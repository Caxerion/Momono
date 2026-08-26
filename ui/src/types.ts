export type Message = { role: "user" | "assistant"; content: string; regenerate_index?: number };
export type Conversation = { id: string; title: string; persona_id?: string; updated_at?: string };
export type Persona = {
  id: string;
  name: string;
  title?: string;
  system_prompt: string;
  about?: string;
  greeting?: string;
  personality?: string;
  created_by?: string;
  avatar_url?: string | null;
};
export type UserProfile = {
  username: string;
  email: string;
  display_name: string;
  about_me: string;
  avatar_url?: string | null;
};
