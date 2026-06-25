from rest_framework import serializers
from .models import Meeting, ParticipantSession

class MeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meeting
        fields = '__all__'
        
class ParticipantSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParticipantSession
        fields = '__all__'