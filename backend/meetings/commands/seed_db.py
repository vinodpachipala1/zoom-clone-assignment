import os
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from meetings.models import Meeting, UserProfile
from meetings.views import generate_zoom_code

class Command(BaseCommand):
    help = 'Seeds the database with sample Zoom meetings'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database...')
        
        # Pull frontend URL from environment variables, fallback to local network IP
        frontend_url = os.getenv('FRONTEND_URL')
        
        # 1. Create Default Host
        host, _ = UserProfile.objects.get_or_create(
            name="Vinod Pachipala", 
            email="vinod@zoomclone.local"
        )

        # Clear existing meetings for a fresh slate
        Meeting.objects.all().delete()

        now = timezone.now()

        # 2. Create Recent (Past) Meetings
        for i in range(1, 4):
            code = generate_zoom_code()
            Meeting.objects.create(
                title=f"Previous Team Sync {i}",
                description="Discussed weekly goals.",
                meeting_code=code,
                invite_link=f"{frontend_url}/meeting/{code}",
                start_time=now - timedelta(days=i, hours=2),
                duration_minutes=40,
                is_instant=False,
                host=host
            )

        # 3. Create Upcoming Meetings
        for i in range(1, 4):
            code = generate_zoom_code()
            Meeting.objects.create(
                title=f"Upcoming Project Review {i}",
                description="Frontend architecture review.",
                meeting_code=code,
                invite_link=f"{frontend_url}/meeting/{code}",
                start_time=now + timedelta(days=i, hours=1),
                duration_minutes=60,
                is_instant=False,
                host=host
            )
            
        self.stdout.write(self.style.SUCCESS('Successfully seeded database with 6 meetings!'))