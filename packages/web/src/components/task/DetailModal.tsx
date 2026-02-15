'use client';
import { useState } from 'react';
import { useTaskStore, type Task } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';
import { useAgentStore } from '@/stores/agentStore';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { PRIORITY_COLORS, COLUMN_CONFIG } from '@/lib/constants';
import { formatDate, timeAgo } from '@/lib/formatters';
import { Clock, User, FolderOpen, CheckCircle2, AlertCircle, FileText, List, ChevronRight, Edit2, Save, X as XIcon, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function DetailModal() {
  const task = useTaskStore(s => s.selectedTask);
  const updateTaskLocal = useTaskStore(s => s.updateTaskLocal);
  const fetchTasks = useTaskStore(s => s.fetchTasks);
  const open = useUIStore(s => s.taskDetailOpen);
  const close = useUIStore(s => s.close);
  const agents = useAgentStore(s => s.agents);
  const agent = task ? agents.find(a => a.id === task.assigned_to) : null;
  const [activeTab, setActiveTab] = useState<'logs' | 'reports'>('logs');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [updating, setUpdating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!task) return null;

  // Filter agents by current project
  const projectAgents = agents.filter(a => a.projects.includes(task.project_id));

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const updated = await api.patch<Task>(`/tasks/${task.id}`, { status: newStatus });
      updateTaskLocal(updated);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    setUpdating(true);
    try {
      const updated = await api.patch<Task>(`/tasks/${task.id}`, { priority: newPriority });
      updateTaskLocal(updated);
    } catch (error) {
      console.error('Failed to update priority:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignmentChange = async (newAgent: string) => {
    setUpdating(true);
    try {
      const updated = await api.patch<Task>(`/tasks/${task.id}`, { assigned_to: newAgent });
      updateTaskLocal(updated);
    } catch (error) {
      console.error('Failed to reassign task:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleStartEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setUpdating(true);
    try {
      const updated = await api.patch<Task>(`/tasks/${task.id}`, { 
        title: editTitle, 
        description: editDescription || null 
      });
      updateTaskLocal(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle('');
    setEditDescription('');
  };

  const handleDelete = async () => {
    setUpdating(true);
    try {
      await api.del(`/tasks/${task.id}`);
      close('taskDetailOpen');
      // Refresh task list
      await fetchTasks(task.project_id);
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setUpdating(false);
      setConfirmDelete(false);
    }
  };

  const nextStatus = COLUMN_CONFIG.find((col, idx, arr) => {
    const currentIdx = arr.findIndex(c => c.key === task.status);
    return idx === currentIdx + 1;
  });

  return (
    <Modal open={open} onClose={() => close('taskDetailOpen')} title={isEditing ? 'Edit Task' : task.title} wide>
      <div className="space-y-6">
        {/* Action Buttons */}
        {!isEditing && (
          <div className="flex flex-wrap gap-2 justify-between">
            <div className="flex flex-wrap gap-2">
              {nextStatus && (
                <button
                  onClick={() => handleStatusChange(nextStatus.key)}
                  disabled={updating}
                  className="px-3 py-1.5 rounded-lg bg-accent-purple/10 hover:bg-accent-purple/20 text-accent-purple text-sm font-medium transition-fast flex items-center gap-1 disabled:opacity-50"
                >
                  Move to {nextStatus.label} <ChevronRight size={14} />
                </button>
              )}
              <button
                onClick={handleStartEdit}
                disabled={updating}
                className="px-3 py-1.5 rounded-lg bg-bg-surface hover:bg-bg-tertiary text-text-secondary text-sm font-medium transition-fast flex items-center gap-1 disabled:opacity-50"
              >
                <Edit2 size={14} /> Edit
              </button>
            </div>
            
            {/* Delete Button */}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={updating}
                className="px-3 py-1.5 rounded-lg bg-bg-surface hover:bg-accent-red/10 text-text-tertiary hover:text-accent-red text-sm font-medium transition-fast flex items-center gap-1 disabled:opacity-50"
              >
                <Trash2 size={14} /> Delete
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={updating}
                  className="px-3 py-1.5 rounded-lg bg-accent-red hover:bg-accent-red/90 text-white text-sm font-medium transition-fast flex items-center gap-1 disabled:opacity-50"
                >
                  <Trash2 size={14} /> Confirm Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={updating}
                  className="px-3 py-1.5 rounded-lg bg-bg-surface hover:bg-bg-tertiary text-text-secondary text-sm font-medium transition-fast disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Edit Mode */}
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-2 block">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 bg-bg-surface border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-purple transition-fast"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-2 block">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-bg-surface border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-purple transition-fast resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={updating || !editTitle.trim()}
                className="px-4 py-2 rounded-lg bg-accent-purple hover:bg-accent-purple/90 text-white text-sm font-medium transition-fast flex items-center gap-1 disabled:opacity-50"
              >
                <Save size={14} /> Save Changes
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={updating}
                className="px-4 py-2 rounded-lg bg-bg-surface hover:bg-bg-tertiary text-text-secondary text-sm font-medium transition-fast flex items-center gap-1 disabled:opacity-50"
              >
                <XIcon size={14} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header info */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Priority Dropdown */}
              <select
                value={task.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                disabled={updating}
                className="px-2 py-1 rounded text-xs font-medium border border-transparent hover:border-border-subtle transition-fast disabled:opacity-50 cursor-pointer"
                style={{ 
                  backgroundColor: PRIORITY_COLORS[task.priority] + '20',
                  color: PRIORITY_COLORS[task.priority]
                }}
              >
                <option value="urgent">urgent</option>
                <option value="high">high</option>
                <option value="medium">medium</option>
                <option value="low">low</option>
              </select>

              {/* Status Dropdown */}
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
                className="px-2 py-1 rounded text-xs bg-bg-surface border border-border-subtle hover:border-border-strong text-text-secondary transition-fast disabled:opacity-50 cursor-pointer capitalize"
              >
                {COLUMN_CONFIG.map(col => (
                  <option key={col.key} value={col.key}>{col.label}</option>
                ))}
              </select>

              {/* Agent Assignment Dropdown - Shows project agents only */}
              <select
                value={task.assigned_to || ''}
                onChange={(e) => handleAssignmentChange(e.target.value)}
                disabled={updating}
                className="px-2 py-1 rounded text-xs bg-bg-surface border border-border-subtle hover:border-border-strong text-text-secondary transition-fast disabled:opacity-50 cursor-pointer"
              >
                {!task.assigned_to && <option value="">Unassigned</option>}
                {projectAgents.map(a => (
                  <option key={a.id} value={a.id}>{a.avatar} {a.name}</option>
                ))}
              </select>

              <span className="text-sm text-text-tertiary flex items-center gap-1">
                <Clock size={14} /> {formatDate(task.created_at)}
              </span>
            </div>
          </>
        )}

        {!isEditing && (
          <>
            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-secondary">Progress</span>
                <span className="text-text-primary font-medium">{task.progress}%</span>
              </div>
              <div className="w-full h-2 bg-bg-surface rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-accent-teal transition-all" style={{ width: `${task.progress}%` }} />
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-2">Description</h4>
                <p className="text-sm text-text-primary leading-relaxed">{task.description}</p>
              </div>
            )}
          </>
        )}

        {!isEditing && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-border-primary mb-4">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'logs' ? 'border-accent-teal text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          >
            <List size={14} /> Activity Log
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'reports' ? 'border-accent-teal text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          >
            <FileText size={14} /> Reports
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'logs' ? (
          <div>
            {task.logs && task.logs.length > 0 ? (
              <div className="space-y-3">
                {task.logs.map((log: any) => (
                  <div key={log.id} className="flex gap-3 text-sm">
                    <div className="w-1.5 rounded-full bg-accent-purple shrink-0 mt-1" style={{ minHeight: 16 }} />
                    <div className="flex-1">
                      <p className="text-text-primary">{log.message}</p>
                      <div className="flex gap-3 mt-1 text-xs text-text-tertiary">
                        {log.stage && <span className="capitalize">{log.stage}</span>}
                        <span>{timeAgo(log.created_at)}</span>
                        {log.progress !== null && <span>{log.progress}%</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-text-tertiary text-sm">No activity logged yet.</div>
            )}
          </div>
        ) : (
          <div>
            {task.reports && task.reports.length > 0 ? (
              <div className="space-y-6">
                {task.reports.map((report: any) => (
                  <div key={report.id} className="bg-bg-surface p-4 rounded-xl border border-border-secondary">
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border-secondary">
                      <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center text-lg">
                        {/* Try to find agent avatar, fallback to robot */}
                        {agents.find(a => a.id === report.agent_id)?.avatar || '🤖'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-text-primary">{report.agent_name}</div>
                        <div className="text-xs text-text-tertiary">{formatDate(report.created_at)}</div>
                      </div>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-text-secondary whitespace-pre-wrap font-mono text-xs leading-relaxed">
                      {report.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-tertiary text-sm">No detailed reports yet.</div>
            )}
          </div>
        )}

            {/* Subtasks */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border-primary">
                <h4 className="text-sm font-medium text-text-secondary mb-2">Sub-tasks</h4>
                <div className="space-y-2">
                  {task.subtasks.map((sub: any) => (
                    <div key={sub.id} className="flex items-center gap-2 p-2 bg-bg-surface rounded-lg text-sm">
                      {sub.status === 'published' ? (
                        <CheckCircle2 size={16} className="text-accent-teal" />
                      ) : (
                        <AlertCircle size={16} className="text-text-tertiary" />
                      )}
                      <span className="text-text-primary">{sub.title}</span>
                      <Badge color={PRIORITY_COLORS[sub.priority]} className="ml-auto">{sub.priority}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {task.tags.map((tag: string) => (
                  <span key={tag} className="text-xs px-2 py-1 rounded-lg bg-bg-surface text-text-secondary">{tag}</span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
