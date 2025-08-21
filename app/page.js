"use client";
import { useState, useEffect } from "react";
import Footer from "./components/Footer";

export default function Home() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [messageIdCounter, setMessageIdCounter] = useState(1);
  const [streaming, setStreaming] = useState("");
  const [streamResponse, setStreamResponse] = useState("");

  // Helper function to get current time (client-side only)
  const getCurrentTime = () => {
    if (typeof window !== 'undefined') {
      return new Date().toLocaleTimeString();
    }
    return '';
  };

  // Initialize timestamps on client side
  useEffect(() => {
    if (chatHistory.length > 0) {
      setChatHistory(prev => prev.map(msg => ({
        ...msg,
        timestamp: msg.timestamp || getCurrentTime()
      })));
    }
  }, []);

  const handleChat = async () => {
    if (!message.trim() || loading) return;
    
    const userMessage = message.trim();
    setLoading(true);
    setMessage("");

    // Add user message to chat history
    const newUserMessage = {
      id: messageIdCounter,
      type: 'user',
      content: userMessage,
      timestamp: getCurrentTime()
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();
      
      // Add AI response to chat history
      const newAIMessage = {
        id: messageIdCounter + 1,
        type: 'ai',
        content: data.response || "Sorry, I couldn't process that request.",
        timestamp: getCurrentTime()
      };

      // Update chat history (keep only last 50 messages)
      setChatHistory(prev => {
        const updated = [...prev, newUserMessage, newAIMessage];
        return updated.slice(-50);
      });

      // Increment counter for next messages
      setMessageIdCounter(prev => prev + 2);

    } catch (error) {
      // Add error message to chat history
      const errorMessage = {
        id: messageIdCounter + 1,
        type: 'error',
        content: "Error: " + error.message,
        timestamp: getCurrentTime()
      };

      setChatHistory(prev => {
        const updated = [...prev, newUserMessage, errorMessage];
        return updated.slice(-50);
      });

      // Increment counter for next messages
      setMessageIdCounter(prev => prev + 2);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-purple-400 rounded-full animate-float opacity-60" style={{animationDelay: '0s', animationDuration: '3s'}}></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-blue-400 rounded-full animate-float opacity-40" style={{animationDelay: '1s', animationDuration: '4s'}}></div>
        <div className="absolute top-60 left-1/4 w-1.5 h-1.5 bg-pink-400 rounded-full animate-float opacity-50" style={{animationDelay: '2s', animationDuration: '5s'}}></div>
        <div className="absolute top-80 right-1/3 w-1 h-1 bg-purple-300 rounded-full animate-float opacity-30" style={{animationDelay: '0.5s', animationDuration: '6s'}}></div>
        <div className="absolute top-32 left-1/2 w-2 h-2 bg-blue-300 rounded-full animate-float opacity-70" style={{animationDelay: '1.5s', animationDuration: '4.5s'}}></div>
      </div>
      
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
        <div className="relative px-6 py-8 text-center">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 animate-gradient-shift">
            Chugli Kro
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Your Gossip Shaheli, here to laugh, rant, and secret with you! ✨
          </p>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="max-w-4xl mx-auto px-6 pb-8 mt-3">
        <div className="glass-dark rounded-2xl border border-white/10 shadow-2xl animate-pulse-glow">
          {/* Chat Messages */}
          <div className="p-6 min-h-[400px] max-h-[500px] overflow-y-auto">
            {chatHistory.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <p>Start a conversation! Type your message below. 💬</p>
              </div>
            )}
            
            {chatHistory.map((msg) => (
              <div key={msg.id} className={`mb-6 animate-slide-in-right ${msg.type === 'user' ? 'flex justify-end' : ''}`}>
                <div className={`flex items-start space-x-3 ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 animate-float ${
                    msg.type === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                      : msg.type === 'error'
                      ? 'bg-gradient-to-r from-red-500 to-pink-500'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500'
                  }`}>
                    <span className="text-white text-sm font-bold">
                      {msg.type === 'user' ? 'You' : msg.type === 'error' ? '!' : 'BFF'}
                    </span>
                  </div>
                  <div className={`glass rounded-2xl p-4 border flex-1 hover-lift max-w-[80%] ${
                    msg.type === 'user' 
                      ? 'border-blue-500/30 bg-blue-500/20' 
                      : msg.type === 'error'
                      ? 'border-red-500/30 bg-red-500/20'
                      : 'border-purple-500/30'
                  }`}>
                    <p className="text-gray-200 leading-relaxed">{msg.content}</p>
                    <p className="text-xs text-gray-400 mt-2">{msg.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="mb-6 animate-slide-in-right">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 animate-float">
                    <span className="text-white text-sm font-bold">BFF</span>
                  </div>
                  <div className="glass rounded-2xl p-4 border border-purple-500/30 flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
                      <span className="text-gray-300">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Section */}
          <div className="p-6 border-t border-white/10 glass">
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full px-4 py-3 glass border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-200 input-magic"
                  style={{ minHeight: "60px", maxHeight: "120px" }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (message.trim() && !loading) {
                        handleChat();
                      }
                    }
                  }}
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  Press Enter to send
                </div>
              </div>
              <button
                onClick={handleChat}
                disabled={loading || !message.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg hover:shadow-xl btn-magic"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Send</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
            {/* Features Section */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
       
       {/* Card 1 */}
       <div className="glass rounded-xl p-6 border border-white/10 text-center hover-lift animate-slide-in-left" style={{animationDelay: '0.1s'}}>
         <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mx-auto mb-4 flex items-center justify-center animate-float">
           <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
           </svg>
         </div>
         <h3 className="text-lg font-semibold text-cyan-300 mb-2">
           🗣️ Chugli & Gossip like Full-Tu Aunty
         </h3>
         <p className="text-cyan-200/80 text-sm">
           Discuss your neighbor's Wi-Fi password, rishtas, or random celeb drama — 
           AI aunty never runs out of masala! 😏
         </p>
       </div>

       {/* Card 2 */}
       <div className="glass rounded-xl p-6 border border-white/10 text-center hover-lift animate-slide-in-left" style={{animationDelay: '0.2s'}}>
         <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mx-auto mb-4 flex items-center justify-center animate-float" style={{animationDelay: '0.5s'}}>
           <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
           </svg>
         </div>
         <h3 className="text-lg font-semibold text-pink-300 mb-2">
           ⚡ Gossip Faster than Shaadi.com Rishtas
         </h3>
         <p className="text-pink-200/80 text-sm">
           Instant replies: funny, judgmental, and sometimes ego-hurting. 
           Just like real aunties at kitty parties! 🫣
         </p>
       </div>

       {/* Card 3 */}
       <div className="glass rounded-xl p-6 border border-white/10 text-center hover-lift animate-slide-in-left" style={{animationDelay: '0.3s'}}>
         <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-red-500 rounded-xl mx-auto mb-4 flex items-center justify-center animate-float" style={{animationDelay: '1s'}}>
           <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
         </div>
         <h3 className="text-lg font-semibold text-emerald-300 mb-2">
           �� Aunty on Call, 24x7
         </h3>
         <p className="text-emerald-200/80 text-sm">
           Midnight? 4am? Doesn't matter — AI aunty is always ready for 
           "beta shaadi kab karoge" or spicy gossip! 💅
         </p>
       </div> 
     </div>

     {/* Warning Section */}
     <div className="mt-6 text-center">
       <div className="glass rounded-xl p-4 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
         <div className="flex items-center justify-center space-x-2 mb-2">
           <span className="text-amber-400 text-lg">⚠️</span>
           <span className="text-amber-300 font-semibold">Important Notice</span>
         </div>
         <p className="text-amber-200/80 text-sm">
           �� Your conversations are <span className="font-semibold text-amber-300">NOT saved</span> to any database. 
           If you refresh the page or close the browser, all your chugli will be lost! 
           Keep screenshots of important gossip! 📸
         </p>
       </div>
     </div>


        
        
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
