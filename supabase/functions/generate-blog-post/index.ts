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
  slug: string;
  category_id: string;
  target_keywords: string;
  tags: string[];
  meta_description: string;
  status: string;
  featured_image_url?: string;
  blog_categories?: { name: string; slug: string };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile } = await adminClient
      .from("user_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_admin) throw new Error("Admin access required");

    const body = await req.json();

    // ── Scheduled publish check ─────────────────────────────────────────────
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
      const apiKey = await getOpenAIKey(adminClient);
      const model = await getOpenAIModel(adminClient);

      for (const post of duePosts) {
        try {
          // Generate content first
          const result = await generateContent(post, apiKey, model);

          // Publish immediately — don't wait for image
          await adminClient.from("blog_posts").update({
            content: result.content,
            excerpt: result.excerpt,
            meta_description: result.meta_description || post.meta_description,
            status: "published",
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq("id", post.id);
          publishedCount++;

          // Generate image in background — non-blocking, updates featured_image_url after
          generateAndStoreImage(adminClient, post, apiKey, supabaseUrl).then(imageUrl => {
            if (imageUrl) {
              adminClient.from("blog_posts")
                .update({ featured_image_url: imageUrl, updated_at: new Date().toISOString() })
                .eq("id", post.id);
            }
          });
        } catch (err) {
          console.error(`Failed to publish post ${post.id}:`, err);
        }
      }

      return new Response(
        JSON.stringify({ published_count: publishedCount }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Single post generation ──────────────────────────────────────────────
    const postId = body.post_id;
    if (!postId) throw new Error("post_id is required");

    const { data: post, error: postError } = await adminClient
      .from("blog_posts")
      .select("*, blog_categories(*)")
      .eq("id", postId)
      .maybeSingle();

    if (postError || !post) throw new Error("Blog post not found");

    const apiKey = await getOpenAIKey(adminClient);
    const model = await getOpenAIModel(adminClient);

    // Generate content + image in parallel
    const [result, imageUrl] = await Promise.all([
      generateContent(post, apiKey, model),
      generateAndStoreImage(adminClient, post, apiKey, supabaseUrl),
    ]);

    const updatePayload: Record<string, unknown> = {
      content: result.content,
      excerpt: result.excerpt,
      meta_description: result.meta_description || post.meta_description,
      updated_at: new Date().toISOString(),
    };

    if (imageUrl) {
      updatePayload.featured_image_url = imageUrl;
    }

    await adminClient.from("blog_posts").update(updatePayload).eq("id", postId);

    return new Response(
      JSON.stringify({ ...result, featured_image_url: imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── Helpers ─────────────────────────────────────────────────────────────────

async function getOpenAIKey(adminClient: ReturnType<typeof createClient>): Promise<string> {
  const { data } = await adminClient
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "openai_api_key")
    .maybeSingle();

  const apiKey = data?.setting_value;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("OpenAI API key not configured. Please configure it in Admin > System Settings > OpenAI tab.");
  }
  if (!apiKey.startsWith('sk-')) {
    throw new Error("Invalid OpenAI API key format. Keys should start with 'sk-'.");
  }
  return apiKey;
}

async function getOpenAIModel(adminClient: ReturnType<typeof createClient>): Promise<string> {
  const { data } = await adminClient
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "openai_model")
    .maybeSingle();
  return data?.setting_value || "gpt-4o-mini";
}

async function generateContent(
  post: BlogPost,
  apiKey: string,
  model: string
): Promise<{ content: string; excerpt: string; meta_description: string }> {
  const categoryName = post.blog_categories?.name || "Finance";

  const prompt = `Write a comprehensive, SEO-optimized blog article for a personal finance app called FinanceFlow.

Title: ${post.title}
Category: ${categoryName}
Target SEO Keywords: ${post.target_keywords}
Tags: ${post.tags?.join(", ") || "finance"}

Requirements:
- Write 900-1200 words of high-quality, informative content
- Naturally incorporate the target keywords throughout the article
- Use clear headings and subheadings (## and ###)
- Include practical tips, actionable advice, and real-world examples with numbers
- Write in a professional yet approachable tone
- Focus on helping readers improve their financial well-being
- Mention FinanceFlow naturally 2-3 times as a tool that helps with the topic
- Include an engaging introduction and a strong conclusion with a call-to-action
- Do NOT include the article title in the content body (it is displayed separately)

Return ONLY valid JSON in this exact format:
{
  "content": "The full blog article text with markdown formatting",
  "excerpt": "A 1-2 sentence compelling preview of the article (max 200 characters)",
  "meta_description": "An SEO-optimized meta description for search engines (max 160 characters)"
}`;

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
          content: "You are an expert financial content writer. Create engaging, well-researched blog articles about personal finance, budgeting, investing, and financial planning. Always return valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" },
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
  if (!rawContent) throw new Error("No content returned from OpenAI");

  // response_format: json_object guarantees valid JSON — parse directly
  const parsed = JSON.parse(rawContent);
  return {
    content: parsed.content || rawContent,
    excerpt: parsed.excerpt || rawContent.substring(0, 200),
    meta_description: parsed.meta_description || "",
  };
}

async function generateAndStoreImage(
  adminClient: ReturnType<typeof createClient>,
  post: BlogPost,
  apiKey: string,
  supabaseUrl: string
): Promise<string | null> {
  try {
    const categoryName = post.blog_categories?.name || "Finance";

    // Build a descriptive, finance-focused DALL-E prompt
    const imagePrompt = `Professional, clean, photorealistic hero image for a personal finance blog article titled "${post.title}".
Category: ${categoryName}.
Style: Modern financial photography, bright and optimistic lighting, minimal and elegant composition.
Subjects: financial charts, money, budgeting tools, calculator, notebook with finance notes, coins, or people managing money on laptop/phone.
No text, no words, no letters, no numbers in the image. Suitable for a professional finance website hero banner. Wide landscape format.`;

    const dalleResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1792x1024",
        quality: "standard",
        response_format: "url",
      }),
    });

    if (!dalleResponse.ok) {
      const err = await dalleResponse.text();
      console.error("DALL-E generation failed:", err);
      return null;
    }

    const dalleData = await dalleResponse.json();
    const tempImageUrl = dalleData.data?.[0]?.url;
    if (!tempImageUrl) {
      console.error("No image URL in DALL-E response");
      return null;
    }

    // Download the generated image (DALL-E URLs expire after ~1 hour)
    const imgResponse = await fetch(tempImageUrl);
    if (!imgResponse.ok) {
      console.error("Failed to download DALL-E image");
      return null;
    }

    const imageBlob = await imgResponse.arrayBuffer();
    const contentType = imgResponse.headers.get("content-type") || "image/png";
    const ext = contentType.includes("jpeg") ? "jpg" : "png";

    // Use slug or post id for filename
    const filename = `${post.slug || post.id}-${Date.now()}.${ext}`;

    // Upload to Supabase Storage blog-images bucket
    const { error: uploadError } = await adminClient.storage
      .from("blog-images")
      .upload(filename, imageBlob, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError.message);
      return null;
    }

    // Get permanent public URL
    const { data: publicUrlData } = adminClient.storage
      .from("blog-images")
      .getPublicUrl(filename);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    // Image generation is non-critical — log but don't fail the whole request
    console.error("Image generation error:", err);
    return null;
  }
}
