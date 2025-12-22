import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class MatchmakingConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for matchmaking
    Uses Celery tasks for async matching with timeout
    """
    
    async def connect(self):
        self.user = self.scope['user']
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        await self.accept()
        
        # Store channel name for this user
        self.channel_name_stored = self.channel_name
        
        await self.send(text_data=json.dumps({
            'type': 'connected',
            'message': 'Connected to matchmaking service'
        }))
        
        print(f"✅ {self.user.username} connected to matchmaking")
    
    async def disconnect(self, close_code):
        # Remove from any queues
        if hasattr(self, 'current_time_control'):
            await self.leave_matchmaking_queue(self.current_time_control)
        
        print(f"🔌 {self.user.username} disconnected from matchmaking")
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            action = data.get('action')
            
            if action == 'join_queue':
                await self.handle_join_queue(data)
            elif action == 'leave_queue':
                await self.handle_leave_queue(data)
            elif action == 'get_queue_status':
                await self.handle_queue_status(data)
            else:
                await self.send(json.dumps({
                    'type': 'error',
                    'message': f'Unknown action: {action}'
                }))
                
        except json.JSONDecodeError:
            await self.send(json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
    
    async def handle_join_queue(self, data):
        """Join matchmaking queue"""
        time_control = data.get('time_control', '10+0')
        
        # Store current time control
        self.current_time_control = time_control
        
        # Get user rating
        rating = await self.get_user_rating()
        
        # Start Celery task for matchmaking
        from .tasks import find_match
        
        find_match.delay(
            user_id=self.user.id,
            time_control=time_control,
            rating=rating,
            channel_name=self.channel_name
        )
        
        print(f"🔍 {self.user.username} joining queue for {time_control}")
    
    async def handle_leave_queue(self, data):
        """Leave matchmaking queue"""
        time_control = data.get('time_control') or getattr(self, 'current_time_control', None)
        
        if time_control:
            await self.leave_matchmaking_queue(time_control)
    
    async def handle_queue_status(self, data):
        """Get current queue status"""
        time_control = data.get('time_control', '10+0')
        count = await self.get_queue_count(time_control)
        
        await self.send(json.dumps({
            'type': 'queue_status',
            'time_control': time_control,
            'players_in_queue': count
        }))
    
    async def leave_matchmaking_queue(self, time_control):
        """Remove user from queue"""
        from .tasks import leave_queue
        
        leave_queue.delay(
            user_id=self.user.id,
            time_control=time_control,
            channel_name=self.channel_name
        )
        
        print(f"🚪 {self.user.username} leaving queue for {time_control}")
    
    # ============================================
    # Channel Layer Handlers (called by Celery tasks)
    # ============================================
    
    async def matchmaking_found(self, event):
        """Match found! Redirect to game"""
        await self.send(json.dumps({
            'type': 'match_found',
            'game_id': event['game_id'],
            'color': event['color'],
            'message': 'Match found! Starting game...'
        }))
    
    async def matchmaking_queued(self, event):
        """User added to queue"""
        await self.send(json.dumps({
            'type': 'queue_joined',
            'time_control': event['time_control'],
            'message': event['message']
        }))
    
    async def matchmaking_left(self, event):
        """User left queue"""
        await self.send(json.dumps({
            'type': 'queue_left',
            'message': event['message']
        }))
    
    async def matchmaking_timeout(self, event):
        """Matchmaking timed out"""
        await self.send(json.dumps({
            'type': 'timeout',
            'message': event['message']
        }))
    
    async def matchmaking_error(self, event):
        """Matchmaking error"""
        await self.send(json.dumps({
            'type': 'error',
            'message': event['message']
        }))
    
    # ============================================
    # Database Queries
    # ============================================
    
    @database_sync_to_async
    def get_user_rating(self):
        return self.user.rating
    
    @database_sync_to_async
    def get_queue_count(self, time_control):
        import redis
        from django.conf import settings
        
        redis_client = redis.Redis(
            host=getattr(settings, 'REDIS_HOST', 'localhost'),
            port=getattr(settings, 'REDIS_PORT', 6379),
            db=1,
            decode_responses=True
        )
        
        queue_key = f"matchmaking:{time_control}"
        return redis_client.scard(queue_key)