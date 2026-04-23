from django.db import models

class Doctor(models.Model):
    SPECIALIZATION_CHOICES = [
        ('general', 'General Practitioner'),
        ('cardiology', 'Cardiology'),
        ('neurology', 'Neurology'),
        ('pediatrics', 'Pediatrics'),
        ('orthopedics', 'Orthopedics'),
        ('dermatology', 'Dermatology'),
        ('other', 'Other'),
    ]

    full_name       = models.CharField(max_length=255)
    specialization  = models.CharField(max_length=50, choices=SPECIALIZATION_CHOICES)
    phone           = models.CharField(max_length=20, unique=True)
    email           = models.EmailField(unique=True)
    license_number  = models.CharField(max_length=100, unique=True)
    available       = models.BooleanField(default=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Dr. {self.full_name} ({self.specialization})"
