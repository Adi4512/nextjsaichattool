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
    messages: [{"role": 'user', "content": message}],
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