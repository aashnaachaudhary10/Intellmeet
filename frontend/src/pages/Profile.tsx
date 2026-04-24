import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { updateProfile } from '../services/api'
import { useMutation } from '@tanstack/react-query'
import { User, Mail, Shield, Save, Loader2, CheckCircle } from 'lucide-react'

export default function Profile() {
  const { user, setUser, token } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saved, setSaved] = useState(false)

  const updateMut = useMutation({
    mutationFn: () => {
      const formData = new FormData()
      formData.append('name', name)
      if (avatarFile) formData.append('avatar', avatarFile)
      return updateProfile(formData)
    },
    onSuccess: (res) => {
      setUser(res.data.user, token!)
      setSaved(true)
      setAvatarFile(null)
      setTimeout(() => setSaved(false), 2500)
    }
  })

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Profile Settings</h1>

      {/* Avatar section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-white mb-4">Your Profile</h2>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-blue-700 rounded-2xl flex items-center justify-center text-3xl font-bold text-white overflow-hidden shrink-0">
            {avatarFile ? (
              <img src={URL.createObjectURL(avatarFile)} alt="Avatar Preview" className="w-full h-full object-cover" />
            ) : user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.name?.[0]?.toUpperCase()
            )}
          </div>
          <div>
            <p className="text-white font-semibold text-lg">{user?.name}</p>
            <p className="text-slate-400 text-sm mb-2">{user?.email}</p>
            
            <div className="flex items-center gap-3">
              <span className="inline-block text-xs bg-blue-900/40 text-blue-400 border border-blue-800 px-2 py-0.5 rounded-full capitalize">
                {user?.role}
              </span>
              <label className="cursor-pointer text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 transition inline-block">
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => setAvatarFile(e.target.files?.[0] || null)}
                />
              </label>
              {avatarFile && (
                <button
                  onClick={() => updateMut.mutate()}
                  disabled={updateMut.isPending}
                  className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1"
                >
                  {updateMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Save Avatar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-white mb-4">Edit Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5 flex items-center gap-2">
              <User size={14} /> Full Name
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5 flex items-center gap-2">
              <Mail size={14} /> Email Address
            </label>
            <input
              value={user?.email}
              disabled
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-600 mt-1">Email cannot be changed</p>
          </div>
        </div>
        <button
          onClick={() => updateMut.mutate()}
          disabled={updateMut.isPending || (name === user?.name && !avatarFile)}
          className="mt-5 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          {updateMut.isPending
            ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
            : saved
            ? <><CheckCircle size={16} className="text-green-300" /> Saved!</>
            : <><Save size={16} /> Save Changes</>
          }
        </button>
      </div>

      {/* Security */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-blue-400" />
          <h2 className="font-semibold text-white">Security</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-400">
          <div className="flex items-center justify-between py-2 border-b border-slate-800">
            <span>JWT Authentication</span>
            <span className="text-green-400 flex items-center gap-1"><CheckCircle size={13} /> Active</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-800">
            <span>Password Hashing</span>
            <span className="text-green-400 flex items-center gap-1"><CheckCircle size={13} /> bcrypt (12 rounds)</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>Rate Limiting</span>
            <span className="text-green-400 flex items-center gap-1"><CheckCircle size={13} /> Enabled</span>
          </div>
        </div>
      </div>
    </div>
  )
}
