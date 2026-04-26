from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Doctor
from .serializers import DoctorSerializer


def get_role(request):
    return getattr(request.user, 'role', None)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def doctor_list(request):
    role = get_role(request)

    if role not in ['admin', 'receptionist', 'doctor']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        search = request.query_params.get('search', '')
        doctors = Doctor.objects.all().order_by('-created_at')
        if search:
            doctors = doctors.filter(
                Q(full_name__icontains=search) |
                Q(specialization__icontains=search) |
                Q(email__icontains=search)
            )
        return Response(DoctorSerializer(doctors, many=True).data)

    if role != 'admin':
        return Response({'error': 'Only admins can create doctors'}, status=status.HTTP_403_FORBIDDEN)

    serializer = DoctorSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def doctor_detail(request, pk):
    role = get_role(request)

    if role not in ['admin', 'receptionist', 'doctor']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    try:
        doctor = Doctor.objects.get(pk=pk)
    except Doctor.DoesNotExist:
        return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(DoctorSerializer(doctor).data)

    if request.method == 'PUT':
        if role != 'admin':
            return Response({'error': 'Only admins can update doctors'}, status=status.HTTP_403_FORBIDDEN)
        serializer = DoctorSerializer(doctor, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if role != 'admin':
        return Response({'error': 'Only admins can delete doctors'}, status=status.HTTP_403_FORBIDDEN)
    doctor.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def doctor_availability(request, pk):
    if get_role(request) != 'admin':
        return Response({'error': 'Only admins can change availability'}, status=status.HTTP_403_FORBIDDEN)

    try:
        doctor = Doctor.objects.get(pk=pk)
    except Doctor.DoesNotExist:
        return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)

    doctor.available = request.data.get('available', doctor.available)
    doctor.save()
    return Response(DoctorSerializer(doctor).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    return Response({'status': 'ok', 'service': 'doctor-service'})
