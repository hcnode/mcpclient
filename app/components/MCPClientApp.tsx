"use client";

import { useState, useEffect } from "react";
import { Tabs, Card } from "flowbite-react";
import ConnectionPanel from "./ConnectionPanel";
import ResourcesPanel from "./ResourcesPanel";
import PromptsPanel from "./PromptsPanel";
import ToolsPanel from "./ToolsPanel";
import LogPanel from "./LogPanel";

export default function MCPClientApp() {
  const [isConnected, setIsConnected] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];
    setLogs((prevLogs) => [...prevLogs, `[${timeString}] ${message}`]);
  };

  useEffect(() => {
    const handleClearLogs = () => {
      setLogs([]);
    };

    window.addEventListener("clearLogs", handleClearLogs);
    
    return () => {
      window.removeEventListener("clearLogs", handleClearLogs);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <ConnectionPanel 
          isConnected={isConnected} 
          setIsConnected={setIsConnected} 
          setClient={setClient}
          addLog={addLog}
        />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <Tabs aria-label="MCP Features" style="underline">
              <Tabs.Item active title="Resources" icon={() => <span className="mr-2">📚</span>}>
                <ResourcesPanel 
                  isConnected={isConnected} 
                  client={client}
                  addLog={addLog}
                />
              </Tabs.Item>
              <Tabs.Item title="Prompts" icon={() => <span className="mr-2">💬</span>}>
                <PromptsPanel 
                  isConnected={isConnected} 
                  client={client}
                  addLog={addLog}
                />
              </Tabs.Item>
              <Tabs.Item title="Tools" icon={() => <span className="mr-2">🔧</span>}>
                <ToolsPanel 
                  isConnected={isConnected} 
                  client={client}
                  addLog={addLog}
                />
              </Tabs.Item>
            </Tabs>
          </Card>
        </div>

        <div>
          <Card>
            <LogPanel logs={logs} />
          </Card>
        </div>
      </div>
    </div>
  );
} 