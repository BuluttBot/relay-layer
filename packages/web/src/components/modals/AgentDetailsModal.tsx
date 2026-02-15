'use client';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import type { Agent } from '@/stores/agentStore';
import { STATUS_COLORS } from '@/lib/constants';
import { timeAgo } from '@/lib/formatters';

interface AgentDetailsModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentDetailsModal({ agent, isOpen, onClose }: AgentDetailsModalProps) {
  if (!agent) return null;

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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-bg-primary border border-border-subtle p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl w-16 h-16 flex items-center justify-center rounded-2xl bg-bg-secondary shrink-0">
                    {agent.avatar || '🤖'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Dialog.Title as="h3" className="text-lg font-semibold text-text-primary">
                        {agent.name}
                      </Dialog.Title>
                      <div 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: STATUS_COLORS[agent.status] || STATUS_COLORS.offline }} 
                        title={agent.status}
                      />
                    </div>
                    {agent.title && (
                      <p className="text-sm text-text-secondary mt-1">
                        {agent.title} {agent.tag && <span className="text-text-tertiary">· {agent.tag}</span>}
                      </p>
                    )}
                  </div>
                </div>

                {agent.description && (
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">Description</h4>
                    <p className="text-sm text-text-secondary">{agent.description}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">Status</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-primary capitalize">{agent.status}</span>
                      {agent.updated_at && (
                        <span className="text-xs text-text-tertiary">· Updated {timeAgo(agent.updated_at)}</span>
                      )}
                    </div>
                  </div>

                  {agent.current_task_title && (
                    <div>
                      <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">Current Task</h4>
                      <p className="text-sm text-accent-teal">📌 {agent.current_task_title}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">Stats</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-bg-secondary">
                        <p className="text-xs text-text-tertiary mb-1">Tasks Completed</p>
                        <p className="text-lg font-semibold text-text-primary">{agent.tasks_completed}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-bg-secondary">
                        <p className="text-xs text-text-tertiary mb-1">Projects</p>
                        <p className="text-lg font-semibold text-text-primary">{agent.projects?.length || 0}</p>
                      </div>
                    </div>
                  </div>

                  {agent.skills && agent.skills.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.skills.map(skill => (
                          <span 
                            key={skill} 
                            className="text-xs px-2 py-1 rounded-md bg-bg-secondary text-text-secondary border border-border-subtle"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {agent.model && (
                    <div>
                      <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">Model</h4>
                      <div className="flex items-center gap-2">
                        <code className="text-xs px-2 py-1 rounded bg-bg-surface text-accent-purple font-mono">
                          {agent.model}
                        </code>
                        {agent.thinking_level && (
                          <span className="text-xs text-text-tertiary">
                            · {agent.thinking_level} thinking
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {agent.projects && agent.projects.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">Active Projects</h4>
                      <div className="space-y-1">
                        {agent.projects.map(project => (
                          <div key={project} className="text-sm text-text-secondary flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-blue"></span>
                            {project}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-secondary hover:bg-bg-surface rounded-lg transition-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
