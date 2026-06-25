'use client';

import React, { use } from 'react';

export default function MeetingRoom({ params }: { params: Promise<{ code: string }> }) {
  // Unwrap the params promise for Next.js 15+
  const resolvedParams = use(params);

  return (
    <div className="min-h-screen bg-zoom-bg flex items-center justify-center text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to Meeting: {resolvedParams.code}</h1>
        <p className="text-zoom-textMuted">This is a placeholder for the video room.</p>
      </div>
    </div>
  );
}