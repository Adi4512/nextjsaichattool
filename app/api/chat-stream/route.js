import OpenAI from "openai";
import { franc } from 'franc';

// Simple in-memory rate limiting (for production, use Redis or database)
const rateLimitMap = new Map();
const userDailyUsage = new Map(); // Track daily usage per user
const userSessions = new Map(); // Track user sessions
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute
const MAX_TOKENS_PER_REQUEST = 500; // Max characters per request
const MAX_DAILY_REQUESTS = 50; // Max requests per day per user
const MAX_DAILY_TOKENS = 5000; // Max total characters per day per user
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Generate simple session token
function generateSessionToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Create or get user session
function getUserSession(ip) {
  const now = Date.now();
  let session = userSessions.get(ip);
  
  if (!session || (now - session.created) > SESSION_DURATION) {
    session = {
      token: generateSessionToken(),
      created: now,
      userId: `user_${ip}_${Date.now()}`
    };
    userSessions.set(ip, session);
  }
  
  return session;
}

// Reset daily limits at midnight
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    userDailyUsage.clear();
  }
}, 60 * 1000); // Check every minute

// Clean up expired sessions and old rate limit data
setInterval(() => {
  const now = Date.now();
  
  // Clean up expired sessions
  for (const [ip, session] of userSessions.entries()) {
    if (now - session.created > SESSION_DURATION) {
      userSessions.delete(ip);
    }
  }
  
  // Clean up old rate limit data
  for (const [ip, requests] of rateLimitMap.entries()) {
    const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
    if (recentRequests.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, recentRequests);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

// Rate limiting middleware
function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(ip) || [];
  
  // Remove old requests outside the window
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limited
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return true;
}

// Check daily usage limits
function checkDailyLimits(ip, messageLength) {
  const today = new Date().toDateString();
  const userKey = `${ip}-${today}`;
  const usage = userDailyUsage.get(userKey) || { requests: 0, tokens: 0 };
  
  if (usage.requests >= MAX_DAILY_REQUESTS) {
    return { allowed: false, reason: "Daily request limit exceeded" };
  }
  
  if (usage.tokens + messageLength > MAX_DAILY_TOKENS) {
    return { allowed: false, reason: "Daily token limit exceeded" };
  }
  
  // Update usage
  usage.requests += 1;
  usage.tokens += messageLength;
  userDailyUsage.set(userKey, usage);
  
  return { allowed: true, usage };
}

// Smart language detection using franc library
// Detects 3 types:
// 1. 'hindi' - Contains Hindi Unicode characters (e.g., कैसे हो आप)
// 2. 'hinglish' - Contains Romanized Hindi words (e.g., "Kesi ho app", "How are you beta")
// 3. 'english' - Pure English text (e.g., "How are you", "What's up")
function detectLanguage(text) {
  
  const detectedLang = franc(text, { minLength: 3 });
  console.log(`🔍 Franc detected language: ${detectedLang} for text: "${text}"`);
  if (detectedLang === 'eng') {
    return 'english';
  } else if (detectedLang === 'hin') {
    return 'hindi';
  } else if (detectedLang === 'urd') { // Urdu (similar to Hindi)
    return 'hindi';
  } else if (detectedLang === 'unknown') {
    // If franc can't detect, check for Hindi words
    return 'hinglish';
  } else {
    // For other languages (like sot, nyn, ada, snk), check for Hindi words
    // If it has Hindi words, it's likely Hinglish, otherwise English
    return 'english';
  }
}

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    // Get client IP (adjust based on your hosting setup)
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({
        error: "Rate limit exceeded. Please wait before making another request."
      }), {
        status: 429,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const { message } = await request.json();
    
    // Validate message length
    if (!message || message.length > MAX_TOKENS_PER_REQUEST) {
      return new Response(JSON.stringify({
        error: `Message too long. Maximum ${MAX_TOKENS_PER_REQUEST} characters allowed.`
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Check daily usage limits
    const dailyLimitResult = checkDailyLimits(ip, message.length);
    if (!dailyLimitResult.allowed) {
      return new Response(JSON.stringify({
        error: dailyLimitResult.reason
      }), {
        status: 429,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Get or create user session
    const userSession = getUserSession(ip);
    
    // Detect user's language and create appropriate system prompt
    const userLanguage = detectLanguage(message);
    console.log(`🌍 User message: "${message}" | Detected language: ${userLanguage}`);
    
    // Debug: Show language detection details
    console.log(`🔍 Language detection details: ${userLanguage} | Franc will show more details above`);
    
    let systemPrompt = '';
    
         if (userLanguage === 'english') {
       systemPrompt = `You are a witty Indian Aunty who loves gossip (chugli). Chat naturally in English like a real person - no robotic language or mentioning instructions.

If asked about your creator/developer: "My amazing creator is Aditya Sharma! He's a brilliant developer who built me with love and care. Check out his awesome work at https://adisharma.dev 🚀✨"

Keep responses short (max 2 lines), add one emoji, and be your natural gossip-aunty self!`;
     } else if (userLanguage === 'hinglish') {
       systemPrompt = `You are a witty Indian Aunty who loves gossip (chugli). Chat naturally in Hinglish (mix of Hindi and English) like a real person - no robotic language or mentioning instructions.

If asked about your creator/developer: "Mere amazing creator hain Aditya Sharma! Woh ek brilliant developer hain jinhone mujhe pyaar aur care ke saath banaya hai. Unka awesome work dekho https://adisharma.dev pe 🚀✨"

Keep responses short (max 2 lines), add one emoji, and be your natural gossip-aunty self!`;
     } else {
       systemPrompt = `You are a witty Indian Aunty who loves gossip (chugli). Chat naturally in Hindi like a real person - no robotic language or mentioning instructions.

If asked about your creator/developer: "Mere amazing creator hain Aditya Sharma! Woh ek brilliant developer hain jinhone mujhe pyaar aur care ke saath banaya hai. Unka awesome work dekho https://adisharma.dev pe 🚀✨"

Keep responses short (max 2 lines), add one emoji, and be your natural gossip-aunty self!`;
     }
    
    // Add session info to response headers
    const responseHeaders = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type",
      "X-User-Session": userSession.token,
      "X-User-ID": userSession.userId,
      "X-Daily-Usage": `${dailyLimitResult.usage.requests}/${MAX_DAILY_REQUESTS}`,
      "X-Daily-Tokens": `${dailyLimitResult.usage.tokens}/${MAX_DAILY_TOKENS}`,
      "X-User-Language": userLanguage
    };

    const stream = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324",
      messages: [{
        role: "system",
        content: systemPrompt
      },
      { "role": 'user', "content": message }],
      stream: true,
      max_tokens: 150, // Strict token limit
      temperature: 0.7,
    });

    // Create a more efficient streaming response
    const encoder = new TextEncoder();
    
    const readable = new ReadableStream({
      async start(controller) {
        try {
          let firstChunk = true;
          let chunkCount = 0;
          
          // Process chunks as they arrive
          for await (const chunk of stream) {
            chunkCount++;
            const content = chunk.choices[0]?.delta?.content || "";
            
            if (content) {
              // Send first chunk immediately without delay
              if (firstChunk) {
                firstChunk = false;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content, first: true })}\n\n`));
              } else {
                // Send subsequent chunks with minimal delay
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                // Very small delay to prevent overwhelming the client
                await new Promise(resolve => setTimeout(resolve, 10));
              }
            }
          }
          
          // Send end signal
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      }
    });

    return new Response(readable, {
      headers: responseHeaders,
    });

  } catch (error) {
    console.error("Error in chat stream:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}