from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Patient
from .serializers import PatientSerializer


def get_role(request):
    return getattr(request.user, 'role', None)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def patient_list(request):
    role = get_role(request)

    if role not in ['admin', 'receptionist', 'doctor']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        search = request.query_params.get('search', '')
        patients = Patient.objects.all().order_by('-created_at')
        if search:
            patients = patients.filter(
                Q(full_name__icontains=search) | Q(email__icontains=search)
            )
        return Response(PatientSerializer(patients, many=True).data)

    if role not in ['admin', 'receptionist']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    serializer = PatientSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def patient_detail(request, pk):
    role = get_role(request)

    if role not in ['admin', 'receptionist', 'doctor']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    try:
        patient = Patient.objects.get(pk=pk)
    except Patient.DoesNotExist:
        return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(PatientSerializer(patient).data)

    if request.method in ['PUT', 'PATCH']:
        if role not in ['admin', 'receptionist']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        serializer = PatientSerializer(patient, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if role != 'admin':
        return Response({'error': 'Only admins can delete patients'}, status=status.HTTP_403_FORBIDDEN)
    patient.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def patient_notes(request, pk):
    role = get_role(request)

    if role not in ['admin', 'receptionist', 'doctor']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    try:
        patient = Patient.objects.get(pk=pk)
    except Patient.DoesNotExist:
        return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

    patient.medical_notes = request.data.get('medical_notes', patient.medical_notes)
    patient.save()
    return Response(PatientSerializer(patient).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    return Response({'status': 'ok', 'service': 'patient-service'})
