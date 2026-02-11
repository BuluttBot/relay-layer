'use client';
import { useEventStore } from '@/stores/eventStore';
import { useUIStore } from '@/stores/uiStore';
import { Activity, X } from 'lucide-react';
import { timeAgo } from '@/lib/formatters';

const TYPE_ICONS: Record<string, string> = {
  'task.created': '📋', 'task.assigned': '📌', 'task.started': '▶️', 'task.progress': '📊',
  'task.completed': '✅', 'task.review_passed': '👍', 'task.review_failed': '🔄',
  'task.approved': '🎉', 'agent.online': '🟢', 'agent.offline': '🔴',
  'system.broadcast': '📡', 'comms.message': '💬',
};

export default function ActivitySidebar() {
  const events = useEventStore(s => s.events);
  const open = useUIStore(s => s.activitySidebarOpen);
  const close = useUIStore(s => s.close);
  const markRead = useEventStore(s => s.markRead);

  if (!open) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div 
        className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={() => { close('activitySidebarOpen'); markRead(); }}
      />

      <aside className={`
        fixed md:relative z-50 md:z-0
        w-80 md:w-80
        right-0 md:right-auto
        top-0 bottom-0
        border-l border-border-subtle bg-bg-primary 
        flex flex-col shrink-0 h-full overflow-hidden
        transition-transform duration-300 ease-out
        md:translate-x-0
      `}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">Activity</span>
          </div>
          <button 
            onClick={() => { close('activitySidebarOpen'); markRead(); }} 
            className="p-2 rounded-lg hover:bg-bg-tertiary transition-fast min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={18} className="text-text-tertiary" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-center py-12 text-text-tertiary text-sm">No events yet</div>
          ) : (
            events.map(event => (
              <div key={event.id} className="flex gap-3 px-4 py-3 border-b border-border-subtle hover:bg-bg-tertiary/30 transition-fast">
                <span className="text-base shrink-0 mt-0.5">{TYPE_ICONS[event.type] || '📎'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">
                    <span className="font-medium">{event.source_agent_name}</span>
                    {' '}
                    <span className="text-text-secondary">{event.type.split('.')[1]?.replace('_', ' ')}</span>
                  </p>
                  {event.payload?.title && (
                    <p className="text-xs text-text-secondary mt-0.5 truncate">{event.payload.title as string}</p>
                  )}
                  <p className="text-xs text-text-tertiary mt-1">{timeAgo(event.timestamp)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
