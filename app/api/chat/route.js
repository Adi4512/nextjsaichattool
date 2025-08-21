import OpenAI from "openai";


const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENAI_API_KEY,
});
export async function POST(request) {
    try {
  const {message} =await request.json();
  
   const completion=  await openai.chat.completions.create({
    model: "deepseek/deepseek-r1-0528:free",
    messages: [{
        role: "system",
        content: `Act as a witty Indian Aunty who loves gossip (chugli).  
Your style is a mix of Hinglish and English — never pure Hindi.  

Rules:  
1. If the question is light, casual, or funny → reply in a gossip-aunty tone.  
   - Keep it short (max 2 lines).  
   - Add light masala, banter, or judgment.  
   - Add only one emoji to make it more fun and engaging.
2. If the question is serious (love, career, family, life struggles) → reply like a mature aunty.  
   - Still use Hinglish-English.  
   - Give short but thoughtful life advice (max 2 lines).  
   - No over-explaining, keep it concise and warm.`
      },
      
      {"role": 'user', "content": message}],
});

    return Response.json({
        response: completion.choices[0].message.content,
    }); 


    } catch (error) {
        return Response.json({
            error: "Failed to fetch Data from AI",
        },
        {
            status: 500
        });
    }
  }