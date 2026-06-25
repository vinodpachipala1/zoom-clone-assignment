from django.urls import path
from .views import DashboardMeetingListView, MeetingValidateView, JoinMeetingView

urlpatterns = [
    path('api/dashboard/', DashboardMeetingListView.as_view(), name='dashboard-meetings'),
    path('api/meetings/validate/<str:code>/', MeetingValidateView.as_view(), name='meeting-validate'),
    path('api/meetings/join/<str:code>/', JoinMeetingView.as_view(), name='meeting-join'),
]