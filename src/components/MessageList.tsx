import { Message } from "../types";
import MessageItem from "./MessageItem";

interface Props {
  messages: Message[];
}

export default function MessageList({ messages }: Props) {
  return (
    <div className="message-list">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      {messages.length === 0 && (
        <div className="empty-state">
          <p>开始与 OpenClaw 对话</p>
        </div>
      )}
    </div>
  );
}
