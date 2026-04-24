import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getMeeting } from '../services/api'
import { format } from 'date-fns'
import { ArrowLeft, Bot, Clock, Users, CheckCircle2, Circle, FileText, Video, Calendar } from 'lucide-react'

export default function MeetingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['meeting', id],
    queryFn: () => getMeeting(id!).then(r => r.data.meeting)
  })

  if (isLoading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  )

  const meeting = data
  if (!meeting) return null

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-8">
      <button onClick={() => navigate('/app/dashboard')}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition text-sm">
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{meeting.title}</h1>
            {meeting.description && <p className="text-slate-400 text-sm mb-4">{meeting.description}</p>}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {format(new Date(meeting.createdAt), 'MMMM d, yyyy')}
              </span>
              {meeting.duration > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {meeting.duration} minutes
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users size={14} />
                {meeting.participants?.length || 0} participants
              </span>
            </div>
          </div>
          {meeting.status !== 'ended' && (
            <button
              onClick={() => navigate(`/room/${meeting._id}`)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              <Video size={16} />
              {meeting.status === 'active' ? 'Rejoin' : 'Start'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Summary + Action Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Summary */}
          {meeting.summary ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bot size={18} className="text-blue-400" />
                <h2 className="font-semibold text-white">AI Summary</h2>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{meeting.summary}</p>

              {meeting.keyPoints?.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Key Points</h3>
                  <ul className="space-y-1.5">
                    {meeting.keyPoints.map((p: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-blue-400 mt-0.5 shrink-0">-</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Bot size={18} className="text-slate-600" />
                <h2 className="font-semibold text-slate-500">AI Summary</h2>
              </div>
              <p className="text-slate-600 text-sm">No AI summary generated yet. Start the meeting and click "AI Summary" to generate one.</p>
            </div>
          )}

          {/* Action Items */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="font-semibold text-white mb-4">
              Action Items ({meeting.actionItems?.length || 0})
            </h2>
            {meeting.actionItems?.length > 0 ? (
              <div className="space-y-3">
                {meeting.actionItems.map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg bg-slate-800 p-3">
                    {item.completed
                      ? <CheckCircle2 size={18} className="text-green-400 mt-0.5 shrink-0" />
                      : <Circle size={18} className="text-slate-500 mt-0.5 shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${item.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                        {item.task}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Assigned to {item.assignee}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      item.priority === 'high' ? 'bg-red-900/40 text-red-400' :
                      item.priority === 'medium' ? 'bg-yellow-900/40 text-yellow-400' :
                      'bg-slate-700 text-slate-400'
                    }`}>{item.priority || 'medium'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-sm">No action items extracted yet.</p>
            )}
          </div>

          {/* Transcript */}
          {meeting.transcript && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-slate-400" />
                <h2 className="font-semibold text-white">Transcript</h2>
              </div>
              <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono bg-slate-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                {meeting.transcript}
              </pre>
            </div>
          )}
        </div>

        {/* Right: Participants + Chat */}
        <div className="space-y-6">
          {/* Participants */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="font-semibold text-white mb-4">Participants</h2>
            <div className="space-y-2">
              {/* Host */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {(meeting.host?.name || meeting.host)?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-white">{meeting.host?.name || meeting.host}</p>
                  <p className="text-xs text-blue-400">Host</p>
                </div>
              </div>
              {meeting.participants?.map((p: any, index: number) => (
                <div key={p._id || p.user?._id || p.name || p || index} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {(p.name || p.user?.name || p)?.[0]?.toUpperCase()}
                  </div>
                  <p className="text-sm text-slate-300">{p.name || p.user?.name || p}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chat history */}
          {meeting.chatMessages?.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="font-semibold text-white mb-4">Chat ({meeting.chatMessages.length})</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {meeting.chatMessages.map((msg: any, i: number) => (
                  <div key={i} className="text-xs">
                    <span className="text-blue-400 font-medium">{msg.senderName}: </span>
                    <span className="text-slate-400">{msg.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

