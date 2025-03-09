import { DarkThemeToggle } from "flowbite-react";
import MCPClientApp from "./components/MCPClientApp";

export default function Home() {
  return (
    <main className="min-h-screen p-4 dark:bg-gray-800">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold dark:text-white">MCP Client Testing App</h1>
        <DarkThemeToggle />
      </div>
      <MCPClientApp />
    </main>
  );
}
