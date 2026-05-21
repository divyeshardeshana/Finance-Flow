import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  subscription_tier?: string;
  is_admin?: boolean;
  admin_role?: string;
  country?: string;
  currency?: string;
  user_type?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('[create-user] Starting user creation request');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[create-user] Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('[create-user] Token received, length:', token.length);

    if (!token || token.length < 20) {
      console.error('[create-user] Invalid token format');
      return new Response(
        JSON.stringify({
          error: 'Invalid authentication token',
          details: 'The provided token is malformed or empty'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    console.log('[create-user] Validating user token with anon client...');
    const { data: { user: callingUser }, error: authError } = await anonClient.auth.getUser();

    if (authError || !callingUser) {
      console.error('[create-user] Authentication failed:', {
        error: authError?.message,
        errorCode: authError?.status,
        errorName: authError?.name,
        hasToken: !!token,
        tokenPrefix: token.substring(0, 10) + '...',
      });

      let errorMessage = 'Authentication failed. Your session may have expired.';
      let errorDetails = authError?.message || 'Unable to verify user session';

      if (authError?.message?.includes('expired') || authError?.message?.includes('JWT')) {
        errorMessage = 'Your session has expired. Please refresh your session or log in again.';
        errorDetails = 'The authentication token has expired and needs to be refreshed';
      } else if (authError?.message?.includes('invalid')) {
        errorMessage = 'Invalid authentication. Please log out and log in again.';
        errorDetails = 'The authentication token is invalid or corrupted';
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          details: errorDetails,
          code: authError?.status,
          hint: 'Try clicking the "Refresh Session" button or logging out and back in'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[create-user] User authenticated:', callingUser.id, 'Email:', callingUser.email);

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[create-user] Checking admin privileges...');
    const { data: callingUserProfile, error: profileError } = await serviceClient
      .from('user_profiles')
      .select('is_admin, admin_role')
      .eq('id', callingUser.id)
      .maybeSingle();

    if (profileError) {
      console.error('[create-user] Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({
          error: 'Failed to verify admin status',
          details: profileError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!callingUserProfile?.is_admin) {
      console.error('[create-user] User is not admin:', callingUser.id);
      return new Response(
        JSON.stringify({
          error: 'Access denied: Admin privileges required',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[create-user] Admin verified, parsing request data...');
    const requestData: CreateUserRequest = await req.json();

    if (!requestData.email || !requestData.password || !requestData.full_name) {
      console.error('[create-user] Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Email, password, and full name are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requestData.email)) {
      console.error('[create-user] Invalid email format:', requestData.email);
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (requestData.password.length < 6) {
      console.error('[create-user] Password too short');
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[create-user] Checking for duplicate email:', requestData.email);
    const { data: existingUsers, error: lookupError } = await serviceClient.auth.admin.listUsers();
    if (!lookupError && existingUsers?.users) {
      const duplicate = existingUsers.users.find(
        (u: { email?: string }) => u.email?.toLowerCase() === requestData.email.toLowerCase()
      );
      if (duplicate) {
        console.error('[create-user] Duplicate email found:', requestData.email);
        return new Response(
          JSON.stringify({ error: 'A user with this email address already exists' }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    console.log('[create-user] Creating auth user:', requestData.email);
    const { data: newAuthUser, error: createUserError } = await serviceClient.auth.admin.createUser({
      email: requestData.email,
      password: requestData.password,
      email_confirm: true,
      user_metadata: {
        full_name: requestData.full_name,
      },
    });

    if (createUserError || !newAuthUser.user) {
      console.error('[create-user] Failed to create auth user:', createUserError);
      return new Response(
        JSON.stringify({
          error: createUserError?.message || 'Failed to create user',
          details: createUserError
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[create-user] Auth user created:', newAuthUser.user.id);

    const adminRole = requestData.is_admin && requestData.admin_role && requestData.admin_role.trim() !== ''
      ? requestData.admin_role
      : null;

    const profileData = {
      id: newAuthUser.user.id,
      full_name: requestData.full_name,
      email: requestData.email,
      user_type: requestData.user_type || 'individual',
      subscription_tier: requestData.subscription_tier || 'free',
      is_admin: requestData.is_admin || false,
      admin_role: adminRole,
      country: requestData.country || 'US',
      currency: requestData.currency || 'USD',
    };

    console.log('[create-user] Creating user profile...');
    const { error: profileError2 } = await serviceClient
      .from('user_profiles')
      .upsert(profileData);

    if (profileError2) {
      console.error('[create-user] Failed to create profile, rolling back:', profileError2);
      await serviceClient.auth.admin.deleteUser(newAuthUser.user.id);

      return new Response(
        JSON.stringify({
          error: 'Failed to create user profile',
          details: profileError2.message
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[create-user] Profile created, sending notification...');
    try {
      await serviceClient.rpc('create_user_notification', {
        target_user_id: newAuthUser.user.id,
        notification_title: 'Welcome!',
        notification_message: 'Your account has been created by an administrator. Please check your email for login details.',
        notification_type: 'system',
        notification_related_id: null,
      });
    } catch (notifError) {
      console.error('[create-user] Failed to create notification (non-fatal):', notifError);
    }

    console.log('[create-user] Logging admin activity...');
    try {
      await serviceClient.from('admin_activity_log').insert({
        admin_user_id: callingUser.id,
        action_type: 'create_user',
        target_type: 'user',
        target_id: newAuthUser.user.id,
        action_details: {
          email: requestData.email,
          subscription_tier: profileData.subscription_tier,
          is_admin: profileData.is_admin,
        },
      });
    } catch (logError) {
      console.error('[create-user] Failed to log activity (non-fatal):', logError);
    }

    console.log('[create-user] User creation completed successfully');
    return new Response(
      JSON.stringify({
        success: true,
        user_id: newAuthUser.user.id,
        email: requestData.email,
        message: 'User created successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[create-user] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
