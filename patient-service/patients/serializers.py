from rest_framework import serializers
from .models import Patient

class PatientSerializer(serializers.ModelSerializer):
    date_of_birth = serializers.DateField(required=False, allow_null=True)

    def validate_date_of_birth(self, value):
        if value == "" or value is None:
            return None
        return value

    class Meta:
        model = Patient
        fields = '__all__'
