"use client";

import { useState, useEffect } from "react";
import { Button, Label, TextInput, Select, Alert } from "flowbite-react";
import { v4 as uuidv4 } from 'uuid';

interface ConnectionPanelProps {
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
  setClient: (client: any) => void;
  addLog: (message: string) => void;
}

export default function ConnectionPanel({ 
  isConnected, 
  setIsConnected, 
  setClient,
  addLog 
}: ConnectionPanelProps) {
  const [protocol, setProtocol] = useState<"stdio" | "sse">("stdio");
  const [command, setCommand] = useState("node");
  const [args, setArgs] = useState("test-server.js");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    // Generate a unique session ID when the component mounts
    setSessionId(uuidv4());
  }, []);

  const handleConnect = async () => {
    try {
      setError(null);
      setConnecting(true);
      addLog(`Connecting to MCP server using ${protocol} protocol...`);

      if (protocol === "stdio") {
        if (!command) {
          setError("Command is required for stdio protocol");
          setConnecting(false);
          return;
        }
        
        // Call the API route to connect to the MCP server
        const response = await fetch('/api/mcp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'connect',
            sessionId,
            command,
            args
          }),
        });

        const data = await response.json();
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to connect to MCP server');
        }
        
        // Create a client proxy that will forward requests to the API route
        const clientProxy = {
          sessionId,
          listResources: async () => {
            return await callMethod('listResources');
          },
          listResourceTemplates: async () => {
            return await callMethod('listResourceTemplates');
          },
          readResource: async (params: any) => {
            return await callMethod('readResource', params);
          },
          listPrompts: async () => {
            return await callMethod('listPrompts');
          },
          getPrompt: async (params: any) => {
            return await callMethod('getPrompt', params);
          },
          listTools: async () => {
            return await callMethod('listTools');
          },
          callTool: async (params: any) => {
            return await callMethod('callTool', params);
          },
          close: async () => {
            return await disconnectFromServer();
          }
        };
        
        addLog("Connected to MCP server successfully");
        setClient(clientProxy);
        setIsConnected(true);
      } else {
        setError("SSE protocol is not supported in this version");
        setConnecting(false);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error';
      
      // Provide more helpful error messages
      let userFriendlyMessage = errorMessage;
      
      if (errorMessage.includes('ENOENT')) {
        userFriendlyMessage = `Could not find or execute the command: ${command}. Make sure the file exists and is executable.`;
      } else if (errorMessage.includes('field.isOptional')) {
        userFriendlyMessage = 'The server is using an incompatible schema format. Make sure you are using the latest version of the MCP SDK and Zod for schema validation.';
      } else if (errorMessage.includes('Cannot read properties of undefined')) {
        userFriendlyMessage = 'The server returned an invalid response. Check the server implementation for errors.';
      }
      
      addLog(`Connection error: ${userFriendlyMessage}`);
      setError(`Connection error: ${userFriendlyMessage}`);
    } finally {
      setConnecting(false);
    }
  };

  const callMethod = async (method: string, params: any = {}) => {
    try {
      addLog(`Calling method: ${method}`);
      
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'call',
          sessionId,
          method,
          params
        }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || `Failed to call method: ${method}`);
      }
      
      addLog(`Method ${method} completed successfully`);
      return data.result;
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error';
      
      // Provide more helpful error messages
      let userFriendlyMessage = errorMessage;
      
      if (errorMessage.includes('field.isOptional')) {
        userFriendlyMessage = 'The server is using an incompatible schema format. Make sure you are using the latest version of the MCP SDK and Zod for schema validation.';
      } else if (errorMessage.includes('Cannot read properties of undefined')) {
        userFriendlyMessage = 'The server returned an invalid response. Check the server implementation for errors.';
      }
      
      addLog(`Error calling method ${method}: ${userFriendlyMessage}`);
      throw new Error(userFriendlyMessage);
    }
  };

  const disconnectFromServer = async () => {
    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'disconnect',
          sessionId
        }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to disconnect from MCP server');
      }
      
      return true;
    } catch (err: any) {
      addLog(`Error disconnecting: ${err.message}`);
      throw err;
    }
  };

  const handleDisconnect = async () => {
    try {
      addLog("Disconnecting from MCP server...");
      
      await disconnectFromServer();
      setClient(null);
      setIsConnected(false);
      addLog("Disconnected from MCP server");
    } catch (err: any) {
      addLog(`Disconnect error: ${err.message}`);
      setError(`Disconnect error: ${err.message}`);
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold dark:text-white">Server Connection</h2>
      
      {error && (
        <Alert color="failure" className="mb-4">
          {error}
        </Alert>
      )}
      
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <div className="mb-2 block">
            <Label htmlFor="protocol" value="Protocol" />
          </div>
          <Select
            id="protocol"
            value={protocol}
            onChange={(e) => setProtocol(e.target.value as "stdio" | "sse")}
            disabled={isConnected}
          >
            <option value="stdio">stdio</option>
            <option value="sse">SSE</option>
          </Select>
        </div>

        {protocol === "stdio" ? (
          <>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="command" value="Command" />
              </div>
              <TextInput
                id="command"
                placeholder="node"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                disabled={isConnected}
                required
              />
              <p className="mt-1 text-xs text-gray-500">The executable (e.g., node)</p>
            </div>
            <div className="md:col-span-2">
              <div className="mb-2 block">
                <Label htmlFor="args" value="Arguments" />
              </div>
              <TextInput
                id="args"
                placeholder="test-server.js"
                value={args}
                onChange={(e) => setArgs(e.target.value)}
                disabled={isConnected}
              />
              <p className="mt-1 text-xs text-gray-500">Script and arguments (e.g., test-server.js)</p>
            </div>
          </>
        ) : (
          <div className="md:col-span-3">
            <div className="mb-2 block">
              <Label htmlFor="url" value="Server URL" />
            </div>
            <TextInput
              id="url"
              placeholder="http://localhost:3001/mcp"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isConnected}
              required
            />
          </div>
        )}
      </div>

      <div className="flex justify-end">
        {!isConnected ? (
          <Button 
            color="success" 
            onClick={handleConnect} 
            disabled={connecting}
            isProcessing={connecting}
          >
            {connecting ? "Connecting..." : "Connect"}
          </Button>
        ) : (
          <Button color="failure" onClick={handleDisconnect}>
            Disconnect
          </Button>
        )}
      </div>
    </div>
  );
} 