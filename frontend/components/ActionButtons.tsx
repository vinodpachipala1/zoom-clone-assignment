import React from 'react';

interface ActionButtonsProps {
  onOpenInstant: () => void;
  isCreating: boolean;
  onOpenJoin: () => void;
  onOpenSchedule: () => void;
}

export default function ActionButtons({ onOpenInstant, isCreating, onOpenJoin, onOpenSchedule }: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <button onClick={onOpenInstant} disabled={isCreating} className={`flex flex-col items-center justify-center p-6 bg-zoom-orange hover:opacity-90 transition rounded-2xl aspect-square shadow-lg group ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
        </div>
        <span className="font-medium text-lg">{isCreating ? 'Starting...' : 'New Meeting'}</span>
      </button>

      <button onClick={onOpenJoin} className="flex flex-col items-center justify-center p-6 bg-zoom-blue hover:bg-zoom-blueHover transition rounded-2xl aspect-square shadow-lg group">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
        </div>
        <span className="font-medium text-lg">Join</span>
      </button>

      <button onClick={onOpenSchedule} className="flex flex-col items-center justify-center p-6 bg-zoom-card border border-gray-800 hover:bg-gray-800 transition rounded-2xl aspect-square shadow-lg group">
        <div className="w-16 h-16 bg-zoom-blue rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        </div>
        <span className="font-medium text-lg">Schedule</span>
      </button>

      <button className="flex flex-col items-center justify-center p-6 bg-zoom-card border border-gray-800 transition rounded-2xl aspect-square shadow-lg opacity-50 cursor-not-allowed">
        <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12"/></svg>
        </div>
        <span className="font-medium text-lg">Share Screen</span>
      </button>
    </div>
  );
}