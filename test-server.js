// A simple MCP server for testing
const { z } = require('zod');
const { McpServer, ResourceTemplate } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { GetPromptRequestSchema, ListPromptsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

// Log errors to help with debugging
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

// Create an MCP server
const server = new McpServer({
  name: "Test Server",
  version: "1.0.0"
}, {
  capabilities: {
    prompts: {}
  }
});

// Add a simple addition tool
server.tool("add",
  { 
    a: z.number().describe("First number to add"), 
    b: z.number().describe("Second number to add") 
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(Number(a) + Number(b)) }]
  })
);

// Define our prompts
const PROMPTS = {
  "greeting": {
    name: "greeting",
    description: "A simple greeting prompt",
    arguments: [
      {
        name: "personName",
        description: "Name of the person to greet",
        required: true
      },
      {
        name: "formal",
        description: "Whether to use formal greeting",
        required: false
      }
    ]
  },
  "echo": {
    name: "echo",
    description: "Echoes back the input message",
    arguments: [
      {
        name: "message",
        description: "Message to echo",
        required: true
      }
    ]
  }
};

// List available prompts
server.server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: Object.values(PROMPTS)
  };
});

// Get specific prompt
server.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  console.error(`GetPrompt called with: ${JSON.stringify(request.params)}`);
  
  const promptName = request.params.name;
  // Extract arguments from both formats - either nested under 'arguments' or directly in params
  const promptArgs = request.params.arguments || {};
  
  // Handle client sending arguments directly in params (not nested under 'arguments')
  // This is for backward compatibility with the client implementation
  Object.keys(request.params).forEach(key => {
    if (key !== 'name' && key !== 'arguments') {
      promptArgs[key] = request.params[key];
    }
  });
  
  console.error(`Processed args: ${JSON.stringify(promptArgs)}`);
  
  if (!PROMPTS[promptName]) {
    throw new Error(`Prompt not found: ${promptName}`);
  }

  if (promptName === "greeting") {
    const { personName, formal } = promptArgs;
    
    if (!personName) {
      throw new Error("personName is required");
    }
    
    const greeting = formal === "true" ? "Greetings" : "Hello";
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `${greeting}, ${personName}!`
          }
        }
      ]
    };
  }

  if (promptName === "echo") {
    const { message } = promptArgs;
    if (!message) {
      throw new Error("message is required");
    }
    
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: message
          }
        }
      ]
    };
  }

  throw new Error("Prompt implementation not found");
});

// Add a simple greeting resource template
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", {
    parameters: {
      name: z.string().describe("Name to greet")
    }
  }),
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `Hello, ${name}!`
    }]
  })
);

// Add a static example resource directly
server.resource(
  "example",
  "example://hello",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: "Hello, world! This is a static resource."
    }]
  })
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
console.error("Starting MCP server...");
server.connect(transport).catch(err => {
  console.error("Error connecting server:", err);
  process.exit(1);
}); 