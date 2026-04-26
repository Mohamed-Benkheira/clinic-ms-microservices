from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, get_tokens_for_user


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user   = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response({
            'user':    UserSerializer(user).data,
            'access':  tokens['access'],
            'refresh': tokens['refresh'],
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user   = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)
        return Response({
            'user':    UserSerializer(user).data,
            'access':  tokens['access'],
            'refresh': tokens['refresh'],
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        token = RefreshToken(request.data.get('refresh'))
        token.blacklist()
    except Exception:
        pass
    return Response({'message': 'Logged out successfully'})


@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    return Response({'status': 'ok', 'service': 'auth-service'})