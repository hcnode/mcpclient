"use client";

import { useState, useEffect } from "react";
import { Button, Label, TextInput, Select, Alert } from "flowbite-react";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

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
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setError(null);
      setConnecting(true);
      addLog(`Connecting to MCP server using ${protocol} protocol...`);

      let transport;
      if (protocol === "stdio") {
        if (!command) {
          setError("Command is required for stdio protocol");
          setConnecting(false);
          return;
        }
        
        const argsArray = args ? args.split(" ").filter(arg => arg.trim() !== "") : [];
        transport = new StdioClientTransport({
          command,
          args: argsArray
        });
      } else {
        if (!url) {
          setError("URL is required for SSE protocol");
          setConnecting(false);
          return;
        }
        
        transport = new SSEClientTransport(new URL(url));
      }

      const client = new Client(
        {
          name: "mcp-client-tester",
          version: "1.0.0"
        },
        {
          capabilities: {
            prompts: {},
            resources: {},
            tools: {}
          }
        }
      );

      // Set up message logging
      transport.onmessage = (message) => {
        addLog(`Received: ${JSON.stringify(message)}`);
      };

      transport.onerror = (err) => {
        addLog(`Transport error: ${err.message}`);
        setError(`Transport error: ${err.message}`);
        setIsConnected(false);
      };

      transport.onclose = () => {
        addLog("Connection closed");
        setIsConnected(false);
      };

      await client.connect(transport);
      
      addLog("Connected to MCP server successfully");
      setClient(client);
      setIsConnected(true);
    } catch (err: any) {
      addLog(`Connection error: ${err.message}`);
      setError(`Connection error: ${err.message}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      addLog("Disconnecting from MCP server...");
      // The client has a close method that we can call
      await setClient((prevClient: any) => {
        if (prevClient) {
          prevClient.close();
        }
        return null;
      });
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
            <div className="md:col-span-2">
              <div className="mb-2 block">
                <Label htmlFor="command" value="Command" />
              </div>
              <TextInput
                id="command"
                placeholder="node test-server.js"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                disabled={isConnected}
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="args" value="Arguments" />
              </div>
              <TextInput
                id="args"
                placeholder="--arg1 value1"
                value={args}
                onChange={(e) => setArgs(e.target.value)}
                disabled={isConnected}
              />
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