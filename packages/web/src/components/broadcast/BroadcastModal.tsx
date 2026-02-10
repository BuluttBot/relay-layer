'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTaskStore } from '@/stores/taskStore';
import { api } from '@/lib/api';
import { Radio } from 'lucide-react';

export default function BroadcastModal() {
  const open = useUIStore(s => s.broadcastModalOpen);
  const close = useUIStore(s => s.close);
  const activeProjectId = useProjectStore(s => s.activeProjectId);
  const fetchTasks = useTaskStore(s => s.fetchTasks);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('medium');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId || !title || !pin) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/tasks', { project_id: activeProjectId, title, description: desc || undefined, priority, pin });
      await fetchTasks(activeProjectId);
      setTitle(''); setDesc(''); setPriority('medium'); setPin('');
      close('broadcastModalOpen');
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <Modal open={open} onClose={() => close('broadcastModalOpen')} title="📡 Broadcast New Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-text-secondary block mb-1">Title</label>
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-purple transition-fast"
            placeholder="What needs to be done?"
            autoFocus
          />
        </div>
        <div>
          <label className="text-sm text-text-secondary block mb-1">Description</label>
          <textarea
            value={desc} onChange={e => setDesc(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-purple transition-fast resize-none"
            placeholder="Details..."
          />
        </div>
        <div>
          <label className="text-sm text-text-secondary block mb-1">Priority</label>
          <select
            value={priority} onChange={e => setPriority(e.target.value)}
            className="w-full px-3 py-2 bg-bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-purple"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-text-secondary block mb-1">Confirm PIN</label>
          <input
            type="password" value={pin} onChange={e => setPin(e.target.value)}
            maxLength={4}
            className="w-full px-3 py-2 bg-bg-surface border border-border rounded-lg text-sm text-center tracking-widest text-text-primary focus:outline-none focus:border-accent-purple transition-fast"
            placeholder="••••"
          />
        </div>
        {error && <p className="text-accent-red text-sm">{error}</p>}
        <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={!title || pin.length !== 4 || loading}>
          <Radio size={16} /> {loading ? 'Broadcasting...' : 'Broadcast'}
        </Button>
      </form>
    </Modal>
  );
}
