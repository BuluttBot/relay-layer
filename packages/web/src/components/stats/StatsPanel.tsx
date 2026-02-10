'use client';
import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { api } from '@/lib/api';
import { formatCost } from '@/lib/formatters';
import { BarChart3, TrendingUp, Users, Layers, X } from 'lucide-react';

interface Overview {
  total_tasks: number;
  completed_tasks: number;
  active_tasks: number;
  completion_rate: number;
  active_agents: number;
  total_cost: number;
}

interface AgentStat {
  agent_id: string;
  agent_name: string;
  tasks_completed: number;
  tasks_in_progress: number;
  total_cost: number;
}

export default function StatsPanel() {
  const open = useUIStore(s => s.statsOpen);
  const close = useUIStore(s => s.close);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [agentStats, setAgentStats] = useState<AgentStat[]>([]);

  useEffect(() => {
    if (open) {
      api.get<Overview>('/stats/overview').then(setOverview).catch(() => {});
      api.get<AgentStat[]>('/stats/agents').then(setAgentStats).catch(() => {});
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-30 bg-bg-primary/95 backdrop-blur-sm overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <BarChart3 size={22} className="text-accent-purple" /> Statistics
          </h2>
          <button onClick={() => close('statsOpen')} className="p-2 rounded-lg hover:bg-bg-tertiary transition-fast">
            <X size={18} className="text-text-secondary" />
          </button>
        </div>

        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Tasks', value: overview.total_tasks, icon: <Layers size={18} />, color: 'text-accent-purple' },
              { label: 'Completed', value: overview.completed_tasks, icon: <TrendingUp size={18} />, color: 'text-accent-teal' },
              { label: 'Active Agents', value: overview.active_agents, icon: <Users size={18} />, color: 'text-accent-blue' },
              { label: 'Total Cost', value: formatCost(overview.total_cost), icon: <BarChart3 size={18} />, color: 'text-accent-amber' },
            ].map(card => (
              <div key={card.label} className="bg-bg-secondary border border-border-subtle rounded-xl p-4">
                <div className={`${card.color} mb-2`}>{card.icon}</div>
                <div className="text-2xl font-bold text-text-primary">{card.value}</div>
                <div className="text-xs text-text-tertiary mt-1">{card.label}</div>
              </div>
            ))}
          </div>
        )}

        {overview && (
          <div className="bg-bg-secondary border border-border-subtle rounded-xl p-4 mb-8">
            <h3 className="text-sm font-medium text-text-secondary mb-3">Completion Rate</h3>
            <div className="w-full h-3 bg-bg-surface rounded-full overflow-hidden">
              <div className="h-full bg-accent-teal rounded-full transition-all" style={{ width: `${overview.completion_rate}%` }} />
            </div>
            <div className="text-right text-sm text-text-primary mt-1">{overview.completion_rate}%</div>
          </div>
        )}

        <div className="bg-bg-secondary border border-border-subtle rounded-xl p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Agent Performance</h3>
          <div className="space-y-3">
            {agentStats.map(stat => (
              <div key={stat.agent_id} className="flex items-center gap-4 text-sm">
                <span className="w-32 text-text-primary font-medium truncate">{stat.agent_name}</span>
                <div className="flex-1 h-2 bg-bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-purple rounded-full"
                    style={{ width: `${Math.min(stat.tasks_completed * 10, 100)}%` }}
                  />
                </div>
                <span className="text-text-secondary w-20 text-right">{stat.tasks_completed} done</span>
                <span className="text-text-tertiary w-20 text-right">{formatCost(stat.total_cost)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
