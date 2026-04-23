from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.register,  name='register'),
    path('login/',    views.login,     name='login'),
    path('me/',       views.me,        name='me'),
    path('logout/',   views.logout,    name='logout'),
    path('refresh/',  TokenRefreshView.as_view(), name='refresh'),
    path('health/',   views.health,    name='health'),
]
