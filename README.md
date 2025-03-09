# MCP Client Testing App

A comprehensive testing application for Model Context Protocol (MCP) servers. This application allows you to connect to and test MCP servers using different transport protocols (stdio and SSE) and test all MCP features including Resources, Prompts, and Tools.

## Features

- **Server Connection**
  - Connect to MCP servers using stdio or SSE protocols
  - View connection status and logs
  - Disconnect from servers

- **Resources Testing**
  - List available resources and resource templates
  - Fetch and view resource content
  - Test resource parameters

- **Prompts Testing**
  - List available prompts
  - Test prompts with custom arguments
  - View prompt results

- **Tools Testing**
  - List available tools
  - Call tools with custom parameters
  - View tool execution results
  - Support for JSON parameter input

- **Debugging**
  - Comprehensive logging of all MCP communications
  - Error handling and display
  - Request/response inspection

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mcpclient.git
   cd mcpclient
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

### Connecting to an MCP Server

1. Select the protocol (stdio or SSE)
2. For stdio:
   - Enter the command to start the server (e.g., `node test-server.js`)
   - Optionally provide command-line arguments
3. For SSE:
   - Enter the server URL (e.g., `http://localhost:3001/mcp`)
4. Click "Connect"

### Testing with the Included Test Server

This repository includes a simple test server (`test-server.js`) that you can use to test the MCP client. The test server provides:

- A simple addition tool that adds two numbers
- A greeting resource that returns a personalized greeting
- A greeting prompt template

To use the test server:

1. In the connection panel, select the "stdio" protocol
2. Enter `node test-server.js` as the command
3. Click "Connect"
4. Once connected, you can test the resources, prompts, and tools provided by the server

### Testing Resources

1. After connecting, the app will automatically fetch available resources
2. Click on a resource to fetch its content
3. Or enter a resource URI manually and click "Fetch"

### Testing Prompts

1. After connecting, the app will automatically fetch available prompts
2. Select a prompt from the list
3. Fill in the required arguments
4. Click "Get Prompt" to execute

### Testing Tools

1. After connecting, the app will automatically fetch available tools
2. Select a tool from the list
3. Fill in the required parameters (using form fields or JSON mode)
4. Click "Call Tool" to execute

## Technologies Used

- Next.js
- React
- Flowbite (UI components)
- TypeScript
- MCP TypeScript SDK

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) for the protocol specification
- MCP TypeScript SDK for the client implementation
