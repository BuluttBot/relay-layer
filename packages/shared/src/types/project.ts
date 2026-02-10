export interface Project {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectDetail extends Project {
  agents: string[];
  task_count: number;
}

export interface CreateProjectInput {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  icon?: string;
}
