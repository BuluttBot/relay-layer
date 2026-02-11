'use client';
import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/formatters';
import { MessageCircle, X } from 'lucide-react';

interface Message {
  id: string;
  from_agent_id: string;
  from_agent_name: string;
  to_agent_id: string;
  to_agent_name: string;
  content: string;
  created_at: string;
}

export default function ChatViewer() {
  const open = useUIStore(s => s.chatViewerOpen);
  const close = useUIStore(s => s.close);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (open) {
      api.get<Message[]>('/comms?limit=100').then(setMessages).catch(() => {});
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-30 bg-bg-primary/95 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border-subtle">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <MessageCircle size={20} className="text-accent-blue" />
          Chat Viewer
          <span className="text-xs text-text-tertiary font-normal ml-2 hidden sm:inline">powered by Telegram</span>
        </h2>
        <button onClick={() => close('chatViewerOpen')} className="p-2 rounded-lg hover:bg-bg-tertiary transition-fast min-h-[44px] min-w-[44px] flex items-center justify-center">
          <X size={18} className="text-text-secondary" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-3xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-text-tertiary">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
            <p>No messages yet</p>
            <p className="text-sm mt-1">Agent communications will appear here</p>
          </div>
        ) : (
          messages.map(msg => {
            const isOrchestrator = msg.from_agent_id === 'bulut';
            return (
              <div key={msg.id} className={`flex ${isOrchestrator ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${isOrchestrator ? 'bg-accent-purple/20 rounded-tr-sm' : 'bg-bg-secondary border border-border-subtle rounded-tl-sm'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-text-secondary">{msg.from_agent_name}</span>
                    <span className="text-xs text-text-tertiary">→ {msg.to_agent_name}</span>
                  </div>
                  <p className="text-sm text-text-primary leading-relaxed">{msg.content}</p>
                  <p className="text-xs text-text-tertiary mt-1 text-right">{timeAgo(msg.created_at)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
