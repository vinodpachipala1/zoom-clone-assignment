import uuid
from django.db import models
from django.utils import timezone

# Create your models here.
class UserProfile(models.Model):
    
    name = models.CharField(max_length=150, default="Default Zoom User")
    email = models.EmailField(unique=True, default="user@zoomclone.local")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
class Meeting(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null = True)
    meeting_code = models.CharField(max_length=50, unique=True, db_index = True)
    invite_link = models.URLField(max_length=500)
    
    start_time = models.DateTimeField(default=timezone.now)
    duration_minutes = models.IntegerField(default=40)
    is_instant = models.BooleanField(default=False)
    
    host = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="hosted_meetings")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-start_time']
        
    def __str__(self):
        return f"{self.title} ({self.meeting_code})"
    
class ParticipantSession(models.Model):
    """Tracks active or recent participants in a meeting room."""
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name="participants")
    display_name = models.CharField(max_length=100)
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.display_name} in {self.meeting.meeting_code}"

class ParticipantSession(models.Model):
    """Tracks active or recent participants in a meeting room."""
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name="participants")
    display_name = models.CharField(max_length=100)
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.display_name} in {self.meeting.meeting_code}"