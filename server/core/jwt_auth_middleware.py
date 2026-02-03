import jwt
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.conf import settings
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from urllib.parse import parse_qs

User = get_user_model()

@database_sync_to_async
def get_user(token_key):
    try:
        # Verify the token type/validity
        UntypedToken(token_key)
    except (InvalidToken, TokenError) as e:
        print(f"Token invalid: {e}")
        return AnonymousUser()

    try:
        # Decode the token to get the user ID
        # Note: We use settings.SECRET_KEY and HS256 as per standard SimpleJWT setup
        decoded_data = jwt.decode(token_key, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = decoded_data['user_id']
        return User.objects.get(id=user_id)
    except Exception as e:
        print(f"User not found: {e}")
        return AnonymousUser()

class JwtAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        # Parse the query string to get the token
        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]

        if token:
            scope["user"] = await get_user(token)
        else:
            scope["user"] = AnonymousUser()

        return await self.app(scope, receive, send)