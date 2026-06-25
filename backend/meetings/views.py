from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import Meeting, UserProfile
from .serializers import MeetingSerializer
import os
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
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        
        is_instant = request.data.get('is_instant', True)
            
        if is_instant:
            title = f"Instant Meeting - {default_host.name}"
            description = ""
            start_time = timezone.now()
            duration_minutes = 40
        else:
            # Safely grab the scheduled data from the frontend request
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