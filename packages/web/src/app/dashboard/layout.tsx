'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { useAgentStore } from '@/stores/agentStore';
import { useEventStore } from '@/stores/eventStore';
import Spinner from '@/components/ui/Spinner';
import Header from '@/components/layout/Header';
import AgentsSidebar from '@/components/sidebar/AgentsSidebar';
import ActivitySidebar from '@/components/sidebar/ActivitySidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authenticated, loading, checkAuth } = useAuthStore();
  const fetchProjects = useProjectStore(s => s.fetchProjects);
  const fetchAgents = useAgentStore(s => s.fetchAgents);
  const fetchEvents = useEventStore(s => s.fetchEvents);

  useEffect(() => {
    checkAuth().then(ok => {
      if (!ok) router.push('/');
      else {
        fetchProjects();
        fetchAgents();
        fetchEvents();
      }
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (!authenticated) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <AgentsSidebar />
        <main className="flex-1 overflow-hidden relative">{children}</main>
        <ActivitySidebar />
      </div>
    </div>
  );
}
