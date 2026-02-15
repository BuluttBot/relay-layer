'use client';
import { useState, useMemo } from 'react';
import { useAgentStore, type Agent } from '@/stores/agentStore';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import AgentCard from './AgentCard';
import AgentDetailsModal from '../modals/AgentDetailsModal';
import { Users, X } from 'lucide-react';

export default function AgentsSidebar() {
  const agents = useAgentStore(s => s.agents);
  const { projects, activeProjectId } = useProjectStore();
  const open = useUIStore(s => s.agentsSidebarOpen);
  const close = useUIStore(s => s.close);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId),
    [projects, activeProjectId]
  );

  const filteredAgents = useMemo(() => {
    if (!activeProject) return agents;
    return agents.filter(agent => activeProject.agents.includes(agent.id));
  }, [agents, activeProject]);

  if (!open) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div 
        className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={() => close('agentsSidebarOpen')}
      />
      
      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-50 md:z-0
        w-72 md:w-72 
        left-0 md:left-auto
        top-0 bottom-0
        border-r border-border-subtle bg-bg-primary 
        flex flex-col shrink-0 h-full overflow-hidden
        transition-transform duration-300 ease-out
        md:translate-x-0
      `}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">Members</span>
            <span className="text-xs text-text-tertiary bg-bg-surface px-1.5 py-0.5 rounded-full">{filteredAgents.length}</span>
          </div>
          <button 
            onClick={() => close('agentsSidebarOpen')} 
            className="p-2 rounded-lg hover:bg-bg-tertiary transition-fast min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={18} className="text-text-tertiary" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredAgents.length > 0 ? (
            filteredAgents.map(agent => (
              <AgentCard 
                key={agent.id} 
                agent={agent} 
                onClick={() => setSelectedAgent(agent)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-text-tertiary text-sm">
              No members in this project
            </div>
          )}
        </div>
      </aside>

      <AgentDetailsModal 
        agent={selectedAgent}
        isOpen={!!selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </>
  );
}
