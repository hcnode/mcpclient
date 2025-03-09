"use client";

import { useState, useEffect } from "react";
import { Button, TextInput, Label, Accordion, Spinner, Alert, Badge } from "flowbite-react";

interface ResourcesPanelProps {
  isConnected: boolean;
  client: any;
  addLog: (message: string) => void;
}

export default function ResourcesPanel({ isConnected, client, addLog }: ResourcesPanelProps) {
  const [resources, setResources] = useState<any[]>([]);
  const [resourceTemplates, setResourceTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resourceUri, setResourceUri] = useState("");
  const [resourceContent, setResourceContent] = useState<any | null>(null);
  const [loadingResource, setLoadingResource] = useState(false);
  const [resourceError, setResourceError] = useState<string | null>(null);

  const fetchResources = async () => {
    if (!isConnected || !client) return;

    try {
      setLoading(true);
      setError(null);
      addLog("Fetching resources...");

      const resourcesList = await client.listResources();
      setResources(resourcesList.resources || []);
      addLog(`Fetched ${resourcesList.resources?.length || 0} resources`);

      const templatesResult = await client.listResourceTemplates();
      setResourceTemplates(templatesResult.templates || []);
      addLog(`Fetched ${templatesResult.templates?.length || 0} resource templates`);
    } catch (err: any) {
      addLog(`Error fetching resources: ${err.message}`);
      setError(`Error fetching resources: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchResource = async () => {
    if (!isConnected || !client || !resourceUri) return;

    try {
      setLoadingResource(true);
      setResourceError(null);
      setResourceContent(null);
      addLog(`Fetching resource: ${resourceUri}`);

      const result = await client.readResource({ uri: resourceUri });
      setResourceContent(result);
      addLog(`Successfully fetched resource: ${resourceUri}`);
    } catch (err: any) {
      addLog(`Error fetching resource: ${err.message}`);
      setResourceError(`Error fetching resource: ${err.message}`);
    } finally {
      setLoadingResource(false);
    }
  };

  useEffect(() => {
    if (isConnected && client) {
      fetchResources();
    } else {
      setResources([]);
      setResourceTemplates([]);
      setResourceContent(null);
    }
  }, [isConnected, client]);

  return (
    <div className="p-2">
      <h2 className="mb-4 text-xl font-bold dark:text-white">Resources</h2>

      {!isConnected ? (
        <Alert color="info">
          Connect to an MCP server to test resources
        </Alert>
      ) : (
        <>
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-white">Available Resources</h3>
              <Button 
                size="xs" 
                onClick={fetchResources} 
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
                    <Accordion.Title>Resource Templates ({resourceTemplates.length})</Accordion.Title>
                    <Accordion.Content>
                      {resourceTemplates.length === 0 ? (
                        <p className="text-gray-500">No resource templates available</p>
                      ) : (
                        <div className="space-y-2">
                          {resourceTemplates.map((template, index) => (
                            <div key={index} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                              <div className="mb-1 font-semibold">{template.pattern}</div>
                              {template.description && (
                                <div className="mb-1 text-sm text-gray-600 dark:text-gray-300">{template.description}</div>
                              )}
                              {template.parameters && Object.keys(template.parameters).length > 0 && (
                                <div className="mt-2">
                                  <div className="text-sm font-medium">Parameters:</div>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {Object.entries(template.parameters).map(([key, value]: [string, any]) => (
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
                  <Accordion.Panel>
                    <Accordion.Title>Resources ({resources.length})</Accordion.Title>
                    <Accordion.Content>
                      {resources.length === 0 ? (
                        <p className="text-gray-500">No resources available</p>
                      ) : (
                        <div className="space-y-2">
                          {resources.map((resource, index) => (
                            <div key={index} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                              <div 
                                className="cursor-pointer font-mono text-blue-600 hover:underline dark:text-blue-400"
                                onClick={() => {
                                  setResourceUri(resource.uri);
                                  fetchResource();
                                }}
                              >
                                {resource.uri}
                              </div>
                              {resource.description && (
                                <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{resource.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </Accordion.Content>
                  </Accordion.Panel>
                </Accordion>

                <div className="mb-4">
                  <h3 className="mb-2 text-lg font-semibold dark:text-white">Fetch Resource</h3>
                  <div className="flex gap-2">
                    <div className="grow">
                      <TextInput
                        id="resourceUri"
                        placeholder="Enter resource URI"
                        value={resourceUri}
                        onChange={(e) => setResourceUri(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={fetchResource} 
                      disabled={!resourceUri || loadingResource}
                      isProcessing={loadingResource}
                    >
                      Fetch
                    </Button>
                  </div>
                </div>

                {resourceError && (
                  <Alert color="failure" className="mb-4">
                    {resourceError}
                  </Alert>
                )}

                {resourceContent && (
                  <div className="mt-4">
                    <h3 className="mb-2 text-lg font-semibold dark:text-white">Resource Content</h3>
                    <div className="max-h-[400px] overflow-auto rounded-lg bg-gray-100 p-4 dark:bg-gray-700">
                      <pre className="whitespace-pre-wrap break-all">
                        {JSON.stringify(resourceContent, null, 2)}
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