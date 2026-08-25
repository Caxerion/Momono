export type Message = { role: "user" | "assistant"; content: string };
export type Conversation = { id: string; title: string; persona_id?: string; updated_at?: string };
export type Persona = {
  id: string;
  name: string;
  system_prompt: string;
  about?: string;
  greeting?: string;
};
