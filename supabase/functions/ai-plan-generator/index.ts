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

    const { userId, planType = 'workout' } = await req.json();

    // Get user profile for AI plan generation
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId || user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Use API key securely - NEVER expose to client
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Create AI prompt based on user profile
    const aiPrompt = createPlanPrompt(profile, planType);

    // Call OpenRouter AI API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://fitsync.app",
        "X-Title": "FitSync AI Plan Generator"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          {
            role: "user",
            content: aiPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      console.error("AI API error:", await response.text());
      return new Response(JSON.stringify({ error: "AI plan generation failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: "No plan generated" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    try {
      // Parse AI response and create plan
      const planData = JSON.parse(content);
      
      // Create workout plan in database
      const { data: newPlan, error: planError } = await supabaseClient
        .from('workout_plans')
        .insert({
          name: planData.name || `AI Custom Plan for ${profile.name}`,
          description: planData.description || `Personalized ${profile.fitness_level} plan`,
          difficulty: profile.fitness_level || 'beginner',
          duration_weeks: planData.duration_weeks || 8,
          created_by: 'ai-system',
          is_ai_generated: true,
          is_public: false,
          price: 0,
          tags: [...(profile.goals || []), profile.fitness_level || 'beginner', 'ai-generated'],
          rating: 0,
          rating_count: 0
        })
        .select()
        .single();

      if (planError) throw planError;

      // Add exercises to the plan
      if (planData.exercises && Array.isArray(planData.exercises)) {
        const exercises = planData.exercises.map((exercise: any, index: number) => ({
          workout_plan_id: newPlan.id,
          exercise_id: exercise.exercise_id || 'default-exercise-id',
          sets: exercise.sets || 3,
          reps: exercise.reps || 12,
          rest_seconds: exercise.rest_seconds || 60,
          order_index: index + 1,
          notes: exercise.notes || `AI customized for ${profile.fitness_level} level`
        }));

        await supabaseClient
          .from('workout_plan_exercises')
          .insert(exercises);
      }

      // Log AI usage
      await supabaseClient
        .from('ai_usage_logs')
        .insert({
          user_id: user.id,
          service_type: 'plan_generation',
          tokens_used: aiResult.usage?.total_tokens || 0,
          success: true
        });

      return new Response(JSON.stringify({
        success: true,
        plan: newPlan,
        message: `AI generated a personalized ${planType} plan for ${profile.name}`
      }), {
        headers: { "Content-Type": "application/json" }
      });

    } catch (parseError) {
      console.error("Failed to parse AI plan:", parseError);
      return new Response(JSON.stringify({ error: "Failed to create plan from AI response" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

  } catch (error) {
    console.error('AI plan generation error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'AI plan generation failed' 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});

function createPlanPrompt(profile: any, planType: string): string {
  const goals = profile.goals?.join(', ') || 'general fitness';
  const level = profile.fitness_level || 'beginner';
  const age = profile.age || 30;
  const weight = profile.weight || 70;
  const height = profile.height || 170;

  return `Create a personalized ${planType} plan for:
- Name: ${profile.name}
- Age: ${age}, Weight: ${weight}kg, Height: ${height}cm
- Fitness Level: ${level}
- Goals: ${goals}
- Gender: ${profile.gender || 'not specified'}

Return ONLY a JSON object with this structure:
{
  "name": "Plan name",
  "description": "Plan description",
  "duration_weeks": 8,
  "exercises": [
    {
      "name": "Exercise name",
      "sets": 3,
      "reps": 12,
      "rest_seconds": 60,
      "notes": "Exercise-specific notes"
    }
  ]
}

Make it appropriate for their ${level} fitness level and ${goals} goals. Include 6-8 exercises for a complete workout.`;
}