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
        # FIXED: Grab the host name from the frontend to prevent the "mahe" host bug
        host_name = request.data.get('host_name', 'Default Zoom User')
        mock_email = f"{host_name.replace(' ', '').lower()}_{secrets.randbelow(9999)}@zoomclone.local"
        
        host_user, _ = UserProfile.objects.get_or_create(
            name=host_name,
            defaults={"email": mock_email}
        )
            
        code = generate_zoom_code()
        frontend_url = os.getenv('FRONTEND_URL', 'http://192.168.31.224:3000')
        is_instant = request.data.get('is_instant', True)
        
        if is_instant:
            title = f"Instant Meeting - {host_user.name}"
            description = ""
            start_time = timezone.now()
            duration_minutes = 40
        else:
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
            host=host_user # Bound specifically to this exact user
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
                
            # FIXED: get_or_create prevents duplicate participants on refresh
            session, created = ParticipantSession.objects.get_or_create(
                meeting=meeting, 
                display_name=display_name
            )
            
            status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
            return Response(ParticipantSessionSerializer(session).data, status=status_code)
            
        except Meeting.DoesNotExist:
            return Response({"error": "Invalid meeting code"}, status=status.HTTP_404_NOT_FOUND)

class LeaveMeetingView(APIView):
    """Removes a participant from the room when they close the tab or click Leave."""
    def post(self, request, code):
        try:
            meeting = Meeting.objects.get(meeting_code=code)
            display_name = request.data.get('display_name')
            
            if display_name:
                ParticipantSession.objects.filter(meeting=meeting, display_name=display_name).delete()
                
            return Response({"status": "Successfully left the meeting"}, status=status.HTTP_200_OK)
            
        except Meeting.DoesNotExist:
            return Response({"error": "Meeting room not found."}, status=status.HTTP_404_NOT_FOUND)
        
class MeetingParticipantsView(APIView):
    """Fetches the list of all participants currently in a specific room."""
    def get(self, request, code):
        try:
            meeting = Meeting.objects.get(meeting_code=code)
            participants = meeting.participants.all().order_by('joined_at')
            
            return Response({
                "meeting_title": meeting.title,
                "host_name": meeting.host.name,
                "participants": ParticipantSessionSerializer(participants, many=True).data
            }, status=status.HTTP_200_OK)
            
        except Meeting.DoesNotExist:
            return Response({"error": "Meeting room not found."}, status=status.HTTP_404_NOT_FOUND)