import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BlogPost {
  id: string;
  title: string;
  category_id: string;
  target_keywords: string;
  tags: string[];
  meta_description: string;
  status: string;
  blog_categories?: { name: string; slug: string };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile } = await adminClient
      .from("user_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      throw new Error("Admin access required");
    }

    const body = await req.json();

    if (body.check_scheduled) {
      const { data: duePosts } = await adminClient
        .from("blog_posts")
        .select("*, blog_categories(*)")
        .eq("status", "scheduled")
        .lte("scheduled_publish_at", new Date().toISOString());

      if (!duePosts || duePosts.length === 0) {
        return new Response(
          JSON.stringify({ published_count: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let publishedCount = 0;
      for (const post of duePosts) {
        try {
          const result = await generateContent(adminClient, post);
          await adminClient
            .from("blog_posts")
            .update({
              content: result.content,
              excerpt: result.excerpt,
              meta_description: result.meta_description || post.meta_description,
              status: "published",
              published_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", post.id);
          publishedCount++;
        } catch (err) {
          console.error(`Failed to publish post ${post.id}:`, err);
        }
      }

      return new Response(
        JSON.stringify({ published_count: publishedCount }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const postId = body.post_id;
    if (!postId) {
      throw new Error("post_id is required");
    }

    const { data: post, error: postError } = await adminClient
      .from("blog_posts")
      .select("*, blog_categories(*)")
      .eq("id", postId)
      .maybeSingle();

    if (postError || !post) {
      throw new Error("Blog post not found");
    }

    const result = await generateContent(adminClient, post);

    await adminClient
      .from("blog_posts")
      .update({
        content: result.content,
        excerpt: result.excerpt,
        meta_description: result.meta_description || post.meta_description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function generateContent(
  adminClient: ReturnType<typeof createClient>,
  post: BlogPost
): Promise<{ content: string; excerpt: string; meta_description: string }> {
  const { data: apiKeySetting } = await adminClient
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "openai_api_key")
    .maybeSingle();

  const { data: modelSetting } = await adminClient
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "openai_model")
    .maybeSingle();

  const apiKey = apiKeySetting?.setting_value;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("OpenAI API key not configured. Please configure it in Admin > System Settings > OpenAI tab.");
  }

  if (!apiKey.startsWith('sk-')) {
    throw new Error("Invalid OpenAI API key format. Keys should start with 'sk-'.");
  }

  const model = modelSetting?.setting_value || "gpt-4o-mini";
  const categoryName = post.blog_categories?.name || "Finance";

  const prompt = `Write a comprehensive, SEO-optimized blog article for a finance planning website called FinanceFlow.

Title: ${post.title}
Category: ${categoryName}
Target SEO Keywords: ${post.target_keywords}
Tags: ${post.tags?.join(", ") || "finance"}

Requirements:
- Write 800-1200 words of high-quality, informative content
- Naturally incorporate the target keywords throughout the article
- Use clear headings and subheadings (## and ###)
- Include practical tips, actionable advice, and real-world examples
- Write in a professional yet approachable tone
- Focus on helping readers improve their financial well-being
- Include an engaging introduction and a strong conclusion with a call-to-action
- Do NOT include the title in the content (it will be displayed separately)

Return your response in the following JSON format:
{
  "content": "The full blog article text with markdown formatting",
  "excerpt": "A 1-2 sentence preview/summary of the article (max 200 characters)",
  "meta_description": "An SEO-optimized meta description for search engines (max 160 characters)"
}

Return ONLY valid JSON, no other text.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert financial content writer. You create engaging, well-researched blog articles about personal finance, budgeting, investing, and financial planning. Always return valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    let errorMessage = `OpenAI API error (${response.status})`;
    try {
      const errorData = await response.json();
      errorMessage = errorData?.error?.message || errorMessage;
    } catch {
      const errorText = await response.text();
      if (errorText) errorMessage += `: ${errorText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error("No content returned from OpenAI");
  }

  try {
    const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      content: parsed.content || rawContent,
      excerpt: parsed.excerpt || rawContent.substring(0, 200),
      meta_description: parsed.meta_description || "",
    };
  } catch {
    return {
      content: rawContent,
      excerpt: rawContent.substring(0, 200),
      meta_description: "",
    };
  }
}
