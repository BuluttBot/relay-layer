'use client';
import { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useProjectStore, type Project } from '@/stores/projectStore';
import { X, Plus, Edit2, Trash2, Save, Folder } from 'lucide-react';
import { api } from '@/lib/api';

interface ProjectManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectManagementModal({ isOpen, onClose }: ProjectManagementModalProps) {
  const { projects, fetchProjects } = useProjectStore();
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({ id: '', name: '', description: '', icon: '' });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      setMode('list');
      setEditingProject(null);
      setConfirmDelete(null);
    }
  }, [isOpen, fetchProjects]);

  const handleCreate = () => {
    setMode('create');
    setFormData({ id: '', name: '', description: '', icon: '📁' });
  };

  const handleEdit = (project: Project) => {
    setMode('edit');
    setEditingProject(project);
    setFormData({
      id: project.id,
      name: project.name,
      description: project.description || '',
      icon: project.icon || '📁'
    });
  };

  const handleCancel = () => {
    setMode('list');
    setEditingProject(null);
    setFormData({ id: '', name: '', description: '', icon: '' });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    
    setLoading(true);
    try {
      if (mode === 'create') {
        const projectId = formData.id.trim() || formData.name.toLowerCase().replace(/\s+/g, '-');
        await api.post('/projects', { 
          id: projectId, 
          name: formData.name.trim(), 
          description: formData.description.trim() || null,
          icon: formData.icon || '📁'
        });
      } else if (mode === 'edit' && editingProject) {
        await api.patch(`/projects/${editingProject.id}`, {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          icon: formData.icon || '📁'
        });
      }
      await fetchProjects();
      handleCancel();
    } catch (error) {
      console.error('Failed to save project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    setLoading(true);
    try {
      await api.del(`/projects/${projectId}`);
      await fetchProjects();
      setConfirmDelete(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-bg-primary border border-border-subtle p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-semibold text-text-primary flex items-center gap-2">
                      <Folder size={20} className="text-accent-purple" />
                      {mode === 'create' ? 'Create Project' : mode === 'edit' ? 'Edit Project' : 'Manage Projects'}
                    </Dialog.Title>
                    {mode === 'list' && (
                      <p className="text-sm text-text-tertiary mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-bg-tertiary transition-fast"
                  >
                    <X size={18} className="text-text-tertiary" />
                  </button>
                </div>

                {/* Content */}
                {mode === 'list' ? (
                  <>
                    <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                      {projects.map(project => (
                        <div
                          key={project.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-bg-secondary border border-border-subtle hover:border-border transition-fast"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="text-2xl shrink-0">{project.icon || '📁'}</div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-text-primary truncate">{project.name}</h4>
                              {project.description && (
                                <p className="text-xs text-text-tertiary mt-1 truncate">{project.description}</p>
                              )}
                              <div className="flex gap-3 mt-2 text-xs text-text-tertiary">
                                <span>{project.agents.length} member{project.agents.length !== 1 ? 's' : ''}</span>
                                <span>{project.task_count} task{project.task_count !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 shrink-0 ml-4">
                            <button
                              onClick={() => handleEdit(project)}
                              disabled={loading}
                              className="p-2 rounded-lg bg-bg-surface hover:bg-bg-tertiary text-text-secondary hover:text-accent-purple transition-fast disabled:opacity-50"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            {confirmDelete === project.id ? (
                              <>
                                <button
                                  onClick={() => handleDelete(project.id)}
                                  disabled={loading}
                                  className="px-3 py-2 rounded-lg bg-accent-red hover:bg-accent-red/90 text-white text-xs font-medium transition-fast disabled:opacity-50"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(null)}
                                  disabled={loading}
                                  className="px-3 py-2 rounded-lg bg-bg-surface hover:bg-bg-tertiary text-text-secondary text-xs font-medium transition-fast disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setConfirmDelete(project.id)}
                                disabled={loading}
                                className="p-2 rounded-lg bg-bg-surface hover:bg-accent-red/10 text-text-tertiary hover:text-accent-red transition-fast disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleCreate}
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-lg bg-accent-purple hover:bg-accent-purple/90 text-white text-sm font-medium transition-fast flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Plus size={16} /> Create New Project
                    </button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-text-secondary mb-2 block">Project Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Personal Development"
                        className="w-full px-3 py-2 bg-bg-surface border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-purple transition-fast"
                        autoFocus
                      />
                    </div>

                    {mode === 'create' && (
                      <div>
                        <label className="text-xs font-medium text-text-secondary mb-2 block">Project ID (optional)</label>
                        <input
                          type="text"
                          value={formData.id}
                          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                          placeholder="Auto-generated from name"
                          className="w-full px-3 py-2 bg-bg-surface border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-purple transition-fast"
                        />
                        <p className="text-xs text-text-tertiary mt-1">Leave empty to auto-generate from name</p>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-medium text-text-secondary mb-2 block">Icon</label>
                      <input
                        type="text"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        placeholder="📁"
                        maxLength={2}
                        className="w-20 px-3 py-2 bg-bg-surface border border-border-subtle rounded-lg text-sm text-text-primary text-center focus:outline-none focus:border-accent-purple transition-fast"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-text-secondary mb-2 block">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of the project..."
                        rows={3}
                        className="w-full px-3 py-2 bg-bg-surface border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-purple transition-fast resize-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={handleSubmit}
                        disabled={loading || !formData.name.trim()}
                        className="flex-1 px-4 py-2 rounded-lg bg-accent-purple hover:bg-accent-purple/90 text-white text-sm font-medium transition-fast flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Save size={14} /> {mode === 'create' ? 'Create Project' : 'Save Changes'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-bg-surface hover:bg-bg-tertiary text-text-secondary text-sm font-medium transition-fast disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
