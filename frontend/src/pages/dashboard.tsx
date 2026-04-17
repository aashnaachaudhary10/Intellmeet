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
