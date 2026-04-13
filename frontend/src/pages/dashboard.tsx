import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Video, CheckSquare, BarChart3, Settings, 
  Search, Play, Volume2, Share2, CheckCircle2, ClipboardList, Sparkles, Loader2 
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- TAB NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- DYNAMIC STATE FOR AI INTEGRATION ---
  const [summaryPoints, setSummaryPoints] = useState([
    "MongoDB Atlas migration and preparing for competition.",
    "Redis integration for Socket.io search optimization.",
    "Kubernetes deployment in the development markets."
  ]);

  const [tasks, setTasks] = useState([
    { id: 1, label: "Extracted tasks for decoration", user: "@User", date: "15 Apr", completed: false },
    { id: 2, label: "Short ext emende contrat reformed", user: "@Intern", date: "15 Apr", completed: false },
    { id: 3, label: "Deploy it Kubernetes components", user: "@User", date: "18 Apr", completed: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  // --- DAY 16/17: AI SUMMARY GENERATION LOGIC ---
  const handleAiGeneration = () => {
    setIsAiLoading(true);
    // Simulate API Call to Gemini/Node backend
    setTimeout(() => {
      setSummaryPoints([
        "Finalized MERN stack architecture for the project.",
        "Integrated Gemini API for automated meeting notes.",
        "Optimized Tailwind CSS for dark/light mode visibility."
      ]);
      setTasks(prev => [
        ...prev,
        { id: Date.now(), label: "Review API Documentation", user: "@Aashna", date: "20 Apr", completed: false }
      ]);
      setIsAiLoading(false);
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-2 text-blue-700 font-bold text-xl cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-blue-600 p-1 rounded-md text-white"><Video size={20} /></div>
          IntellMeet
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem 
            icon={<LayoutDashboard size={20}/>} 
            label="Dashboard" 
            active={activeTab === 'Dashboard'} 
            onClick={() => setActiveTab('Dashboard')} 
          />
          <NavItem 
            icon={<Video size={20}/>} 
            label="Meetings" 
            active={activeTab === 'Meetings'} 
            onClick={() => navigate('/lobby')} 
          />
          <NavItem 
            icon={<CheckSquare size={20}/>} 
            label="Tasks" 
            active={activeTab === 'Tasks'} 
            onClick={() => setActiveTab('Tasks')} 
          />
          <NavItem 
            icon={<BarChart3 size={20}/>} 
            label="Analytics" 
            active={activeTab === 'Analytics'} 
            onClick={() => setActiveTab('Analytics')} 
          />
          <NavItem 
            icon={<Settings size={20}/>} 
            label="Settings" 
            active={activeTab === 'Settings'} 
            onClick={() => setActiveTab('Settings')} 
          />
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div>
            <h1 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              {activeTab} - Industry Edition
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* AI TRIGGER BUTTON */}
            <button 
                onClick={handleAiGeneration}
                disabled={isAiLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md hover:opacity-90 transition disabled:opacity-50"
            >
              {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Generate AI Report
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-2 text-slate-400" size={16} />
              <input type="text" placeholder="Search..." className="bg-slate-100 rounded-lg py-1.5 pl-10 pr-4 text-sm w-64 outline-none focus:ring-2 ring-blue-500/20 text-slate-900" />
            </div>
          </div>
        </header>

        {/* CONDITIONALLY RENDER VIEWS */}
        <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'Dashboard' ? (
                <div className="flex gap-6 h-full">
                    {/* LEFT COLUMN */}
                    <div className="flex-[2] space-y-6">
                        <section className="flex justify-between items-end">
                            <h2 className="text-2xl font-bold text-slate-700">Enterprisers <span className="font-normal text-slate-400">- April 2026</span></h2>
                            <div className="flex -space-x-2">
                                {[1,2,3,4].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-300 overflow-hidden"><img src={`https://i.pravatar.cc/150?u=${i}`} alt="user"/></div>)}
                            </div>
                        </section>

                        <div className="bg-[#111827] rounded-2xl overflow-hidden shadow-xl">
                            <div className="p-4 flex justify-between text-white border-b border-white/10">
                                <span className="font-medium">Sprint Sync - March 24</span>
                                <div className="flex gap-3"><Share2 size={18}/></div>
                            </div>
                            <div className="grid grid-cols-3 gap-1 p-2 h-64 bg-black/40">
                                <VideoFeed name="@User" />
                                <VideoFeed name="@User" />
                                <VideoFeed name="@Intern" />
                            </div>
                            <div className="p-4 bg-slate-900/50">
                                <div className="h-1 bg-white/20 rounded-full w-full relative mb-4">
                                    <div className="absolute h-full bg-blue-500 w-1/3 rounded-full"></div>
                                </div>
                                <div className="flex items-center justify-between text-white/80">
                                    <div className="flex items-center gap-4 text-sm">
                                        <Play size={20} fill="white"/> <Volume2 size={20}/> <span>0:00 / 12:24</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="bg-blue-600 px-3 py-1 rounded text-xs flex items-center gap-1 cursor-pointer"><ClipboardList size={14}/> Tasks</span>
                                        <span className="bg-emerald-600 px-3 py-1 rounded text-xs flex items-center gap-1 cursor-pointer"><CheckCircle2 size={14}/> Decisions</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI INTELLIGENCE */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
                            {isAiLoading && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
                                    <Loader2 className="animate-spin text-blue-600" />
                                </div>
                            )}
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">AI Meeting Intelligence</h3>
                                <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full border border-emerald-100">Sentiment: Productive</span>
                            </div>
                            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                                <h4 className="font-bold text-sm text-blue-900 mb-2 underline">Executive Summary</h4>
                                <ul className="text-sm space-y-2 text-slate-600">
                                    {summaryPoints.map((point, index) => (
                                        <li key={index}>• {point}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="flex-1 space-y-4">
                        <div className="bg-white border border-slate-200 rounded-xl h-full shadow-sm flex flex-col">
                            <div className="flex border-b text-xs">
                                <button className="flex-1 p-4 font-bold border-b-2 border-blue-600">Realtime collaboration</button>
                                <button className="flex-1 p-4 text-slate-400 hover:text-slate-600">Live Transcript</button>
                            </div>
                            <div className="p-6 flex-1 overflow-y-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-slate-800 text-sm">Smart Action Items</h3>
                                    <button className="bg-slate-800 text-white text-[10px] px-2 py-1.5 rounded-md font-bold">Sync to Jira</button>
                                </div>
                                <div className="space-y-6">
                                    {tasks.map(task => (
                                        <TaskItem 
                                            key={task.id} 
                                            label={task.label} 
                                            user={task.user} 
                                            date={task.date} 
                                            completed={task.completed} 
                                            onToggle={() => toggleTask(task.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="p-4">
                                <button className="w-full bg-[#1e293b] text-white py-2.5 rounded-lg text-sm font-bold hover:bg-slate-700 transition">
                                    Export to Project Board
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="bg-slate-100 p-6 rounded-full mb-4">
                        <ClipboardList size={48} className="text-slate-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-700">{activeTab} Section</h2>
                    <p className="text-slate-500 max-w-sm">This module is coming in the Week 3 final push.</p>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

/* --- HELPER COMPONENTS (Keep these at the bottom) --- */
const NavItem = ({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition ${
      active ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-50'
    }`}
  >
    {icon} <span>{label}</span>
  </div>
);

const VideoFeed = ({ name }: { name: string }) => (
  <div className="relative bg-slate-800 rounded-lg overflow-hidden border border-white/5">
    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300" className="w-full h-full object-cover opacity-80" alt="user"/>
    <span className="absolute bottom-2 left-2 bg-black/50 text-[10px] text-white px-2 py-0.5 rounded">{name}</span>
  </div>
);

const TaskItem = ({ label, user, date, completed, onToggle }: { label: string, user: string, date: string, completed: boolean, onToggle: () => void }) => (
  <div className="flex items-start gap-3">
    <input 
      type="checkbox" 
      checked={completed} 
      onChange={onToggle}
      className="mt-1.5 rounded border-slate-300 text-blue-600" 
    />
    <div className="flex-1">
      <p className={`text-sm font-medium leading-tight mb-1 ${completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{label}</p>
      <div className="flex justify-between items-center text-[11px] text-slate-400">
        <span className="flex items-center gap-1"><span className="w-4 h-4 bg-slate-200 rounded-full"></span>{user}</span>
        <span>{date}</span>
      </div>
    </div>
  </div>
);

export default Dashboard;