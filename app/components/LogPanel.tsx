"use client";

import { useRef, useEffect } from "react";
import { Button } from "flowbite-react";

interface LogPanelProps {
  logs: string[];
}

export default function LogPanel({ logs }: LogPanelProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleClearLogs = () => {
    // We can't directly modify the logs array since it's passed as a prop
    // Instead, we'll emit a custom event that the parent component can listen to
    const event = new CustomEvent("clearLogs");
    window.dispatchEvent(event);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-bold dark:text-white">Logs</h2>
        <Button color="light" size="xs" onClick={handleClearLogs}>
          Clear
        </Button>
      </div>
      
      <div 
        ref={logContainerRef}
        className="h-[400px] overflow-y-auto rounded-lg bg-gray-100 p-3 font-mono text-sm dark:bg-gray-700"
      >
        {logs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No logs yet. Connect to a server to see logs.</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1 break-all">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 