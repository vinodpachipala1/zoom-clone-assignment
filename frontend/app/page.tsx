'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // State for fetching and displaying meetings
  const [meetings, setMeetings] = useState({ upcoming: [], recent: [] });
  const [isCreating, setIsCreating] = useState(false);
  
  // State for the Schedule Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    time: '12:00',
    duration: 40
  });

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

  // 1. Fetch meetings from the backend
  const fetchMeetings = async () => {
    try {
      // FORCE Next.js to bypass the cache and get fresh database records
      const res = await fetch(`${backendUrl}/api/dashboard/`, { cache: 'no-store' });
      
      if (res.ok) {
        const data = await res.json();
        console.log("Fetched Data:", data); // Add this log to see the raw data!
        setMeetings(data);
      }
    } catch (error) {
      console.error("Failed to load meetings:", error);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchMeetings(); // Load data on mount
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Handle Instant Meeting (unchanged)
  const handleInstantMeeting = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`${backendUrl}/api/dashboard/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_instant: true }) 
      });
      if (response.ok) {
        const data = await response.json();
        router.push(`/meeting/${data.meeting_code}`);
      }
    } catch (error) {
      console.error("Failed to create meeting:", error);
      setIsCreating(false);
    }
  };

  // 3. Handle Scheduled Meeting Submit
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine date and time strings into a valid ISO datetime format for Django
    const startDateTime = new Date(`${formData.date}T${formData.time}:00`).toISOString();

    try {
      const response = await fetch(`${backendUrl}/api/dashboard/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_instant: false,
          title: formData.title || `${formData.date} Meeting`,
          description: formData.description,
          start_time: startDateTime,
          duration_minutes: formData.duration
        })
      });

      if (response.ok) {
        setIsModalOpen(false); // Close the modal
        fetchMeetings(); // Refresh the list so the new meeting appears!
      }
    } catch (error) {
      console.error("Failed to schedule meeting:", error);
    }
  };

  return (
    <div className="min-h-screen bg-zoom-bg text-white font-sans flex flex-col relative">
      {/* Navbar */}
      <nav className="h-16 border-b border-gray-800 bg-zoom-card flex items-center justify-between px-8 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zoom-blue rounded-lg flex items-center justify-center font-bold text-lg">Z</div>
          <span className="font-semibold text-lg tracking-wide">zoom</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-medium border border-gray-500">VU</div>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
        {/* Left Action Buttons */}
        <div className="md:col-span-2 flex flex-col justify-center gap-8">
          <div className="grid grid-cols-2 gap-6">
            
            <button onClick={handleInstantMeeting} disabled={isCreating} className={`flex flex-col items-center justify-center p-6 bg-zoom-orange hover:opacity-90 transition rounded-2xl aspect-square shadow-lg group ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              </div>
              <span className="font-medium text-lg">{isCreating ? 'Starting...' : 'New Meeting'}</span>
            </button>

            <button className="flex flex-col items-center justify-center p-6 bg-zoom-blue hover:bg-zoom-blueHover transition rounded-2xl aspect-square shadow-lg group">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
              </div>
              <span className="font-medium text-lg">Join</span>
            </button>

            {/* OPEN MODAL BUTTON */}
            <button onClick={() => setIsModalOpen(true)} className="flex flex-col items-center justify-center p-6 bg-zoom-card border border-gray-800 hover:bg-gray-800 transition rounded-2xl aspect-square shadow-lg group">
              <div className="w-16 h-16 bg-zoom-blue rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <span className="font-medium text-lg">Schedule</span>
            </button>

            <button className="flex flex-col items-center justify-center p-6 bg-zoom-card border border-gray-800 transition rounded-2xl aspect-square shadow-lg opacity-50 cursor-not-allowed">
              <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12"/></svg>
              </div>
              <span className="font-medium text-lg">Share Screen</span>
            </button>

          </div>
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-6">
          <div className="p-6 bg-zoom-card rounded-2xl border border-gray-800 shadow-md bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-zoom-card to-zoom-card">
            <h1 className="text-4xl font-bold tracking-tight">
              {mounted ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "..."}
            </h1>
            <p className="text-zoom-textMuted text-sm mt-1 font-medium">
              {mounted ? currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : "Loading date..."}
            </p>
          </div>

          <div className="flex-1 p-6 bg-zoom-card rounded-2xl border border-gray-800 shadow-md flex flex-col min-h-[300px] overflow-y-auto">
            <h2 className="font-semibold text-md uppercase tracking-wider text-zoom-textMuted mb-4">Upcoming Meetings</h2>
            
            {/* Map over our fetched database records! */}
            {meetings.upcoming.length > 0 ? (
              <div className="flex flex-col gap-4">
                {meetings.upcoming.map((meeting: any) => (
                  <div key={meeting.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-500 transition cursor-pointer">
                    <h3 className="font-semibold text-white truncate">{meeting.title}</h3>
                    <p className="text-sm text-zoom-textMuted mt-1">
                      {new Date(meeting.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • ID: {meeting.meeting_code}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
                <svg className="w-12 h-12 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <p className="text-sm font-medium text-gray-400">No upcoming meetings scheduled</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* SCHEDULE MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zoom-card w-full max-w-lg rounded-2xl border border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/30">
              <h2 className="text-xl font-bold">Schedule Meeting</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleScheduleSubmit} className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Topic</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-zoom-blue focus:outline-none" placeholder="Vinod's Zoom Meeting" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                  <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-zoom-blue focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Time</label>
                  <input type="time" required value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-zoom-blue focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Duration (minutes)</label>
                <select value={formData.duration} onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-zoom-blue focus:outline-none">
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={40}>40 Minutes (Basic Limit)</option>
                  <option value={60}>1 Hour</option>
                </select>
              </div>

              <div className="mt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-zoom-blue hover:bg-zoom-blueHover text-white rounded-lg font-medium transition shadow-md">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}