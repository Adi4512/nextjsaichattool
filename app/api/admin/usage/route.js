export async function GET(request) {
  try {
    // Simple admin check (in production, add proper authentication)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET || "admin123"}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Import the rate limiting maps (you'll need to move these to a shared module)
    // For now, this is a placeholder - you'll need to restructure the code
    
    const usageStats = {
      timestamp: new Date().toISOString(),
      totalActiveUsers: 0, // Will be populated from shared module
      totalRequestsToday: 0,
      estimatedCosts: {
        daily: "$0.00",
        monthly: "$0.00"
      },
      rateLimitStatus: "Active",
      recommendations: [
        "Monitor daily usage patterns",
        "Set up cost alerts",
        "Consider user authentication"
      ]
    };

    return new Response(JSON.stringify(usageStats), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
