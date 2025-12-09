from rest_framework import serializers
from .models import GameChallenge


class ChallengeUserSerializer(serializers.Serializer):
    """Lightweight user serializer for challenges"""
    id = serializers.IntegerField()
    username = serializers.CharField()
    rating = serializers.IntegerField()
    avatar = serializers.ImageField(required=False)


class GameChallengeSerializer(serializers.ModelSerializer):
    challenger = ChallengeUserSerializer(read_only=True)
    challenged = ChallengeUserSerializer(read_only=True)
    time_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = GameChallenge
        fields = ['id', 'challenger', 'challenged', 'time_control', 'status', 
                  'game', 'created_at', 'expires_at', 'time_remaining']
        read_only_fields = ['status', 'game', 'created_at', 'expires_at']
    
    def get_time_remaining(self, obj):
        """Calculate remaining time in seconds"""
        from django.utils import timezone
        if obj.status != 'pending':
            return 0
        
        remaining = (obj.expires_at - timezone.now()).total_seconds()
        return max(0, int(remaining))