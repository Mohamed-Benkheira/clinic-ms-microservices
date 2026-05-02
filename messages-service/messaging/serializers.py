from rest_framework import serializers
from .models import Conversation, Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Message
        fields = ["id","conversation","sender_id","sender_role",
                "sender_name","body","read","created_at"]
        read_only_fields = ["id","created_at"]

class ConversationSerializer(serializers.ModelSerializer):
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model  = Conversation
        fields = ["id","participant_1_id","participant_1_role","participant_1_name",
                  "participant_2_id","participant_2_role","participant_2_name",
                  "created_at","last_message_at","last_message_body","unread_count"]

    def get_unread_count(self, obj):
        requester_id = self.context.get("requester_id")
        if not requester_id:
            return 0
        return obj.messages.filter(read=False)\
                           .exclude(sender_id=requester_id).count()