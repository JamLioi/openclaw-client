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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    invoke<string[]>("fetch_models", { config })
      .then((list) => {
        setModels(list);
        if (list.length > 0) setCurrentModel(list[0]);
      })
      .catch(() => {
        setModels(["default"]);
        setCurrentModel("default");
      });
  }, [config]);

  useEffect(() => {
    const unlisten = listen<string>("stream-chunk", (event) => {
      const chunk = event.payload;
      if (chunk === "[DONE]") return;
      try {
        const data = JSON.parse(chunk);
        if (data.choices && data.choices[0]?.delta?.content) {
          const content = data.choices[0].delta.content;
          const prev = messagesRef.current;
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === "assistant") {
            onMessagesChange([
              ...prev.slice(0, -1),
              { ...lastMsg, content: lastMsg.content + content },
            ]);
          }
        }
      } catch (e) {
        console.error("Parse error:", e);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [onMessagesChange]);

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

    const request: ChatRequest = {
      model: currentModel,
      messages: [...messages, userMessage],
      stream: true,
    };

    try {
      await invoke("stream_chat_message", { config, request });
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
