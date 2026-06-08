import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog'
import {
  getMeeting,
  startMeeting,
  endMeeting,
  leaveMeeting as leaveMeetingAPI,
  summarizeMeeting,
  saveTranscript,
} from '../services/api'
import { getSocket } from '../services/socket'
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  MessageSquare, PhoneOff, Bot, Copy, Users, Loader2, Send, X,
} from 'lucide-react'

// ΓöÇΓöÇ Types ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
interface Participant {
  socketId: string
  userId: string
  userName: string
  stream?: MediaStream
  screenStream?: MediaStream
  isMuted?: boolean
  isVideoOff?: boolean
  // Set by peer-screen-share-start/stop events so ontrack knows what to expect
  isSharing?: boolean
}

interface ChatMsg {
  id: string
  message: string
  userId: string
  userName: string
  timestamp: string
}

// 2 hours in seconds
const MEETING_LIMIT_SECONDS = 7200

// ΓöÇΓöÇ Black-frame track helper ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// Used to replace the camera track when video is toggled off,
// so the camera hardware is released (no OS indicator light).
function createBlackTrack(): MediaStreamTrack {
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 2
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, 2, 2)
  const stream = canvas.captureStream(1)
  const track = stream.getVideoTracks()[0]
  track.contentHint = ''
  return track
}

// ΓöÇΓöÇ Component ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// ΓöÇΓöÇ VideoTile ΓÇö defined outside MeetingRoom so React never remounts it ΓöÇΓöÇ
// Defining a component inside another component causes it to be treated as
// a new type on every render, which unmounts/remounts the video element and
// kills the MediaStream. It must live at module level.
function VideoTile({
  participant,
  isLocal = false,
  showScreen = false,
}: {
  participant: Participant
  isLocal?: boolean
  showScreen?: boolean
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const stream = showScreen ? participant.screenStream : participant.stream

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream
      ref.current.play().catch(() => {})
    }
  }, [stream])

  return (
    <div className="relative bg-slate-800 rounded-xl overflow-hidden aspect-video">
      <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-blue-700 rounded-full flex items-center justify-center text-2xl font-bold text-white">
            {participant.userName?.[0]?.toUpperCase()}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
        {participant.isMuted && <MicOff size={10} className="text-red-400" />}
        {participant.userName} {isLocal ? '(You)' : ''} {showScreen ? '≡ƒûÑ∩╕Å Screen' : ''}
      </div>
    </div>
  )
}

export default function MeetingRoom() {
  const { id } = useParams<{ id: string }>()
  const { user, accessToken } = useAuthStore()
  const navigate = useNavigate()
  // Pass the token so the socket middleware can verify identity
  const socket = getSocket(accessToken ?? undefined)

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
  const [showEndDialog, setShowEndDialog] = useState(false)
  const { toast } = useToast()

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  // Keep a black track alive so we can replace camera track without closing the stream
  const blackTrackRef = useRef<MediaStreamTrack | null>(null)
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
  const shouldTranscribeRef = useRef(false)
  // Whether the current user is the host (set after meeting loads)
  const isHostRef = useRef(false)

  const roomId = id!

  // ΓöÇΓöÇ Sync local stream to video element after loading ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  useEffect(() => {
    if (!loading && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current
    }
  }, [loading])

  // ΓöÇΓöÇ Assign screen stream to video element when isSharing toggles ΓöÇΓöÇΓöÇ
  useEffect(() => {
    if (isSharing && screenVideoRef.current && screenStreamRef.current) {
      screenVideoRef.current.srcObject = screenStreamRef.current
    }
    if (!isSharing && screenVideoRef.current) {
      screenVideoRef.current.srcObject = null
    }
  }, [isSharing])

  // ΓöÇΓöÇ Init meeting & media ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const res = await getMeeting(id!)
        if (!mounted) return
        const m = res.data.data.meeting

        if (m.status === 'ended') {
          toast({ title: 'Meeting Ended', description: 'This meeting has already ended.', variant: 'destructive' })
          navigate('/app/dashboard')
          return
        }

        isHostRef.current = m.hostId === user?.id
        setMessages(
          (m.chatMessages ?? []).map((msg: any) => ({
            id: msg._id ?? msg.id,
            message: msg.message,
            userId: msg.sender,
            userName: msg.senderName,
            timestamp: msg.timestamp,
          }))
        )

        if (m.status === 'scheduled' && m.hostId === user?.id) {
          const startResponse = await startMeeting(id!)
          setMeeting(startResponse.data?.data?.meeting || m)
        } else {
          setMeeting(m)
        }

        if (m.status === 'scheduled' && m.hostId !== user?.id) {
          toast({
            title: 'Waiting for host',
            description: 'The meeting will go live when the host starts it.',
          })
        }

        await setupMedia()
        if (mounted) setLoading(false)
      } catch (err: any) {
        console.error(err)
        toast({
          title: 'Error',
          description: err?.response?.data?.message ?? err.message ?? 'Failed to initialize meeting',
          variant: 'destructive',
        })
        navigate('/app/dashboard')
      }
    }

    init()
    return () => { mounted = false }
  }, [id])

  // ΓöÇΓöÇ Setup local media ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const setupMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      // Pre-create a black track so we can swap in/out without acquiring new getUserMedia
      blackTrackRef.current = createBlackTrack()

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.muted = true
      }
    } catch (err) {
      console.warn('Camera/mic not available, joining without media')
    }
    // Join the room after media is ready (or after failure ΓÇö join anyway)
    socket.emit('join-room', { roomId, userId: user?.id, userName: user?.name })
  }

  const stopTranscription = useCallback(() => {
    shouldTranscribeRef.current = false
    try {
      recognitionRef.current?.stop()
    } catch {}
  }, [])

  const startTranscription = useCallback(() => {
    const hasLiveAudioTrack = Boolean(
      localStreamRef.current?.getAudioTracks().some((track) => track.enabled && track.readyState === 'live')
    )

    if (!recognitionRef.current || meeting?.status !== 'active' || isMuted || !hasLiveAudioTrack) {
      shouldTranscribeRef.current = false
      return
    }

    shouldTranscribeRef.current = true
    try {
      recognitionRef.current.start()
    } catch {}
  }, [isMuted, meeting?.status])

  // ΓöÇΓöÇ beforeunload: emit leave so the server cleans up the participant ΓöÇ
  useEffect(() => {
    const handleUnload = () => {
      stopTranscription()
      socket.emit('leave-room', { roomId })
      if (!endingRef.current) {
        leaveMeetingAPI(id!).catch(() => {})
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [id, roomId, socket, stopTranscription])

  // ΓöÇΓöÇ Renegotiate with a specific peer after track changes ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const renegotiate = useCallback(
    async (targetSocketId: string) => {
      const pc = peersRef.current.get(targetSocketId)
      if (!pc) return
      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.emit('webrtc-offer', {
          to: targetSocketId,
          offer,
          from: socket.id,
          fromName: user?.name,
        })
      } catch (err) {
        console.warn('Renegotiation failed for', targetSocketId, err)
      }
    },
    [socket, user]
  )

  // ΓöÇΓöÇ WebRTC peer creation ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  // Uses only refs (never state) in deps so this function is stable for
  // the lifetime of the component ΓÇö recreating it would orphan existing
  // RTCPeerConnection objects and break media mid-call.
  const createPeer = useCallback(
    (targetSocketId: string) => {
      // Never create duplicate peers
      if (peersRef.current.has(targetSocketId)) {
        return peersRef.current.get(targetSocketId)!
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      })

      // Add local camera/mic tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!)
        })
      }
      // Add screen track if already sharing (uses ref, not state)
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, screenStreamRef.current!)
        })
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('ice-candidate', { to: targetSocketId, candidate: e.candidate })
        }
      }

      pc.ontrack = (e) => {
        const stream = e.streams[0]
        if (!stream) return

        setParticipants((prev) => {
          const updated = new Map(prev)
          const existing = updated.get(targetSocketId)

          // Use the server-signaled isSharing flag (set by peer-screen-share-start)
          // instead of unreliable contentHint / displaySurface heuristics
          if (existing?.isSharing) {
            updated.set(targetSocketId, { ...existing, screenStream: stream })
          } else {
            updated.set(targetSocketId, {
              ...(existing ?? { socketId: targetSocketId, userId: '', userName: '' }),
              stream,
            })
          }
          return updated
        })
      }

      peersRef.current.set(targetSocketId, pc)
      return pc
    },
    [socket, user]  // stable: only socket instance and user identity
  )

  // ΓöÇΓöÇ Socket events ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  useEffect(() => {
    const onRoomParticipants = async (list: Participant[]) => {
      for (const p of list) {
        if (p.socketId === socket.id) continue
        setParticipants((prev) => {
          if (prev.has(p.socketId)) return prev
          const next = new Map(prev)
          next.set(p.socketId, p)
          return next
        })
        if (!peersRef.current.has(p.socketId)) createPeer(p.socketId)
      }
    }

    const onUserJoined = async ({ socketId, userId, userName }: any) => {
      // Deduplicate: only add / create peer if not already tracking this socket
      if (peersRef.current.has(socketId)) return
      setParticipants((prev) => {
        if (prev.has(socketId)) return prev
        const next = new Map(prev)
        next.set(socketId, { socketId, userId, userName, stream: undefined })
        return next
      })
      const pc = createPeer(socketId)
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket.emit('webrtc-offer', { to: socketId, offer, from: socket.id, fromName: user?.name })
    }

    const onWebRTCOffer = async ({ offer, from, fromName }: any) => {
      setParticipants((prev) => {
        if (prev.has(from)) return prev
        const next = new Map(prev)
        next.set(from, { socketId: from, userId: '', userName: fromName, stream: undefined })
        return next
      })
      // createPeer guards against duplicates internally
      const pc = createPeer(from)
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('webrtc-answer', { to: from, answer })
    }

    const onWebRTCAnswer = async ({ answer, from }: any) => {
      const pc = peersRef.current.get(from)
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer))
    }

    const onICECandidate = async ({ candidate, from }: any) => {
      const pc = peersRef.current.get(from)
      if (pc && candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch {}
      }
    }

    const onUserLeft = ({ socketId, userName }: any) => {
      setParticipants((prev) => {
        const next = new Map(prev)
        next.delete(socketId)
        return next
      })
      const pc = peersRef.current.get(socketId)
      if (pc) { pc.close(); peersRef.current.delete(socketId) }
    }

    const onMeetingEnded = () => {
      toast({ title: 'Meeting Ended', description: 'The host has ended this meeting.' })
      cleanup()
      navigate('/app/dashboard')
    }

    const onReceiveMessage = (msg: ChatMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    }

    const onUserTyping = ({ userName, isTyping }: any) => {
      setTypingUsers((prev) =>
        isTyping ? [...new Set([...prev, userName])] : prev.filter((u) => u !== userName)
      )
    }

    const onTranscriptUpdate = ({ text }: any) => {
      setTranscript((prev) => prev + text + '\n')
    }

    // Screen share signals from server ΓÇö set a flag so ontrack routes correctly
    const onPeerScreenShareStart = ({ socketId }: any) => {
      setParticipants((prev) => {
        const next = new Map(prev)
        const p = next.get(socketId)
        if (p) next.set(socketId, { ...p, isSharing: true })
        return next
      })
    }

    const onPeerScreenShareStop = ({ socketId }: any) => {
      setParticipants((prev) => {
        const next = new Map(prev)
        const p = next.get(socketId)
        if (p) next.set(socketId, { ...p, isSharing: false, screenStream: undefined })
        return next
      })
    }

    const onUserToggledVideo = ({ socketId, isVideoOff }: any) => {
      setParticipants((prev) => {
        const next = new Map(prev)
        const p = next.get(socketId)
        if (p) next.set(socketId, { ...p, isVideoOff })
        return next
      })
    }

    const onUserToggledAudio = ({ socketId, isMuted }: any) => {
      setParticipants((prev) => {
        const next = new Map(prev)
        const p = next.get(socketId)
        if (p) next.set(socketId, { ...p, isMuted })
        return next
      })
    }

    socket.on('room-participants', onRoomParticipants)
    socket.on('user-joined', onUserJoined)
    socket.on('webrtc-offer', onWebRTCOffer)
    socket.on('webrtc-answer', onWebRTCAnswer)
    socket.on('ice-candidate', onICECandidate)
    socket.on('user-left', onUserLeft)
    socket.on('meeting-ended', onMeetingEnded)
    socket.on('receive-message', onReceiveMessage)
    socket.on('user-typing', onUserTyping)
    socket.on('transcript-update', onTranscriptUpdate)
    socket.on('peer-screen-share-start', onPeerScreenShareStart)
    socket.on('peer-screen-share-stop', onPeerScreenShareStop)
    socket.on('user-toggled-video', onUserToggledVideo)
    socket.on('user-toggled-audio', onUserToggledAudio)

    return () => {
      socket.off('room-participants', onRoomParticipants)
      socket.off('user-joined', onUserJoined)
      socket.off('webrtc-offer', onWebRTCOffer)
      socket.off('webrtc-answer', onWebRTCAnswer)
      socket.off('ice-candidate', onICECandidate)
      socket.off('user-left', onUserLeft)
      socket.off('meeting-ended', onMeetingEnded)
      socket.off('receive-message', onReceiveMessage)
      socket.off('user-typing', onUserTyping)
      socket.off('transcript-update', onTranscriptUpdate)
      socket.off('peer-screen-share-start', onPeerScreenShareStart)
      socket.off('peer-screen-share-stop', onPeerScreenShareStop)
      socket.off('user-toggled-video', onUserToggledVideo)
      socket.off('user-toggled-audio', onUserToggledAudio)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, navigate])  // stable: createPeer is memoized on socket+user only

  // ΓöÇΓöÇ Speech recognition for live transcript ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognitionRef.current = recognition

    recognition.onresult = (event: any) => {
      if (!shouldTranscribeRef.current) return

      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript + ' '
      }
      if (final) {
        const line = `[${user?.name ?? 'User'}]: ${final}`
        setTranscript((prev) => prev + line + '\n')
        socket.emit('transcript-update', { roomId, text: line })
      }
    }

    recognition.onend = () => {
      if (!shouldTranscribeRef.current) return
      try { recognition.start() } catch {}
    }

    return () => {
      shouldTranscribeRef.current = false
      recognition.onend = null
      recognition.stop()
    }
  }, [])

  useEffect(() => {
    if (loading) return

    if (meeting?.status === 'active' && !isMuted) {
      startTranscription()
    } else {
      stopTranscription()
    }
  }, [loading, meeting?.status, isMuted, startTranscription, stopTranscription])

  // ΓöÇΓöÇ Debounced transcript save ΓÇö host only ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  useEffect(() => {
    // Only the host writes the transcript to the DB to avoid races
    if (!id || !transcript.trim() || !isHostRef.current) return

    const timer = setTimeout(() => {
      saveTranscript(id, transcript).catch((err) => {
        console.warn('Failed to save transcript', err)
      })
    }, 2000)

    return () => clearTimeout(timer)
  }, [id, transcript])

  // ΓöÇΓöÇ Auto-scroll chat ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ΓöÇΓöÇ Controls ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const toggleMute = () => {
    const stream = localStreamRef.current
    if (!stream) return
    const nextMuted = !isMuted
    stream.getAudioTracks().forEach((t) => (t.enabled = !nextMuted))
    setIsMuted(nextMuted)
    socket.emit('toggle-audio', { roomId, isMuted: nextMuted })
    if (nextMuted) {
      stopTranscription()
    } else {
      startTranscription()
    }
  }

  const toggleVideo = useCallback(async () => {
    const stream = localStreamRef.current
    if (!stream) return

    const nextVideoOff = !isVideoOff
    setIsVideoOff(nextVideoOff)
    socket.emit('toggle-video', { roomId, isVideoOff: nextVideoOff })

    if (nextVideoOff) {
      // Replace camera track with a black frame ΓÇö releases the hardware
      const currentVideoTrack = stream.getVideoTracks()[0]
      if (currentVideoTrack) {
        // Replace in every peer sender first, then stop
        for (const [, pc] of peersRef.current) {
          const sender = pc.getSenders().find((s) => s.track === currentVideoTrack)
          if (sender && blackTrackRef.current) {
            await sender.replaceTrack(blackTrackRef.current).catch(() => {})
          }
        }
        currentVideoTrack.stop()
        stream.removeTrack(currentVideoTrack)
      }
    } else {
      // Re-acquire camera and swap back in
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true })
        const newVideoTrack = newStream.getVideoTracks()[0]
        stream.addTrack(newVideoTrack)

        if (localVideoRef.current) localVideoRef.current.srcObject = stream

        for (const [, pc] of peersRef.current) {
          const sender = pc.getSenders().find(
            (s) => s.track?.kind === 'video' && s.track.contentHint !== 'detail'
          )
          if (sender) await sender.replaceTrack(newVideoTrack).catch(() => {})
        }
      } catch (err) {
        console.warn('Failed to re-enable camera', err)
        setIsVideoOff(true)
      }
    }
  }, [isVideoOff, roomId, socket])

  const toggleScreen = useCallback(async () => {
    if (isSharing) {
      // ΓöÇΓöÇ Stop sharing ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
      screenStreamRef.current?.getTracks().forEach((t) => t.stop())
      screenStreamRef.current = null
      setIsSharing(false)
      socket.emit('screen-share-stop', { roomId })

      // Swap back to camera track in all peer senders
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0]
      for (const [socketId, pc] of peersRef.current) {
        const sender = pc.getSenders().find((s) => s.track?.contentHint === 'detail')
        if (sender) {
          if (cameraTrack) {
            await sender.replaceTrack(cameraTrack).catch(() => {})
          } else {
            pc.removeTrack(sender)
          }
          await renegotiate(socketId)
        }
      }
    } else {
      // ΓöÇΓöÇ Start sharing ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true })
        const screenTrack = screen.getVideoTracks()[0]
        screenTrack.contentHint = 'detail'
        screenStreamRef.current = screen

        // Signal peers BEFORE adding track so their ontrack handler routes correctly
        socket.emit('screen-share-start', { roomId })
        setIsSharing(true)

        // Add screen track to each peer; onnegotiationneeded handles the offer
        for (const [socketId, pc] of peersRef.current) {
          pc.addTrack(screenTrack, screen)
          await renegotiate(socketId)
        }

        // Handle user stopping share via the browser's built-in "Stop sharing" button
        screenTrack.onended = () => {
          toggleScreen()
        }
      } catch (err) {
        console.warn('Screen sharing cancelled or failed', err)
      }
    }
  }, [isSharing, renegotiate, roomId, socket])

  // ΓöÇΓöÇ Chat ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const sendMessage = () => {
    if (!msgInput.trim()) return
    socket.emit('send-message', {
      roomId,
      message: msgInput.trim(),
      userId: user?.id,
      userName: user?.name,
      meetingId: id,
    })
    setMsgInput('')
    socket.emit('typing-stop', { roomId })
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMsgInput(e.target.value)
    socket.emit('typing-start', { roomId })
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(
      () => socket.emit('typing-stop', { roomId }),
      1500
    )
  }

  // ΓöÇΓöÇ AI Summary ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const generateAISummary = async () => {
    if (!transcript && !meeting?.transcript) {
      toast({ title: 'Notice', description: 'No transcript available yet. Speak in the meeting to generate one.' })
      return
    }
    setLoadingAI(true)
    try {
      const transcriptToSummarize = transcript || meeting.transcript
      await saveTranscript(id!, transcriptToSummarize)
      const res = await summarizeMeeting(transcriptToSummarize, id)
      setAiSummary(res.data)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message ?? err.message ?? 'Failed to generate AI summary',
        variant: 'destructive',
      })
    } finally {
      setLoadingAI(false)
    }
  }

  // ΓöÇΓöÇ Cleanup: stop all media & close all peers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const cleanup = useCallback(() => {
    stopTranscription()
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    screenStreamRef.current?.getTracks().forEach((t) => t.stop())
    screenStreamRef.current = null
    blackTrackRef.current?.stop()
    blackTrackRef.current = null
    peersRef.current.forEach((pc) => pc.close())
    peersRef.current.clear()
    recognitionRef.current = null
    aiRecorderActiveRef.current = false
    clearTimeout(aiRecorderTimerRef.current)
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
  }, [stopTranscription])

  useEffect(() => {
    return () => {
      cleanup()
      socket.emit('leave-room', { roomId })
    }
  }, [cleanup, roomId, socket])

  // ΓöÇΓöÇ Leave / End ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const leaveMeeting = useCallback(
    async (endForEveryone = false) => {
      if (endingRef.current) return
      endingRef.current = true

      // Save transcript if we're the host
      if (isHostRef.current && transcript.trim()) {
        try { await saveTranscript(id!, transcript) } catch {}
      }

      cleanup()

      // Emit socket leave so others get user-left immediately
      socket.emit('leave-room', { roomId })

      if (endForEveryone) {
        try { await endMeeting(id!) } catch {}
        socket.emit('end-meeting', { roomId })
      } else {
        // Record that this participant left in the DB
        try { await leaveMeetingAPI(id!) } catch {}
      }

      navigate('/app/dashboard')
    },
    [id, navigate, roomId, socket, transcript, cleanup]
  )

  const handleEndClick = () => {
    // Fix: compare hostId (string), not the host object
    if (meeting?.hostId === user?.id) {
      setShowEndDialog(true)
    } else {
      leaveMeeting(false)
    }
  }

  // ΓöÇΓöÇ Meeting time limit countdown ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  useEffect(() => {
    if (loading) return
    if (meeting?.status !== 'active') {
      limitStartedAtRef.current = null
      setRemainingSeconds(MEETING_LIMIT_SECONDS)
      return
    }

    if (!limitStartedAtRef.current) {
      limitStartedAtRef.current = meeting?.startedAt
        ? new Date(meeting.startedAt).getTime()
        : Date.now()
    }

    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - limitStartedAtRef.current!) / 1000)
      const remaining = Math.max(MEETING_LIMIT_SECONDS - elapsed, 0)
      setRemainingSeconds(remaining)

      if (remaining <= 0) {
        window.clearInterval(timer)
        leaveMeeting(meeting?.hostId === user?.id)
      }
    }, 1000)

    return () => window.clearInterval(timer)
  }, [loading, leaveMeeting, meeting?.hostId, meeting?.startedAt, meeting?.status, user?.id])

  const copyCode = () => {
    navigator.clipboard.writeText(meeting?.meetingCode ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }



  // ΓöÇΓöÇ Loading state ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-500 mx-auto mb-3" size={40} />
          <p className="text-slate-400">Setting up your meeting...</p>
        </div>
      </div>
    )
  }

  // ΓöÇΓöÇ Derived display values ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const participantsList = Array.from(participants.values())
  const remoteTiles = participantsList.reduce((count, p) => {
    if (p.stream && p.screenStream) return count + 2
    return count + 1
  }, 0)
  const totalTiles = (localStreamRef.current ? 1 : 0) + (isSharing ? 1 : 0) + remoteTiles
  const totalParticipants = participantsList.length + 1
  // Only show the countdown when under 10 minutes
  const showCountdown = remainingSeconds <= 600
  const remainingLabel = `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`

  // ΓöÇΓöÇ Render ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-900 px-4 py-3 md:px-6">
        <div>
          <h1 className="truncate text-sm font-semibold text-white">{meeting?.title}</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <span className={`text-xs ${meeting?.status === 'active' ? 'text-green-400' : 'text-amber-400'}`}>
              {meeting?.status === 'active' ? 'Live' : 'Waiting for host'}
            </span>
            <button
              onClick={copyCode}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
            >
              <Copy size={11} />
              {copied ? 'Copied!' : meeting?.meetingCode}
            </button>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Users size={11} /> {totalParticipants}
            </span>
            {showCountdown && (
              <span className={`text-xs font-medium ${remainingSeconds <= 60 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
                ΓÅ▒ {remainingLabel} left
              </span>
            )}
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
          <div
            className={`grid gap-4 h-full ${
              totalTiles <= 1
                ? 'grid-cols-1'
                : totalTiles <= 2
                ? 'grid-cols-1 md:grid-cols-2'
                : totalTiles <= 4
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
            }`}
          >
            {/* Local camera */}
            <div className="relative bg-slate-800 rounded-xl overflow-hidden aspect-video">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isVideoOff && (
                <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                  <div className="w-16 h-16 bg-blue-700 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                {isMuted && <MicOff size={10} className="text-red-400" />}
                {user?.name} (You) ≡ƒô╣
              </div>
            </div>

            {/* Local screen share tile */}
            {isSharing && (
              <div className="relative bg-slate-800 rounded-xl overflow-hidden aspect-video border-2 border-blue-500">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                  {user?.name} (You) ≡ƒûÑ∩╕Å Screen
                </div>
              </div>
            )}

            {/* Remote participants */}
            {participantsList.map((p) => {
              const tiles = []
              if (p.stream) {
                tiles.push(<VideoTile key={`${p.socketId}-cam`} participant={p} />)
              }
              if (p.screenStream) {
                tiles.push(
                  <VideoTile key={`${p.socketId}-screen`} participant={p} showScreen />
                )
              }
              if (!p.stream && !p.screenStream) {
                tiles.push(<VideoTile key={p.socketId} participant={p} />)
              }
              return tiles
            })}
          </div>
        </div>

        {/* Right panel */}
        {showChat && (
          <div className="flex w-full max-w-sm flex-col border-l border-slate-800 bg-slate-900">
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setActivePanelTab('chat')}
                className={`flex-1 py-3 text-xs font-medium ${activePanelTab === 'chat' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-500'}`}
              >
                Chat
              </button>
              <button
                onClick={() => setActivePanelTab('transcript')}
                className={`flex-1 py-3 text-xs font-medium ${activePanelTab === 'transcript' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-500'}`}
              >
                Transcript
              </button>
            </div>

            {activePanelTab === 'chat' ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <p className="text-slate-600 text-xs text-center mt-4">No messages yet. Say hello!</p>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`${msg.userId === user?.id ? 'items-end' : 'items-start'} flex flex-col`}
                    >
                      {msg.userId !== user?.id && (
                        <span className="text-xs text-slate-500 mb-1 ml-1">{msg.userName}</span>
                      )}
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                          msg.userId === user?.id
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                        }`}
                      >
                        {msg.message}
                      </div>
                      <span className="text-xs text-slate-600 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                  {typingUsers.length > 0 && (
                    <p className="text-xs text-slate-500 italic">{typingUsers.join(', ')} typing...</p>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-3 border-t border-slate-800">
                  <div className="flex gap-2">
                    <input
                      value={msgInput}
                      onChange={handleTyping}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Message..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    />
                    <button
                      onClick={sendMessage}
                      className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 whitespace-pre-wrap text-sm text-slate-300">
                {transcript || 'No transcript yet. Speak to start transcribing...'}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Summary Modal */}
      {aiSummary && (
        <div
          style={{ minHeight: 400, background: 'rgba(0,0,0,0.6)' }}
          className="absolute inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
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
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                            item.priority === 'high'
                              ? 'bg-red-900/40 text-red-400'
                              : item.priority === 'medium'
                              ? 'bg-yellow-900/40 text-yellow-400'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-800 bg-slate-900/90 px-3 py-3 shadow-2xl backdrop-blur md:bottom-6 md:gap-4 md:px-6">
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full transition ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600'}`}
        >
          {isMuted ? <MicOff size={20} className="text-white" /> : <Mic size={20} className="text-white" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full transition ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600'}`}
        >
          {isVideoOff ? <VideoOff size={20} className="text-white" /> : <Video size={20} className="text-white" />}
        </button>

        <button
          onClick={toggleScreen}
          className={`p-3 rounded-full transition ${isSharing ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-700 hover:bg-slate-600'}`}
        >
          {isSharing ? <MonitorOff size={20} className="text-white" /> : <Monitor size={20} className="text-white" />}
        </button>

        <button
          onClick={() => setShowChat(!showChat)}
          className={`p-3 rounded-full transition ${showChat ? 'bg-slate-200 text-slate-900' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
        >
          <MessageSquare size={20} className={showChat ? 'text-slate-900' : 'text-white'} />
        </button>

        <div className="w-px h-8 bg-slate-700 mx-2" />

        <button
          onClick={handleEndClick}
          className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 transition flex items-center gap-2 font-medium"
        >
          <PhoneOff size={20} className="text-white" />
          <span className="text-white text-sm">
            {meeting?.hostId === user?.id ? 'End' : 'Leave'}
          </span>
        </button>
      </div>

      {/* End meeting dialog */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>End Meeting</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              You are the host. Do you want to end the meeting for everyone, or just leave?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 hover:bg-slate-700 hover:text-white border-slate-700 text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => leaveMeeting(false)}
              className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-white"
            >
              Just Leave
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => leaveMeeting(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              End for Everyone
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
