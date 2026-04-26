import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { API_BASE_URL, getMeeting, startMeeting, endMeeting, summarizeMeeting, saveTranscript, saveRecordingPart } from '../services/api'
import { getSocket } from '../services/socket'
import { genUploader } from 'uploadthing/client'
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  MessageSquare, PhoneOff, Bot, Copy, Users, Loader2, Send, X
} from 'lucide-react'

interface Participant {
  socketId: string
  userId: string
  userName: string
  stream?: MediaStream
  isMuted?: boolean
  isVideoOff?: boolean
}

interface ChatMsg {
  id: string
  message: string
  userId: string
  userName: string
  timestamp: string
}

const { uploadFiles: uploadRecordingFiles } = genUploader<any>({
  url: `${API_BASE_URL}/uploadthing`,
})

const MEETING_LIMIT_SECONDS = 120000

export default function MeetingRoom() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const socket = getSocket()

  const [meeting, setMeeting] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map())
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [activePanelTab, setActivePanelTab] = useState<'chat' | 'transcript'>('chat')
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [msgInput, setMsgInput] = useState('')
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [transcript, setTranscript] = useState('')
  const [aiSummary, setAiSummary] = useState<any>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [copied, setCopied] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(MEETING_LIMIT_SECONDS)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const chatEndRef = useRef<HTMLDivElement>(null)
  const typingTimerRef = useRef<any>(null)
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const aiRecorderActiveRef = useRef(false)
  const aiRecorderTimerRef = useRef<any>(null)
  const recordingPartRef = useRef(0)
  const endingRef = useRef(false)
  const limitStartedAtRef = useRef<number | null>(null)

  const roomId = id!

  // ── Sync local stream to video element when loading finishes ───────────────────
  useEffect(() => {
    if (!loading && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current
    }
  }, [loading])

  // ── Init meeting & media ─────────────────────────────────────────
  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const res = await getMeeting(id!)
        if (!mounted) return
        setMeeting(res.data.meeting)
        setMessages(res.data.meeting.chatMessages?.map((m: any) => ({
          id: m._id, message: m.message, userId: m.sender,
          userName: m.senderName, timestamp: m.timestamp
        })) || [])

        if (res.data.meeting.status === 'scheduled') {
          await startMeeting(id!)
        }

        await setupMedia()
        setLoading(false)
      } catch (err) {
        console.error(err)
        navigate('/app/dashboard')
      }
    }

    init()
    return () => { mounted = false }
  }, [id])

  // ── Setup local media ────────────────────────────────────────────
  const setupMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.muted = true
      }

      socket.emit('join-room', { roomId, userId: user?.id, userName: user?.name })
    } catch (err) {
      console.warn('Camera/mic not available, joining without media')
      socket.emit('join-room', { roomId, userId: user?.id, userName: user?.name })
    }
  }

  // ── WebRTC peer creation ─────────────────────────────────────────
  const createPeer = useCallback((targetSocketId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    })

    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!)
    })

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('ice-candidate', { to: targetSocketId, candidate: e.candidate })
      }
    }

    pc.ontrack = (e) => {
      setParticipants(prev => {
        const updated = new Map(prev)
        const p = updated.get(targetSocketId)
        if (p) updated.set(targetSocketId, { ...p, stream: e.streams[0] })
        return updated
      })
    }

    peersRef.current.set(targetSocketId, pc)
    return pc
  }, [socket, roomId])

  // ── Socket events ────────────────────────────────────────────────
  useEffect(() => {
    socket.on('room-participants', (list: Participant[]) => {
      list.forEach(async (p) => {
        if (p.socketId === socket.id) return
        setParticipants(prev => new Map(prev).set(p.socketId, p))
        const pc = createPeer(p.socketId)
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.emit('webrtc-offer', { to: p.socketId, offer, from: socket.id, fromName: user?.name })
      })
    })

    socket.on('user-joined', async ({ socketId, userId, userName }: any) => {
      setParticipants(prev => new Map(prev).set(socketId, { socketId, userId, userName }))
    })

    socket.on('webrtc-offer', async ({ offer, from, fromName }: any) => {
      setParticipants(prev => new Map(prev).set(from, { socketId: from, userId: '', userName: fromName }))
      const pc = createPeer(from)
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('webrtc-answer', { to: from, answer })
    })

    socket.on('webrtc-answer', async ({ answer, from }: any) => {
      const pc = peersRef.current.get(from)
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer))
    })

    socket.on('ice-candidate', async ({ candidate, from }: any) => {
      const pc = peersRef.current.get(from)
      if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate))
    })

    socket.on('receive-message', (msg: ChatMsg) => {
      setMessages(prev => [...prev, msg])
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    })

    socket.on('user-typing', ({ userName, isTyping }: any) => {
      setTypingUsers(prev =>
        isTyping ? [...prev.filter(u => u !== userName), userName] : prev.filter(u => u !== userName)
      )
    })

    socket.on('user-left', ({ socketId, userName }: any) => {
      setParticipants(prev => { const m = new Map(prev); m.delete(socketId); return m })
      peersRef.current.get(socketId)?.close()
      peersRef.current.delete(socketId)
    })

    socket.on('meeting-ended', () => {
      cleanup()
      navigate('/app/dashboard')
    })

    return () => {
      socket.off('room-participants')
      socket.off('user-joined')
      socket.off('webrtc-offer')
      socket.off('webrtc-answer')
      socket.off('ice-candidate')
      socket.off('receive-message')
      socket.off('user-typing')
      socket.off('user-left')
      socket.off('meeting-ended')
    }
  }, [socket, createPeer])

  // ── Speech recognition for live transcript ───────────────────────
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognitionRef.current = recognition

    recognition.onresult = (event: any) => {
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript + ' '
      }
      if (final) {
        setTranscript(prev => prev + `[${user?.name || 'User'}]: ${final}\n`)
        socket.emit('transcript-update', { roomId, meetingId: id, text: `[${user?.name || 'User'}]: ${final}` })
      }
    }

    recognition.onend = () => {
      // Auto-restart recognition to keep it running continuously
      try { recognition.start() } catch (err) {}
    }

    recognition.start()
    return () => {
      recognition.onend = null;
      recognition.stop()
    }
  }, [])

  useEffect(() => {
    if (!id || !transcript.trim()) return

    const timer = setTimeout(() => {
      saveTranscript(id, transcript).catch((error) => {
        console.warn('Failed to save transcript', error)
      })
    }, 2000)

    return () => clearTimeout(timer)
  }, [id, transcript])

  // ── Controls ─────────────────────────────────────────────────────
  const toggleMute = () => {
    const stream = localStreamRef.current
    if (stream) {
      stream.getAudioTracks().forEach(t => (t.enabled = isMuted))
      setIsMuted(!isMuted)
      socket.emit('toggle-audio', { roomId, userId: user?.id, isMuted: !isMuted })
    }
  }

  const toggleVideo = () => {
    const stream = localStreamRef.current
    if (stream) {
      stream.getVideoTracks().forEach(t => (t.enabled = isVideoOff))
      setIsVideoOff(!isVideoOff)
      socket.emit('toggle-video', { roomId, userId: user?.id, isVideoOff: !isVideoOff })
    }
  }

  const toggleScreen = async () => {
    if (isSharing) {
      screenStreamRef.current?.getTracks().forEach(t => t.stop())
      setIsSharing(false)
      socket.emit('screen-share-stop', { roomId, userId: user?.id })
      
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current
      }
      peersRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video')
        if (sender && localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0]
          if (videoTrack) sender.replaceTrack(videoTrack)
        }
      })
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true })
        screenStreamRef.current = screen
        if (localVideoRef.current) localVideoRef.current.srcObject = screen
        peersRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video')
          if (sender) sender.replaceTrack(screen.getVideoTracks()[0])
        })
        setIsSharing(true)
        socket.emit('screen-share-start', { roomId, userId: user?.id })
        
        screen.getVideoTracks()[0].onended = () => {
          setIsSharing(false)
          socket.emit('screen-share-stop', { roomId, userId: user?.id })
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current
          }
          peersRef.current.forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video')
            if (sender && localStreamRef.current) {
              const videoTrack = localStreamRef.current.getVideoTracks()[0]
              if (videoTrack) sender.replaceTrack(videoTrack)
            }
          })
        }
      } catch (err) {
        console.warn('Screen sharing cancelled or failed', err)
      }
    }
  }

  const sendMessage = () => {
    if (!msgInput.trim()) return
    socket.emit('send-message', {
      roomId, message: msgInput.trim(),
      userId: user?.id, userName: user?.name, meetingId: id
    })
    setMsgInput('')
    socket.emit('typing-stop', { roomId, userName: user?.name })
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMsgInput(e.target.value)
    socket.emit('typing-start', { roomId, userName: user?.name })
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() =>
      socket.emit('typing-stop', { roomId, userName: user?.name }), 1500)
  }

  const generateAISummary = async () => {
    if (!transcript && !meeting?.transcript) {
      alert('No transcript available yet. Speak in the meeting to generate one.')
      return
    }
    setLoadingAI(true)
    try {
      const transcriptToSummarize = transcript || meeting.transcript
      await saveTranscript(id!, transcriptToSummarize)
      const res = await summarizeMeeting(transcriptToSummarize, id)
      setAiSummary(res.data)
    } catch (err) {
      alert('Failed to generate AI summary')
    } finally {
      setLoadingAI(false)
    }
  }

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
    peersRef.current.forEach(pc => pc.close())
    recognitionRef.current?.stop()
    aiRecorderActiveRef.current = false
    clearTimeout(aiRecorderTimerRef.current)
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
  }

  const leaveMeeting = useCallback(async () => {
    if (endingRef.current) return
    endingRef.current = true

    if (transcript.trim()) {
      try { await saveTranscript(id!, transcript) } catch {}
    }
    cleanup()
    try { await endMeeting(id!) } catch {}
    socket.emit('end-meeting', { roomId })
    navigate('/app/dashboard')
  }, [id, navigate, roomId, socket, transcript])

  useEffect(() => {
    if (loading) return

    if (!limitStartedAtRef.current) limitStartedAtRef.current = Date.now()
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - limitStartedAtRef.current!) / 1000)
      const remaining = Math.max(MEETING_LIMIT_SECONDS - elapsed, 0)
      setRemainingSeconds(remaining)

      if (remaining <= 0) {
        window.clearInterval(timer)
        leaveMeeting()
      }
    }, 1000)

    return () => window.clearInterval(timer)
  }, [loading, leaveMeeting])

  const copyCode = () => {
    navigator.clipboard.writeText(meeting?.meetingCode || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const VideoTile = ({ participant }: { participant: Participant }) => {
    const ref = useRef<HTMLVideoElement>(null)
    useEffect(() => {
      if (ref.current && participant.stream) ref.current.srcObject = participant.stream
    }, [participant.stream])

    return (
      <div className="relative bg-slate-800 rounded-xl overflow-hidden aspect-video">
        <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
        {!participant.stream && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-blue-700 rounded-full flex items-center justify-center text-2xl font-bold text-white">
              {participant.userName?.[0]?.toUpperCase()}
            </div>
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md">
          {participant.userName}
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-blue-500 mx-auto mb-3" size={40} />
        <p className="text-slate-400">Setting up your meeting...</p>
      </div>
    </div>
  )

  const participantsList = Array.from(participants.values())
  const totalParticipants = participantsList.length + 1
  const remainingLabel = `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-900 px-4 py-3 md:px-6">
        <div>
          <h1 className="truncate text-sm font-semibold text-white">{meeting?.title}</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-green-400">Live</span>
            <button onClick={copyCode} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition">
              <Copy size={11} />
              {copied ? 'Copied!' : meeting?.meetingCode}
            </button>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Users size={11} /> {totalParticipants}
            </span>
            <span className={`text-xs font-medium ${remainingSeconds <= 30 ? 'text-red-400' : 'text-slate-400'}`}>
              Limit {remainingLabel}
            </span>
          </div>
        </div>

        <button
          onClick={generateAISummary}
          disabled={loadingAI}
          className="flex items-center gap-2 bg-blue-600/20 border border-blue-600/40 hover:bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-medium transition"
        >
          {loadingAI ? <Loader2 size={13} className="animate-spin" /> : <Bot size={13} />}
          {loadingAI ? 'Generating...' : 'AI Summary'}
        </button>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Video grid */}
        <div className="flex-1 overflow-y-auto p-3 pb-24 md:p-4">
          <div className={`grid gap-4 h-full ${
            totalParticipants === 1 ? 'grid-cols-1' :
            totalParticipants <= 2 ? 'grid-cols-1 md:grid-cols-2' :
            totalParticipants <= 4 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
          }`}>
            {/* Local video */}
            <div className="relative bg-slate-800 rounded-xl overflow-hidden aspect-video">
              <video ref={localVideoRef} autoPlay playsInline muted
                className="w-full h-full object-cover" />
              {isVideoOff && (
                <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                  <div className="w-16 h-16 bg-blue-700 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                {isMuted && <MicOff size={10} className="text-red-400" />}
                {user?.name} (You)
              </div>
            </div>

            {/* Remote participants */}
            {participantsList.map(p => (
              <VideoTile key={p.socketId} participant={p} />
            ))}
          </div>
        </div>

        {/* Right panel */}
        {showChat && (
          <div className="flex w-full max-w-sm flex-col border-l border-slate-800 bg-slate-900">
            {/* Tabs */}
            <div className="flex border-b border-slate-800">
              <button 
                onClick={() => setActivePanelTab('chat')}
                className={`flex-1 py-3 text-xs font-medium ${activePanelTab === 'chat' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-500'}`}>
                Chat
              </button>
              <button 
                onClick={() => setActivePanelTab('transcript')}
                className={`flex-1 py-3 text-xs font-medium ${activePanelTab === 'transcript' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-500'}`}>
                Transcript
              </button>
            </div>

            {activePanelTab === 'chat' ? (
              <>
                {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-slate-600 text-xs text-center mt-4">No messages yet. Say hello!</p>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`${msg.userId === user?.id ? 'items-end' : 'items-start'} flex flex-col`}>
                  {msg.userId !== user?.id && (
                    <span className="text-xs text-slate-500 mb-1 ml-1">{msg.userName}</span>
                  )}
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                    msg.userId === user?.id
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                  }`}>
                    {msg.message}
                  </div>
                  <span className="text-xs text-slate-600 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {typingUsers.length > 0 && (
                <p className="text-xs text-slate-500 italic">{typingUsers.join(', ')} typing...</p>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div className="p-3 border-t border-slate-800">
              <div className="flex gap-2">
                <input
                  value={msgInput}
                  onChange={handleTyping}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Message..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
                <button onClick={sendMessage}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 whitespace-pre-wrap text-sm text-slate-300">
            {transcript || "No transcript yet. Speak to start transcribing..."}
            <div ref={chatEndRef} />
          </div>
        )}
          </div>
        )}
      </div>

      {/* AI Summary Modal */}
      {aiSummary && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot size={20} className="text-blue-400" />
                <h2 className="text-lg font-bold text-white">AI Meeting Summary</h2>
              </div>
              <button onClick={() => setAiSummary(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Summary</h3>
                <p className="text-sm text-slate-400 bg-slate-800 rounded-lg p-3">{aiSummary.summary}</p>
              </div>

              {aiSummary.keyPoints?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Key Points</h3>
                  <ul className="space-y-1">
                    {aiSummary.keyPoints.map((p: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-blue-400 mt-0.5">-</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSummary.actionItems?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Action Items</h3>
                  <div className="space-y-2">
                    {aiSummary.actionItems.map((item: any, i: number) => (
                      <div key={i} className="bg-slate-800 rounded-lg p-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-white">{item.task}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Assigned to {item.assignee}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          item.priority === 'high' ? 'bg-red-900/40 text-red-400' :
                          item.priority === 'medium' ? 'bg-yellow-900/40 text-yellow-400' :
                          'bg-slate-700 text-slate-400'
                        }`}>{item.priority}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controls bar (Floating Dock) */}
      <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-800 bg-slate-900/90 px-3 py-3 shadow-2xl backdrop-blur md:bottom-6 md:gap-4 md:px-6">
        <button onClick={toggleMute}
          className={`p-3 rounded-full transition ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
          {isMuted ? <MicOff size={20} className="text-white" /> : <Mic size={20} className="text-white" />}
        </button>

        <button onClick={toggleVideo}
          className={`p-3 rounded-full transition ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
          {isVideoOff ? <VideoOff size={20} className="text-white" /> : <Video size={20} className="text-white" />}
        </button>

        <button onClick={toggleScreen}
          className={`p-3 rounded-full transition ${isSharing ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-700 hover:bg-slate-600'}`}>
          {isSharing ? <MonitorOff size={20} className="text-white" /> : <Monitor size={20} className="text-white" />}
        </button>

        <button onClick={() => setShowChat(!showChat)}
          className={`p-3 rounded-full transition ${showChat ? 'bg-slate-200 text-slate-900' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
          <MessageSquare size={20} className={showChat ? 'text-slate-900' : 'text-white'} />
        </button>

        <div className="w-px h-8 bg-slate-700 mx-2"></div>

        <button onClick={leaveMeeting}
          className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 transition flex items-center gap-2 font-medium">
          <PhoneOff size={20} className="text-white" />
          <span className="text-white text-sm">End</span>
        </button>
      </div>
    </div>
  )
}

