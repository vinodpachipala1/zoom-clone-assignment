from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import Meeting, UserProfile
from .serializers import MeetingSerializer
import secrets


# Create your views here.

def generate_zoom_code():
    part1 = secrets.randbelow(900) + 100
    part2 = secrets.randbelow(900) + 100
    part3 = secrets.randbelow(900) + 100
    
    return f"{part1}-{part2}-{part3}"


class DashboardMeetingListView(APIView):
    
    def get(self, request):
        now = timezone.now();
        
        upcomming = Meeting.objects.filter(start_time__gte=now).order_by('start_time')
        recent = Meeting.objects.filter(start_time__lt=now).order_by('-start_time')
        
        return Response({
            "upcoming": MeetingSerializer(upcomming, many=True).data,
            "recent": MeetingSerializer(recent, many=True).data
        })
        
    def post(self, request):
            
        default_host, _ = UserProfile.objects.get_or_create(
            email="user@zoomclone.local",
            defaults={"name": "Default Zoom User"}
        )
            
        code = generate_zoom_code()
            
        meeting = Meeting.objects.create(
            title=f"Instant Meeting - {default_host.name}",
            meeting_code = code,
            invite_link=f"https://localhost:3000/meeting.{code}",
            is_instant=True,
            host=default_host
        )
            
        return Response(MeetingSerializer(meeting).data, status.HTTP_201_CREATED)