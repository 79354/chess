from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Friendship, FriendRequest

User = get_user_model()


class FriendUserSerializer(serializers.ModelSerializer):
    """Serializer for friend user info"""
    class Meta:
        model = User
        fields = ['id', 'username', 'rating', 'is_online', 'last_seen', 'avatar', 'country']


class FriendshipSerializer(serializers.ModelSerializer):
    friend = serializers.SerializerMethodField()
    
    class Meta:
        model = Friendship
        fields = ['id', 'friend', 'created_at']
        
    def get_friend(self, obj):
        request = self.context.get('request')
        if request and request.user:
            # Return the other user in the friendship
            friend = obj.user2 if obj.user1 == request.user else obj.user1
            return FriendUserSerializer(friend).data
        return None


class FriendRequestSerializer(serializers.ModelSerializer):
    from_user = FriendUserSerializer(read_only=True)
    to_user = FriendUserSerializer(read_only=True)
    
    class Meta:
        model = FriendRequest
        fields = ['id', 'from_user', 'to_user', 'status', 'created_at', 'updated_at']
        read_only_fields = ['status', 'created_at', 'updated_at']