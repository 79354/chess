import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import Game, Move, MatchmakingQueue
from accounts.models import User
from .chess_engine import ChessEngine


class MatchmakingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.user = None
        self.queue_entry = None
    
    async def disconnect(self, close_code):
        if self.queue_entry:
            await self.leave_queue()
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        
        if action == 'join_queue':
            await self.join_queue(data)
        elif action == 'leave_queue':
            await self.leave_queue()
    
    async def join_queue(self, data):
        user_id = data.get('user_id')
        time_control = data.get('time_control')
        rating = data.get('rating', 1200)
        
        # Get user
        self.user = await self.get_user(user_id)
        if not self.user:
            await self.send(json.dumps({
                'type': 'error',
                'message': 'Invalid user'
            }))
            return
        
        # Add to queue
        self.queue_entry = await self.add_to_queue(self.user, time_control, rating)
        
        # Get queue position
        position, total = await self.get_queue_stats(time_control)
        
        await self.send(json.dumps({
            'type': 'queue_joined',
            'position': position,
            'total_players': total,
            'estimated_wait': self.calculate_wait_time(position)
        }))
        
        # Try to find match
        await self.try_match(time_control, rating)
    
    async def try_match(self, time_control, rating):
        # Find suitable opponent (within 200 rating points)
        opponent_entry = await self.find_opponent(time_control, rating, self.user.id)
        
        if opponent_entry:
            # Create game
            game = await self.create_game(self.user, opponent_entry.user, time_control)
            
            # Remove both from queue
            await self.remove_from_queue(self.queue_entry)
            await self.remove_from_queue(opponent_entry)
            
            # Send match found to both players
            await self.send(json.dumps({
                'type': 'match_found',
                'game_id': game.game_id,
                'opponent': opponent_entry.user.username,
                'color': 'white' if game.white_player == self.user else 'black'
            }))
            
            # Note: We'd need to store WebSocket connections to send to opponent
            # This is simplified - in production, use channel layers
    
    async def leave_queue(self):
        if self.queue_entry:
            await self.remove_from_queue(self.queue_entry)
            await self.send(json.dumps({
                'type': 'queue_left'
            }))
    
    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
    
    @database_sync_to_async
    def add_to_queue(self, user, time_control, rating):
        return MatchmakingQueue.objects.create(
            user=user,
            time_control=time_control,
            rating=rating
        )
    
    @database_sync_to_async
    def remove_from_queue(self, queue_entry):
        queue_entry.delete()
    
    @database_sync_to_async
    def get_queue_stats(self, time_control):
        entries = MatchmakingQueue.objects.filter(time_control=time_control)
        total = entries.count()
        position = list(entries.values_list('id', flat=True)).index(self.queue_entry.id) + 1
        return position, total
    
    @database_sync_to_async
    def find_opponent(self, time_control, rating, exclude_user_id):
        return MatchmakingQueue.objects.filter(
            time_control=time_control,
            rating__gte=rating - 200,
            rating__lte=rating + 200
        ).exclude(user_id=exclude_user_id).first()
    
    @database_sync_to_async
    def create_game(self, white_player, black_player, time_control):
        # Parse time control
        parts = time_control.split('+')
        initial_time = int(parts[0]) * 60  # convert to seconds
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
            started_at=timezone.now(),
            white_rating_before=white_player.rating,
            black_rating_before=black_player.rating
        )
        return game
    
    def calculate_wait_time(self, position):
        # Estimate: ~10 seconds per position
        return position * 10


class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.room_group_name = f'game_{self.game_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        
        if action == 'join_game':
            await self.join_game()
        elif action == 'make_move':
            await self.make_move(data)
        elif action == 'resign':
            await self.resign()
        elif action == 'offer_draw':
            await self.offer_draw()
        elif action == 'request_takeback':
            await self.request_takeback()
    
    async def join_game(self):
        game = await self.get_game()
        if not game:
            await self.send(json.dumps({
                'type': 'error',
                'message': 'Game not found'
            }))
            return
        
        moves = await self.get_moves()
        
        await self.send(json.dumps({
            'type': 'game_state',
            'game_id': game.game_id,
            'white_player': {
                'id': game.white_player.id,
                'username': game.white_player.username,
                'rating': game.white_rating_before
            },
            'black_player': {
                'id': game.black_player.id,
                'username': game.black_player.username,
                'rating': game.black_rating_before
            },
            'fen': game.current_fen,
            'status': game.status,
            'white_time': game.white_time_left,
            'black_time': game.black_time_left,
            'increment': game.increment * 1000,
            'moves': [
                {
                    'from': m.from_square,
                    'to': m.to_square,
                    'notation': m.algebraic_notation,
                    'color': m.color
                } for m in moves
            ]
        }))
    
    async def make_move(self, data):
        from_square = data.get('from')
        to_square = data.get('to')
        promotion = data.get('promotion')
        
        game = await self.get_game()
        if not game or game.status != 'ongoing':
            await self.send(json.dumps({
                'type': 'error',
                'message': 'Invalid game state'
            }))
            return
        
        # Validate move using chess engine
        engine = ChessEngine(game.current_fen)
        if not engine.is_valid_move(from_square, to_square, promotion):
            await self.send(json.dumps({
                'type': 'error',
                'message': 'Invalid move'
            }))
            return
        
        # Execute move
        result = engine.make_move(from_square, to_square, promotion)
        
        # Save move to database
        move = await self.save_move(
            game,
            from_square,
            to_square,
            result['piece'],
            result.get('captured'),
            promotion,
            result.get('notation'),
            result['fen'],
            result.get('is_check', False),
            result.get('is_checkmate', False)
        )
        
        # Update game
        await self.update_game(game, result['fen'], result.get('status'))
        
        # Broadcast move to all players
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_move',
                'move': {
                    'from': from_square,
                    'to': to_square,
                    'notation': result['notation'],
                    'piece': result['piece'],
                    'captured': result.get('captured'),
                    'color': game.current_turn,
                    'fen': result['fen'],
                    'check': result.get('is_check', False),
                    'checkmate': result.get('is_checkmate', False)
                }
            }
        )
        
        # Check game end
        if result.get('status') and result['status'] != 'ongoing':
            await self.end_game(game, result['status'], result.get('winner'))
    
    async def resign(self):
        game = await self.get_game()
        # Determine winner (opponent of player who resigned)
        # Implementation here
        pass
    
    async def offer_draw(self):
        # Send draw offer to opponent
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'draw_offered'
            }
        )
    
    async def request_takeback(self):
        # Send takeback request
        pass
    
    # Message handlers
    async def game_move(self, event):
        await self.send(json.dumps({
            'type': 'move_made',
            'move': event['move']
        }))
    
    async def draw_offered(self, event):
        await self.send(json.dumps({
            'type': 'draw_offered'
        }))
    
    @database_sync_to_async
    def get_game(self):
        try:
            return Game.objects.get(game_id=self.game_id)
        except Game.DoesNotExist:
            return None
    
    @database_sync_to_async
    def get_moves(self):
        return list(Move.objects.filter(game_id=self.game_id).order_by('move_number', 'id'))
    
    @database_sync_to_async
    def save_move(self, game, from_sq, to_sq, piece, captured, promotion, notation, fen, is_check, is_checkmate):
        move_num = (game.move_count // 2) + 1
        color = 'white' if game.move_count % 2 == 0 else 'black'
        
        return Move.objects.create(
            game=game,
            move_number=move_num,
            color=color,
            from_square=from_sq,
            to_square=to_sq,
            piece=piece,
            captured_piece=captured or '',
            promotion=promotion or '',
            algebraic_notation=notation,
            fen_after=fen,
            is_check=is_check,
            is_checkmate=is_checkmate,
            time_spent=0,  # Calculate from timer
            time_left=0    # Get from game state
        )
    
    @database_sync_to_async
    def update_game(self, game, fen, status):
        game.current_fen = fen
        game.move_count += 1
        game.current_turn = 'black' if game.current_turn == 'white' else 'white'
        if status:
            game.status = status
        game.save()
    
    @database_sync_to_async
    def end_game(self, game, status, winner):
        game.status = 'completed'
        game.ended_at = timezone.now()
        if winner:
            game.winner = winner
            game.result = '1-0' if winner == game.white_player else '0-1'
        else:
            game.result = '1/2-1/2'
        game.save()