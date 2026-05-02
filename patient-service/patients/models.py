from django.db import models

class Patient(models.Model):
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]

    full_name    = models.CharField(max_length=255)
    date_of_birth= models.DateField(null=True, blank=True)
    gender       = models.CharField(max_length=10, choices=GENDER_CHOICES)
    phone        = models.CharField(max_length=20, unique=True)
    email        = models.EmailField(blank=True, null=True)
    address      = models.TextField(blank=True, null=True)
    medical_notes= models.TextField(blank=True, null=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name
