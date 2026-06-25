'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const getNextValidTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5); 
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const date = `${year}-${month}-${day}`;
  
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const time = `${hours}:${minutes}`;

  return { title: '', description: '', date, time, duration: 40 };
};

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [meetings, setMeetings] = useState({ upcoming: [], recent: [] });
  const [isCreating, setIsCreating] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'upcoming' | 'recent'>('upcoming');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isInstantOpen, setIsInstantOpen] = useState(false);
  
  const [instantName, setInstantName] = useState('Default User');
  const [successMeeting, setSuccessMeeting] = useState<any>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  
  const [scheduleData, setScheduleData] = useState(getNextValidTime());
  const [joinData, setJoinData] = useState({ code: '', displayName: '' });
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchMeetings = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/dashboard/`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
      }
    } catch (error) {
      console.error("Failed to load meetings:", error);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchMeetings();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleInstantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const response = await fetch(`${backendUrl}/api/dashboard/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          is_instant: true,
          host_name: instantName 
        }) 
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem(`zoom_session_${data.meeting_code}`, JSON.stringify({
          displayName: instantName,
          isHost: true
        }));
        router.push(`/meeting/${data.meeting_code}`);
      }
    } catch (error) {
      console.error("Failed to create meeting:", error);
    } finally {
      setIsCreating(false);
      setIsInstantOpen(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const startDateTime = new Date(`${scheduleData.date}T${scheduleData.time}:00`).toISOString();

    try {
      const response = await fetch(`${backendUrl}/api/dashboard/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_instant: false,
          title: scheduleData.title || `${scheduleData.date} Meeting`,
          description: scheduleData.description,
          start_time: startDateTime,
          duration_minutes: scheduleData.duration
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMeeting(data);
        setIsScheduleOpen(false);
        fetchMeetings(); 
      }
    } catch (error) {
      console.error("Failed to schedule meeting:", error);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    setIsJoining(true);

    const cleanCode = joinData.code.trim();

    try {
      const response = await fetch(`${backendUrl}/api/meetings/join/${cleanCode}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: joinData.displayName })
      });

      if (response.ok) {
        router.push(`/meeting/${cleanCode}`);
      } else if (response.status === 404) {
        setJoinError("Meeting ID is invalid or not found.");
      } else {
        setJoinError("An error occurred while joining.");
      }
    } catch (error) {
      setJoinError("Failed to connect to server.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleCopyLink = async (e: React.MouseEvent, meetingCode: string, id: number) => {
    e.stopPropagation(); 
    const inviteUrl = `${window.location.origin}/meeting/${meetingCode}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
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

  const handleSuccessCopy = async () => {
    const inviteUrl = `${window.location.origin}/meeting/${successMeeting.meeting_code}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = inviteUrl;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="min-h-screen bg-zoom-bg text-white font-sans flex flex-col relative">
      <nav className="h-16 border-b border-gray-800 bg-zoom-card flex items-center justify-between px-8 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zoom-blue rounded-lg flex items-center justify-center font-bold text-lg shadow-md">Z</div>
          <span className="font-semibold text-lg tracking-wide">zoom</span>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-gray-400 hover:text-white transition-colors" title="Settings">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          {/* FIXED: Changed to "V" */}
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-medium border border-gray-500 cursor-pointer hover:border-gray-400 transition-colors shadow-sm" title="Profile">
            V
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 xl:gap-12 p-8 md:p-10">
        <div className="md:col-span-2 flex flex-col justify-center gap-8 xl:gap-12">
          
          <div className="grid grid-cols-2 gap-6 xl:gap-10">
            <button onClick={() => setIsInstantOpen(true)} disabled={isCreating} className={`flex flex-col items-center justify-center p-6 xl:p-8 bg-zoom-orange hover:opacity-90 transition rounded-2xl aspect-square shadow-lg group ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <div className="w-16 h-16 xl:w-20 xl:h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-8 h-8 xl:w-10 xl:h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              </div>
              <span className="font-medium text-lg xl:text-xl">{isCreating ? 'Starting...' : 'New Meeting'}</span>
            </button>

            <button onClick={() => setIsJoinOpen(true)} className="flex flex-col items-center justify-center p-6 xl:p-8 bg-zoom-blue hover:bg-zoom-blueHover transition rounded-2xl aspect-square shadow-lg group">
              <div className="w-16 h-16 xl:w-20 xl:h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-8 h-8 xl:w-10 xl:h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              </div>
              <span className="font-medium text-lg xl:text-xl">Join</span>
            </button>

            <button onClick={() => { setScheduleData(getNextValidTime()); setIsScheduleOpen(true); }} className="flex flex-col items-center justify-center p-6 xl:p-8 bg-zoom-card border border-gray-800 hover:bg-gray-800 transition rounded-2xl aspect-square shadow-lg group">
              <div className="w-16 h-16 xl:w-20 xl:h-20 bg-zoom-blue rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-8 h-8 xl:w-10 xl:h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <span className="font-medium text-lg xl:text-xl">Schedule</span>
            </button>

            <button className="flex flex-col items-center justify-center p-6 xl:p-8 bg-zoom-card border border-gray-800 transition rounded-2xl aspect-square shadow-lg opacity-50 cursor-not-allowed">
              <div className="w-16 h-16 xl:w-20 xl:h-20 bg-gray-700 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 xl:w-10 xl:h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12"/></svg>
              </div>
              <span className="font-medium text-lg xl:text-xl">Share Screen</span>
            </button>
          </div>
          
        </div>

        <div className="flex flex-col gap-6 xl:gap-8">
          <div className="p-6 xl:p-8 bg-zoom-card rounded-2xl border border-gray-800 shadow-md bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-zoom-card to-zoom-card">
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight">
              {mounted ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "..."}
            </h1>
            <p className="text-zoom-textMuted text-sm xl:text-base mt-2 font-medium">
              {mounted ? currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : "Loading date..."}
            </p>
          </div>

          <div className="flex-1 p-6 xl:p-8 bg-zoom-card rounded-2xl border border-gray-800 shadow-md flex flex-col min-h-[300px] overflow-y-auto">
            <div className="flex gap-6 border-b border-gray-700 mb-6">
              <button onClick={() => setActiveTab('upcoming')} className={`pb-3 font-semibold text-sm xl:text-base tracking-wider uppercase transition-colors border-b-2 ${activeTab === 'upcoming' ? 'text-white border-zoom-blue' : 'text-zoom-textMuted border-transparent hover:text-gray-300'}`}>
                Upcoming
              </button>
              <button onClick={() => setActiveTab('recent')} className={`pb-3 font-semibold text-sm xl:text-base tracking-wider uppercase transition-colors border-b-2 ${activeTab === 'recent' ? 'text-white border-zoom-blue' : 'text-zoom-textMuted border-transparent hover:text-gray-300'}`}>
                Recent
              </button>
            </div>
            
            {activeTab === 'upcoming' ? (
              meetings.upcoming.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {meetings.upcoming.map((meeting: any) => (
                    <div key={meeting.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-zoom-blue transition flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-white truncate">{meeting.title}</h3>
                        {/* FIXED: Rendering description nicely if it exists */}
                        {meeting.description && (
                          <p className="text-sm text-gray-400 mt-1 italic line-clamp-2">{meeting.description}</p>
                        )}
                        <div className="text-sm text-zoom-textMuted mt-2 flex flex-col gap-1">
                          <span>{new Date(meeting.start_time).toLocaleDateString()} at {new Date(meeting.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          <span className="text-gray-400">Meeting ID: <span className="font-mono text-gray-300">{meeting.meeting_code}</span></span>
                        </div>
                      </div>

                      <button 
                        onClick={(e) => handleCopyLink(e, meeting.meeting_code, meeting.id)}
                        className="px-4 py-2 mt-1 bg-gray-700 hover:bg-gray-600 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap w-fit"
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
      </main>

      {/* INSTANT MEETING MODAL */}
      {isInstantOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zoom-card w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/30">
              <h2 className="text-xl font-bold">Start Instant Meeting</h2>
              <button onClick={() => setIsInstantOpen(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleInstantSubmit} className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Your Name (Host)</label>
                <input type="text" required value={instantName} onChange={(e) => setInstantName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-zoom-blue focus:outline-none" placeholder="Enter your name" />
              </div>
              <div className="mt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsInstantOpen(false)} className="px-5 py-2.5 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition">Cancel</button>
                <button type="submit" disabled={isCreating} className={`px-5 py-2.5 bg-zoom-orange hover:opacity-90 text-white rounded-lg font-medium transition shadow-md ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isCreating ? 'Starting...' : 'Start Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {isScheduleOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zoom-card w-full max-w-lg rounded-2xl border border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/30">
              <h2 className="text-xl font-bold">Schedule Meeting</h2>
              <button onClick={() => setIsScheduleOpen(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[80vh]">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Topic</label>
                <input type="text" required value={scheduleData.title} onChange={(e) => setScheduleData({...scheduleData, title: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-zoom-blue focus:outline-none" placeholder="My Meeting" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description (Optional)</label>
                <textarea rows={2} value={scheduleData.description} onChange={(e) => setScheduleData({...scheduleData, description: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-zoom-blue focus:outline-none resize-none" placeholder="Meeting description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                  <input type="date" required value={scheduleData.date} onChange={(e) => setScheduleData({...scheduleData, date: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-zoom-blue focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Time</label>
                  <input type="time" required value={scheduleData.time} onChange={(e) => setScheduleData({...scheduleData, time: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-zoom-blue focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Duration</label>
                <select value={scheduleData.duration} onChange={(e) => setScheduleData({...scheduleData, duration: parseInt(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-zoom-blue focus:outline-none appearance-none cursor-pointer">
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={40}>40 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={120}>2 Hours</option>
                </select>
              </div>
              <div className="mt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsScheduleOpen(false)} className="px-5 py-2.5 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-zoom-blue hover:bg-zoom-blueHover text-white rounded-lg font-medium transition shadow-md">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN MODAL */}
      {isJoinOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zoom-card w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/30">
              <h2 className="text-xl font-bold">Join Meeting</h2>
              <button onClick={() => {setIsJoinOpen(false); setJoinError('');}} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleJoinSubmit} className="p-6 flex flex-col gap-5">
              {joinError && (
                <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">{joinError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Meeting ID</label>
                <input type="text" required value={joinData.code} onChange={(e) => setJoinData({...joinData, code: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-zoom-blue focus:outline-none font-mono" placeholder="XXX-XXX-XXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Your Name</label>
                <input type="text" required value={joinData.displayName} onChange={(e) => setJoinData({...joinData, displayName: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-zoom-blue focus:outline-none" placeholder="Enter your display name" />
              </div>
              <div className="mt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => {setIsJoinOpen(false); setJoinError('');}} className="px-5 py-2.5 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition">Cancel</button>
                <button type="submit" disabled={isJoining} className={`px-5 py-2.5 bg-zoom-blue hover:bg-zoom-blueHover text-white rounded-lg font-medium transition shadow-md ${isJoining ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isJoining ? 'Joining...' : 'Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL OVERLAY */}
      {successMeeting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zoom-card w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/30">
              <h2 className="text-xl font-bold text-green-400 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Meeting Scheduled
              </h2>
              <button onClick={() => { setSuccessMeeting(null); setCopiedSuccess(false); }} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-6">
              <div>
                <h3 className="font-semibold text-lg text-white mb-1">{successMeeting.title}</h3>
                <p className="text-sm text-gray-400">
                  {new Date(successMeeting.start_time).toLocaleDateString()} at {new Date(successMeeting.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>

              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Meeting ID</p>
                <p className="text-2xl font-mono tracking-wider font-bold text-white">{successMeeting.meeting_code}</p>
              </div>

              <button 
                onClick={handleSuccessCopy}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                {copiedSuccess ? (
                  <span className="text-green-400 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    Copied to Clipboard
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    Copy Invitation Link
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}