'use client';
import { useTaskStore, getTasksByStatus } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';
import Column from './Column';
import { COLUMN_CONFIG } from '@/lib/constants';
import type { Task } from '@/stores/taskStore';

export default function Board() {
  const tasks = useTaskStore(s => s.tasks);
  const selectTask = useTaskStore(s => s.selectTask);
  const fetchTask = useTaskStore(s => s.fetchTask);
  const toggle = useUIStore(s => s.toggle);
  const grouped = getTasksByStatus(tasks);

  const handleCardClick = (task: Task) => {
    fetchTask(task.id);
    toggle('taskDetailOpen');
  };

  return (
    <div className="flex gap-4 overflow-x-auto h-full px-4 py-4">
      {COLUMN_CONFIG.map(col => (
        <Column
          key={col.key}
          label={col.label}
          color={col.color}
          tasks={grouped[col.key] || []}
          onCardClick={handleCardClick}
        />
      ))}
    </div>
  );
}
