import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasks, createTask, updateTaskStatus, deleteTask } from '../services/api'
import { useToast } from '../hooks/use-toast'
import { Plus, Trash2, Loader2, X } from 'lucide-react'

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'text-slate-400', dot: 'bg-slate-500' },
  { id: 'inprogress', label: 'In Progress', color: 'text-yellow-400', dot: 'bg-yellow-500' },
  { id: 'done', label: 'Done', color: 'text-green-400', dot: 'bg-green-500' },
]

const PRIORITIES = [
  { value: 'high', label: 'High', color: 'text-red-400 bg-red-900/30 border-red-800' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400 bg-yellow-900/30 border-yellow-800' },
  { value: 'low', label: 'Low', color: 'text-slate-400 bg-slate-800 border-slate-700' },
]

type Task = {
  id: string
  _id: string
  title: string
  description?: string
  status: string
  priority: string
  assigneeName: string
  user?: { id?: string; name?: string; email?: string }
}

export default function KanbanBoard() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const [showAdd, setShowAdd] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' })
  const [pendingMove, setPendingMove] = useState<{ taskId: string; status: string } | null>(null)
  const [isTransferring, setIsTransferring] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => getTasks().then((r: any) => r),
  })

  const tasks: Task[] = (data || []).map((t: any) => ({
    ...t,
    _id: t.id,
    status: t.status === 'in-progress' ? 'inprogress' : t.status,
  }))

  const createMut = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
      setShowAdd(false)
      setNewTask({ title: '', description: '', priority: 'medium' })
      toast({ title: 'Success', description: 'Task created successfully' })
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to create task',
        variant: 'destructive',
      })
    },
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateTaskStatus(id, status),
    onMutate: () => {
      setIsTransferring(true)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
      setPendingMove(null)
      setIsTransferring(false)
      toast({ title: 'Success', description: 'Task status updated' })
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to update task status',
        variant: 'destructive'
      })
      setPendingMove(null)
      setIsTransferring(false)
    }
  })
      setPendingMove(null)
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
      toast({ title: 'Success', description: 'Task deleted' })
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to delete task',
        variant: 'destructive',
      })
    },
  })

  const getColumnTasks = (colId: string) => tasks.filter((t) => t.status === colId)

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDragging(taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    if (dragging) {
      const task = tasks.find((t) => t._id === dragging)
      if (!task) {
        setDragging(null)
        return
      }
      if (task.status !== colId) {
        setPendingMove({ taskId: dragging, status: colId })
      }
      setDragging(null)
    }
  }

  const handleQuickMove = (taskId: string, status: string) => {
    setPendingMove({ taskId, status })
  }

  const confirmMove = () => {
    if (pendingMove) {
      statusMut.mutate({ id: pendingMove.taskId, status: pendingMove.status })
    }
  }

  const PriorityBadge = ({ priority }: { priority: string }) => {
    const p = PRIORITIES.find((x) => x.value === priority) || PRIORITIES[1]
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${p.color}`}>
        {p.label}
      </span>
    )
  }

  const TaskCard = ({ task }: { task: Task }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, task._id)}
      className="bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-slate-600 transition group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p
          className={`text-sm font-medium ${
            task.status === 'done' ? 'line-through text-slate-500' : 'text-white'
          }`}
        >
          {task.title}
        </p>
        <button
          onClick={() => deleteMut.mutate(task._id)}
          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between">
        <PriorityBadge priority={task.priority} />
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-slate-300">
            {(task.assigneeName || 'U')[0]}
          </div>
          <span className="text-xs text-slate-500">{task.assigneeName || 'Unassigned'}</span>
        </div>
      </div>

      <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition">
        {COLUMNS.filter((c) => c.id !== task.status).map((col) => (
          <button
            key={col.id}
            onClick={() => handleQuickMove(task._id, col.id)}
            className="text-xs text-slate-500 hover:text-white bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-md transition"
          >
            → {col.label}
          </button>
        ))}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    )
  }

  return (
    <div className="p-8 h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Task Board</h1>
          <p className="text-slate-400 mt-1 text-sm">Drag and drop tasks between columns</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {COLUMNS.map((col) => (
          <div key={col.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${col.dot}`} />
              <p className={`text-xs font-medium ${col.color}`}>{col.label}</p>
            </div>
            <p className="text-2xl font-bold text-white">{getColumnTasks(col.id).length}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-340px)]">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className="flex flex-col bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                <h2 className={`text-sm font-semibold ${col.color}`}>{col.label}</h2>
              </div>
              <span className="text-xs font-medium bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                {getColumnTasks(col.id).length}
              </span>
            </div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.id)}
              className="flex-1 overflow-y-auto"
            >
              {getColumnTasks(col.id).length === 0 ? (
                <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-800 m-2">
                  <p className="text-slate-700 text-sm">Drop tasks here</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {getColumnTasks(col.id).map((task) => (
                    <TaskCard key={task._id} task={task} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-5">Add New Task</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Task Title *</label>
                <input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="What needs to be done?"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Add more details..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setNewTask({ ...newTask, priority: p.value })}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${
                        newTask.priority === p.value ? p.color : 'border-slate-700 text-slate-500 hover:border-slate-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 border border-slate-700 text-slate-300 py-2.5 rounded-xl hover:bg-slate-800 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => createMut.mutate(newTask)}
                disabled={!newTask.title || createMut.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-xl transition text-sm font-semibold flex items-center justify-center gap-2"
              >
                {createMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Confirm status change</h3>
              <button
                onClick={() => setPendingMove(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-300">
              Move this task to{' '}
              <span className="font-semibold text-white">
                {COLUMNS.find((c) => c.id === pendingMove.status)?.label}
              </span>
              ?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingMove(null)}
                className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmMove}
                disabled={isTransferring || statusMut.isPending}
                className={`flex-1 rounded-lg px-3 py-2 text-sm text-white transition ${
                  isTransferring || statusMut.isPending
                    ? 'bg-blue-500/60 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {isTransferring || statusMut.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Transferring...
                  </span>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
