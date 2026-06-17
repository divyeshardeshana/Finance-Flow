import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL = 'hello@financeflow.ai';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
};

// 5-email drip sequence
const DRIP_EMAILS = [
  {
    subject: 'Welcome to FinanceFlow - your financial clarity starts now',
    html: `
      <h2>Welcome to FinanceFlow! 👋</h2>
      <p>Thanks for joining 50,000+ people who are taking control of their finances with AI.</p>
      <p>Here's what you can do right now:</p>
      <ul>
        <li>✅ Set up your first budget in 2 minutes</li>
        <li>✅ Connect your bank account securely</li>
        <li>✅ Ask our AI assistant your first financial question</li>
      </ul>
      <p><a href="https://financeflow.ai/signup" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">Start for Free →</a></p>
      <p>See you inside,<br>The FinanceFlow Team</p>
    `,
  },
  {
    subject: '📊 Most users save $300/month - here\'s how',
    html: `
      <h2>The #1 thing our users do differently</h2>
      <p>After analysing thousands of FinanceFlow users, we found one pattern: <strong>people who set up a budget in their first week save an average of $312/month</strong>.</p>
      <p>It takes about 3 minutes. Here's how:</p>
      <ol>
        <li>Open FinanceFlow and go to Budget</li>
        <li>Set limits for your top 5 spending categories</li>
        <li>Turn on weekly alerts</li>
      </ol>
      <p><a href="https://financeflow.ai/signup" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">Set Up My Budget →</a></p>
    `,
  },
  {
    subject: '💡 The 50/30/20 rule explained in 60 seconds',
    html: `
      <h2>A simple rule that changes everything</h2>
      <p>The 50/30/20 rule is the fastest way to structure your finances:</p>
      <ul>
        <li><strong>50%</strong> of after-tax income → needs (rent, food, utilities)</li>
        <li><strong>30%</strong> → wants (dining, subscriptions, travel)</li>
        <li><strong>20%</strong> → savings & debt repayment</li>
      </ul>
      <p>FinanceFlow automatically categorises every transaction so you can see your 50/30/20 split in real time.</p>
      <p><a href="https://financeflow.ai/blog/50-30-20-rule-guide" style="color:#2563eb;">Read the full guide →</a></p>
      <p><a href="https://financeflow.ai/signup" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">Try It Free →</a></p>
    `,
  },
  {
    subject: '🎯 3 features you probably haven\'t tried yet',
    html: `
      <h2>Hidden gems inside FinanceFlow</h2>
      <ol>
        <li><strong>AI Financial Assistant</strong> - ask "Can I afford a $500 vacation?" and get a data-backed answer.</li>
        <li><strong>Bill Reminders</strong> - never pay a late fee again.</li>
        <li><strong>Net Worth Tracker</strong> - see assets vs liabilities updated daily.</li>
      </ol>
      <p><a href="https://financeflow.ai/signup" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">Unlock All Features →</a></p>
    `,
  },
  {
    subject: '🚀 Ready to upgrade? Here\'s what Pro users get',
    html: `
      <h2>Take your finances to the next level</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr style="background:#f3f4f6"><td style="padding:8px;font-weight:600">Feature</td><td style="padding:8px;text-align:center">Free</td><td style="padding:8px;text-align:center;color:#2563eb;font-weight:600">Pro</td></tr>
        <tr><td style="padding:8px">Bank accounts</td><td style="padding:8px;text-align:center">2</td><td style="padding:8px;text-align:center">Unlimited</td></tr>
        <tr style="background:#f9fafb"><td style="padding:8px">AI Financial Assistant</td><td style="padding:8px;text-align:center">-</td><td style="padding:8px;text-align:center">✅</td></tr>
        <tr><td style="padding:8px">Investment tracking</td><td style="padding:8px;text-align:center">-</td><td style="padding:8px;text-align:center">✅</td></tr>
        <tr style="background:#f9fafb"><td style="padding:8px">Advanced reports</td><td style="padding:8px;text-align:center">-</td><td style="padding:8px;text-align:center">✅</td></tr>
      </table>
      <br>
      <p><a href="https://financeflow.ai/pricing" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">View Pricing →</a></p>
      <p style="font-size:12px;color:#6b7280">Don't want these emails? <a href="https://financeflow.ai/unsubscribe?email={{email}}" style="color:#6b7280">Unsubscribe</a></p>
    `,
  },
];

const DRIP_DELAYS_DAYS = [0, 2, 5, 9, 14];

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `FinanceFlow <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html: html.replace('{{email}}', encodeURIComponent(to)),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
  return res.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // ── POST /capture-email-lead/send-drip-emails ────────────────────────────
  if (url.pathname.endsWith('/send-drip-emails')) {
    const now = new Date();
    let sent = 0;

    for (let step = 1; step < DRIP_EMAILS.length; step++) {
      const delayMs = DRIP_DELAYS_DAYS[step] * 24 * 60 * 60 * 1000;
      const cutoff = new Date(now.getTime() - delayMs).toISOString();

      const { data: leads } = await supabase
        .from('email_leads')
        .select('id, email')
        .eq('drip_step', step)
        .eq('subscribed', true)
        .lte('created_at', cutoff);

      for (const lead of leads ?? []) {
        try {
          if (RESEND_API_KEY) await sendEmail(lead.email, DRIP_EMAILS[step].subject, DRIP_EMAILS[step].html);
          await supabase.from('email_leads').update({ drip_step: step + 1 }).eq('id', lead.id);
          sent++;
        } catch (e) {
          console.error(`Drip send failed for ${lead.email}:`, e);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── POST /capture-email-lead ─────────────────────────────────────────────
  try {
    const { email, source = 'unknown' } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: lead, error } = await supabase
      .from('email_leads')
      .upsert({ email, source, subscribed: true }, { onConflict: 'email', ignoreDuplicates: false })
      .select()
      .single();

    if (error) throw error;

    // Send first drip email immediately for new leads
    if (lead.drip_step === 0 && RESEND_API_KEY) {
      try {
        await sendEmail(email, DRIP_EMAILS[0].subject, DRIP_EMAILS[0].html);
        await supabase.from('email_leads').update({ drip_step: 1 }).eq('id', lead.id);
      } catch (e) {
        console.error('First drip email failed:', e);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('capture-email-lead error:', err);
    return new Response(JSON.stringify({ success: false, message: 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
