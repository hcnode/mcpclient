import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Store active MCP clients
const activeClients: Record<string, { client: any, transport: any, process?: any }> = {};

export async function POST(request: NextRequest) {
  try {
    const { action, sessionId, command, args, method, params } = await request.json();
    console.log(`API request: ${action}, sessionId: ${sessionId}, method: ${method}`);

    // Create a new MCP client
    if (action === 'connect') {
      // Check if a client with this sessionId already exists
      if (activeClients[sessionId]) {
        try {
          await activeClients[sessionId].client.close();
          if (activeClients[sessionId].process) {
            activeClients[sessionId].process.kill();
          }
        } catch (err) {
          console.error('Error closing existing client:', err);
        }
        delete activeClients[sessionId];
      }

      // Create a new client
      try {
        // Parse the command to separate the executable and its arguments
        const commandParts = command.split(' ');
        const executable = commandParts[0];
        const execArgs = commandParts.slice(1);
        
        // Add any additional arguments
        const argsArray = args ? args.split(' ').filter((arg: string) => arg.trim() !== '') : [];
        const allArgs = [...execArgs, ...argsArray];
        
        console.log(`Spawning process: ${executable} with args:`, allArgs);
        const childProcess = spawn(executable, allArgs);
        
        // Log stdout and stderr for debugging
        childProcess.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
        });
        
        childProcess.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
        });
        
        childProcess.on('error', (err) => {
          console.error('Failed to start subprocess:', err);
        });

        const transport = new StdioClientTransport({
          command: executable,
          args: allArgs,
          childProcess // This is not used by the SDK but we're passing it for our own tracking
        } as any); // Using 'as any' to bypass TypeScript checking for the childProcess property

        // Store the child process separately
        activeClients[sessionId] = { 
          client: null, 
          transport,
          process: childProcess
        };

        const client = new Client(
          {
            name: 'mcp-client-tester',
            version: '1.0.0'
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
          console.log(`Received message:`, JSON.stringify(message));
        };

        await client.connect(transport);
        console.log('Client connected successfully');
        
        activeClients[sessionId].client = client;

        return NextResponse.json({ success: true, message: 'Connected successfully' });
      } catch (err: any) {
        console.error('Error connecting to MCP server:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
      }
    }
    
    // Disconnect an existing client
    else if (action === 'disconnect') {
      if (!activeClients[sessionId]) {
        return NextResponse.json({ success: false, error: 'No active client found' }, { status: 404 });
      }

      try {
        await activeClients[sessionId].client.close();
        if (activeClients[sessionId].process) {
          activeClients[sessionId].process.kill();
        }
        delete activeClients[sessionId];
        return NextResponse.json({ success: true, message: 'Disconnected successfully' });
      } catch (err: any) {
        console.error('Error disconnecting from MCP server:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
      }
    }
    
    // Call a method on an existing client
    else if (action === 'call') {
      if (!activeClients[sessionId]) {
        return NextResponse.json({ success: false, error: 'No active client found' }, { status: 404 });
      }

      try {
        const client = activeClients[sessionId].client;
        console.log(`Calling method ${method} with params:`, params);
        
        let result;
        try {
          switch (method) {
            case 'listResources':
              result = await client.listResources();
              break;
            case 'listResourceTemplates':
              result = await client.listResourceTemplates();
              break;
            case 'readResource':
              result = await client.readResource(params);
              break;
            case 'listPrompts':
              result = await client.listPrompts();
              break;
            case 'getPrompt':
              result = await client.getPrompt(params);
              break;
            case 'listTools':
              result = await client.listTools();
              break;
            case 'callTool':
              result = await client.callTool(params);
              break;
            default:
              return NextResponse.json({ success: false, error: `Unknown method: ${method}` }, { status: 400 });
          }
          
          console.log(`Method ${method} result:`, result);
          return NextResponse.json({ success: true, result });
        } catch (methodErr: any) {
          console.error(`Error calling method ${method}:`, methodErr);
          return NextResponse.json({ 
            success: false, 
            error: methodErr.message,
            stack: methodErr.stack,
            code: methodErr.code,
            data: methodErr.data
          }, { status: 500 });
        }
      } catch (err: any) {
        console.error(`Error in call action:`, err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
      }
    }
    
    else {
      return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Error processing request:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
} 