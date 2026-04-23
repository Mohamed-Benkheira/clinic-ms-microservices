import jwt
import os
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


class StatelessJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]

        try:
            payload = jwt.decode(
                token,
                os.getenv('SECRET_KEY'),
                algorithms=['HS256']
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token')

        return (TokenUser(payload), token)


class TokenUser:
    def __init__(self, payload):
        self.id           = payload.get('user_id')
        self.user_id      = payload.get('user_id')
        self.role         = payload.get('role', 'appointment')
        self.is_active    = True
        self.is_anonymous = False

    @property
    def is_authenticated(self):
        return True
