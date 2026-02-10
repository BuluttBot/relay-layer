'use client';
import { useAgentStore } from '@/stores/agentStore';
import { useUIStore } from '@/stores/uiStore';
import AgentCard from './AgentCard';
import { Users, X } from 'lucide-react';

export default function AgentsSidebar() {
  const agents = useAgentStore(s => s.agents);
  const open = useUIStore(s => s.agentsSidebarOpen);
  const close = useUIStore(s => s.close);

  if (!open) return null;

  return (
    <aside className="w-72 border-r border-border-subtle bg-bg-primary flex flex-col shrink-0 h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-text-secondary" />
          <span className="text-sm font-medium text-text-primary">Agents</span>
          <span className="text-xs text-text-tertiary bg-bg-surface px-1.5 py-0.5 rounded-full">{agents.length}</span>
        </div>
        <button onClick={() => close('agentsSidebarOpen')} className="p-1 rounded hover:bg-bg-tertiary transition-fast">
          <X size={14} className="text-text-tertiary" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {agents.map(agent => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </aside>
  );
}
