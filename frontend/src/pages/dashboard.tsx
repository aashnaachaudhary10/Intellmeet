import React from 'react';
import { 
  LayoutDashboard, Video, CheckSquare, BarChart3, Settings, 
  Search, Play, Volume2, Maximize, Share2, CheckCircle2, ClipboardList 
} from 'lucide-react';

const IntellMeetDashboard = () => {
  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-2 text-blue-700 font-bold text-xl">
          <div className="bg-blue-600 p-1 rounded-md text-white"><Video size={20} /></div>
          IntellMeet
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active />
          <NavItem icon={<Video size={20}/>} label="Meetings" />
          <NavItem icon={<CheckSquare size={20}/>} label="Tasks" />
          <NavItem icon={<BarChart3 size={20}/>} label="Analytics" />
          <NavItem icon={<Settings size={20}/>} label="Settings" />
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div>
            <h1 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              IntellMeet - AI-Powered Enterprise Meeting & Collaboration Platform
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
              Version 2.0 - Industry Edition
            </span>
            <div className="relative">
              <Search className="absolute left-3 top-2 text-slate-400" size={16} />
              <input type="text" placeholder="Search" className="bg-slate-100 rounded-lg py-1.5 pl-10 pr-4 text-sm w-64 outline-none focus:ring-2 ring-blue-500/20" />
            </div>
          </div>
        </header>

        {/* DASHBOARD GRID */}
        <div className="flex-1 overflow-y-auto p-8 flex gap-6">
          
          {/* LEFT COLUMN: VIDEO & AI INTEL */}
          <div className="flex-[2] space-y-6">
            <section className="flex justify-between items-end">
              <h2 className="text-2xl font-bold text-slate-700">Enterprisers <span className="font-normal text-slate-400">- April 2026</span></h2>
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-300 overflow-hidden"><img src={`https://i.pravatar.cc/150?u=${i}`} alt="user"/></div>)}
              </div>
            </section>

            {/* VIDEO PLAYER COMPONENT */}
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
              {/* VIDEO CONTROLS */}
              <div className="p-4 bg-slate-900/50">
                <div className="h-1 bg-white/20 rounded-full w-full relative mb-4">
                  <div className="absolute h-full bg-blue-500 w-1/3 rounded-full"></div>
                </div>
                <div className="flex items-center justify-between text-white/80">
                  <div className="flex items-center gap-4 text-sm">
                    <Play size={20} fill="white"/> <Volume2 size={20}/> <span>0:00 / 12:24</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-blue-600 px-3 py-1 rounded text-xs flex items-center gap-1"><ClipboardList size={14}/> Tasks</span>
                    <span className="bg-emerald-600 px-3 py-1 rounded text-xs flex items-center gap-1"><CheckCircle2 size={14}/> Decisions</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI INTELLIGENCE */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">AI Meeting Intelligence</h3>
                <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full border border-emerald-100">Sentiment: Productive</span>
              </div>
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                <h4 className="font-bold text-sm text-blue-900 mb-2 underline">Executive Summary</h4>
                <ul className="text-sm space-y-2 text-slate-600">
                  <li>• MongoDB Atlas migration and preparing for competition.</li>
                  <li>• Redis integration for Socket.io search optimization.</li>
                  <li>• Kubernetes deployment in the development markets.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ACTION ITEMS */}
          <div className="flex-1 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl h-full shadow-sm flex flex-col">
              <div className="flex border-b">
                <button className="flex-1 p-4 font-bold border-b-2 border-blue-600 text-sm">Realtime collaboration</button>
                <button className="flex-1 p-4 text-slate-400 text-sm hover:text-slate-600">Live Transcript</button>
              </div>
              <div className="p-6 flex-1">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800">Smart Action Items</h3>
                  <button className="bg-slate-800 text-white text-[10px] px-3 py-2 rounded-lg font-bold">Sync to Jira/Trello</button>
                </div>
                <div className="space-y-6">
                  <TaskItem label="Extracted tasks for decoration" user="@User" date="15 Apr" />
                  <TaskItem label="Short ext emende contrat reformed" user="@Intern" date="15 Apr" />
                  <TaskItem label="Deploy it Kubernetes components" user="@User" date="18 Apr" />
                </div>
              </div>
              <div className="p-6">
                 <button className="w-full bg-[#1e293b] text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition">Sync to Jira/Trello</button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

/* --- HELPER COMPONENTS --- */
const NavItem = ({ icon, label, active = false }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition ${active ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
    {icon} <span>{label}</span>
  </div>
);

const VideoFeed = ({ name }) => (
  <div className="relative bg-slate-800 rounded-lg overflow-hidden border border-white/5">
    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300" className="w-full h-full object-cover opacity-80" alt="user"/>
    <span className="absolute bottom-2 left-2 bg-black/50 text-[10px] text-white px-2 py-0.5 rounded">{name}</span>
  </div>
);

const TaskItem = ({ label, user, date }) => (
  <div className="flex items-start gap-3">
    <input type="checkbox" className="mt-1.5 rounded border-slate-300" />
    <div className="flex-1">
      <p className="text-sm font-medium text-slate-700 leading-tight mb-1">{label}</p>
      <div className="flex justify-between items-center text-[11px] text-slate-400">
        <span className="flex items-center gap-1"><span className="w-4 h-4 bg-slate-200 rounded-full"></span>{user}</span>
        <span>{date}</span>
      </div>
    </div>
  </div>
);

export default IntellMeetDashboard;