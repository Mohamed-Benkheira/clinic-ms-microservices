from django.urls import path, include

urlpatterns = [
    path('api/appointments/', include('appointments.urls')),
]
