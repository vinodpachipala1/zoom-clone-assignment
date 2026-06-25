import React, { useState } from 'react';

interface MeetingPanelProps {
  currentTime: Date;
  mounted: boolean;
  meetings: { upcoming: any[]; recent: any[] };
}

export default function MeetingPanel({ currentTime, mounted, meetings }: MeetingPanelProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'recent'>('upcoming');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopyLink = async (e: React.MouseEvent, meetingCode: string, id: number) => {
    e.stopPropagation(); 
    
    // Build the URL
    const inviteUrl = `${window.location.origin}/meeting/${meetingCode}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        // Fallback for local IP development
        const textArea = document.createElement("textarea");
        textArea.value = inviteUrl;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="flex flex-col gap-6 xl:gap-8">
      {/* Clock Widget */}
      <div className="p-6 xl:p-8 bg-zoom-card rounded-2xl border border-gray-800 shadow-md bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-zoom-card to-zoom-card">
        <h1 className="text-4xl xl:text-5xl font-bold tracking-tight">
          {mounted ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "..."}
        </h1>
        <p className="text-zoom-textMuted text-sm xl:text-base mt-2 font-medium">
          {mounted ? currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : "Loading date..."}
        </p>
      </div>

      {/* Tabs and List */}
      <div className="flex-1 p-6 xl:p-8 bg-zoom-card rounded-2xl border border-gray-800 shadow-md flex flex-col min-h-[300px] overflow-y-auto">
        <div className="flex gap-6 border-b border-gray-700 mb-6">
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={`pb-3 font-semibold text-sm xl:text-base tracking-wider uppercase transition-colors border-b-2 ${
              activeTab === 'upcoming' ? 'text-white border-zoom-blue' : 'text-zoom-textMuted border-transparent hover:text-gray-300'
            }`}
          >
            Upcoming
          </button>
          <button 
            onClick={() => setActiveTab('recent')}
            className={`pb-3 font-semibold text-sm xl:text-base tracking-wider uppercase transition-colors border-b-2 ${
              activeTab === 'recent' ? 'text-white border-zoom-blue' : 'text-zoom-textMuted border-transparent hover:text-gray-300'
            }`}
          >
            Recent
          </button>
        </div>
        
        {activeTab === 'upcoming' ? (
          meetings.upcoming.length > 0 ? (
            <div className="flex flex-col gap-4">
              {meetings.upcoming.map((meeting: any) => (
                <div key={meeting.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-zoom-blue transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white truncate">{meeting.title}</h3>
                    <div className="text-sm text-zoom-textMuted mt-2 flex flex-col gap-1">
                      <span>{new Date(meeting.start_time).toLocaleDateString()} at {new Date(meeting.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      <span className="text-gray-400">Meeting ID: <span className="font-mono text-gray-300">{meeting.meeting_code}</span></span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleCopyLink(e, meeting.meeting_code, meeting.id)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap w-fit"
                  >
                    {copiedId === meeting.id ? (
                      <span className="text-green-400 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        Copied!
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        Copy Link
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center opacity-60">
              <p className="text-zoom-textMuted">No upcoming meetings scheduled.</p>
            </div>
          )
        ) : (
          meetings.recent.length > 0 ? (
            <div className="flex flex-col gap-3">
              {meetings.recent.slice(0, 5).map((meeting: any) => (
                <div key={meeting.id} className="p-4 bg-gray-900/50 rounded-lg border border-gray-800 hover:bg-gray-800 transition cursor-pointer">
                  <h3 className="text-sm font-medium text-gray-200 truncate">{meeting.title}</h3>
                  <div className="flex flex-col gap-1 mt-2 text-xs text-gray-500">
                    
                    <span>{new Date(meeting.start_time).toLocaleDateString()} at {new Date(meeting.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span>Meeting ID: <span className="font-mono text-gray-400">{meeting.meeting_code}</span></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center opacity-60">
              <p className="text-zoom-textMuted">No previous meetings.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}