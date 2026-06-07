import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { signup, login } from "../services/api";
import { signupFormSchema, loginFormSchema, type SignupFormInput, type LoginFormInput } from "../validators/authValidators";
import { ZodError } from "zod";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { setUser, isLoading, setLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>("");
  const [apiSuccess, setApiSuccess] = useState<string>("");

  // Clear errors when switching between login/signup
  useEffect(() => {
    setErrors({});
    setApiError("");
    setApiSuccess("");
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
  }, [isLogin]);

  const validateForm = () => {
    setErrors({});
    try {
      if (isLogin) {
        loginFormSchema.parse({ email: formData.email, password: formData.password });
      } else {
        signupFormSchema.parse({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });
      }
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join(".");
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setApiSuccess("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      if (isLogin) {
        const response = await login({
          email: formData.email,
          password: formData.password,
        });

        const { user, accessToken, refreshToken } = response.data.data;

        setUser(user, accessToken, refreshToken);
        setApiSuccess("Login successful! Redirecting...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } else {
        const response = await signup({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });

        const { user, accessToken, refreshToken } = response.data.data;

        setUser(user, accessToken, refreshToken);
        setApiSuccess("Account created! Redirecting...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      
      if (error.response?.data?.message) {
        setApiError(error.response.data.message);
      } else if (error.message) {
        setApiError(error.message);
      } else {
        setApiError(isLogin ? "Login failed. Please try again." : "Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (field: string) => {
    return errors[field];
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

          {/* Error Alert */}
          {apiError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-start">
              <AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{apiError}</p>
            </div>
          )}

          {/* Success Alert */}
          {apiSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2 items-start">
              <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-700">{apiSuccess}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field (Signup Only) */}
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Full Name"
                  className={`w-full bg-slate-50 border rounded-xl py-3 pl-10 pr-4 text-black outline-none focus:ring-2 ${
                    getFieldError("name")
                      ? "border-red-300 focus:ring-red-500/20"
                      : "border-slate-200 focus:ring-blue-500/20"
                  }`}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                {getFieldError("name") && (
                  <p className="text-red-600 text-xs mt-1">{getFieldError("name")}</p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="email"
                placeholder="Email Address"
                className={`w-full bg-slate-50 border rounded-xl py-3 pl-10 pr-4 text-black outline-none focus:ring-2 ${
                  getFieldError("email")
                    ? "border-red-300 focus:ring-red-500/20"
                    : "border-slate-200 focus:ring-blue-500/20"
                }`}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              {getFieldError("email") && (
                <p className="text-red-600 text-xs mt-1">{getFieldError("email")}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="password"
                placeholder="Password"
                className={`w-full bg-slate-50 border rounded-xl py-3 pl-10 pr-4 text-black outline-none focus:ring-2 ${
                  getFieldError("password")
                    ? "border-red-300 focus:ring-red-500/20"
                    : "border-slate-200 focus:ring-blue-500/20"
                }`}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              {getFieldError("password") && (
                <p className="text-red-600 text-xs mt-1">{getFieldError("password")}</p>
              )}
            </div>

            {/* Confirm Password Field (Signup Only) */}
            {!isLogin && (
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className={`w-full bg-slate-50 border rounded-xl py-3 pl-10 pr-4 text-black outline-none focus:ring-2 ${
                    getFieldError("confirmPassword")
                      ? "border-red-300 focus:ring-red-500/20"
                      : "border-slate-200 focus:ring-blue-500/20"
                  }`}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                />
                {getFieldError("confirmPassword") && (
                  <p className="text-red-600 text-xs mt-1">{getFieldError("confirmPassword")}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isLoading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>

        {/* Toggle */}
        <div className="bg-slate-50 border-t border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
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