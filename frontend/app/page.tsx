'use client';

import React, { useState, useEffect } from 'react';
// 1. Import Next.js navigation router
import { useRouter } from 'next/navigation'; 

export default function DashboardPage() {
  const router = useRouter(); // Initialize router
  const [isCreating, setIsCreating] = useState(false); // Loading state
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. The API connection function
  const handleInstantMeeting = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`${backendUrl}/api/dashboard/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Empty body because the backend handles all the generation
        body: JSON.stringify({}) 
      });

      if (response.ok) {
        const data = await response.json();
        // 3. Push the browser to the new meeting room route
        router.push(`/meeting/${data.meeting_code}`);
      }
    } catch (error) {
      console.error("Failed to create meeting:", error);
      setIsCreating(false);
    }
  };

  // ... (keep the rest of your UI the same, but update the orange button)

  return (
    <div className="min-h-screen bg-zoom-bg text-white font-sans flex flex-col">
      {/* Navbar Layout Shell */}
      <nav className="h-16 border-b border-gray-800 bg-zoom-card flex items-center justify-between px-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zoom-blue rounded-lg flex items-center justify-center font-bold text-lg">Z</div>
          <span className="font-semibold text-lg tracking-wide">zoom</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-medium border border-gray-500">
            VU
          </div>
        </div>
      </nav>

      {/* Main Content Layout Wrapper */}
      <main className="flex-1 max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
        
        {/* Left Interactive Operations Dashboard Panel */}
        <div className="md:col-span-2 flex flex-col justify-center gap-8">
          <div className="grid grid-cols-2 gap-6">
            
            {/* New Meeting Button */}
            {/* New Meeting Button */}
            <button 
              onClick={handleInstantMeeting}
              disabled={isCreating}
              className={`flex flex-col items-center justify-center p-6 bg-zoom-orange hover:opacity-90 transition rounded-2xl aspect-square shadow-lg group ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              </div>
              <span className="font-medium text-lg">
                {isCreating ? 'Creating...' : 'New Meeting'}
              </span>
            </button>

            {/* Join Meeting Button */}
            <button className="flex flex-col items-center justify-center p-6 bg-zoom-blue hover:bg-zoom-blueHover transition rounded-2xl aspect-square shadow-lg group">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
              </div>
              <span className="font-medium text-lg">Join</span>
            </button>

            {/* Schedule Meeting Button */}
            <button className="flex flex-col items-center justify-center p-6 bg-zoom-card border border-gray-800 hover:bg-gray-800 transition rounded-2xl aspect-square shadow-lg group">
              <div className="w-16 h-16 bg-zoom-blue rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <span className="font-medium text-lg">Schedule</span>
            </button>

            {/* Share Screen Placeholder Card */}
            <button className="flex flex-col items-center justify-center p-6 bg-zoom-card border border-gray-800 hover:bg-gray-800 transition rounded-2xl aspect-square shadow-lg group opacity-50 cursor-not-allowed">
              <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12"/></svg>
              </div>
              <span className="font-medium text-lg">Share Screen</span>
            </button>

          </div>
        </div>

        {/* Right Information Display Sidebar & Agenda Panel */}
        <div className="flex flex-col gap-6">
          {/* Zoom System Clock Display */}
          <div className="p-6 bg-zoom-card rounded-2xl border border-gray-800 shadow-md bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-zoom-card to-zoom-card">
            <h1 className="text-4xl font-bold tracking-tight">
              {mounted ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "..."}
            </h1>
            <p className="text-zoom-textMuted text-sm mt-1 font-medium">
              {mounted ? currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : "Loading date..."}
            </p>
          </div>

          {/* Agenda & Scheduled Data Card Lists */}
          <div className="flex-1 p-6 bg-zoom-card rounded-2xl border border-gray-800 shadow-md flex flex-col min-h-[300px]">
            <h2 className="font-semibold text-md uppercase tracking-wider text-zoom-textMuted mb-4">Today's Agenda</h2>
            
            <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
              <svg className="w-12 h-12 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <p className="text-sm font-medium text-gray-400">No upcoming meetings scheduled for today</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}