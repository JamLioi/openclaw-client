import { useState, useEffect, useCallback } from "react";
import { ConnectionConfig, Message } from "./types";
import ConnectionSettings from "./components/ConnectionSettings";
import ChatInterface from "./components/ChatInterface";
import SessionList, { Session } from "./components/SessionList";

const STORAGE_KEY = "openclaw-sessions";

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function newSession(): Session {
  const now = Date.now();
  return {
    id: now.toString(),
    title: "新会话",
    messages: [],
    createdAt: now,
  };
}

function App() {
  const [config, setConfig] = useState<ConnectionConfig | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessions, setSessions] = useState<Session[]>(loadSessions);
  const [activeId, setActiveId] = useState<string>(() => {
    const loaded = loadSessions();
    return loaded.length > 0 ? loaded[0].id : "";
  });

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const activeSession = sessions.find((s) => s.id === activeId);

  const handleNewSession = useCallback(() => {
    const s = newSession();
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
  }, []);

  const handleSelectSession = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const handleDeleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (id === activeId && next.length > 0) {
          setActiveId(next[0].id);
        } else if (next.length === 0) {
          const s = newSession();
          setActiveId(s.id);
          return [s];
        }
        return next;
      });
    },
    [activeId]
  );

  const handleUpdateMessages = useCallback(
    (messages: Message[]) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeId) return s;
          const title =
            messages.length > 0 && messages[0].role === "user"
              ? messages[0].content.slice(0, 20)
              : s.title;
          return { ...s, messages, title };
        })
      );
    },
    [activeId]
  );

  return (
    <div className="app">
      {!isConnected ? (
        <ConnectionSettings
          onConnect={(cfg) => {
            setConfig(cfg);
            setIsConnected(true);
            if (sessions.length === 0) {
              const s = newSession();
              setSessions([s]);
              setActiveId(s.id);
            }
          }}
        />
      ) : (
        <div style={{ display: "flex", height: "100%" }}>
          <SessionList
            sessions={sessions}
            activeId={activeId}
            onSelect={handleSelectSession}
            onNew={handleNewSession}
            onDelete={handleDeleteSession}
          />
          <div style={{ flex: 1 }}>
            <ChatInterface
              config={config!}
              onDisconnect={() => setIsConnected(false)}
              messages={activeSession?.messages ?? []}
              onMessagesChange={handleUpdateMessages}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
