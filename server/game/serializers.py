from rest_framework import serializers
from .models import Game, Move
from accounts.serializers import UserSerializer

class MoveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Move
        fields = '__all__'


class GameSerializer(serializers.ModelSerializer):
    white_player = UserSerializer(read_only=True)
    black_player = UserSerializer(read_only=True)
    duration = serializers.SerializerMethodField()
    
    class Meta:
        model = Game
        fields = '__all__'
        
    def get_duration(self, obj):
        return obj.get_duration()


class GameListSerializer(serializers.ModelSerializer):
    white_player = serializers.StringRelatedField()
    black_player = serializers.StringRelatedField()
    
    class Meta:
        model = Game
        fields = ['game_id', 'white_player', 'black_player', 'time_control',
                  'status', 'result', 'created_at', 'move_count']