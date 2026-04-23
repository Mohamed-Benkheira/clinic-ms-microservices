from django.urls import path, include

urlpatterns = [
    path('api/doctors/', include('doctors.urls')),
]
