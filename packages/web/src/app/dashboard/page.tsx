'use client';
import { useEffect } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import { useEventStore } from '@/stores/eventStore';
import { useAgentStore } from '@/stores/agentStore';
import { onWsMessage } from '@/lib/ws';
import Board from '@/components/kanban/Board';
import DetailModal from '@/components/task/DetailModal';
import BroadcastModal from '@/components/broadcast/BroadcastModal';
import StatsPanel from '@/components/stats/StatsPanel';
import ReportsModal from '@/components/modals/ReportsModal';
import ChatViewer from '@/components/chat/ChatViewer';

export default function DashboardPage() {
  const fetchTasks = useTaskStore(s => s.fetchTasks);
  const updateTaskLocal = useTaskStore(s => s.updateTaskLocal);
  const activeProjectId = useProjectStore(s => s.activeProjectId);
  const pushEvent = useEventStore(s => s.pushEvent);
  const updateAgentLocal = useAgentStore(s => s.updateAgentLocal);

  useEffect(() => {
    if (activeProjectId) fetchTasks(activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    const unsub = onWsMessage((msg: any) => {
      if (msg.type === 'task_update' && msg.data) updateTaskLocal(msg.data);
      if (msg.type === 'event' && msg.data) pushEvent(msg.data);
      if (msg.type === 'agent_status' && msg.data) updateAgentLocal(msg.data.agentId, { status: msg.data.status });
    });
    return unsub;
  }, []);

  return (
    <>
      <Board />
      <DetailModal />
      <BroadcastModal />
      <StatsPanel />
      <ReportsModal />
      <ChatViewer />
    </>
  );
}
