from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from datetime import timedelta
from .models import Appointment
from .serializers import AppointmentSerializer
from .publisher import publish_appointment_created


def get_role(request):
    return getattr(request.user, 'role', None)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def appointment_list(request):
    role = get_role(request)

    if role not in ['admin', 'receptionist', 'doctor']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        appointments = Appointment.objects.all()
        doctor_id     = request.query_params.get('doctor_id')
        patient_id    = request.query_params.get('patient_id')
        status_filter = request.query_params.get('status')

        if doctor_id:
            appointments = appointments.filter(doctor_id=doctor_id)
        if patient_id:
            appointments = appointments.filter(patient_id=patient_id)
        if status_filter:
            appointments = appointments.filter(status=status_filter)

        return Response(AppointmentSerializer(appointments, many=True).data)

    # POST — admin and receptionist only
    if role not in ['admin', 'receptionist']:
        return Response({'error': 'Only admin and receptionist can create appointments'}, status=status.HTTP_403_FORBIDDEN)

    serializer = AppointmentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Conflict detection — same doctor within 30 minutes
    scheduled_at = serializer.validated_data['scheduled_at']
    doctor_id    = serializer.validated_data['doctor_id']
    window_start = scheduled_at - timedelta(minutes=30)
    window_end   = scheduled_at + timedelta(minutes=30)

    conflict = Appointment.objects.filter(
        doctor_id=doctor_id,
        scheduled_at__range=(window_start, window_end),
        status='scheduled'
    ).exists()

    if conflict:
        return Response(
            {'error': 'Doctor already has an appointment within 30 minutes of this time'},
            status=status.HTTP_409_CONFLICT
        )

    appointment = serializer.save()

    publish_appointment_created({
        'id':           appointment.id,
        'patient_id':   appointment.patient_id,
        'doctor_id':    appointment.doctor_id,
        'scheduled_at': appointment.scheduled_at.isoformat(),
        'status':       appointment.status,
        'reason':       appointment.reason,
    })

    return Response(AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def appointment_detail(request, pk):
    role = get_role(request)

    if role not in ['admin', 'receptionist', 'doctor']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    try:
        appointment = Appointment.objects.get(pk=pk)
    except Appointment.DoesNotExist:
        return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(AppointmentSerializer(appointment).data)

    if request.method == 'PUT':
        if role not in ['admin', 'receptionist']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # doctors can only update status, not reschedule
        if role == 'doctor':
            allowed = {k: v for k, v in request.data.items() if k in ['status', 'notes']}
            serializer = AppointmentSerializer(appointment, data=allowed, partial=True)
        else:
            serializer = AppointmentSerializer(appointment, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE — admin only
    if role != 'admin':
        return Response({'error': 'Only admins can delete appointments'}, status=status.HTTP_403_FORBIDDEN)
    appointment.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def appointment_status(request, pk):
    role = get_role(request)

    if role not in ['admin', 'receptionist', 'doctor']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    try:
        appointment = Appointment.objects.get(pk=pk)
    except Appointment.DoesNotExist:
        return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    if new_status not in ['scheduled', 'completed', 'cancelled']:
        return Response({'error': 'Invalid status. Choose: scheduled, completed, cancelled'}, status=status.HTTP_400_BAD_REQUEST)

    appointment.status = new_status
    appointment.save()
    return Response(AppointmentSerializer(appointment).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    return Response({'status': 'ok', 'service': 'appointment-service'})
