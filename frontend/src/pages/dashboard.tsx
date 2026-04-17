import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getMeetings, createMeeting, joinMeetingByCode, deleteMeeting } from '../services/api'
import { format } from 'date-fns'
import {
  Plus, Video, Link2, Clock, Users, Trash2,
  ExternalLink, Search, Calendar, ChevronRight, Loader2, Bot
} from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [newMeeting, setNewMeeting] = useState({ title: '', description: '' })
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => getMeetings().then(r => r.data.meetings)
  })

  const createMut = useMutation({
    mutationFn: createMeeting,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['meetings'] })
      setShowCreate(false)
      setNewMeeting({ title: '', description: '' })
      navigate(`/room/${res.data.meeting._id}`)
    }
  })

  const joinMut = useMutation({
    mutationFn: () => joinMeetingByCode(joinCode.trim().toUpperCase()),
    onSuccess: (res) => {
      setShowJoin(false)
      navigate(`/room/${res.data.meeting._id}`)
    }
  })

  const deleteMut = useMutation({
    mutationFn: deleteMeeting,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetings'] })
  })

  const meetings = data || []
  const filtered = meetings.filter((m: any) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  )

  const active = filtered.filter((m: any) => m.status === 'active')
  const scheduled = filtered.filter((m: any) => m.status === 'scheduled')
  const ended = filtered.filter((m: any) => m.status === 'ended')

  const StatusBadge = ({ status }: { status: string }) => {
    const map: any = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      ended: 'bg-slate-700 text-slate-400 border-slate-600'
    }
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${map[status]}`}>
        {status === 'active' ? '● Live' : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const MeetingCard = ({ meeting }: { meeting: any }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white truncate">{meeting.title}</h3>
            <StatusBadge status={meeting.status} />
          </div>
          {meeting.description && (
            <p className="text-sm text-slate-400 truncate mb-2">{meeting.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {format(new Date(meeting.createdAt), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <Users size={12} />
              {meeting.participants?.length || 0} participants
            </span>
            {meeting.duration > 0 && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {meeting.duration} min
              </span>
            )}
            <span className="flex items-center gap-1 font-mono bg-slate-800 px-2 py-0.5 rounded">
              <Link2 size={11} />
              {meeting.meetingCode}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
          {meeting.status !== 'ended' && (
            <button
              onClick={() => navigate(`/room/${meeting._id}`)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
            >
              <Video size={13} />
              {meeting.status === 'active' ? 'Join' : 'Start'}
            </button>
          )}
          <button
            onClick={() => navigate(`/meeting/${meeting._id}`)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <ExternalLink size={15} />
          </button>
          {meeting.host?._id === user?.id || meeting.host === user?.id ? (
            <button
              onClick={() => { if (confirm('Delete this meeting?')) deleteMut.mutate(meeting._id) }}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition"
            >
              <Trash2 size={15} />
            </button>
          ) : null}
        </div>
      </div>

      {meeting.summary && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-blue-400 mb-1">
            <Bot size={12} />
            AI Summary
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Video, CheckSquare, BarChart3, Settings, 
  Search, Play, Volume2, Share2, CheckCircle2, ClipboardList, Sparkles, Loader2,
  User, Shield, Cpu, Globe
} from 'lucide-react';

/* --- 1. SUB-COMPONENTS --- */

const NavItem = ({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition ${
      active ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-50'
    }`}
  >
    {icon} <span className="text-sm">{label}</span>
  </div>
);

const VideoFeed = ({ name, isLocal = false }: { name: string, isLocal?: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isLocal) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(s => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => console.error("Camera access denied:", err));
    }
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [isLocal]);

  return (
    <div className="relative bg-slate-800 rounded-lg overflow-hidden border border-white/5 h-full min-h-[140px]">
      {isLocal ? (
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
      ) : (
        <img src={`https://i.pravatar.cc/150?u=${name}`} className="w-full h-full object-cover opacity-60" alt="participant" />
      )}
      <span className="absolute bottom-2 left-2 bg-black/50 text-[10px] text-white px-2 py-0.5 rounded">{name}</span>
    </div>
  );
};

/* --- 2. VIEW COMPONENTS --- */

const TasksView = ({ tasks }: { tasks: any[] }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold text-slate-700">Project Board</h2>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition">+ Create New Task</button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {['To Do', 'In Progress', 'Done'].map(status => (
        <div key={status} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl min-h-[400px]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{status}</h3>
          {status === 'To Do' && tasks.map(t => (
            <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm mb-3 border-l-4 border-blue-500 hover:shadow-md transition">
              <p className="text-sm font-semibold text-slate-700 mb-2">{t.label}</p>
              <p className="text-[10px] text-slate-400">{t.user} • {t.date}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

const AnalyticsView = () => (
  <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
    <h2 className="text-2xl font-bold text-slate-700">Meeting Productivity</h2>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[
        { label: "Meetings Held", val: "24", color: "text-blue-600" },
        { label: "Action Items", val: "142", color: "text-indigo-600" },
        { label: "Hours Saved", val: "12.5h", color: "text-emerald-600" },
        { label: "AI Accuracy", val: "98%", color: "text-purple-600" }
      ].map((stat, i) => (
        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition hover:-translate-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">{stat.label}</p>
          <p className={`text-3xl font-black ${stat.color}`}>{stat.val}</p>
        </div>
      ))}
    </div>
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-64 flex items-center justify-center text-slate-300 italic text-center">
      Recharts Visualization <br/> (Week 3 Analytics Integration)
    </div>
  </div>
);

const SettingsView = () => {
  const [activeSet, setActiveSet] = useState('Profile');
  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-slate-700">Account Settings</h2>
      <div className="flex gap-8">
        <aside className="w-48 space-y-1">
          {[
            { id: 'Profile', icon: <User size={16}/> },
            { id: 'AI Prefs', icon: <Cpu size={16}/> },
            { id: 'Security', icon: <Shield size={16}/> },
            { id: 'MERN Stack', icon: <Globe size={16}/> }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveSet(t.id)} className={`w-full flex items-center gap-2 text-left px-4 py-2 rounded-lg text-sm font-medium transition ${activeSet === t.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>
              {t.icon} {t.id}
            </button>
          ))}
        </aside>
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          {activeSet === 'Profile' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-slate-200 rounded-full overflow-hidden border-2 border-blue-100">
                  <img src="https://i.pravatar.cc/150?u=Aashna" alt="Profile" />
                </div>
                <button className="text-[10px] font-bold uppercase bg-slate-100 px-3 py-1 rounded">Update Avatar</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Username</label>
                  <input type="text" defaultValue="aashnachaudhary" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-blue-500/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Role</label>
                  <input type="text" defaultValue="Full Stack Developer" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-blue-500/20" />
                </div>
              </div>
            </div>
          )}
          {activeSet === 'AI Prefs' && (
             <div className="space-y-6">
               <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <p className="text-sm font-bold text-blue-900">Auto-Summarization (Gemini API)</p>
                  <div className="w-10 h-5 bg-blue-600 rounded-full"></div>
               </div>
               <p className="text-xs text-slate-500">Model parameters for real-time transcription and summary generation.</p>
             </div>
          )}
          <div className="mt-8 pt-4 border-t flex justify-end gap-3">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">Save Config</button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- 3. MAIN DASHBOARD --- */

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [summaryPoints, setSummaryPoints] = useState([
    "MongoDB Atlas migration status: 80% complete.",
    "Redis caching implemented for Socket.io feeds.",
    "Kubernetes node configuration for deployment."
  ]);
  const [tasks, setTasks] = useState([
    { id: 1, label: "Refactor HeroSection", user: "@You", date: "15 Apr", completed: false },
    { id: 2, label: "Test Gemini API Endpoint", user: "@Intern", date: "16 Apr", completed: true },
    { id: 3, label: "Kubernetes Cluster Config", user: "@You", date: "18 Apr", completed: false },
  ]);

  const handleAiGeneration = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      setSummaryPoints([
        "Finalized MERN architecture for Q3.",
        "Auto-meeting notes now syncing with Jira.",
        "Dark mode UI optimized for Tailwind."
      ]);
      setTasks(prev => [...prev, { id: Date.now(), label: "Review Security Logs", user: "@You", date: "20 Apr", completed: false }]);
      setIsAiLoading(false);
    }, 1500);
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-2 text-blue-700 font-bold text-xl cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-blue-600 p-1.5 rounded-lg text-white"><Video size={20} /></div>
          IntellMeet
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <NavItem icon={<LayoutDashboard size={18}/>} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
          <NavItem icon={<CheckSquare size={18}/>} label="Tasks" active={activeTab === 'Tasks'} onClick={() => setActiveTab('Tasks')} />
          <NavItem icon={<BarChart3 size={18}/>} label="Analytics" active={activeTab === 'Analytics'} onClick={() => setActiveTab('Analytics')} />
          <NavItem icon={<Settings size={18}/>} label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <button onClick={handleAiGeneration} disabled={isAiLoading} className="flex items-center gap-2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:opacity-90 transition disabled:opacity-50">
              {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Generate AI Insight
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input type="text" placeholder="Search project..." className="bg-slate-100 rounded-xl py-2 pl-10 pr-4 text-xs w-48 focus:w-64 transition-all outline-none" />
            </div>
          </div>
          <p className="text-xs text-slate-400 line-clamp-2">{meeting.summary}</p>
        </div>
      )}
    </div>
  )
  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 mt-1">Manage your meetings and collaborations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowJoin(true)}
            className="flex items-center gap-2 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
          >
            <Link2 size={16} />
            Join with Code
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            <Plus size={16} />
            New Meeting
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Meetings', value: meetings.length, color: 'text-white' },
          { label: 'Active Now', value: active.length, color: 'text-green-400' },
          { label: 'Scheduled', value: scheduled.length, color: 'text-blue-400' },
          { label: 'Completed', value: ended.length, color: 'text-slate-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-500 text-xs mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search meetings..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
        />
      </div>

      {/* Meeting sections */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Video size={48} className="mx-auto text-slate-700 mb-4" />
          <p className="text-slate-400 font-medium">No meetings yet</p>
          <p className="text-slate-600 text-sm mt-1">Create a meeting to get started</p>
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">● Live Now</h2>
              <div className="space-y-3">{active.map((m: any) => <MeetingCard key={m._id} meeting={m} />)}</div>
            </section>
          )}
          {scheduled.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Scheduled</h2>
              <div className="space-y-3">{scheduled.map((m: any) => <MeetingCard key={m._id} meeting={m} />)}</div>
            </section>
          )}
          {ended.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Past Meetings</h2>
              <div className="space-y-3">{ended.map((m: any) => <MeetingCard key={m._id} meeting={m} />)}</div>
            </section>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-5">New Meeting</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Meeting Title *</label>
                <input
                  value={newMeeting.title}
                  onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  placeholder="e.g. Sprint Planning"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Description (optional)</label>
                <textarea
                  value={newMeeting.description}
                  onChange={e => setNewMeeting({ ...newMeeting, description: e.target.value })}
                  placeholder="What's this meeting about?"
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 border border-slate-700 text-slate-300 py-2.5 rounded-xl hover:bg-slate-800 transition text-sm">
                Cancel
              </button>
              <button
                onClick={() => createMut.mutate(newMeeting)}
                disabled={!newMeeting.title || createMut.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-xl transition text-sm font-semibold flex items-center justify-center gap-2"
              >
                {createMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
                Create & Start
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold text-white mb-5">Join Meeting</h2>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-digit code (e.g. AB12CD34)"
              maxLength={8}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-mono text-center text-lg tracking-widest mb-2"
            />
            {joinMut.isError && (
              <p className="text-red-400 text-sm mb-3">{(joinMut.error as any)?.response?.data?.message}</p>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowJoin(false)}
                className="flex-1 border border-slate-700 text-slate-300 py-2.5 rounded-xl hover:bg-slate-800 transition text-sm">
                Cancel
              </button>
              <button
                onClick={() => joinMut.mutate()}
                disabled={joinCode.length < 6 || joinMut.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-xl transition text-sm font-semibold flex items-center justify-center gap-2"
              >
                {joinMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'Dashboard' && (
            <div className="flex gap-6 h-full">
              <div className="flex-[2] space-y-6">
                <div className="bg-[#0f172a] rounded-3xl overflow-hidden shadow-2xl border border-white/5">
                  <div className="p-4 flex justify-between text-white/70 text-xs border-b border-white/5">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/> Sprint Sync - Hathras Dev Team</span>
                    <Share2 size={16} className="cursor-pointer hover:text-white"/>
                  </div>
                  <div className="grid grid-cols-3 gap-1 p-2 h-64 bg-black/20">
                    <VideoFeed name="@You" isLocal={true} />
                    <VideoFeed name="@Lead" />
                    <VideoFeed name="@Intern" />
                  </div>
                  <div className="p-4 bg-slate-900/40">
                    <div className="flex items-center justify-between text-white/80">
                      <div className="flex items-center gap-3 text-sm">
                        <Play size={18} fill="white"/> <Volume2 size={18}/> <span className="text-xs font-mono">08:44 / 15:00</span>
                      </div>
                      <div className="flex gap-2">
                         <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] border border-white/10">AI Live Transcript</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm">
                  {isAiLoading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10"><Loader2 className="animate-spin text-blue-600" /></div>}
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Sparkles size={16} className="text-blue-600"/> Executive AI Summary</h3>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <ul className="text-sm space-y-3 text-slate-600">
                      {summaryPoints.map((p, i) => <li key={i} className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"/>{p}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="bg-white border border-slate-200 rounded-2xl h-full shadow-sm flex flex-col overflow-hidden">
                   <div className="p-6 border-b"><h3 className="font-bold text-sm text-slate-800">Smart Action Items</h3></div>
                   <div className="p-6 flex-1 space-y-6">
                      {tasks.map(t => (
                        <div key={t.id} className="flex gap-3">
                           <input type="checkbox" checked={t.completed} onChange={() => {}} className="mt-1 rounded text-blue-600" />
                           <div>
                             <p className={`text-sm font-medium ${t.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.label}</p>
                             <p className="text-[10px] text-slate-400">{t.user} • {t.date}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                   <div className="p-4 border-t"><button className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-bold hover:bg-slate-800 transition">Sync with MongoDB</button></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Tasks' && <TasksView tasks={tasks} />}
          {activeTab === 'Analytics' && <AnalyticsView />}
          {activeTab === 'Settings' && <SettingsView />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

