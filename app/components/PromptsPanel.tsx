"use client";

import { useState, useEffect } from "react";
import { Button, TextInput, Label, Accordion, Spinner, Alert, Badge, Textarea } from "flowbite-react";

interface PromptsPanelProps {
  isConnected: boolean;
  client: any;
  addLog: (message: string) => void;
}

export default function PromptsPanel({ isConnected, client, addLog }: PromptsPanelProps) {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  const [promptArgs, setPromptArgs] = useState<Record<string, string>>({});
  const [promptResult, setPromptResult] = useState<any | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);

  const fetchPrompts = async () => {
    if (!isConnected || !client) return;

    try {
      setLoading(true);
      setError(null);
      addLog("Fetching prompts...");

      const promptsList = await client.listPrompts();
      setPrompts(promptsList.prompts || []);
      addLog(`Fetched ${promptsList.prompts?.length || 0} prompts`);
    } catch (err: any) {
      addLog(`Error fetching prompts: ${err.message}`);
      setError(`Error fetching prompts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getPrompt = async () => {
    if (!isConnected || !client || !selectedPrompt) return;

    try {
      setLoadingPrompt(true);
      setPromptError(null);
      setPromptResult(null);
      addLog(`Getting prompt: ${selectedPrompt} with args: ${JSON.stringify(promptArgs)}`);

      const result = await client.getPrompt({ name: selectedPrompt, ...promptArgs });
      setPromptResult(result);
      addLog(`Successfully got prompt: ${selectedPrompt}`);
    } catch (err: any) {
      addLog(`Error getting prompt: ${err.message}`);
      setPromptError(`Error getting prompt: ${err.message}`);
    } finally {
      setLoadingPrompt(false);
    }
  };

  const handlePromptSelect = (promptName: string) => {
    setSelectedPrompt(promptName);
    
    // Reset prompt args
    const selectedPromptObj = prompts.find(p => p.name === promptName);
    if (selectedPromptObj && selectedPromptObj.arguments) {
      const initialArgs: Record<string, string> = {};
      selectedPromptObj.arguments.forEach((arg: any) => {
        initialArgs[arg.name] = "";
      });
      setPromptArgs(initialArgs);
    } else {
      setPromptArgs({});
    }
  };

  const handlePromptArgChange = (argName: string, value: string) => {
    setPromptArgs(prev => ({
      ...prev,
      [argName]: value
    }));
  };

  useEffect(() => {
    if (isConnected && client) {
      fetchPrompts();
    } else {
      setPrompts([]);
      setPromptResult(null);
    }
  }, [isConnected, client]);

  const selectedPromptObj = prompts.find(p => p.name === selectedPrompt);

  return (
    <div className="p-2">
      <h2 className="mb-4 text-xl font-bold dark:text-white">Prompts</h2>

      {!isConnected ? (
        <Alert color="info">
          Connect to an MCP server to test prompts
        </Alert>
      ) : (
        <>
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-white">Available Prompts</h3>
              <Button 
                size="xs" 
                onClick={fetchPrompts} 
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
                    <Accordion.Title>Prompts ({prompts.length})</Accordion.Title>
                    <Accordion.Content>
                      {prompts.length === 0 ? (
                        <p className="text-gray-500">No prompts available</p>
                      ) : (
                        <div className="space-y-2">
                          {prompts.map((prompt, index) => (
                            <div 
                              key={index} 
                              className={`cursor-pointer rounded-lg p-3 ${
                                selectedPrompt === prompt.name 
                                  ? 'bg-blue-100 dark:bg-blue-900' 
                                  : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600'
                              }`}
                              onClick={() => handlePromptSelect(prompt.name)}
                            >
                              <div className="mb-1 font-semibold">{prompt.name}</div>
                              {prompt.description && (
                                <div className="mb-1 text-sm text-gray-600 dark:text-gray-300">{prompt.description}</div>
                              )}
                              {prompt.arguments && prompt.arguments.length > 0 && (
                                <div className="mt-2">
                                  <div className="text-sm font-medium">Arguments:</div>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {prompt.arguments.map((arg: any) => (
                                      <Badge key={arg.name} color="info" className="text-xs">
                                        {arg.name}{arg.required ? '*' : ''}
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

                {selectedPromptObj && (
                  <div className="mb-4">
                    <h3 className="mb-2 text-lg font-semibold dark:text-white">
                      Prompt: {selectedPromptObj.name}
                    </h3>
                    
                    {selectedPromptObj.arguments && selectedPromptObj.arguments.length > 0 && (
                      <div className="mb-4 space-y-3">
                        <h4 className="font-medium dark:text-white">Arguments</h4>
                        {selectedPromptObj.arguments.map((arg: any) => (
                          <div key={arg.name}>
                            <div className="mb-1 block">
                              <Label htmlFor={`arg-${arg.name}`} value={`${arg.name}${arg.required ? ' *' : ''}`} />
                              {arg.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">{arg.description}</p>
                              )}
                            </div>
                            <TextInput
                              id={`arg-${arg.name}`}
                              value={promptArgs[arg.name] || ""}
                              onChange={(e) => handlePromptArgChange(arg.name, e.target.value)}
                              required={arg.required}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <Button 
                      onClick={getPrompt} 
                      disabled={loadingPrompt}
                      isProcessing={loadingPrompt}
                    >
                      Get Prompt
                    </Button>
                  </div>
                )}

                {promptError && (
                  <Alert color="failure" className="mb-4">
                    {promptError}
                  </Alert>
                )}

                {promptResult && (
                  <div className="mt-4">
                    <h3 className="mb-2 text-lg font-semibold dark:text-white">Prompt Result</h3>
                    <div className="max-h-[400px] overflow-auto rounded-lg bg-gray-100 p-4 dark:bg-gray-700">
                      <pre className="whitespace-pre-wrap break-all">
                        {JSON.stringify(promptResult, null, 2)}
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