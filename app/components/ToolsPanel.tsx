"use client";

import { useState, useEffect } from "react";
import { Button, TextInput, Label, Accordion, Spinner, Alert, Badge, Textarea } from "flowbite-react";

interface ToolsPanelProps {
  isConnected: boolean;
  client: any;
  addLog: (message: string) => void;
}

export default function ToolsPanel({ isConnected, client, addLog }: ToolsPanelProps) {
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [toolArgs, setToolArgs] = useState<Record<string, any>>({});
  const [toolResult, setToolResult] = useState<any | null>(null);
  const [loadingTool, setLoadingTool] = useState(false);
  const [toolError, setToolError] = useState<string | null>(null);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonArgsText, setJsonArgsText] = useState("{}");

  const fetchTools = async () => {
    if (!isConnected || !client) return;

    try {
      setLoading(true);
      setError(null);
      addLog("Fetching tools...");

      const toolsList = await client.listTools();
      setTools(toolsList.tools || []);
      addLog(`Fetched ${toolsList.tools?.length || 0} tools`);
    } catch (err: any) {
      addLog(`Error fetching tools: ${err.message}`);
      setError(`Error fetching tools: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const callTool = async () => {
    if (!isConnected || !client || !selectedTool) return;

    try {
      setLoadingTool(true);
      setToolError(null);
      setToolResult(null);

      let args = toolArgs;
      if (jsonMode) {
        try {
          args = JSON.parse(jsonArgsText);
        } catch (err: any) {
          setToolError(`Invalid JSON: ${err.message}`);
          setLoadingTool(false);
          return;
        }
      }

      addLog(`Calling tool: ${selectedTool} with args: ${JSON.stringify(args)}`);

      const result = await client.callTool({
        name: selectedTool,
        arguments: args
      });
      
      setToolResult(result);
      addLog(`Successfully called tool: ${selectedTool}`);
    } catch (err: any) {
      addLog(`Error calling tool: ${err.message}`);
      setToolError(`Error calling tool: ${err.message}`);
    } finally {
      setLoadingTool(false);
    }
  };

  const handleToolSelect = (toolName: string) => {
    setSelectedTool(toolName);
    
    // Reset tool args
    const selectedToolObj = tools.find(t => t.name === toolName);
    if (selectedToolObj && selectedToolObj.parameters) {
      const initialArgs: Record<string, any> = {};
      Object.entries(selectedToolObj.parameters).forEach(([key, value]: [string, any]) => {
        initialArgs[key] = "";
      });
      setToolArgs(initialArgs);
      setJsonArgsText(JSON.stringify(initialArgs, null, 2));
    } else {
      setToolArgs({});
      setJsonArgsText("{}");
    }
  };

  const handleToolArgChange = (argName: string, value: string) => {
    setToolArgs(prev => ({
      ...prev,
      [argName]: value
    }));
  };

  useEffect(() => {
    if (isConnected && client) {
      fetchTools();
    } else {
      setTools([]);
      setToolResult(null);
    }
  }, [isConnected, client]);

  const selectedToolObj = tools.find(t => t.name === selectedTool);

  return (
    <div className="p-2">
      <h2 className="mb-4 text-xl font-bold dark:text-white">Tools</h2>

      {!isConnected ? (
        <Alert color="info">
          Connect to an MCP server to test tools
        </Alert>
      ) : (
        <>
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-white">Available Tools</h3>
              <Button 
                size="xs" 
                onClick={fetchTools} 
                disabled={loading}
                isProcessing={loading}
              >
                Refresh
              </Button>
            </div>

            {error && (
              <Alert color="failure" className="mb-4">
                {error}
              </Alert>
            )}

            {loading ? (
              <div className="flex justify-center p-4">
                <Spinner size="xl" />
              </div>
            ) : (
              <>
                <Accordion className="mb-4">
                  <Accordion.Panel>
                    <Accordion.Title>Tools ({tools.length})</Accordion.Title>
                    <Accordion.Content>
                      {tools.length === 0 ? (
                        <p className="text-gray-500">No tools available</p>
                      ) : (
                        <div className="space-y-2">
                          {tools.map((tool, index) => (
                            <div 
                              key={index} 
                              className={`cursor-pointer rounded-lg p-3 ${
                                selectedTool === tool.name 
                                  ? 'bg-blue-100 dark:bg-blue-900' 
                                  : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600'
                              }`}
                              onClick={() => handleToolSelect(tool.name)}
                            >
                              <div className="mb-1 font-semibold">{tool.name}</div>
                              {tool.description && (
                                <div className="mb-1 text-sm text-gray-600 dark:text-gray-300">{tool.description}</div>
                              )}
                              {tool.parameters && Object.keys(tool.parameters).length > 0 && (
                                <div className="mt-2">
                                  <div className="text-sm font-medium">Parameters:</div>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {Object.entries(tool.parameters).map(([key, value]: [string, any]) => (
                                      <Badge key={key} color="info" className="text-xs">
                                        {key}{value.required ? '*' : ''}: {value.type || 'any'}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </Accordion.Content>
                  </Accordion.Panel>
                </Accordion>

                {selectedToolObj && (
                  <div className="mb-4">
                    <h3 className="mb-2 text-lg font-semibold dark:text-white">
                      Tool: {selectedToolObj.name}
                    </h3>
                    
                    <div className="mb-4">
                      <div className="mb-2 flex items-center">
                        <Label htmlFor="jsonMode" className="mr-2">JSON Mode</Label>
                        <input
                          id="jsonMode"
                          type="checkbox"
                          checked={jsonMode}
                          onChange={(e) => setJsonMode(e.target.checked)}
                          className="size-4"
                        />
                      </div>
                      
                      {jsonMode ? (
                        <div>
                          <div className="mb-1 block">
                            <Label htmlFor="jsonArgs" value="Arguments (JSON)" />
                          </div>
                          <Textarea
                            id="jsonArgs"
                            value={jsonArgsText}
                            onChange={(e) => setJsonArgsText(e.target.value)}
                            rows={5}
                            className="font-mono"
                          />
                        </div>
                      ) : (
                        selectedToolObj.parameters && Object.keys(selectedToolObj.parameters).length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-medium dark:text-white">Parameters</h4>
                            {Object.entries(selectedToolObj.parameters).map(([key, value]: [string, any]) => (
                              <div key={key}>
                                <div className="mb-1 block">
                                  <Label htmlFor={`arg-${key}`} value={`${key}${value.required ? ' *' : ''}`} />
                                  {value.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{value.description}</p>
                                  )}
                                </div>
                                <TextInput
                                  id={`arg-${key}`}
                                  value={toolArgs[key] || ""}
                                  onChange={(e) => handleToolArgChange(key, e.target.value)}
                                  required={value.required}
                                />
                              </div>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                    
                    <Button 
                      onClick={callTool} 
                      disabled={loadingTool}
                      isProcessing={loadingTool}
                    >
                      Call Tool
                    </Button>
                  </div>
                )}

                {toolError && (
                  <Alert color="failure" className="mb-4">
                    {toolError}
                  </Alert>
                )}

                {toolResult && (
                  <div className="mt-4">
                    <h3 className="mb-2 text-lg font-semibold dark:text-white">Tool Result</h3>
                    <div className="max-h-[400px] overflow-auto rounded-lg bg-gray-100 p-4 dark:bg-gray-700">
                      <pre className="whitespace-pre-wrap break-all">
                        {JSON.stringify(toolResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
} 