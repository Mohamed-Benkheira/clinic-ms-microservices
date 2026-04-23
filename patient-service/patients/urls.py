from django.urls import path
from . import views

urlpatterns = [
    path('',           views.patient_list,   name='patient-list'),
    path('<int:pk>/',  views.patient_detail, name='patient-detail'),
    path('health/',    views.health,         name='health'),
]
