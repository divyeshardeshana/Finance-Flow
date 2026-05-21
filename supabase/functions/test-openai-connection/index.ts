import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile } = await serviceClient
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: apiKeySetting } = await serviceClient
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'openai_api_key')
      .maybeSingle();

    const apiKey = apiKeySetting?.setting_value;

    if (!apiKey || apiKey.trim() === '') {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No OpenAI API key configured. Please save your API key first.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!apiKey.startsWith('sk-')) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid API key format. OpenAI keys should start with "sk-".',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: modelSetting } = await serviceClient
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'openai_model')
      .maybeSingle();

    const model = modelSetting?.setting_value || 'gpt-3.5-turbo';

    const openaiResponse = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (openaiResponse.ok) {
      const modelsData = await openaiResponse.json();
      const availableModels = modelsData.data?.map((m: any) => m.id) || [];
      const modelAvailable = availableModels.includes(model);

      return new Response(
        JSON.stringify({
          success: true,
          message: modelAvailable
            ? `Connected successfully. Model "${model}" is available.`
            : `Connected successfully, but model "${model}" was not found. Available models include: ${availableModels.slice(0, 5).join(', ')}...`,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const errorData = await openaiResponse.json();
    const errorMessage = errorData?.error?.message || 'Unknown OpenAI error';

    return new Response(
      JSON.stringify({
        success: false,
        message: `OpenAI API error (${openaiResponse.status}): ${errorMessage}`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
