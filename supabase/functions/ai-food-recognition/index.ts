import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "Image data required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Use API key securely from environment - NEVER expose to client
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      console.error("OPENROUTER_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Call OpenRouter AI API for food recognition
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://fitsync.app",
        "X-Title": "FitSync Food Recognition"
      },
      body: JSON.stringify({
        model: "google/gemini-pro-vision",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this food image and return ONLY a JSON object with: {\"name\": \"food name\", \"calories_per_100g\": number, \"protein_per_100g\": number, \"carbs_per_100g\": number, \"fat_per_100g\": number, \"estimated_portion_grams\": number, \"confidence\": number}. No other text."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        max_tokens: 300,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      console.error("AI API error:", await response.text());
      return new Response(JSON.stringify({ error: "AI recognition failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: "No recognition result" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    try {
      // Parse AI response
      const foodData = JSON.parse(content);
      
      // Validate response structure
      if (!foodData.name || typeof foodData.calories_per_100g !== 'number') {
        throw new Error("Invalid AI response format");
      }

      // Log successful recognition for analytics
      await supabaseClient
        .from('ai_usage_logs')
        .insert({
          user_id: user.id,
          service_type: 'food_recognition',
          tokens_used: aiResult.usage?.total_tokens || 0,
          success: true
        })
        .select()
        .maybeSingle();

      return new Response(JSON.stringify({
        success: true,
        food: {
          name: foodData.name,
          calories_per_100g: foodData.calories_per_100g,
          protein_per_100g: foodData.protein_per_100g || 0,
          carbs_per_100g: foodData.carbs_per_100g || 0,
          fat_per_100g: foodData.fat_per_100g || 0,
          estimated_portion_grams: foodData.estimated_portion_grams || 100,
          confidence: foodData.confidence || 0.8
        }
      }), {
        headers: { "Content-Type": "application/json" }
      });

    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(JSON.stringify({ error: "Failed to parse food data" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

  } catch (error) {
    console.error('AI food recognition error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'AI food recognition failed' 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});