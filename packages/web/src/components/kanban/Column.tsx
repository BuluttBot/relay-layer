'use client';
import type { Task } from '@/stores/taskStore';
import Card from './Card';

interface ColumnProps {
  label: string;
  color: string;
  tasks: Task[];
  onCardClick: (task: Task) => void;
}

export default function Column({ label, color, tasks, onCardClick }: ColumnProps) {
  return (
    <div className="flex flex-col w-[calc(100vw-2rem)] md:min-w-[280px] md:max-w-[320px] md:flex-1 md:w-auto snap-center shrink-0">
      <div className="flex items-center gap-2 px-3 py-2 mb-3">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{label}</h3>
        <span className="text-xs text-text-tertiary ml-auto bg-bg-surface px-2 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto px-1 pb-4">
        {tasks.map(task => (
          <Card key={task.id} task={task} onClick={() => onCardClick(task)} />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-text-tertiary text-xs">No tasks</div>
        )}
      </div>
    </div>
  );
}
