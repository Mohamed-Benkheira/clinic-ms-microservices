from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from .permissions import can_converse, can_start_conversation

def get_requester(request):
    """Read caller identity from request headers set by the frontend."""
    return {
        "id":   int(request.headers.get("X-User-Id",   0)),
        "role": request.headers.get("X-User-Role", ""),
        "name": request.headers.get("X-User-Name", ""),
    }

class ConversationListView(APIView):
    def get(self, request):
        user = get_requester(request)
        if not user["id"]:
            return Response({"error": "X-User-Id header required"}, status=400)
        convs = Conversation.objects.filter(
            participant_1_id=user["id"]
        ) | Conversation.objects.filter(
            participant_2_id=user["id"]
        )
        convs = convs.order_by("-last_message_at")
        serializer = ConversationSerializer(
            convs, many=True, context={"requester_id": user["id"]}
        )
        return Response(serializer.data)

    def post(self, request):
        user = get_requester(request)
        if not can_start_conversation(user["role"]):
            return Response(
                {"error": "Only receptionists and admins can start conversations"},
                status=403
            )
        p2_id   = request.data.get("participant_2_id")
        p2_role = request.data.get("participant_2_role")
        p2_name = request.data.get("participant_2_name", "")

        if not p2_id or not p2_role:
            return Response({"error": "participant_2_id and participant_2_role required"}, status=400)

        if not can_converse(user["role"], p2_role):
            return Response(
                {"error": f"{user['role']} cannot message {p2_role}"},
                status=403
            )

        existing = Conversation.objects.filter(
            participant_1_id=min(user["id"], int(p2_id)),
            participant_2_id=max(user["id"], int(p2_id)),
        ).first()
        if existing:
            return Response(ConversationSerializer(existing).data)

        conv = Conversation.objects.create(
            participant_1_id   = min(user["id"], int(p2_id)),
            participant_1_role = user["role"] if user["id"] < int(p2_id) else p2_role,
            participant_1_name = user["name"] if user["id"] < int(p2_id) else p2_name,
            participant_2_id   = max(user["id"], int(p2_id)),
            participant_2_role = p2_role if user["id"] < int(p2_id) else user["role"],
            participant_2_name = p2_name if user["id"] < int(p2_id) else user["name"],
        )
        return Response(ConversationSerializer(conv).data, status=201)


class MessageListView(APIView):
    def get(self, request, conversation_id):
        user = get_requester(request)
        try:
            conv = Conversation.objects.get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

        if user["id"] not in [conv.participant_1_id, conv.participant_2_id]:
            return Response({"error": "Forbidden"}, status=403)

        messages = conv.messages.order_by("created_at")[:50]
        conv.messages.filter(read=False).exclude(
            sender_id=user["id"]
        ).update(read=True)

        return Response(MessageSerializer(messages, many=True).data)

    def post(self, request, conversation_id):
        user = get_requester(request)
        try:
            conv = Conversation.objects.get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

        if user["id"] not in [conv.participant_1_id, conv.participant_2_id]:
            return Response({"error": "Forbidden"}, status=403)

        body = request.data.get("body", "").strip()
        if not body:
            return Response({"error": "Message body required"}, status=400)

        msg = Message.objects.create(
            conversation = conv,
            sender_id    = user["id"],
            sender_role  = user["role"],
            sender_name  = user["name"],
            body         = body,
        )
        conv.last_message_at   = timezone.now()
        conv.last_message_body = body[:100]
        conv.save()

        return Response(MessageSerializer(msg).data, status=201)