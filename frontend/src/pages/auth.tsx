import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Mail, Lock, User, ArrowRight } from "lucide-react";
import { useAuthStore } from "../store/authStore";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fakeToken = "fake-jwt-token";

    const fakeUser = {
      id: "1",
      name: formData.name || "Guest User",
      email: formData.email,
    };

    // ✅ save in zustand + localStorage
    setUser(fakeUser, fakeToken);

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2 text-blue-700 font-bold text-2xl">
        <div className="bg-blue-600 p-1.5 rounded-lg text-white">
          <Video size={24} />
        </div>
        IntellMeet
      </div>

      {/* Auth Card */}
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>

          <p className="text-slate-500 text-sm mb-8">
            {isLogin
              ? "Enter your credentials to access your meetings."
              : "Join IntellMeet to start AI-powered collaborations."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-black outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-black outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="password"
                placeholder="Password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-black outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
            >
              {isLogin ? "Sign In" : "Create Account"}
              <ArrowRight size={18} />
            </button>
          </form>
        </div>

        {/* Toggle */}
        <div className="bg-slate-50 border-t border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-600">
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-blue-600 font-bold hover:underline"
            >
              {isLogin ? "Sign Up" : "Log In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;

// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Video, Mail, Lock, User, ArrowRight } from 'lucide-react';

// const Auth = () => {
//   const [isLogin, setIsLogin] = useState(true);
//   const navigate = useNavigate();

//   // --- ADDED THIS STATE TO FIX THE "formData" ERROR ---
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     password: ''
//   });

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     // For now, we mock a successful login
//     console.log("Form Submitted:", formData);
//     localStorage.setItem('token', 'fake-jwt-token'); 
//     navigate('/dashboard'); 
//   };

//   return (
//     <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-4">
//       <div className="mb-8 flex items-center gap-2 text-blue-700 font-bold text-2xl">
//         <div className="bg-blue-600 p-1.5 rounded-lg text-white"><Video size={24} /></div>
//         IntellMeet
//       </div>

//       <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
//         <div className="p-8">
//           <h2 className="text-2xl font-bold text-slate-800 mb-2">
//             {isLogin ? 'Welcome Back' : 'Create Account'}
//           </h2>
//           <p className="text-slate-500 text-sm mb-8">
//             {isLogin ? 'Enter your credentials to access your meetings.' : 'Join IntellMeet to start AI-powered collaborations.'}
//           </p>

//           <form onSubmit={handleSubmit} className="space-y-4">
//             {!isLogin && (
//               <div className="relative">
//                 <User className="absolute left-3 top-3 text-slate-400" size={18} />
//                 <input 
//                   type="text" 
//                   placeholder="Full Name" 
//                   // !text-black ensures visibility in white window
//                   className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 ring-blue-500/20 !text-black placeholder:text-slate-400" 
//                   value={formData.name}
//                   onChange={(e) => setFormData({...formData, name: e.target.value})}
//                   required 
//                 />
//               </div>
//             )}
            
//             <div className="relative">
//               <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
//               <input 
//                 type="email" 
//                 placeholder="Email Address" 
//                 className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 ring-blue-500/20 !text-black placeholder:text-slate-400" 
//                 value={formData.email}
//                 onChange={(e) => setFormData({...formData, email: e.target.value})}
//                 required 
//               />
//             </div>

//             <div className="relative">
//               <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
//               <input 
//                 type="password" 
//                 placeholder="Password" 
//                 className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 ring-blue-500/20 !text-black placeholder:text-slate-400" 
//                 value={formData.password}
//                 onChange={(e) => setFormData({...formData, password: e.target.value})}
//                 required 
//               />
//             </div>

//             <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
//               {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} />
//             </button>
//           </form>
//         </div>

//         <div className="bg-slate-50 border-t border-slate-200 p-6 text-center">
//           <p className="text-sm text-slate-600">
//             {isLogin ? "Don't have an account?" : "Already have an account?"}
//             <button 
//               onClick={() => setIsLogin(!isLogin)}
//               className="ml-2 text-blue-600 font-bold hover:underline"
//             >
//               {isLogin ? 'Sign Up' : 'Log In'}
//             </button>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Auth;