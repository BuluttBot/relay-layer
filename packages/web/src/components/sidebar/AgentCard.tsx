'use client';
import type { Agent } from '@/stores/agentStore';
import { STATUS_COLORS } from '@/lib/constants';
import { timeAgo } from '@/lib/formatters';

export default function AgentCard({ agent, onClick }: { agent: Agent; onClick?: () => void }) {
  return (
    <div 
      className="p-3 rounded-xl bg-bg-secondary border border-border-subtle hover:border-border transition-fast cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl bg-bg-surface shrink-0">
          {agent.avatar || '🤖'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-sm text-text-primary truncate">{agent.name}</span>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[agent.status] || STATUS_COLORS.offline }} title={agent.status} />
            </div>
            {agent.updated_at && (
              <span className="text-[10px] text-text-tertiary whitespace-nowrap shrink-0">{timeAgo(agent.updated_at)}</span>
            )}
          </div>
          {agent.title && (
            <p className="text-xs text-text-secondary mt-0.5 truncate">
              {agent.title} {agent.tag && <span className="text-text-tertiary">· {agent.tag}</span>}
            </p>
          )}
          {agent.current_task_title ? (
            <p className="text-xs text-accent-teal mt-1 truncate">📌 {agent.current_task_title}</p>
          ) : (
             <p className="text-[10px] text-text-tertiary mt-1 italic">Idle</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary">
            <span>✅ {agent.tasks_completed}</span>
            {agent.model && <span className="truncate">{agent.model.split('/').pop()?.split('-').slice(0, 2).join('-')}</span>}
          </div>
        </div>
      </div>
      {agent.skills && agent.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {agent.skills.slice(0, 4).map(skill => (
            <span key={skill} className="text-[10px] px-1.5 py-0.5 rounded bg-bg-surface text-text-tertiary">{skill}</span>
          ))}
        </div>
      )}
    </div>
  );
}
