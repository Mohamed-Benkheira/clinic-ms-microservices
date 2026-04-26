from django.urls import path
from . import views

urlpatterns = [
    path('',                  views.appointment_list,   name='appointment-list'),
    path('<int:pk>/',         views.appointment_detail, name='appointment-detail'),
    path('<int:pk>/status/',  views.appointment_status, name='appointment-status'),
    path('health/',           views.health,             name='health'),
]
