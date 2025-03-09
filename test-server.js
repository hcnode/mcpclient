// A simple MCP server for testing
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

// Create an MCP server
const server = new McpServer({
  name: "Test Server",
  version: "1.0.0"
});

// Add a simple addition tool
server.tool("add",
  { a: { type: "number" }, b: { type: "number" } },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(Number(a) + Number(b)) }]
  })
);

// Add a simple greeting resource
server.resource(
  "greeting",
  { pattern: "greeting://{name}", parameters: { name: { type: "string" } } },
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `Hello, ${name}!`
    }]
  })
);

// Add a simple prompt
server.prompt(
  "greet",
  {
    description: "A simple greeting prompt",
    arguments: [
      {
        name: "name",
        description: "The name to greet",
        required: true
      }
    ]
  },
  async ({ name }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Hello, ${name}! How are you today?`
        }
      }
    ]
  })
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
server.connect(transport).catch(err => {
  console.error("Error connecting server:", err);
  process.exit(1);
}); 