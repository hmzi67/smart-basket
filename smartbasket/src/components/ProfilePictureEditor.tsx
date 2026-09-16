'use client'
import { useEffect, useRef, useState } from 'react'
import { Camera, Loader2, User } from 'lucide-react'
import Image from 'next/image'
import axios from 'axios'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { setUserData } from '@/redux/userSlice'
import { MAX_PROFILE_IMAGE_BYTES, PROFILE_IMAGE_TYPES } from '@/lib/profile-image'

export default function ProfilePictureEditor({ image, name }: { image?: string; name: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [savedImage, setSavedImage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const { update } = useSession()
  const router = useRouter()
  const dispatch = useDispatch()
  const current = savedImage ?? image ?? ''
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  function select(selected?: File) {
    setError(''); setMessage('')
    if (!selected) return
    if (!PROFILE_IMAGE_TYPES.includes(selected.type) || selected.size > MAX_PROFILE_IMAGE_BYTES) {
      setError('Choose a JPEG, PNG, or WebP image up to 5 MB.'); return
    }
    setFile(selected); setPreview(URL.createObjectURL(selected))
  }
  async function save(remove = false) {
    if (busy || (!remove && !file)) return
    setBusy(true); setError(''); setMessage('')
    try {
      const form = new FormData()
      if (file) form.set('image', file)
      const { data } = remove ? await axios.delete('/api/user/profile/picture') : await axios.post('/api/user/profile/picture', form)
      setSavedImage(data.user.image ?? ''); setFile(null); setPreview('')
      if (input.current) input.current.value = ''
      dispatch(setUserData(data.user))
      setMessage(remove ? 'Picture removed.' : 'Picture updated.')
      router.refresh()
      // The database is authoritative; no client-supplied image is put into the JWT.
      await update()
    } catch (err) { setError(axios.isAxiosError(err) ? err.response?.data?.message || 'Could not update your picture.' : 'Could not update your picture.') }
    finally { setBusy(false) }
  }
  return <div className="mb-4 flex w-full flex-col items-center">
    <div className="relative mb-3 h-24 w-24"><div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border-4 border-white bg-emerald-50 ring-1 ring-emerald-100">{preview || current ? <Image src={preview || current} alt={name} fill sizes="96px" className="object-cover" /> : <User size={42} className="text-emerald-700" />}</div><button type="button" aria-label="Choose profile picture" disabled={busy} onClick={() => input.current?.click()} className="absolute -bottom-1 -right-1 rounded-full border-4 border-white bg-emerald-700 p-2 text-white hover:bg-emerald-800 disabled:opacity-50"><Camera size={16} /></button></div>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Profile picture file" disabled={busy} onChange={event => select(event.target.files?.[0])} />
    <div className="flex flex-wrap justify-center gap-3 text-xs font-semibold">
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className="text-emerald-700 disabled:opacity-50">{current ? 'Change picture' : 'Add picture'}</button>
      {current && !file && <button type="button" disabled={busy} onClick={() => save(true)} className="text-slate-500 disabled:opacity-50">Remove</button>}
      {file && <><button type="button" disabled={busy} onClick={() => save()} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-white disabled:opacity-50">Save picture</button><button type="button" disabled={busy} onClick={() => { setFile(null); setPreview(''); if (input.current) input.current.value = '' }} className="text-slate-500">Cancel</button></>}
    </div>
    {busy && <p role="status" className="mt-2 flex items-center gap-1 text-xs text-slate-500"><Loader2 size={13} className="animate-spin" /> Updating picture…</p>}
    <p className="mt-2 text-[11px] text-slate-400">JPEG, PNG or WebP · Maximum 5 MB</p>
    {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}{message && <p role="status" className="mt-2 text-xs text-emerald-700">{message}</p>}
  </div>
}
