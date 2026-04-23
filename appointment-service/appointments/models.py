from django.db import models

class Appointment(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    patient_id   = models.IntegerField()
    doctor_id    = models.IntegerField()
    scheduled_at = models.DateTimeField()
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    reason       = models.TextField(blank=True, null=True)
    notes        = models.TextField(blank=True, null=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-scheduled_at']

    def __str__(self):
        return f"Appointment {self.id}: patient {self.patient_id} with doctor {self.doctor_id}"
