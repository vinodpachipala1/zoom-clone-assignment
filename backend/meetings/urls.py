from django.urls import path
from .views import DashboardMeetingListView

urlpatterns = [
    path('api/dashboard/', DashboardMeetingListView.as_view(), name='dashboard-meetings'),
]