import os
import secrets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import Meeting, UserProfile, ParticipantSession
from .serializers import MeetingSerializer, ParticipantSessionSerializer

def generate_zoom_code():
    """Generates a 9-digit code formatted as XXX-XXX-XXX"""
    part1 = secrets.randbelow(900) + 100
    part2 = secrets.randbelow(900) + 100
    part3 = secrets.randbelow(900) + 100
    return f"{part1}-{part2}-{part3}"

class DashboardMeetingListView(APIView):
    """Handles fetching and creating meetings for the main dashboard."""
    
    def get(self, request):
        now = timezone.now()
        upcoming = Meeting.objects.filter(start_time__gte=now).order_by('start_time')
        recent = Meeting.objects.filter(start_time__lt=now).order_by('-start_time')
        
        return Response({
            "upcoming": MeetingSerializer(upcoming, many=True).data,
            "recent": MeetingSerializer(recent, many=True).data
        })

    def post(self, request):
        default_host, _ = UserProfile.objects.get_or_create(
            email="user@zoomclone.local",
            defaults={"name": "Default Zoom User"}
        )
            
        code = generate_zoom_code()
        
        # Pull frontend URL from environment variables, fallback to localhost
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        
        # 1. Check if the frontend is asking for an instant or scheduled meeting
        is_instant = request.data.get('is_instant', True)
        
        if is_instant:
            title = f"Instant Meeting - {default_host.name}"
            description = ""
            start_time = timezone.now()
            duration_minutes = 40
        else:
            # 2. Grab the scheduled data from the frontend request
            title = request.data.get('title', 'Scheduled Meeting')
            description = request.data.get('description', '')
            start_time = request.data.get('start_time', timezone.now())
            duration_minutes = int(request.data.get('duration_minutes', 40))
            
        meeting = Meeting.objects.create(
            title=title,
            description=description,
            meeting_code=code,
            invite_link=f"{frontend_url}/meeting/{code}",
            start_time=start_time,
            duration_minutes=duration_minutes,
            is_instant=is_instant,
            host=default_host
        )
            
        return Response(MeetingSerializer(meeting).data, status=status.HTTP_201_CREATED)

class MeetingValidateView(APIView):
    """Checks if a meeting code exists before letting a user try to join."""
    def get(self, request, code):
        try:
            meeting = Meeting.objects.get(meeting_code=code)
            return Response(MeetingSerializer(meeting).data, status=status.HTTP_200_OK)
        except Meeting.DoesNotExist:
            return Response({"error": "Meeting room not found."}, status=status.HTTP_404_NOT_FOUND)

class JoinMeetingView(APIView):
    """Registers a participant's display name to a verified room."""
    def post(self, request, code):
        try:
            meeting = Meeting.objects.get(meeting_code=code)
            display_name = request.data.get('display_name')
            
            if not display_name:
                return Response({"error": "Display name is required"}, status=status.HTTP_400_BAD_REQUEST)
                
            session = ParticipantSession.objects.create(meeting=meeting, display_name=display_name)
            return Response(ParticipantSessionSerializer(session).data, status=status.HTTP_201_CREATED)
            
        except Meeting.DoesNotExist:
            return Response({"error": "Invalid meeting code"}, status=status.HTTP_404_NOT_FOUND)