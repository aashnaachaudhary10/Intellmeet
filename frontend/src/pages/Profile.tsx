import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { updateProfile } from '../services/api'
import { useMutation } from '@tanstack/react-query'
import { Camera, CheckCircle, Loader2, Mail, Save, Shield, User } from 'lucide-react'

export default function Profile() {
  const { user, setUser, token } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saved, setSaved] = useState(false)
  const previewUrl = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : user?.avatar || ''),
    [avatarFile, user?.avatar]
  )
  const userInitial = user?.name?.[0]?.toUpperCase() || 'U'

  useEffect(() => {
    setName(user?.name || '')
  }, [user?.name])

  useEffect(() => {
    return () => {
      if (avatarFile && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    }
  }, [avatarFile, previewUrl])

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
    <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
      <div className="mb-7">
        <p className="text-sm font-medium text-blue-400">Account</p>
        <h1 className="mt-1 text-2xl font-bold text-white">Profile Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Update your public meeting identity and profile image.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-blue-700 text-3xl font-bold text-white ring-1 ring-slate-700">
              {previewUrl ? (
                <img src={previewUrl} alt={`${user?.name || 'User'} avatar`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">{userInitial}</div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold text-white">{user?.name || 'Your profile'}</h2>
                <span className="rounded-full border border-blue-800 bg-blue-900/40 px-2.5 py-1 text-xs font-medium capitalize text-blue-300">
                  {user?.role || 'member'}
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-slate-400">{user?.email}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700">
                  <Camera size={15} />
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
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                  >
                    {updateMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    Save Image
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 lg:row-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Shield size={18} className="text-blue-400" />
            <h2 className="font-semibold text-white">Security</h2>
          </div>
          <div className="space-y-3 text-sm text-slate-400">
            <div className="flex items-center justify-between gap-4 border-b border-slate-800 py-2">
              <span>JWT Authentication</span>
              <span className="flex items-center gap-1 text-green-400"><CheckCircle size={13} /> Active</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-slate-800 py-2">
              <span>Password Hashing</span>
              <span className="flex items-center gap-1 text-green-400"><CheckCircle size={13} /> bcrypt</span>
            </div>
            <div className="flex items-center justify-between gap-4 py-2">
              <span>Avatar Storage</span>
              <span className="flex items-center gap-1 text-green-400"><CheckCircle size={13} /> Cloudinary</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 font-semibold text-white">Edit Information</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm text-slate-300">
                <User size={14} /> Full Name
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm text-slate-300">
                <Mail size={14} /> Email Address
              </label>
              <input
                value={user?.email || ''}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-600">Email cannot be changed.</p>
            </div>
          </div>
          <button
            onClick={() => updateMut.mutate()}
            disabled={updateMut.isPending || (name === user?.name && !avatarFile)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            {updateMut.isPending
              ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
              : saved
              ? <><CheckCircle size={16} className="text-green-300" /> Saved</>
              : <><Save size={16} /> Save Changes</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
