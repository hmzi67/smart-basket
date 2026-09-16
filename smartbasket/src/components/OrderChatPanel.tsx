'use client'

import { Loader2, Send, Sparkles } from 'lucide-react'
import type { RefObject } from 'react'
import type { IMessages } from '@/models/message.model'

type Props = {
  variant?: 'customer' | 'rider'
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

export default function OrderChatPanel({ title, variant = 'rider', messages, currentUserId, message, onMessageChange, onSend, suggestions, onSuggest, suggesting, closed = false, chatRef }: Props) {
  const customer = variant === 'customer'
  return (
    <section aria-label={title} className={customer ? 'w-full min-w-0' : 'w-full min-w-0 rounded-xl border border-gray-400 bg-white p-3 shadow-md'}>
      <header className="mb-2 flex items-center justify-between gap-2">
        <h2 className={customer ? 'text-base font-bold text-gray-900' : 'text-xs font-medium text-gray-800'}>{title}</h2>
        {!closed && <button type="button" disabled={suggesting} onClick={onSuggest} className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] disabled:opacity-50 ${customer ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>
          {suggesting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          {customer ? 'AI Help' : 'AI Suggest'}
        </button>}
      </header>
      {!closed && suggestions.length > 0 && <div className="mb-3 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
        {suggestions.map((suggestion, index) => <button type="button" key={`${index}-${suggestion}`} onClick={() => onMessageChange(suggestion)} className="rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-left text-[11px] text-green-700 hover:bg-green-100">{suggestion}</button>)}
      </div>}
      <div className={`flex flex-col overflow-hidden bg-white ${customer ? 'h-[400px] rounded-2xl border border-gray-400' : 'h-[300px]'}`}>
        <div ref={chatRef} role="log" aria-label="Messages" aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          {messages.map((item, index) => {
            const own = item.senderId?.toString() === currentUserId
            return <div key={item._id?.toString() ?? `${item.senderId}-${index}`} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${own ? 'rounded-br-none bg-green-600 text-white' : 'rounded-bl-none bg-gray-100 text-gray-800'}`}>
                <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{item.text}</p>
                <p className={`mt-1 text-right text-[10px] ${own ? 'text-green-100' : 'text-gray-500'}`}>{item.time}</p>
              </div>
            </div>
          })}
        </div>
        {closed ? <p className="border-t border-gray-300 p-3 text-center text-xs text-gray-500">Delivery completed. This conversation is closed.</p> : (
          <form onSubmit={event => { event.preventDefault(); if (message.trim() && currentUserId) onSend() }} className="mx-2 flex shrink-0 items-center gap-2 border-t border-gray-400 py-2">
            <input aria-label="Message" placeholder="Type a message..." value={message} onChange={event => onMessageChange(event.target.value)} className="min-w-0 flex-1 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-green-200" />
            <button type="submit" aria-label="Send message" disabled={!message.trim() || !currentUserId} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"><Send size={17} /></button>
          </form>
        )}
      </div>
    </section>
  )
}
