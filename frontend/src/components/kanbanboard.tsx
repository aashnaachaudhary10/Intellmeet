import React from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';

const KanbanBoard = () => {
  const columns = ["To Do", "In Progress", "Done"];
  const tasks = [
    { id: 1, title: "Fix MongoDB Schema", status: "To Do", user: "@User" },
    { id: 2, title: "Socket.io Integration", status: "In Progress", user: "@Intern" },
    { id: 3, title: "Setup Vite Boilerplate", status: "Done", user: "@User" }
  ];

  return (
    <div className="flex gap-6 h-full overflow-x-auto pb-4">
      {columns.map(col => (
        <div key={col} className="min-w-[300px] bg-slate-100/50 rounded-xl p-4 flex flex-col border border-slate-200">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              {col} <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-slate-300 text-slate-400">
                {tasks.filter(t => t.status === col).length}
              </span>
            </h3>
            <div className="flex gap-1 text-slate-400"><Plus size={18}/><MoreHorizontal size={18}/></div>
          </div>
          
          <div className="space-y-3">
            {tasks.filter(t => t.status === col).map(task => (
              <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors">
                <p className="text-sm font-medium mb-3">{task.title}</p>
                <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-tighter">
                  <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">{task.user}</span>
                  <span>15 Apr 2026</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;