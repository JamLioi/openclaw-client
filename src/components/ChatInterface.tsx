import { useState, useRef, useEffect } from "react";
import { ConnectionConfig, Message, ChatRequest } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

interface Props {
  config: ConnectionConfig;
  onDisconnect: () => void;
}

export default function ChatInterface({ config, onDisconnect }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState("gpt-3.5-turbo");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const unlisten = listen<string>("stream-chunk", (event) => {
      const chunk = event.payload;
      try {
        const data = JSON.parse(chunk);
        if (data.choices && data.choices[0]?.delta?.content) {
          const content = data.choices[0].delta.content;
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === "assistant") {
              return [
                ...prev.slice(0, -1),
                { ...lastMsg, content: lastMsg.content + content },
              ];
            }
            return prev;
          });
        }
      } catch (e) {
        console.error("Parse error:", e);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

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

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
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
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === "assistant") {
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, content: `错误: ${e}` },
          ];
        }
        return prev;
      });
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
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
          </select>
          <button onClick={onDisconnect}>断开连接</button>
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
