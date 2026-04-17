import { useQuery } from '@tanstack/react-query'
import { getAnalytics } from '../services/api'
import { BarChart2, Clock, Video, CheckCircle2, TrendingUp, Loader2 } from 'lucide-react'

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => getAnalytics().then(r => r.data)
  })

  if (isLoading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  )

  const a = data || {}
  const maxWeekly = Math.max(...(a.weeklyData || [0]), 1)

  const StatCard = ({ icon: Icon, label, value, sub, color }: any) => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm font-medium text-slate-300">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 mt-1 text-sm">Your meeting productivity insights</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Video} label="Total Meetings" value={a.totalMeetings || 0}
          sub="All time" color="bg-blue-600" />
        <StatCard icon={Clock} label="Total Duration" value={`${a.totalDuration || 0}m`}
          sub={`Avg ${a.avgDuration || 0} min/meeting`} color="bg-purple-600" />
        <StatCard icon={CheckCircle2} label="Action Items" value={a.totalActionItems || 0}
          sub={`${a.completedActionItems || 0} completed`} color="bg-green-600" />
        <StatCard icon={TrendingUp} label="Completion Rate" value={`${a.completionRate || 0}%`}
          sub="Action items done" color="bg-orange-600" />
      </div>

      {/* Weekly chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-white mb-6">Meetings Per Week</h2>
        <div className="flex items-end gap-4 h-40">
          {(a.weeklyData || [0, 0, 0, 0]).map((count: number, i: number) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">{count}</span>
              <div
                className="w-full bg-blue-600 rounded-t-lg transition-all duration-500 min-h-[4px]"
                style={{ height: `${Math.max((count / maxWeekly) * 120, 4)}px` }}
              />
              <span className="text-xs text-slate-500 text-center leading-tight">
                {(a.weekLabels || [])[i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action item progress */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-4">Action Item Progress</h2>
        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-green-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${a.completionRate || 0}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-white w-12 text-right">
            {a.completionRate || 0}%
          </span>
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>{a.completedActionItems || 0} completed</span>
          <span>{(a.totalActionItems || 0) - (a.completedActionItems || 0)} remaining</span>
        </div>

        {a.totalMeetings === 0 && (
          <div className="mt-6 text-center py-8">
            <BarChart2 size={40} className="mx-auto text-slate-700 mb-3" />
            <p className="text-slate-500 text-sm">No meeting data yet. Host your first meeting to see analytics!</p>
          </div>
        )}
      </div>
    </div>
  )
}
