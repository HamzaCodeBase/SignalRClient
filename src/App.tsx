

import React, { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

interface Message {
  user: string;
  content: string;
  privateMsg?: boolean;
  group?: string;
}

const App: React.FC = () => {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [privateTarget, setPrivateTarget] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const connect = async () => {
    if (!username.trim()) return alert("Enter username");

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`https://localhost:7116/chatHub?username=${username}`)
      .withAutomaticReconnect()
      .build();

    conn.on("ReceiveMessage", (user: string, content: string) => {
      setMessages(prev => [...prev, { user, content }]);
    });

    conn.on("ReceivePrivateMessage", (user: string, content: string) => {
      setMessages(prev => [...prev, { user, content, privateMsg: true }]);
    });

    await conn.start();
    setConnection(conn);
  };

  const sendMessage = async () => {
    if (connection && message.trim()) {
      if (privateTarget.trim()) {
        await connection.invoke("SendPrivateMessage", privateTarget, message);
      } else {
        await connection.invoke("SendMessageToAll", message);
      }
      setMessage("");
    }
  };

  if (!connection) {
    return (
      <div className={`${darkMode ? "dark" : ""} h-screen w-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900`}>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-96">
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">
            SignalR Chat
          </h1>

          <input
            className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Your name"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />

          <div className="flex justify-between mt-5 items-center">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="text-sm px-3 py-1 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            >
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>

            <button
              onClick={connect}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-5 rounded-xl font-semibold transition"
            >
              Connect
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? "dark" : ""} h-screen w-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200`}>
      
      {/* Header with current user */}
      <div className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center border-b border-gray-300 dark:border-gray-700">
        <div className="font-semibold text-lg"><span className="text-indigo-600 dark:text-indigo-400">{username}</span></div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="bg-gray-400 dark:bg-gray-600 hover:bg-gray-500 dark:hover:bg-gray-700 text-white px-4 py-1 rounded-xl text-sm"
        >
          {darkMode ? "Light" : "Dark"}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-xs p-3 rounded-2xl text-sm shadow
              ${m.user === username ? "ml-auto bg-indigo-600 text-white" : m.privateMsg ? "ml-auto bg-purple-600 text-white" : "bg-white dark:bg-gray-800"}`}
          >
            <div className="text-xs font-semibold opacity-70 mb-1">{m.user}</div>
            <div>{m.content}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2">
        <input
          className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Type message..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
        />
        <input
          className="w-36 p-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Send to user (optional)"
          value={privateTarget}
          onChange={e => setPrivateTarget(e.target.value)}
        />
        <button
          onClick={sendMessage}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 rounded-xl font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default App;
