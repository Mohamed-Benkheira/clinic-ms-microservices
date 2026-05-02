from django.urls import path
from .views import ConversationListView, MessageListView
from django.http import HttpResponse

def health_view(request):
    return HttpResponse('{"status":"ok"}')

urlpatterns = [
    path("api/conversations/", ConversationListView.as_view()),
    path("api/conversations/<int:conversation_id>/messages/", MessageListView.as_view()),
    path("health/", health_view),
]