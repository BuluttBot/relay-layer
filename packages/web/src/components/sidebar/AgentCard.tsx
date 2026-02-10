'use client';
import type { Agent } from '@/stores/agentStore';
import { STATUS_COLORS } from '@/lib/constants';

export default function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div className="p-3 rounded-xl bg-bg-secondary border border-border-subtle hover:border-border transition-fast">
      <div className="flex items-start gap-3">
        <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl bg-bg-surface shrink-0">
          {agent.avatar || '🤖'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-text-primary truncate">{agent.name}</span>
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[agent.status] || STATUS_COLORS.offline }} />
          </div>
          {agent.title && (
            <p className="text-xs text-text-secondary mt-0.5">
              {agent.title} {agent.tag && <span className="text-text-tertiary">· {agent.tag}</span>}
            </p>
          )}
          {agent.current_task_title && (
            <p className="text-xs text-accent-teal mt-1 truncate">📌 {agent.current_task_title}</p>
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
