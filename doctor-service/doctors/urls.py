from django.urls import path
from . import views

urlpatterns = [
    path('',           views.doctor_list,   name='doctor-list'),
    path('<int:pk>/',  views.doctor_detail, name='doctor-detail'),
    path('health/',    views.health,        name='health'),
]
