import React, { useEffect, useRef, useState } from 'react';
import { Camera, Mic, MicOff, CameraOff, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Lobby = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isCameraOn) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
        .catch(err => console.error("Media Error:", err));
    } else {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    }
  }, [isCameraOn]);

  return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-2xl font-bold mb-8">Ready to join "Sprint Sync"?</h1>
      
      <div className="relative w-full max-w-2xl aspect-video bg-slate-800 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl">
        {isCameraOn ? <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" /> : 
        <div className="flex items-center justify-center h-full text-slate-500 flex-col"><CameraOff size={64}/> <p>Camera is off</p></div>}
        
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
          <button onClick={() => setIsMicOn(!isMicOn)} className={`p-4 rounded-full ${isMicOn ? 'bg-slate-700' : 'bg-red-500'}`}>
            {isMicOn ? <Mic size={24}/> : <MicOff size={24}/>}
          </button>
          <button onClick={() => setIsCameraOn(!isCameraOn)} className={`p-4 rounded-full ${isCameraOn ? 'bg-slate-700' : 'bg-red-500'}`}>
            {isCameraOn ? <Camera size={24}/> : <CameraOff size={24}/>}
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <p className="text-slate-400">@User and 3 others are already in the call</p>
        <button onClick={() => navigate('/dashboard')} className="bg-blue-600 hover:bg-blue-700 px-12 py-3 rounded-xl font-bold text-lg flex items-center gap-2 transition-all">
          <Video size={20}/> Join Meeting
        </button>
      </div>
    </div>
  );
};

export default Lobby;