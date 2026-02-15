'use client';
import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';
import { useEventStore } from '@/stores/eventStore';
import { useAuthStore } from '@/stores/authStore';
import { Radio, BarChart3, MessageCircle, Activity, Users, LogOut, ChevronDown, Settings, PieChart } from 'lucide-react';
import ProjectManagementModal from '@/components/modals/ProjectManagementModal';

export default function Header() {
  const toggle = useUIStore(s => s.toggle);
  const unreadCount = useEventStore(s => s.unreadCount);
  const logout = useAuthStore(s => s.logout);
  const { projects, activeProjectId, setActiveProject } = useProjectStore();
  const activeProject = projects.find(p => p.id === activeProjectId);
  const [projectManagementOpen, setProjectManagementOpen] = useState(false);

  return (
    <>
      <ProjectManagementModal 
        isOpen={projectManagementOpen}
        onClose={() => setProjectManagementOpen(false)}
      />
    <header className="h-14 border-b border-border-subtle bg-bg-secondary flex items-center px-2 md:px-4 gap-2 md:gap-4 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-base md:text-lg font-bold text-text-primary">
          <span className="text-accent-purple">R</span>elay laye<span className="text-accent-purple">R</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg bg-bg-tertiary hover:bg-bg-surface text-xs md:text-sm text-text-primary transition-fast min-h-[44px] md:min-h-0">
            <span className="hidden sm:inline">{activeProject?.icon}</span> 
            <span className="hidden sm:inline">{activeProject?.name || 'Select Project'}</span>
            <span className="sm:hidden">{activeProject?.icon}</span>
            <ChevronDown size={14} className="text-text-tertiary" />
          </button>
          <div className="absolute top-full left-0 mt-1 bg-bg-secondary border border-border rounded-lg shadow-modal py-1 hidden group-hover:block z-50 min-w-[200px]">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveProject(p.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-bg-tertiary transition-fast ${p.id === activeProjectId ? 'text-accent-purple' : 'text-text-primary'}`}
              >
                {p.icon} {p.name}
              </button>
            ))}
          </div>
        </div>
        
        <button 
          onClick={() => setProjectManagementOpen(true)}
          className="p-2 rounded-lg hover:bg-bg-tertiary text-text-tertiary hover:text-accent-purple transition-fast"
          title="Manage Projects"
        >
          <Settings size={16} />
        </button>
      </div>

      <div className="flex-1" />

      {/* Desktop actions */}
      <div className="hidden md:flex items-center gap-1">
        <button onClick={() => toggle('broadcastModalOpen')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-purple/10 hover:bg-accent-purple/20 text-accent-purple text-sm font-medium transition-fast">
          <Radio size={14} /> Broadcast
        </button>

        <button onClick={() => toggle('chatViewerOpen')} className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-accent-blue transition-fast" title="Chat Viewer">
          <MessageCircle size={18} />
        </button>

        <button onClick={() => toggle('statsOpen')} className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-accent-purple transition-fast" title="Statistics">
          <BarChart3 size={18} />
        </button>

        <button onClick={() => toggle('reportsOpen')} className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-accent-teal transition-fast" title="Reports">
          <PieChart size={18} />
        </button>

        <button onClick={() => toggle('activitySidebarOpen')} className="relative p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-accent-amber transition-fast" title="Activity">
          <Activity size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-accent-red text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <button onClick={() => toggle('agentsSidebarOpen')} className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-accent-teal transition-fast" title="Members">
          <Users size={18} />
        </button>

        <button onClick={logout} className="p-2 rounded-lg hover:bg-bg-tertiary text-text-tertiary hover:text-accent-red transition-fast ml-2" title="Logout">
          <LogOut size={18} />
        </button>
      </div>

      {/* Mobile actions - compact icons only */}
      <div className="flex md:hidden items-center gap-1">
        <button onClick={() => toggle('broadcastModalOpen')} className="p-2 rounded-lg bg-accent-purple/10 hover:bg-accent-purple/20 text-accent-purple transition-fast min-h-[44px] min-w-[44px] flex items-center justify-center" title="Broadcast">
          <Radio size={18} />
        </button>

        <button onClick={() => toggle('activitySidebarOpen')} className="relative p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-accent-amber transition-fast min-h-[44px] min-w-[44px] flex items-center justify-center" title="Activity">
          <Activity size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-accent-red text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <button onClick={() => toggle('agentsSidebarOpen')} className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-accent-teal transition-fast min-h-[44px] min-w-[44px] flex items-center justify-center" title="Members">
          <Users size={18} />
        </button>
      </div>
    </header>
    </>
  );
}
