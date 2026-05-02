from django.db import models

ROLE_CHOICES = [
    ("admin",         "Admin"),
    ("receptionist",  "Receptionist"),
    ("doctor",        "Doctor"),
    ("patient",       "Patient"),
]

class Conversation(models.Model):
    participant_1_id    = models.IntegerField()
    participant_1_role  = models.CharField(max_length=20, choices=ROLE_CHOICES)
    participant_1_name  = models.CharField(max_length=100, default="")
    participant_2_id    = models.IntegerField()
    participant_2_role  = models.CharField(max_length=20, choices=ROLE_CHOICES)
    participant_2_name  = models.CharField(max_length=100, default="")
    created_at          = models.DateTimeField(auto_now_add=True)
    last_message_at     = models.DateTimeField(auto_now_add=True)
    last_message_body   = models.TextField(default="")

    class Meta:
        ordering = ["-last_message_at"]
        unique_together = [["participant_1_id", "participant_2_id"]]

    def __str__(self):
        return f"{self.participant_1_name} ↔ {self.participant_2_name}"


class Message(models.Model):
    conversation  = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    sender_id     = models.IntegerField()
    sender_role   = models.CharField(max_length=20, choices=ROLE_CHOICES)
    sender_name   = models.CharField(max_length=100, default="")
    body          = models.TextField()
    read          = models.BooleanField(default=False)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender_name}: {self.body[:40]}"