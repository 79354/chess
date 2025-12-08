from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Game, Move
from .serializers import GameSerializer, GameListSerializer, MoveSerializer
from accounts.models import User


@api_view(['GET'])
@permission_classes([AllowAny])
def list_games(request):
    """List all games with filtering options"""
    games = Game.objects.all()
    
    # Filter by status
    status_filter = request.query_params.get('status')
    if status_filter:
        games = games.filter(status=status_filter)
    
    # Filter by user
    username = request.query_params.get('username')
    if username:
        games = games.filter(
            white_player__username=username
        ) | games.filter(
            black_player__username=username
        )
    
    serializer = GameListSerializer(games, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_game(request, game_id):
    """Get detailed game information"""
    game = get_object_or_404(Game, game_id=game_id)
    serializer = GameSerializer(game)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_game_moves(request, game_id):
    """Get all moves for a game"""
    game = get_object_or_404(Game, game_id=game_id)
    moves = game.moves.all()
    serializer = MoveSerializer(moves, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_user_games(request, username):
    """Get all games for a specific user"""
    user = get_object_or_404(User, username=username)
    games = Game.objects.filter(
        white_player=user
    ) | Game.objects.filter(
        black_player=user
    )
    
    serializer = GameListSerializer(games.order_by('-created_at'), many=True)
    return Response(serializer.data)