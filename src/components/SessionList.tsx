import { Message } from "../types";

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

interface Props {
  sessions: Session[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export default function SessionList({ sessions, activeId, onSelect, onNew, onDelete }: Props) {
  return (
    <div className="session-list">
      <div className="session-list-header">
        <h3>会话</h3>
        <button onClick={onNew} className="btn-new">+ 新建</button>
      </div>
      <div className="session-items">
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`session-item ${s.id === activeId ? "active" : ""}`}
            onClick={() => onSelect(s.id)}
          >
            <div className="session-title">{s.title || "新会话"}</div>
            <div className="session-time">
              {new Date(s.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <button
              className="btn-delete"
              onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
