import React, { useState, useRef, useEffect } from 'react';

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const chatContainerRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;
  const reconnectAttemptRef = useRef(0);

  // Load saved messages from localStorage
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem('chatMessages');
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages)) {
          setMessages(parsedMessages);
        }
      }
    } catch (error) {
      console.error('Error loading saved messages:', error);
      localStorage.removeItem('chatMessages');
    }
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const retryConnection = () => {
    reconnectAttemptRef.current = 0;
    setConnectionStatus('connecting');
    connectWebSocket();
  };

  const connectWebSocket = () => {
    try {
      if (reconnectAttemptRef.current >= maxReconnectAttempts) {
        setConnectionStatus('failed');
        return;
      }

      const ws = new WebSocket('ws://localhost:8080');
      
      ws.onopen = () => {
        console.log('Connected to chat server');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptRef.current = 0;
        
        // Send welcome message if no messages exist
        if (messages.length === 0) {
          setMessages([{
            role: 'assistant',
            content: 'Hello! I\'m your AI assistant. How can I help you today?'
          }]);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Filter out the default website message
          if (typeof data === 'string' && data.includes("I'm here to help! You can ask a question or use the contact buttons below.")) {
            setIsLoading(false);
            return;
          }

          // Handle both string messages and structured messages
          if (typeof data === 'string') {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: data
            }]);
            setIsLoading(false);
            return;
          }
          
          switch(data.type) {
            case 'ai_response':
              if (typeof data.message === 'string') {
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: data.message
                }]);
                setIsLoading(false);
              }
              break;
            
            case 'message':
              if (typeof data.content === 'string') {
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: data.content
                }]);
                setIsLoading(false);
              }
              break;
            
            case 'connection_status':
              if (typeof data.status === 'string') {
                setConnectionStatus(data.status);
              }
              break;
            
            case 'error':
              console.error('Server error:', data.message);
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'I apologize, but I encountered an error. Please try again.'
              }]);
              setIsLoading(false);
              break;
            
            default:
              // Handle untyped messages
              if (data.message || data.content || data.response) {
                const messageContent = data.message || data.content || data.response;
                // Filter out the default website message
                if (messageContent && !messageContent.includes("I'm here to help! You can ask a question or use the contact buttons below.")) {
                  setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: messageContent
                  }]);
                }
                setIsLoading(false);
              } else {
                console.warn('Unknown message format:', data);
              }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          // Try to handle raw message
          if (typeof event.data === 'string') {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: event.data
            }]);
          } else {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: 'I apologize, but I encountered an error processing the response.'
            }]);
          }
          setIsLoading(false);
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from chat server');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        reconnectAttemptRef.current += 1;
        
        if (reconnectAttemptRef.current < maxReconnectAttempts) {
          setConnectionStatus('reconnecting');
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        } else {
          setConnectionStatus('failed');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        ws.close();
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setConnectionStatus('error');
      reconnectAttemptRef.current += 1;
      if (reconnectAttemptRef.current < maxReconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      }
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isConnected || !wsRef.current) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Send message in the format expected by the server
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        query: userMessage,
        message: userMessage
      }));
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.'
      }]);
      setIsLoading(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const startNewChat = () => {
    // Clear localStorage
    localStorage.removeItem('chatMessages');
    
    // Reset messages with welcome message
    setMessages([{
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. How can I help you today?'
    }]);

    // Reset WebSocket connection if needed
    if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
      wsRef.current.close();
      connectWebSocket();
    }
  };

  const getStatusIndicator = () => {
    switch(connectionStatus) {
      case 'connected':
        return <span className="w-2 h-2 rounded-full bg-green-500"></span>;
      case 'connecting':
      case 'reconnecting':
        return <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>;
      case 'error':
      case 'failed':
        return <span className="w-2 h-2 rounded-full bg-red-500"></span>;
      default:
        return <span className="w-2 h-2 rounded-full bg-gray-500"></span>;
    }
  };

  return (
    <div className={`fixed ${isMinimized ? 'bottom-4 right-4 w-16 h-16' : 'bottom-4 right-4 w-96 h-[600px]'} transition-all duration-300 ease-in-out z-50`}>
      {isMinimized ? (
        <button
          onClick={toggleMinimize}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
          </svg>
        </button>
      ) : (
        <div className="bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden h-full">
          <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIndicator()}
              <h3 className="font-semibold">AI Assistant</h3>
              {connectionStatus === 'failed' && (
                <button
                  onClick={retryConnection}
                  className="ml-2 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors"
                  title="Retry Connection"
                >
                  Retry
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={startNewChat}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Start New Chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <button
                onClick={toggleMinimize}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Minimize"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
          >
            {connectionStatus === 'failed' && (
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg text-sm">
                  Connection failed. Please click retry to reconnect.
                </div>
              </div>
            )}
            {connectionStatus === 'connecting' && (
              <div className="flex justify-center mb-4">
                <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm">
                  Connecting to chat server...
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-2xl bg-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!isConnected || isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || !isConnected || isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
