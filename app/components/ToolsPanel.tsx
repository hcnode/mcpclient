"use client";

import { useState, useEffect } from "react";
import { Button, TextInput, Label, Accordion, Spinner, Alert, Badge, Textarea, ToggleSwitch } from "flowbite-react";

// Define example JSON outside the component to avoid linter issues
const exampleJson = `{
  "a": 5,
  "b": 3
}`;

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
  const [jsonArgsText, setJsonArgsText] = useState('{\n  "a": 5,\n  "b": 3\n}');

  const fetchTools = async () => {
    if (!isConnected || !client) return;

    try {
      setLoading(true);
      setError(null);
      addLog("Fetching tools...");

      const toolsList = await client.listTools();
      setTools(toolsList.tools || []);
      
      // Log detailed tool information
      if (toolsList.tools && toolsList.tools.length > 0) {
        toolsList.tools.forEach((tool: any) => {
          addLog(`Tool: ${tool.name}`);
          if (tool.inputSchema) {
            if (tool.inputSchema.properties) {
              Object.entries(tool.inputSchema.properties).forEach(([key, value]: [string, any]) => {
                const isRequired = tool.inputSchema.required && tool.inputSchema.required.includes(key);
                addLog(`  Parameter: ${key}${isRequired ? ' (required)' : ''} - Type: ${value.type}`);
                if (value.description) {
                  addLog(`    Description: ${value.description}`);
                }
              });
            }
          }
        });
      }
      
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
      } else {
        // Convert string values to appropriate types based on parameter definitions
        const selectedToolObj = tools.find(t => t.name === selectedTool);
        if (selectedToolObj) {
          const convertedArgs: Record<string, any> = {};
          
          // Check for inputSchema first
          if (selectedToolObj.inputSchema && selectedToolObj.inputSchema.properties) {
            Object.entries(toolArgs).forEach(([key, value]) => {
              const paramInfo = selectedToolObj.inputSchema.properties[key];
              if (paramInfo) {
                if (paramInfo.type === 'number' || paramInfo.type === 'integer') {
                  convertedArgs[key] = Number(value);
                } else if (paramInfo.type === 'boolean') {
                  convertedArgs[key] = value === 'true';
                } else {
                  convertedArgs[key] = value;
                }
              } else {
                convertedArgs[key] = value;
              }
            });
          } 
          // Fall back to parameters if inputSchema is not available
          else if (selectedToolObj.parameters) {
            Object.entries(toolArgs).forEach(([key, value]) => {
              const paramInfo = selectedToolObj.parameters[key];
              if (paramInfo) {
                if (paramInfo.type === 'number' || paramInfo.type === 'integer') {
                  convertedArgs[key] = Number(value);
                } else if (paramInfo.type === 'boolean') {
                  convertedArgs[key] = value === 'true';
                } else {
                  convertedArgs[key] = value;
                }
              } else {
                convertedArgs[key] = value;
              }
            });
          } else {
            Object.assign(convertedArgs, toolArgs);
          }
          
          args = convertedArgs;
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
    if (selectedToolObj) {
      const initialArgs: Record<string, any> = {};
      
      // Check for inputSchema first
      if (selectedToolObj.inputSchema && selectedToolObj.inputSchema.properties) {
        Object.entries(selectedToolObj.inputSchema.properties).forEach(([key, value]: [string, any]) => {
          initialArgs[key] = "";
        });
        
        // Create a nicely formatted JSON template with the required parameters
        const jsonTemplate: Record<string, any> = {};
        Object.entries(selectedToolObj.inputSchema.properties).forEach(([key, value]: [string, any]) => {
          // Add example values based on parameter type
          if (value.type === 'number' || value.type === 'integer') {
            jsonTemplate[key] = 0;
          } else if (value.type === 'boolean') {
            jsonTemplate[key] = false;
          } else if (value.type === 'array') {
            jsonTemplate[key] = [];
          } else if (value.type === 'object') {
            jsonTemplate[key] = {};
          } else {
            jsonTemplate[key] = "";
          }
        });
        setJsonArgsText(JSON.stringify(jsonTemplate, null, 2));
      } 
      // Fall back to parameters if inputSchema is not available
      else if (selectedToolObj.parameters) {
        Object.entries(selectedToolObj.parameters).forEach(([key, value]: [string, any]) => {
          initialArgs[key] = "";
        });
        
        // Create a nicely formatted JSON template with the required parameters
        const jsonTemplate: Record<string, any> = {};
        Object.entries(selectedToolObj.parameters).forEach(([key, value]: [string, any]) => {
          // Add example values based on parameter type
          if (value.type === 'number' || value.type === 'integer') {
            jsonTemplate[key] = 0;
          } else if (value.type === 'boolean') {
            jsonTemplate[key] = false;
          } else if (value.type === 'array') {
            jsonTemplate[key] = [];
          } else if (value.type === 'object') {
            jsonTemplate[key] = {};
          } else {
            jsonTemplate[key] = "";
          }
        });
        setJsonArgsText(JSON.stringify(jsonTemplate, null, 2));
      } else {
        setJsonArgsText("{}");
      }
      
      setToolArgs(initialArgs);
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
  const hasParameters = selectedToolObj && 
                       ((selectedToolObj.parameters && Object.keys(selectedToolObj.parameters).length > 0) ||
                        (selectedToolObj.inputSchema && selectedToolObj.inputSchema.properties && 
                         Object.keys(selectedToolObj.inputSchema.properties).length > 0));

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
                              {tool.inputSchema && (
                                <div className="mt-2">
                                  <div className="text-sm font-medium">Parameters:</div>
                                  <div className="mt-1">
                                    {tool.inputSchema.properties && Object.entries(tool.inputSchema.properties).map(([key, value]: [string, any]) => (
                                      <div key={key} className="mb-2 rounded border border-gray-200 p-2 dark:border-gray-600">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{key}</span>
                                          {tool.inputSchema.required && tool.inputSchema.required.includes(key) && (
                                            <Badge color="red" size="xs">Required</Badge>
                                          )}
                                        </div>
                                        <div className="mt-1 text-xs">
                                          <div><strong>Type:</strong> {value.type}</div>
                                          {value.description && <div><strong>Description:</strong> {value.description}</div>}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
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
                        <span className="mr-2">Form Mode</span>
                        <ToggleSwitch
                          checked={jsonMode}
                          onChange={setJsonMode}
                          label="JSON Mode"
                        />
                      </div>
                      
                      {jsonMode ? (
                        <div>
                          <div className="mb-1 block">
                            <Label htmlFor="jsonArgs" value="Arguments (JSON)" />
                            <p className="mt-1 text-xs text-gray-500">Enter parameters as JSON object</p>
                          </div>
                          <Textarea
                            id="jsonArgs"
                            value={jsonArgsText}
                            onChange={(e) => setJsonArgsText(e.target.value)}
                            rows={8}
                            className="font-mono"
                          />
                          <div className="mt-2">
                            <Alert color="info">
                              <div className="text-sm">
                                <p className="font-medium">Example for &quot;add&quot; tool:</p>
                                <pre className="mt-1 rounded bg-gray-100 p-2 dark:bg-gray-800">
                                  {exampleJson}
                                </pre>
                              </div>
                            </Alert>
                          </div>
                        </div>
                      ) : (
                        hasParameters ? (
                          <div className="space-y-3">
                            <h4 className="font-medium dark:text-white">Parameters</h4>
                            {selectedToolObj.inputSchema && selectedToolObj.inputSchema.properties ? (
                              // Use inputSchema if available
                              Object.entries(selectedToolObj.inputSchema.properties).map(([key, value]: [string, any]) => {
                                const isRequired = selectedToolObj.inputSchema.required && 
                                                  selectedToolObj.inputSchema.required.includes(key);
                                return (
                                  <div key={key}>
                                    <div className="mb-1 block">
                                      <Label htmlFor={`arg-${key}`} value={`${key}${isRequired ? ' *' : ''}`} />
                                      {value.description && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{value.description}</p>
                                      )}
                                    </div>
                                    <TextInput
                                      id={`arg-${key}`}
                                      value={toolArgs[key] || ""}
                                      onChange={(e) => handleToolArgChange(key, e.target.value)}
                                      required={isRequired}
                                      placeholder={value.type === 'number' ? "0" : value.type === 'boolean' ? "true/false" : ""}
                                    />
                                  </div>
                                );
                              })
                            ) : (
                              // Fall back to parameters if inputSchema is not available
                              Object.entries(selectedToolObj.parameters).map(([key, value]: [string, any]) => (
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
                                    placeholder={value.type === 'number' ? "0" : value.type === 'boolean' ? "true/false" : ""}
                                  />
                                </div>
                              ))
                            )}
                          </div>
                        ) : (
                          <Alert color="info">
                            This tool doesn&apos;t have any parameters
                          </Alert>
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
                      <div className="mb-2">
                        <Badge color="success" className="mb-2">Success</Badge>
                      </div>
                      <Accordion>
                        <Accordion.Panel>
                          <Accordion.Title>Raw Response</Accordion.Title>
                          <Accordion.Content>
                            <pre className="whitespace-pre-wrap break-all">
                              {JSON.stringify(toolResult, null, 2)}
                            </pre>
                          </Accordion.Content>
                        </Accordion.Panel>
                      </Accordion>
                      
                      {toolResult.content && (
                        <div className="mt-4">
                          <h4 className="mb-2 font-medium">Content:</h4>
                          {toolResult.content.map((item: any, index: number) => (
                            <div key={index} className="mb-2 rounded border border-gray-200 p-2 dark:border-gray-600">
                              <div><strong>Type:</strong> {item.type}</div>
                              {item.text && <div className="mt-1"><strong>Text:</strong> {item.text}</div>}
                              {item.url && <div className="mt-1"><strong>URL:</strong> <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">{item.url}</a></div>}
                            </div>
                          ))}
                        </div>
                      )}
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