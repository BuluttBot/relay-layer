'use client';
import type { Task } from '@/stores/taskStore';
import Badge from '@/components/ui/Badge';
import { PRIORITY_COLORS } from '@/lib/constants';
import { timeAgo } from '@/lib/formatters';
import { useAgentStore } from '@/stores/agentStore';

interface CardProps {
  task: Task;
  onClick: () => void;
}

export default function Card({ task, onClick }: CardProps) {
  const agents = useAgentStore(s => s.agents);
  const agent = agents.find(a => a.id === task.assigned_to);

  return (
    <div
      onClick={onClick}
      className="bg-bg-secondary border border-border-subtle rounded-card p-4 cursor-pointer hover:border-border-strong hover:shadow-card transition-normal group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-text-primary group-hover:text-accent-purple transition-fast line-clamp-2">
          {task.title}
        </h4>
        <Badge color={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
      </div>

      {task.progress > 0 && task.progress < 100 && (
        <div className="w-full h-1.5 bg-bg-surface rounded-full mb-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent-teal transition-all duration-500"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-text-tertiary">
        <div className="flex items-center gap-1.5">
          {agent && (
            <span className="text-text-secondary">
              {agent.avatar || '🤖'} {agent.name}
            </span>
          )}
        </div>
        <span>{timeAgo(task.updated_at)}</span>
      </div>

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-bg-surface text-text-tertiary">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
