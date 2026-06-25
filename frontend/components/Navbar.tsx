import React from 'react';

export default function Navbar() {
  return (
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
        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-medium border border-gray-500 cursor-pointer hover:border-gray-400 transition-colors shadow-sm" title="Profile">
          VU
        </div>
      </div>
    </nav>
  );
}