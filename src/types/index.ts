export interface ConnectionConfig {
  host: string;
  port: number;
  token: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ChatRequest {
  model: string;
  messages: Message[];
  stream: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentModel: string;
}
