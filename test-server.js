// A simple MCP server for testing
const { z } = require('zod');
const { McpServer, ResourceTemplate } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

// Log errors to help with debugging
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

// Create an MCP server
const server = new McpServer({
  name: "Test Server",
  version: "1.0.0"
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