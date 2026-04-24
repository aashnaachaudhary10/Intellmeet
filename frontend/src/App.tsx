import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { getMe } from "./services/api";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Auth from "./pages/Auth";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MeetingRoom from "./pages/MeetingRoom";
import MeetingDetail from "./pages/MeetingDetail";
import KanbanBoard from "./pages/KanbanBoard";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Layout from "@/components/Layout";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { token, setUser, logout } = useAuthStore();

  useEffect(() => {
    if (token) {
      getMe()
        .then((res) => setUser(res.data.user, token))
        .catch(() => logout());
    }
  }, [token, setUser, logout]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected layout routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/app/dashboard" element={<Dashboard />} />
              <Route path="/app/meeting/:id" element={<MeetingDetail />} />
              <Route path="/app/kanban" element={<KanbanBoard />} />
              <Route path="/app/analytics" element={<Analytics />} />
              <Route path="/app/profile" element={<Profile />} />
            </Route>

            {/* Fullscreen room */}
            <Route
              path="/room/:id"
              element={
                <ProtectedRoute>
                  <MeetingRoom />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}


// import { useEffect } from 'react'
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
// import { useAuthStore } from './store/authStore'
// import { getMe } from './services/api'

// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { Toaster } from "@/components/ui/toaster";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import Auth from "./pages/auth";

// import Index from "./pages/Index.tsx";
// import About from "./pages/About.tsx";
// import Contact from "./pages/Contact.tsx";
// import Login from './pages/Login'
// import Register from './pages/Register'
// import Dashboard from './pages/Dashboard'
// import MeetingRoom from './pages/MeetingRoom'
// import MeetingDetail from './pages/MeetingDetail'
// import KanbanBoard from './pages/KanbanBoard'
// import Analytics from './pages/Analytics'
// import Profile from './pages/Profile'
// import NotFound from './pages/NotFound'
// import Layout from './components/Layout'


// function ProtectedRoute({ children }: { children: React.ReactNode }) {
//   const { token } = useAuthStore()
//   if (!token) return <Navigate to="/login" replace />
//   return <>{children}</>
// }

// export default function App() {
//   const { token, setUser, logout } = useAuthStore()


//   // Restore user session on page refresh
//   useEffect(() => {
//     if (token) {
//       getMe()
//         .then(res => setUser(res.data.user, token))
//         .catch(() => logout())
//     }
//   }, [])

// const queryClient = new QueryClient();

// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <TooltipProvider>
//       <Toaster />
//       <Sonner />
//       <BrowserRouter>
//         <Routes>
//           <Route path="/" element={<Index />} />
//           <Route path="/about" element={<About />} />
//           <Route path="/contact" element={<Contact />} />
//           <Route path="/auth" element={<Auth />} />
          
//           <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />

//         <Route path="/" element={
//           <ProtectedRoute>
//             <Layout />
//           </ProtectedRoute>
//         }>
//           <Route index element={<Navigate to="/Dashboard" replace />} />
//           <Route path="dashboard" element={<Dashboard />} />
//           <Route path="meeting/:id" element={<MeetingDetail />} />
//           <Route path="kanban" element={<KanbanBoard />} />
//           <Route path="analytics" element={<Analytics />} />
//           <Route path="profile" element={<Profile />} />
//         </Route>

//         {/* Meeting room is full-screen, no layout */}
//         <Route path="/room/:id" element={
//           <ProtectedRoute>
//             <MeetingRoom />
//           </ProtectedRoute>
//         } />

       
//           <Route path="*" element={<NotFound />} />
//         </Routes>
//       </BrowserRouter>
//     </TooltipProvider>
//   </QueryClientProvider>
// )
// }
