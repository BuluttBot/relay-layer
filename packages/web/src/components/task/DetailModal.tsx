'use client';
import { useTaskStore } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';
import { useAgentStore } from '@/stores/agentStore';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { PRIORITY_COLORS } from '@/lib/constants';
import { formatDate, timeAgo } from '@/lib/formatters';
import { Clock, User, FolderOpen, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DetailModal() {
  const task = useTaskStore(s => s.selectedTask);
  const open = useUIStore(s => s.taskDetailOpen);
  const close = useUIStore(s => s.close);
  const agents = useAgentStore(s => s.agents);
  const agent = task ? agents.find(a => a.id === task.assigned_to) : null;

  if (!task) return null;

  return (
    <Modal open={open} onClose={() => close('taskDetailOpen')} title={task.title} wide>
      <div className="space-y-6">
        {/* Header info */}
        <div className="flex flex-wrap gap-3 items-center">
          <Badge color={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
          <span className="text-sm text-text-secondary capitalize">{task.status.replace('_', ' ')}</span>
          {agent && (
            <span className="text-sm text-text-secondary flex items-center gap-1">
              <User size={14} /> {agent.avatar} {agent.name}
            </span>
          )}
          <span className="text-sm text-text-tertiary flex items-center gap-1">
            <Clock size={14} /> {formatDate(task.created_at)}
          </span>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-secondary">Progress</span>
            <span className="text-text-primary font-medium">{task.progress}%</span>
          </div>
          <div className="w-full h-2 bg-bg-surface rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-accent-teal transition-all" style={{ width: `${task.progress}%` }} />
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-2">Description</h4>
            <p className="text-sm text-text-primary leading-relaxed">{task.description}</p>
          </div>
        )}

        {/* Logs */}
        {task.logs && task.logs.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-3">Activity Log</h4>
            <div className="space-y-3">
              {task.logs.map((log: any) => (
                <div key={log.id} className="flex gap-3 text-sm">
                  <div className="w-1.5 rounded-full bg-accent-purple shrink-0 mt-1" style={{ minHeight: 16 }} />
                  <div className="flex-1">
                    <p className="text-text-primary">{log.message}</p>
                    <div className="flex gap-3 mt-1 text-xs text-text-tertiary">
                      {log.stage && <span className="capitalize">{log.stage}</span>}
                      <span>{timeAgo(log.created_at)}</span>
                      {log.progress !== null && <span>{log.progress}%</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subtasks */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-2">Sub-tasks</h4>
            <div className="space-y-2">
              {task.subtasks.map((sub: any) => (
                <div key={sub.id} className="flex items-center gap-2 p-2 bg-bg-surface rounded-lg text-sm">
                  {sub.status === 'published' ? (
                    <CheckCircle2 size={16} className="text-accent-teal" />
                  ) : (
                    <AlertCircle size={16} className="text-text-tertiary" />
                  )}
                  <span className="text-text-primary">{sub.title}</span>
                  <Badge color={PRIORITY_COLORS[sub.priority]} className="ml-auto">{sub.priority}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {task.tags.map((tag: string) => (
              <span key={tag} className="text-xs px-2 py-1 rounded-lg bg-bg-surface text-text-secondary">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
