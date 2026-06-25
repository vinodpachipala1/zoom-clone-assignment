'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';

export default function MeetingRoom({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [copiedLink, setCopiedLink] = useState(false);

  const [localDisplayName, setLocalDisplayName] = useState('');
  const [isHost, setIsHost] = useState(false);

  const [showSidebar, setShowSidebar] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState('');

  const [meetingData, setMeetingData] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [error, setError] = useState('');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    setMounted(true);
    const validateRoom = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/meetings/validate/${resolvedParams.code}/`);
        if (res.ok) {
          const data = await res.json();
          setMeetingData(data);
          
          const savedSession = localStorage.getItem(`zoom_session_${resolvedParams.code}`);
          if (savedSession) {
            const parsedSession = JSON.parse(savedSession);
            setLocalDisplayName(parsedSession.displayName);
            setIsHost(parsedSession.isHost);
            joinRoomAPI(parsedSession.displayName, parsedSession.isHost);
          }
        } else {
          setError("This meeting room does not exist or has ended.");
        }
      } catch (err) {
        setError("Failed to connect to the server.");
      }
    };
    validateRoom();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [resolvedParams.code, backendUrl]);

  useEffect(() => {
    if (!hasJoined) return;
    const fetchParticipants = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/meetings/${resolvedParams.code}/participants/`);
        if (res.ok) {
          const data = await res.json();
          const backendHostName = data.host_name;
          const mappedParticipants = data.participants.map((p: any) => ({
            ...p,
            isRemoteHost: p.display_name === backendHostName
          }));
          const others = mappedParticipants.filter((p: any) => p.display_name !== localDisplayName);
          setParticipants(others);
        }
      } catch (err) {
        console.error("Failed to load participants", err);
      }
    };
    fetchParticipants();
    const participantInterval = setInterval(fetchParticipants, 3000);
    return () => clearInterval(participantInterval);
  }, [hasJoined, resolvedParams.code, backendUrl, localDisplayName]);

  useEffect(() => {
    if (hasJoined) {
      const startMedia = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn("Camera access blocked. Requires HTTPS or localhost.");
          setMediaError("Camera requires HTTPS or localhost");
          return;
        }

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          setLocalStream(stream);
        } catch (err) {
          console.error("Failed to access media devices.", err);
          setMediaError("Camera permissions denied");
        }
      };
      startMedia();
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [hasJoined]);

  useEffect(() => {
    if (localVideoRef.current && localStream && !isVideoOff) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOff, hasJoined]);

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOff;
      });
    }
  }, [isMuted, isVideoOff, localStream]);

  useEffect(() => {
    if (!hasJoined || !localDisplayName) return;
    const notifyBackendOfLeave = () => {
      fetch(`${backendUrl}/api/meetings/leave/${resolvedParams.code}/`, {
        method: 'POST',
        keepalive: true, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: localDisplayName })
      });
    };
    window.addEventListener('beforeunload', notifyBackendOfLeave);
    return () => {
      window.removeEventListener('beforeunload', notifyBackendOfLeave);
    };
  }, [hasJoined, localDisplayName, resolvedParams.code, backendUrl]);

  const joinRoomAPI = async (name: string, hostStatus: boolean) => {
    setIsJoining(true);
    try {
      const response = await fetch(`${backendUrl}/api/meetings/join/${resolvedParams.code}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: name })
      });
      if (response.ok) {
        localStorage.setItem(`zoom_session_${resolvedParams.code}`, JSON.stringify({
          displayName: name,
          isHost: hostStatus
        }));
        setHasJoined(true);
      } else {
        setError("Failed to join the meeting.");
      }
    } catch (err) {
      setError("Server connection failed.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLobbyJoin = (e: React.FormEvent) => {
    e.preventDefault();
    joinRoomAPI(localDisplayName, false); 
  };

  const handleLeave = async () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    await fetch(`${backendUrl}/api/meetings/leave/${resolvedParams.code}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: localDisplayName })
    });
    router.push('/');
  };

  const handleCopyInviteLink = async () => {
    const inviteUrl = `${window.location.origin}/meeting/${resolvedParams.code}`;
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
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  if (!mounted) return null;

  if (error) {
    return (
      <div className="min-h-screen bg-zoom-bg flex items-center justify-center text-white p-4">
        <div className="bg-zoom-card p-8 rounded-2xl border border-gray-800 text-center max-w-md w-full">
          <h2 className="text-xl font-bold mb-2 text-red-500">Connection Failed</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button onClick={() => router.push('/')} className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition">Return Home</button>
        </div>
      </div>
    );
  }

  if (!meetingData) return <div className="min-h-screen bg-zoom-bg flex items-center justify-center text-white">Connecting...</div>;

  let isEarly = false;
  let timeUntilOpen = 0;
  
  if (meetingData && !meetingData.is_instant) {
    const startMs = new Date(meetingData.start_time).getTime();
    const nowMs = currentTime.getTime();
    const diffMs = startMs - nowMs;
    
    if (diffMs > 600000) {
      isEarly = true;
      timeUntilOpen = diffMs - 600000;
    }
  }

  if (isEarly) {
    const h = Math.floor(timeUntilOpen / (1000 * 60 * 60));
    const m = Math.floor((timeUntilOpen % (1000 * 60 * 60)) / 60000);
    const s = Math.floor((timeUntilOpen % 60000) / 1000);

    return (
      <div className="min-h-screen bg-zoom-bg flex items-center justify-center text-white p-4">
        <div className="bg-zoom-card p-8 rounded-2xl border border-gray-700 max-w-md w-full shadow-2xl text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-6 border border-gray-600">
            <svg className="w-8 h-8 text-zoom-blue" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Meeting has not started</h2>
          <p className="text-gray-400 mb-6">This room will open 10 minutes before the scheduled start time.</p>
          
          <div className="w-full bg-gray-900 p-5 rounded-xl border border-gray-800 mb-6">
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-2 font-semibold">Room Opens In</p>
            <div className="text-4xl font-mono text-white font-bold tracking-widest">
              {h > 0 ? `${h}:` : ''}
              {m.toString().padStart(2, '0')}:
              {s.toString().padStart(2, '0')}
            </div>
          </div>
          
          <button onClick={() => router.push('/')} className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-zoom-bg flex items-center justify-center text-white p-4">
        <div className="bg-zoom-card p-8 rounded-2xl border border-gray-700 max-w-md w-full shadow-2xl">
          <h2 className="text-2xl font-bold mb-2">{meetingData.title}</h2>
          <p className="text-gray-400 mb-6">Enter your name to join this meeting</p>
          <form onSubmit={handleLobbyJoin} className="flex flex-col gap-4">
            <input type="text" required value={localDisplayName} onChange={(e) => setLocalDisplayName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-zoom-blue focus:outline-none" placeholder="Your Name" />
            <button type="submit" disabled={isJoining} className="w-full py-3 bg-zoom-blue hover:bg-zoom-blueHover rounded-lg font-medium transition">
              {isJoining ? 'Joining...' : 'Join Meeting'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col font-sans overflow-hidden">
      <div className="h-12 bg-black/90 px-4 flex items-center justify-between border-b border-gray-800 z-10 w-full">
        <span className="font-semibold text-sm">{meetingData.title}</span>
        <span className="text-sm text-gray-300">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div className="flex-1 flex mt-2 mb-20 relative">
        <div className="flex-1 p-4 flex items-center justify-center relative">
          <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
            
            <div className="bg-gray-900 rounded-xl overflow-hidden relative border border-gray-800 flex items-center justify-center group">
              
              {/* Falls back to avatar if stream fails to load due to HTTP restrictions */}
              {isVideoOff || !localStream ? (
                <div className="w-24 h-24 bg-zoom-blue rounded-full flex items-center justify-center text-3xl font-bold">
                  {localDisplayName ? localDisplayName.charAt(0).toUpperCase() : 'V'}
                </div>
              ) : (
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover transform -scale-x-100" 
                />
              )}

              {isMuted && (
                <div className="absolute top-4 right-4 bg-red-500 p-1.5 rounded-full z-10">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                </div>
              )}

              <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1.5 rounded-md text-sm font-medium border border-white/10 flex items-center gap-2">
                You ({localDisplayName}) {isHost && <span className="bg-zoom-blue text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Host</span>}
                {mediaError && <span className="text-red-400 text-xs ml-2">({mediaError})</span>}
              </div>
            </div>

            {/* Remote Participants */}
            {participants.length > 0 ? participants.map((p, idx) => (
              <div key={idx} className="bg-gray-900 rounded-xl overflow-hidden relative border border-gray-800 flex items-center justify-center">
                <div className="w-24 h-24 bg-zoom-blue rounded-full flex items-center justify-center text-3xl font-bold">
                  {p.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1.5 rounded-md text-sm font-medium border border-white/10 flex items-center gap-2">
                  {p.display_name} 
                  {p.isRemoteHost && <span className="bg-zoom-blue text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Host</span>}
                </div>
              </div>
            )) : (
              <div className="bg-gray-900/40 rounded-xl border border-gray-800 border-dashed flex flex-col items-center justify-center text-gray-400 p-6">
                <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                </div>
                <p className="mb-2 text-lg font-medium text-white">Waiting for others to join...</p>
                <p className="mb-6 text-sm">Meeting ID: <span className="font-mono text-white bg-gray-800 px-2 py-1 rounded ml-1">{meetingData.meeting_code}</span></p>
                
                <button 
                  onClick={handleCopyInviteLink} 
                  className="px-5 py-2.5 bg-zoom-blue hover:bg-zoom-blueHover text-white rounded-lg text-sm font-medium transition shadow-lg flex items-center gap-2"
                >
                  {copiedLink ? (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> Copied to Clipboard</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg> Copy Invite Link</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {showSidebar && (
          <div className="w-80 bg-zoom-card border-l border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-800 flex justify-between">
              <h3 className="font-semibold">Participants ({participants.length + 1})</h3>
              <button onClick={() => setShowSidebar(false)} className="text-gray-400">X</button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="p-3 bg-gray-800/50 rounded-lg mb-2 text-sm font-medium flex justify-between items-center">
                <span>You ({localDisplayName})</span>
                {isHost && <span className="text-xs text-zoom-blue font-bold uppercase tracking-wider">Host</span>}
              </div>
              {participants.map((p, idx) => (
                <div key={idx} className="p-3 bg-gray-800/30 rounded-lg mb-2 text-sm text-gray-300 flex justify-between items-center">
                  <span>{p.display_name}</span>
                  {p.isRemoteHost && <span className="text-xs text-zoom-blue font-bold uppercase tracking-wider">Host</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="h-20 bg-zoom-card border-t border-gray-800 absolute bottom-0 w-full flex items-center justify-between px-6 z-20">
        <div className="flex gap-4">
          <button 
            onClick={() => setIsMuted(!isMuted)} 
            className={`flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-lg transition-colors ${isMuted ? 'text-red-500 hover:bg-red-500/10' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            {isMuted ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
            )}
            <span className="text-xs">{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          <button 
            onClick={() => setIsVideoOff(!isVideoOff)} 
            className={`flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-lg transition-colors ${isVideoOff ? 'text-red-500 hover:bg-red-500/10' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            {isVideoOff ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/><line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            )}
            <span className="text-xs">{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
          </button>
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => setShowSidebar(!showSidebar)} className="flex flex-col items-center justify-center gap-1 h-14 px-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            <span className="text-xs">Participants ({participants.length + 1})</span>
          </button>
          
          <button onClick={handleCopyInviteLink} className="flex flex-col items-center justify-center gap-1 h-14 px-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            <span className="text-xs">{copiedLink ? <span className="text-green-400">Copied!</span> : 'Share Link'}</span>
          </button>
        </div>
        
        <button onClick={handleLeave} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition shadow-lg">Leave</button>
      </div>
    </div>
  );
}