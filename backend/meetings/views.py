from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from .models import Meeting
from .serializers import MeetingSerializer

# Create your views here.
class DashboardMeetingListView(APIView):
    
    def get(self, request):
        now = timezone.now();
        
        upcomming = Meeting.objects.filter(start_time__gte=now).order_by('start_time')
        recent = Meeting.objects.filter(start_time__lt=now).order_by('-start_time')
        
        return Response({
            "upcoming": MeetingSerializer(upcomming, many=True).data,
            "recent": MeetingSerializer(recent, many=True).data
        })