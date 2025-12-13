from django.urls import re_path
from . import consumers
from .user_consumer import UserNotificationConsumer

websocket_urlpatterns = [
    re_path(r'ws/notifications/$', UserNotificationConsumer.as_asgi()),
    re_path(r'ws/matchmaking/$', consumers.MatchmakingConsumer.as_asgi()),
    re_path(r'ws/game/(?P<game_id>\w+)/$', consumers.GameConsumer.as_asgi()),
]