'use client';
import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { api } from '@/lib/api';
import { formatCost } from '@/lib/formatters';
import { 
  X, TrendingUp, Clock, AlertCircle, Zap, 
  Users, DollarSign, Activity, BarChart3,
  PieChart, Target, Gauge
} from 'lucide-react';

interface ProjectHealthReport {
  project_id: string;
  project_name: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  blocked_tasks: number;
  completion_rate: number;
  avg_task_duration_hours: number;
  velocity_per_week: number;
  bottleneck_status?: string;
  active_agents: number;
  total_cost: number;
}

interface AgentPerformanceReport {
  agent_id: string;
  agent_name: string;
  status: string;
  tasks_completed: number;
  tasks_in_progress: number;
  tasks_blocked: number;
  avg_completion_time_hours: number;
  avg_response_time_hours: number;
  workload_score: number;
  total_cost: number;
  avg_cost_per_task: number;
  token_efficiency: number;
  recent_activity: string;
}

interface TokenAnalytics {
  by_project: Array<{
    project_id: string;
    project_name: string;
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    total_cost: number;
    avg_cost_per_task: number;
  }>;
  by_agent: Array<{
    agent_id: string;
    agent_name: string;
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    total_cost: number;
    efficiency: number;
  }>;
  by_model: Array<{
    model: string;
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    total_cost: number;
    usage_count: number;
  }>;
  timeline: Array<{
    date: string;
    total_tokens: number;
    total_cost: number;
  }>;
}

type TabType = 'project-health' | 'agent-performance' | 'token-analytics';

export default function ReportsModal() {
  const open = useUIStore(s => s.reportsOpen);
  const close = useUIStore(s => s.close);
  const [activeTab, setActiveTab] = useState<TabType>('project-health');
  const [range, setRange] = useState<string>('7');
  
  const [projectHealth, setProjectHealth] = useState<ProjectHealthReport[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformanceReport[]>([]);
  const [tokenAnalytics, setTokenAnalytics] = useState<TokenAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, activeTab, range]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === 'project-health') {
        const data = await api.get<ProjectHealthReport[]>('/stats/reports/project-health');
        setProjectHealth(data);
      } else if (activeTab === 'agent-performance') {
        const data = await api.get<AgentPerformanceReport[]>('/stats/reports/agent-performance');
        setAgentPerformance(data);
      } else if (activeTab === 'token-analytics') {
        const data = await api.get<TokenAnalytics>(`/stats/reports/token-analytics?range=${range}`);
        setTokenAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const tabs: Array<{ id: TabType; label: string; icon: any }> = [
    { id: 'project-health', label: 'Project Health', icon: Target },
    { id: 'agent-performance', label: 'Agent Performance', icon: Users },
    { id: 'token-analytics', label: 'Token Analytics', icon: DollarSign },
  ];

  return (
    <div className="absolute inset-0 z-40 bg-bg-primary/95 backdrop-blur-sm overflow-y-auto p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <BarChart3 size={22} className="text-accent-purple" />
            Enhanced Reports
          </h2>
          <button 
            onClick={() => close('reportsOpen')} 
            className="p-2 rounded-lg hover:bg-bg-tertiary transition-fast min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={18} className="text-text-secondary" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-fast flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-accent-purple text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Range Selector for Token Analytics */}
        {activeTab === 'token-analytics' && (
          <div className="flex gap-2 mb-6">
            {[
              { value: '7', label: '7 Days' },
              { value: '30', label: '30 Days' },
              { value: '90', label: '90 Days' },
            ].map(r => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1 rounded text-xs font-medium transition-fast ${
                  range === r.value
                    ? 'bg-accent-teal text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent-purple border-t-transparent" />
          </div>
        ) : (
          <>
            {activeTab === 'project-health' && <ProjectHealthView data={projectHealth} />}
            {activeTab === 'agent-performance' && <AgentPerformanceView data={agentPerformance} />}
            {activeTab === 'token-analytics' && tokenAnalytics && <TokenAnalyticsView data={tokenAnalytics} />}
          </>
        )}
      </div>
    </div>
  );
}

function ProjectHealthView({ data }: { data: ProjectHealthReport[] }) {
  return (
    <div className="space-y-4">
      {data.map(project => (
        <div key={project.project_id} className="bg-bg-secondary border border-border-subtle rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-text-primary">{project.project_name}</h3>
              <p className="text-sm text-text-tertiary">{project.project_id}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-accent-purple">{project.completion_rate}%</div>
              <div className="text-xs text-text-tertiary">Completion</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <MetricCard icon={Target} label="Total Tasks" value={project.total_tasks} color="text-accent-blue" />
            <MetricCard icon={TrendingUp} label="Completed" value={project.completed_tasks} color="text-accent-teal" />
            <MetricCard icon={Activity} label="In Progress" value={project.in_progress_tasks} color="text-accent-amber" />
            <MetricCard icon={AlertCircle} label="Blocked" value={project.blocked_tasks} color="text-accent-red" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <MetricCard icon={Clock} label="Avg Duration" value={`${project.avg_task_duration_hours}h`} color="text-text-secondary" />
            <MetricCard icon={Zap} label="Velocity/Week" value={project.velocity_per_week} color="text-accent-purple" />
            <MetricCard icon={Users} label="Active Agents" value={project.active_agents} color="text-accent-blue" />
            <MetricCard icon={DollarSign} label="Total Cost" value={formatCost(project.total_cost)} color="text-accent-amber" />
          </div>

          {project.bottleneck_status && (
            <div className="bg-bg-tertiary border border-border-subtle rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle size={16} className="text-accent-red" />
                <span className="text-text-secondary">Bottleneck:</span>
                <span className="font-medium text-text-primary">{project.bottleneck_status}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AgentPerformanceView({ data }: { data: AgentPerformanceReport[] }) {
  return (
    <div className="space-y-4">
      {data.map(agent => (
        <div key={agent.agent_id} className="bg-bg-secondary border border-border-subtle rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-text-primary">{agent.agent_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex h-2 w-2 rounded-full ${
                  agent.status === 'active' ? 'bg-accent-teal' : 'bg-text-tertiary'
                }`} />
                <span className="text-sm text-text-tertiary capitalize">{agent.status}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-accent-purple">{agent.tasks_completed}</div>
              <div className="text-xs text-text-tertiary">Tasks Done</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <MetricCard icon={Activity} label="In Progress" value={agent.tasks_in_progress} color="text-accent-amber" />
            <MetricCard icon={AlertCircle} label="Blocked" value={agent.tasks_blocked} color="text-accent-red" />
            <MetricCard icon={Gauge} label="Workload" value={`${agent.workload_score}%`} color="text-accent-blue" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <MetricCard icon={Clock} label="Avg Completion" value={`${agent.avg_completion_time_hours}h`} color="text-text-secondary" />
            <MetricCard icon={Zap} label="Avg Response" value={`${agent.avg_response_time_hours}h`} color="text-text-secondary" />
            <MetricCard icon={DollarSign} label="Total Cost" value={formatCost(agent.total_cost)} color="text-accent-amber" />
            <MetricCard icon={Target} label="Cost/Task" value={formatCost(agent.avg_cost_per_task)} color="text-accent-purple" />
          </div>

          <div className="bg-bg-tertiary border border-border-subtle rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <PieChart size={16} className="text-accent-teal" />
                <span className="text-text-secondary">Token Efficiency:</span>
                <span className="font-medium text-text-primary">{agent.token_efficiency}x</span>
              </div>
              <div className="text-text-tertiary text-xs">
                Last active: {new Date(agent.recent_activity).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TokenAnalyticsView({ data }: { data: TokenAnalytics }) {
  return (
    <div className="space-y-6">
      {/* By Project */}
      <div className="bg-bg-secondary border border-border-subtle rounded-xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <Target size={18} className="text-accent-purple" />
          Token Usage by Project
        </h3>
        <div className="space-y-3">
          {data.by_project.map(p => (
            <div key={p.project_id} className="bg-bg-tertiary border border-border-subtle rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-text-primary">{p.project_name}</span>
                <span className="text-accent-amber font-bold">{formatCost(p.total_cost)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-text-tertiary">Total Tokens</div>
                  <div className="font-medium text-text-secondary">{p.total_tokens.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-text-tertiary">Input</div>
                  <div className="font-medium text-text-secondary">{p.input_tokens.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-text-tertiary">Output</div>
                  <div className="font-medium text-text-secondary">{p.output_tokens.toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* By Agent */}
      <div className="bg-bg-secondary border border-border-subtle rounded-xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <Users size={18} className="text-accent-blue" />
          Token Usage by Agent
        </h3>
        <div className="space-y-3">
          {data.by_agent.map(a => (
            <div key={a.agent_id} className="flex items-center justify-between bg-bg-tertiary border border-border-subtle rounded-lg p-4">
              <div className="flex-1">
                <div className="font-medium text-text-primary mb-1">{a.agent_name}</div>
                <div className="flex gap-4 text-xs text-text-tertiary">
                  <span>{a.total_tokens.toLocaleString()} tokens</span>
                  <span>Efficiency: {a.efficiency}x</span>
                </div>
              </div>
              <div className="text-accent-amber font-bold">{formatCost(a.total_cost)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* By Model */}
      <div className="bg-bg-secondary border border-border-subtle rounded-xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-accent-teal" />
          Token Usage by Model
        </h3>
        <div className="space-y-3">
          {data.by_model.map(m => (
            <div key={m.model} className="bg-bg-tertiary border border-border-subtle rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm text-text-primary">{m.model}</span>
                <span className="text-accent-amber font-bold">{formatCost(m.total_cost)}</span>
              </div>
              <div className="flex justify-between text-xs text-text-tertiary">
                <span>{m.total_tokens.toLocaleString()} tokens</span>
                <span>{m.usage_count} calls</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {data.timeline.length > 0 && (
        <div className="bg-bg-secondary border border-border-subtle rounded-xl p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Activity size={18} className="text-accent-purple" />
            Daily Timeline
          </h3>
          <div className="space-y-2">
            {data.timeline.map(t => (
              <div key={t.date} className="flex items-center justify-between bg-bg-tertiary border border-border-subtle rounded-lg p-3 text-sm">
                <span className="text-text-secondary">{new Date(t.date).toLocaleDateString()}</span>
                <div className="flex items-center gap-4">
                  <span className="text-text-tertiary">{t.total_tokens.toLocaleString()} tokens</span>
                  <span className="text-accent-amber font-medium">{formatCost(t.total_cost)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-bg-tertiary border border-border-subtle rounded-lg p-3">
      <Icon size={16} className={`${color} mb-2`} />
      <div className="text-lg font-bold text-text-primary">{value}</div>
      <div className="text-xs text-text-tertiary">{label}</div>
    </div>
  );
}
