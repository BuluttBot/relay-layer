export interface Communication {
  id: string;
  from_agent_id: string;
  from_agent_name: string;
  to_agent_id: string;
  to_agent_name: string;
  content: string;
  reply_to: string | null;
  session_key: string | null;
  project_id: string | null;
  created_at: string;
}
