"use client";
import { useState, useEffect, useRef } from "react";
import Footer from "./components/Footer";

export default function Home() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [streaming, setStreaming] = useState("");
  const [streamResponse, setStreamResponse] = useState("");
  const [isClient, setIsClient] = useState(false);
  const chatContainerRef = useRef(null);

  // Generate unique message ID
  const generateMessageId = () => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
//console.log("🔑 Generated message ID:", id);
    return id;
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Scroll to bottom when chat history changes
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Scroll to bottom when streaming response updates
  useEffect(() => {
    if (streaming && streamResponse) {
      scrollToBottom();
    }
  }, [streamResponse, streaming]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getCurrentTime = () => {
    if (isClient) {
      return new Date().toLocaleTimeString();
    }
    return '';
  };

  useEffect(() => {
    if (chatHistory.length > 0 && isClient) {
      setChatHistory(prev => prev.map(msg => ({
        ...msg,
        timestamp: msg.timestamp || getCurrentTime()
      })));
    }
  }, [isClient]);

  // Debug: Log chat history changes
  useEffect(() => {
    if (chatHistory.length > 0) {
   //   console.log("🔍 Chat history updated:", chatHistory.map(msg => ({ id: msg.id, type: msg.type, content: msg.content.substring(0, 20) + "..." })));
    }
  }, [chatHistory]);

  const handleChatStream = async () => {
    if (!message.trim() || loading) return;
    
    const userMessage = message.trim();
  //  console.log("💬 User message:", userMessage);
    
    setLoading(true);
    setMessage("");
    setStreaming(true);
    setStreamResponse("");

    // Generate unique IDs for both messages
    const userMessageId = generateMessageId();
    const aiMessageId = generateMessageId();
    
    const newUserMessage = {
      id: userMessageId,
      type: 'user',
      content: userMessage,
      timestamp: getCurrentTime()
    };

    // Add user message to chat history immediately
  //  console.log("📝 Adding user message with ID:", userMessageId);
    setChatHistory(prev => {
      const updated = [...prev, newUserMessage];
      //console.log("📚 Updated chat history:", updated.map(msg => ({ id: msg.id, type: msg.type })));
      return updated;
    });
    
    try {
    //  console.log("🌐 Making API request to /api/chat-stream...");
      const startTime = Date.now();
      
      const res = await fetch("/api/chat-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userMessage })
      });

      const responseTime = Date.now() - startTime;
    // console.log(`⏱️ API response received in ${responseTime}ms, status:`, res.status);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

     // console.log("📡 Starting to read stream...");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      let chunkCount = 0;
      let firstChunkTime = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
       //   console.log("🏁 Stream reading completed");
          break;
        }

        chunkCount++;
        const chunk = decoder.decode(value);
     //   console.log(`📥 Raw chunk ${chunkCount}:`, chunk);
        
        const lines = chunk.split("\n");
     //   console.log(`📝 Split into ${lines.length} lines:`, lines);

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataContent = line.slice(6);
         //   console.log(`🔍 Processing data line:`, dataContent);
            
            // Check if stream is done
            if (dataContent === "[DONE]") {
          //    console.log("✅ Received [DONE] signal");
              break;
            }
            
            try {
              const data = JSON.parse(dataContent);
           //   console.log(`📊 Parsed data:`, data);
              
              if (data.content) {
                // Handle first chunk immediately
                if (data.first) {
                  firstChunkTime = Date.now();
                  const timeToFirstChunk = firstChunkTime - startTime;
            //      console.log(`⚡ First chunk received in ${timeToFirstChunk}ms:`, data.content);
                  setStreamResponse(data.content);
                  fullResponse = data.content;
                } else {
                  fullResponse += data.content;
             //     console.log(`📝 Updated response (${fullResponse.length} chars):`, data.content);
                  setStreamResponse(fullResponse);
                }
              }
            } catch (parseError) {
           //   console.log("❌ Parse error:", parseError, "for line:", dataContent);
            }
          }
        }
      }

      const totalTime = Date.now() - startTime;
     // console.log(`🎯 Streaming completed in ${totalTime}ms. Final response:`, fullResponse);

      // Add AI response to chat history with the pre-assigned ID
      const newAIMessage = {
        id: aiMessageId,
        type: 'ai',
        content: fullResponse || "Sorry, I couldn't process that request.",
        timestamp: getCurrentTime()
      };

    //  console.log("🤖 Adding AI message with ID:", aiMessageId);
      setChatHistory(prev => {
        const updated = [...prev, newAIMessage];
       // console.log("📚 Final chat history:", updated.map(msg => ({ id: msg.id, type: msg.type })));
        return updated.slice(-50);
      });

    } catch (error) {
    //  console.error("❌ Streaming error:", error);
      
      // Add error message with the pre-assigned AI message ID
      const errorMessage = {
        id: aiMessageId,
        type: 'error',
        content: "Error: " + error.message,
        timestamp: getCurrentTime()
      };

      setChatHistory(prev => {
        const updated = [...prev, errorMessage];
        return updated.slice(-50);
      });
    }

    setLoading(false);
    setStreaming(false);
    setStreamResponse("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-purple-400 rounded-full animate-float opacity-60" style={{animationDelay: '0s', animationDuration: '3s'}}></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-blue-400 rounded-full animate-float opacity-40" style={{animationDelay: '1s', animationDuration: '4s'}}></div>
        <div className="absolute top-60 left-1/4 w-1.5 h-1.5 bg-pink-400 rounded-full animate-float opacity-50" style={{animationDelay: '2s', animationDuration: '5s'}}></div>
        <div className="absolute top-80 right-1/3 w-1 h-1 bg-purple-300 rounded-full animate-float opacity-30" style={{animationDelay: '0.5s', animationDuration: '6s'}}></div>
        <div className="absolute top-32 left-1/2 w-2 h-2 bg-blue-300 rounded-full animate-float opacity-70" style={{animationDelay: '1.5s', animationDuration: '4.5s'}}></div>
      </div>
      
      
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

      
      <div className="max-w-4xl mx-auto px-4 pb-4 mt-2">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
        
          <div className="p-4 min-h-[500px] max-h-[600px] overflow-y-auto" ref={chatContainerRef}>
            {chatHistory.length === 0 && (
              <div className="text-center text-gray-400 py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Welcome to Chugli Central! 💬</h3>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                  Your AI Aunty is ready to spill some tea! 🍵 
                  <br />
                  <span className="text-purple-300">No judgment, just pure gossip energy! ✨</span>
                </p>
              </div>
            )}
            
            {chatHistory.map((msg) => (
              <div key={msg.id} className={`mb-4 ${msg.type === 'user' ? 'flex justify-end' : ''}`}>
                <div className={`flex items-start gap-3 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.type === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                      : msg.type === 'error'
                      ? 'bg-gradient-to-r from-red-500 to-pink-500'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500'
                  }`}>
                    <span className="text-white text-xs font-bold">
                      {msg.type === 'user' ? 'U' : msg.type === 'error' ? '!' : 'A'}
                    </span>
                  </div>
                  <div className={`rounded-2xl px-4 py-3 ${
                    msg.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : msg.type === 'error'
                      ? 'bg-red-500/20 text-red-200 border border-red-500/30'
                      : 'bg-gray-700/50 text-gray-200 border border-gray-600/30'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-2">{isClient ? msg.timestamp : ''}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="mb-4">
                <div className="flex items-start gap-3 max-w-[85%]">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">A</span>
                  </div>
                  <div className="bg-gray-700/50 text-gray-200 border border-gray-600/30 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
                      <span className="text-sm">
                        {streaming ? "Typing..." : "Thinking..."}
                      </span>
                    </div>
                    {streaming && streamResponse && (
                      <div className="mt-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <p className="text-gray-200 text-sm leading-relaxed">{streamResponse}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

         
          <div className="p-4 border-t border-white/10 bg-gray-800/30">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Aao Bhen Chugli kare...☕"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-200 text-sm"
                  style={{ minHeight: "48px", maxHeight: "120px" }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (message.trim() && !loading) {
                        handleChatStream();
                      }
                    }
                  }}
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  Enter to send
                </div>
              </div>
              <button
                onClick={handleChatStream}
                disabled={loading || !message.trim()}
                className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium rounded-2xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg text-sm flex-shrink-0"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-sm">Thinking...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span className="text-sm">Send</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Move the feature cards below and make them smaller to focus on chat */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
       
       {/* Card 1 */}
       <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30 text-center">
         <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
           <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
           </svg>
         </div>
         <h3 className="text-sm font-medium text-cyan-300 mb-1">
           🗣️ Chugli & Gossip like Full-Tu Aunty
         </h3>
         <p className="text-cyan-200/80 text-xs">
           Discuss your neighbor's Wi-Fi password, rishtas, or random celeb drama — 
           AI aunty never runs out of masala! 😏
         </p>
       </div>

   
       <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30 text-center">
         <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
           <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
           </svg>
         </div>
         <h3 className="text-sm font-medium text-pink-300 mb-1">
           ⚡ Gossip Faster than Shaadi.com Rishtas
         </h3>
         <p className="text-pink-200/80 text-xs">
           Instant replies: funny, judgmental, and sometimes ego-hurting. 
           Just like real aunties at kitty parties! 🫣
         </p>
       </div>

  
       <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30 text-center">
         <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
           <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
         </div>
         <h3 className="text-sm font-medium text-emerald-300 mb-1">
           🕐 Aunty on Call, 24x7
         </h3>
         <p className="text-pink-200/80 text-xs">
           Midnight? 4am? Doesn't matter — AI aunty is always ready for 
           "beta shaadi kab karoge" or spicy gossip! 💅
         </p>
       </div> 
     </div>


     <div className="mt-4 text-center">
       <div className="bg-gray-800/30 rounded-lg p-3 border border-amber-500/30">
         <div className="flex items-center justify-center gap-2 mb-2">
           <span className="text-amber-400 text-base">🤫</span>
           <span className="text-amber-300 font-medium text-sm">Top Secret Notice</span>
         </div>
         <p className="text-amber-200/80 text-xs leading-relaxed">
           💬 Your chats are <span className="font-medium text-amber-300">super secret</span> because I'm too lazy to add a database! 😅 
           <br />
           <span className="text-amber-300/80">Translation:</span> Your gossip is safe from prying eyes, but don't refresh or I'll forget everything! 📸
         </p>
       </div>
     </div>  
      </div>
      
      <Footer />
    </div>
  );
}
