import { useState, useRef, useEffect } from "react";
import { ConnectionConfig, Message, ChatRequest } from "../types";
import { invoke } from "@tauri-apps/api/core";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

interface Props {
  config: ConnectionConfig;
  onDisconnect: () => void;
  messages: Message[];
  onMessagesChange: (messages: Message[]) => void;
}

export default function ChatInterface({ config, onDisconnect, messages, onMessagesChange }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [currentModel, setCurrentModel] = useState("default");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>(messages);

  messagesRef.current = messages;

  useEffect(() => {
    invoke<string[]>("fetch_models", { config }).then((list) => {
      if (list && list.length > 0) {
        setModels(list);
        if (!list.includes(currentModel)) {
          setCurrentModel(list[0]);
        }
      }
    }).catch(console.error);
  }, [config]);


  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    const updated = [...messages, userMessage, assistantMessage];
    onMessagesChange(updated);
    setIsLoading(true);

    const apiMessages = [...messages, userMessage].map(({ role, content }) => ({ role, content }));
    const request: ChatRequest = {
      model: currentModel,
      messages: apiMessages as any,
      stream: false,
    };

    try {
      const content = await invoke<string>("stream_chat_message", { config, request });
      const prev = messagesRef.current;
      const lastMsg = prev[prev.length - 1];
      if (lastMsg && lastMsg.role === "assistant") {
        onMessagesChange([...prev.slice(0, -1), { ...lastMsg, content: content || "(空回复)" }]);
      }
    } catch (e) {
      console.error("Send error:", e);
      const prev = messagesRef.current;
      const lastMsg = prev[prev.length - 1];
      if (lastMsg && lastMsg.role === "assistant") {
        onMessagesChange([
          ...prev.slice(0, -1),
          { ...lastMsg, content: `错误: ${e}` },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>OpenClaw Chat</h2>
        <div className="header-actions">
          <select
            value={currentModel}
            onChange={(e) => setCurrentModel(e.target.value)}
          >
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
            {models.length === 0 && <option value="openclaw/main">openclaw/main</option>}
          </select>
          <button onClick={onDisconnect}>断开连接</button>
        <button onClick={async () => {
          try {
            const msgs = JSON.stringify(messages.map(m => ({role:m.role, content:m.content.slice(0,100)})));
            const log = await invoke<string>("generate_log", { config, messagesJson: msgs });
            // Copy to clipboard
            await navigator.clipboard.writeText(log);
            alert("日志已复制到剪贴板\n\n" + log.slice(0, 500) + "...");
          } catch(e) {
            alert("生成日志失败: " + e);
          }
        }} className="btn-log">📋 日志</button>
        </div>
      </div>
      
      <div className="chat-messages">
        <MessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>
      
      <MessageInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
