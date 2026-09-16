'use client'

import { Loader2, MessageCircle, Send, Sparkles } from 'lucide-react'
import type { RefObject } from 'react'
import type { IMessages } from '@/models/message.model'

type Props = {
  title: string
  messages: IMessages[]
  currentUserId?: string
  message: string
  onMessageChange: (value: string) => void
  onSend: () => void
  suggestions: string[]
  onSuggest: () => void
  suggesting: boolean
  closed?: boolean
  chatRef: RefObject<HTMLDivElement | null>
}

export default function OrderChatPanel({ title, messages, currentUserId, message, onMessageChange, onSend, suggestions, onSuggest, suggesting, closed = false, chatRef }: Props) {
  return (
    <section aria-label={title} className="flex h-[460px] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><MessageCircle size={20} /></span>
          <div><h2 className="text-sm font-semibold text-slate-900">{title}</h2><p className="mt-0.5 text-xs text-slate-500">{closed ? 'Conversation history' : 'Coordinate a smooth delivery'}</p></div>
        </div>
        {!closed && <button type="button" disabled={suggesting} onClick={onSuggest} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50">
          {suggesting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Quick replies
        </button>}
      </header>
      {!closed && suggestions.length > 0 && <div className="flex max-h-28 shrink-0 flex-wrap gap-2 overflow-y-auto border-b border-slate-100 px-4 py-3">
        {suggestions.map((suggestion, index) => <button type="button" key={`${index}-${suggestion}`} onClick={() => onMessageChange(suggestion)} className="rounded-xl border border-slate-200 px-3 py-2 text-left text-xs text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50">{suggestion}</button>)}
      </div>}
      <div ref={chatRef} role="log" aria-label="Messages" aria-live="polite" className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4 sm:p-5">
        {messages.length === 0 && <div className="flex h-full flex-col items-center justify-center gap-2 text-center"><MessageCircle size={28} className="text-emerald-600" /><p className="text-sm font-medium text-slate-700">No messages yet</p><p className="max-w-56 text-xs leading-5 text-slate-500">{closed ? 'There are no messages for this delivery.' : 'Send a message about your delivery or choose a quick reply.'}</p></div>}
        {messages.map((item, index) => {
          const own = item.senderId?.toString() === currentUserId
          return <div key={item._id?.toString() ?? `${item.senderId}-${index}`} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${own ? 'rounded-br-md bg-emerald-700 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'}`}>
              <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{item.text}</p>
              <p className={`mt-1.5 text-right text-[10px] ${own ? 'text-emerald-100' : 'text-slate-500'}`}>{item.time}</p>
            </div>
          </div>
        })}
      </div>
      {closed ? <p className="border-t border-slate-100 px-4 py-4 text-center text-xs text-slate-500">Delivery completed. This conversation is closed.</p> : (
        <form onSubmit={event => { event.preventDefault(); onSend() }} className="flex shrink-0 gap-2 border-t border-slate-100 p-3 sm:p-4">
          <input aria-label="Message" placeholder="Write a message…" value={message} onChange={event => onMessageChange(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
          <button type="submit" aria-label="Send message" disabled={!message.trim() || !currentUserId} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"><Send size={18} /></button>
        </form>
      )}
    </section>
  )
}
