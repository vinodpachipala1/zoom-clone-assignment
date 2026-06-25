from django.urls import path
from .views import DashboardMeetingListView, MeetingValidateView, JoinMeetingView, LeaveMeetingView, MeetingParticipantsView

urlpatterns = [
    path('api/dashboard/', DashboardMeetingListView.as_view(), name='dashboard-meetings'),
    path('api/meetings/validate/<str:code>/', MeetingValidateView.as_view(), name='meeting-validate'),
    path('api/meetings/join/<str:code>/', JoinMeetingView.as_view(), name='meeting-join'),
    path('api/meetings/leave/<str:code>/', LeaveMeetingView.as_view(), name='meeting-leave'),
    path('api/meetings/<str:code>/participants/', MeetingParticipantsView.as_view(), name='meeting-participants'),
]