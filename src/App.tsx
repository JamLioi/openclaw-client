import { useState } from "react";
import { ConnectionConfig } from "./types";
import ConnectionSettings from "./components/ConnectionSettings";
import ChatInterface from "./components/ChatInterface";

function App() {
  const [config, setConfig] = useState<ConnectionConfig | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="app">
      {!isConnected ? (
        <ConnectionSettings
          onConnect={(cfg) => {
            setConfig(cfg);
            setIsConnected(true);
          }}
        />
      ) : (
        <ChatInterface
          config={config!}
          onDisconnect={() => setIsConnected(false)}
        />
      )}
    </div>
  );
}

export default App;
