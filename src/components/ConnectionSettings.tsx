import { useState } from "react";
import { ConnectionConfig } from "../types";
import { invoke } from "@tauri-apps/api/core";

interface Props {
  onConnect: (config: ConnectionConfig) => void;
}

export default function ConnectionSettings({ onConnect }: Props) {
  const [host, setHost] = useState("192.168.1.100");
  const [port, setPort] = useState("18188");
  const [token, setToken] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    setIsTesting(true);
    setError("");
    
    const config: ConnectionConfig = {
      host,
      port: parseInt(port, 10),
      token,
    };
    
    try {
      const success = await invoke<boolean>("test_connection", { config });
      if (success) {
        onConnect(config);
      } else {
        setError("连接失败，请检查配置");
      }
    } catch (e) {
      setError(`连接错误: ${e}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="connection-settings">
      <h1>OpenClaw Client</h1>
      <h2>连接设置</h2>
      
      <div className="form-group">
        <label>服务器地址</label>
        <input
          type="text"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="192.168.1.100"
        />
      </div>
      
      <div className="form-group">
        <label>端口</label>
        <input
          type="text"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          placeholder="18789"
        />
      </div>
      
      <div className="form-group">
        <label>API Token</label>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="输入 API Token"
        />
      </div>
      
      {error && <div className="error">{error}</div>}
      
      <button onClick={handleConnect} disabled={isTesting}>
        {isTesting ? "测试连接中..." : "连接"}
      </button>
    </div>
  );
}
