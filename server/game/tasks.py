from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import redis
from django.conf import settings
import json
import traceback

# Redis client for matchmaking queue
redis_client = redis.Redis(
    host=getattr(settings, 'REDIS_HOST', 'localhost'),
    port=getattr(settings, 'REDIS_PORT', 6379),
    db=1,  # Use separate DB for matchmaking
    decode_responses=True
)


@shared_task(bind=True)
def find_match(self, user_id, time_control, rating, channel_name):
    """
    Find a match for a player in the queue.
    Uses Atomic operations to prevent race conditions.
    Runs asynchronously with 30-second timeout.
    """
    from accounts.models import User
    from .models import Game
    
    print(f"🔍 Finding match for user {user_id}, time_control {time_control}, rating {rating}")
    
    # Key for this time control's queue
    queue_key = f"matchmaking:{time_control}"
    rating_range = 200  # ±200 rating points
    
    try:
        user = User.objects.get(id=user_id)
        
        # 1. Check if user is already in a game
        active_game = Game.objects.filter(
            status__in=['waiting', 'ongoing']
        ).filter(
            white_player=user
        ) | Game.objects.filter(
            status__in=['waiting', 'ongoing'],
            black_player=user
        )
        
        if active_game.exists():
            _notify_matchmaking_error(channel_name, "You're already in an active game")
            return None
        
        # 2. FIX: Race Condition - Atomic Pop
        # We try to find and atomically 'claim' an opponent from the queue
        opponent_data = _find_and_claim_opponent_atomically(queue_key, rating, rating_range, user_id)
        
        if opponent_data:
            # Match found and opponent successfully claimed from Redis!
            opponent_id = opponent_data['user_id']
            opponent = User.objects.get(id=opponent_id)
            
            # Create game
            game = _create_matchmaking_game(user, opponent, time_control)
            
            # Notify both players
            # Using Group send for robustness (as per the Fix)
            _notify_match_found(f"user_{user.id}", game.game_id, 'white')
            _notify_match_found(f"user_{opponent.id}", game.game_id, 'black')
            
            print(f"Match created: {game.game_id}")
            return game.game_id
        else:
            # 3. No match found, add self to queue
            # We preserve the JSON format to keep timestamps and rating info available
            queue_entry = json.dumps({
                'user_id': user_id,
                'rating': rating,
                'channel_name': channel_name,
                'timestamp': timezone.now().isoformat()
            })
            
            redis_client.sadd(queue_key, queue_entry)
            
            # Schedule timeout check
            check_timeout.apply_async(
                args=[user_id, time_control, channel_name],
                countdown=30  # 30 seconds timeout
            )
            
            # Notify user they're in queue
            _notify_queue_joined(channel_name, time_control)
            
            print(f"⏳ User {user_id} added to queue, waiting for opponent...")
            return None
            
    except User.DoesNotExist:
        print(f"User {user_id} not found")
        _notify_matchmaking_error(channel_name, "User not found")
        return None
    except Exception as e:
        print(f"Matchmaking error: {e}")
        traceback.print_exc()
        _notify_matchmaking_error(channel_name, str(e))
        return None


@shared_task
def check_timeout(user_id, time_control, channel_name):
    """
    Check if user is still in queue after 30 seconds.
    Remove them and notify timeout if they are.
    """
    queue_key = f"matchmaking:{time_control}"
    
    print(f"Checking timeout for user {user_id}")
    
    # Get all entries in queue
    queue_entries = redis_client.smembers(queue_key)
    
    for entry in queue_entries:
        try:
            data = json.loads(entry)
            if data['user_id'] == user_id:
                # Check if entry is older than 30 seconds
                entry_time = timezone.datetime.fromisoformat(data['timestamp'])
                if timezone.now() - entry_time > timedelta(seconds=30):
                    
                    # ATOMIC FIX: Attempt to remove this specific entry
                    # If srem returns 0, it means the user was JUST matched by someone else
                    if redis_client.srem(queue_key, entry):
                        _notify_matchmaking_timeout(channel_name)
                        print(f"User {user_id} timed out - removed from queue")
                        return True
                    else:
                        print(f"User {user_id} was matched just before timeout")
                        return False
        except (json.JSONDecodeError, KeyError) as e:
            print(f"Invalid queue entry: {e}")
            continue
    
    return False


@shared_task
def leave_queue(user_id, time_control, channel_name):
    """
    Remove user from matchmaking queue
    """
    queue_key = f"matchmaking:{time_control}"
    
    print(f"🚪 User {user_id} leaving queue")
    
    queue_entries = redis_client.smembers(queue_key)
    
    for entry in queue_entries:
        try:
            data = json.loads(entry)
            if data['user_id'] == user_id:
                # Atomically remove
                if redis_client.srem(queue_key, entry):
                    _notify_queue_left(channel_name)
                    print(f"User {user_id} removed from queue")
                    return True
        except (json.JSONDecodeError, KeyError):
            continue
    
    return False


@shared_task
def cleanup_stale_queues():
    """
    Periodic task to clean up stale queue entries
    Run every 5 minutes
    """
    print("🧹 Cleaning up stale matchmaking queues...")
    
    # Get all queue keys
    queue_keys = redis_client.keys("matchmaking:*")
    cleaned = 0
    
    for queue_key in queue_keys:
        entries = redis_client.smembers(queue_key)
        
        for entry in entries:
            try:
                data = json.loads(entry)
                entry_time = timezone.datetime.fromisoformat(data['timestamp'])
                
                # Remove entries older than 5 minutes
                if timezone.now() - entry_time > timedelta(minutes=5):
                    # Use srem to ensure we don't delete someone currently being matched
                    if redis_client.srem(queue_key, entry):
                        cleaned += 1
                        # Notify user if possible
                        if 'channel_name' in data:
                            _notify_matchmaking_timeout(data['channel_name'])
                        
            except (json.JSONDecodeError, KeyError, ValueError):
                # Invalid entry, remove it
                redis_client.srem(queue_key, entry)
                cleaned += 1
    
    print(f"Cleaned {cleaned} stale queue entries")
    return cleaned



# HELPER FUNCTIONS

def _find_and_claim_opponent_atomically(queue_key, rating, rating_range, user_id):
    """
    Find suitable opponent in queue and atomically remove them.
    If removal succeeds, we have 'claimed' the match.
    """
    queue_entries = redis_client.smembers(queue_key)
    
    for entry in queue_entries:
        try:
            data = json.loads(entry)
            opponent_id = data['user_id']
            opponent_rating = data['rating']
            
            # Don't match with self
            if opponent_id == user_id:
                continue
            
            # Check rating range
            if abs(opponent_rating - rating) <= rating_range:
                # ATOMIC CHECK:
                # We attempt to remove this exact string from Redis.
                # If srem returns 1 (True), we successfully 'popped' this user from the queue.
                # If srem returns 0 (False), someone else matched with them in the microsecond between read and remove.
                if redis_client.srem(queue_key, entry):
                    data['raw'] = entry  # Keep raw for reference if needed
                    return data
                
        except (json.JSONDecodeError, KeyError):
            continue
    
    return None


def _create_matchmaking_game(white_player, black_player, time_control):
    """Create a new game from matchmaking"""
    from .models import Game
    
    # Parse time control (e.g., "5+0", "10+5")
    parts = time_control.split('+')
    initial_time = int(parts[0]) * 60  # Convert minutes to seconds
    increment = int(parts[1]) if len(parts) > 1 else 0
    
    game = Game.objects.create(
        game_id=Game.generate_game_id(),
        white_player=white_player,
        black_player=black_player,
        time_control=time_control,
        initial_time=initial_time,
        increment=increment,
        white_time_left=initial_time * 1000,  # milliseconds
        black_time_left=initial_time * 1000,
        status='ongoing',
        white_rating_before=white_player.rating,
        black_rating_before=black_player.rating,
        started_at=timezone.now()
    )
    
    return game


def _notify_match_found(group_name, game_id, color):
    """
    Notify player that match was found.
    Uses group_send (user_{id}) instead of channel_send for better reliability.
    """
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'matchmaking.found',
            'game_id': game_id,
            'color': color
        }
    )


def _notify_queue_joined(channel_name, time_control):
    """Notify player they joined the queue"""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.send)(
        channel_name,
        {
            'type': 'matchmaking.queued',
            'time_control': time_control,
            'message': 'Searching for opponent...'
        }
    )


def _notify_queue_left(channel_name):
    """Notify player they left the queue"""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.send)(
        channel_name,
        {
            'type': 'matchmaking.left',
            'message': 'Left matchmaking queue'
        }
    )


def _notify_matchmaking_timeout(channel_name):
    """Notify player matchmaking timed out"""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.send)(
        channel_name,
        {
            'type': 'matchmaking.timeout',
            'message': 'No opponent found. Please try again.'
        }
    )


def _notify_matchmaking_error(channel_name, error_message):
    """Notify player of matchmaking error"""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.send)(
        channel_name,
        {
            'type': 'matchmaking.error',
            'message': error_message
        }
    )