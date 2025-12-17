from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from urllib.parse import parse_qs

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token_key):
    try:
        access_token = AccessToken(token_key)
        user_id = access_token['user_id']
        user = User.objects.get(id=user_id)
        return user
    except (InvalidToken, TokenError, User.DoesNotExist) as e:
        print(f"❌ Token validation failed: {e}")
        return None

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Get token from query string
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        if token:
            user = await get_user_from_token(token)
            if user:
                scope['user'] = user
            else:
                # CRITICAL: Reject connection with auth error code
                await send({
                    'type': 'websocket.close',
                    'code': 4001,  # Custom auth failure code
                    'reason': 'Invalid token'
                })
                return
        else:
            # No token provided - reject immediately
            await send({
                'type': 'websocket.close',
                'code': 4001,
                'reason': 'No authentication token'
            })
            return
        
        return await super().__call__(scope, receive, send)