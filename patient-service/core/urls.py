from django.urls import path, include

urlpatterns = [
    path('api/patients/', include('patients.urls')),
]
