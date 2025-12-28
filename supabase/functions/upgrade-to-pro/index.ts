import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpgradeRequest {
  stripeSessionId?: string;
  planType?: 'pro' | 'enterprise';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for privileged operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: UpgradeRequest = await req.json().catch(() => ({}));
    const planType = body.planType || 'pro';

    // TODO: Integrate with Stripe to verify payment
    // In production, you would:
    // 1. Verify stripeSessionId with Stripe API
    // 2. Check that the payment was successful
    // 3. Get the customer ID from Stripe
    // 4. Store the subscription details
    //
    // const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
    // const session = await stripe.checkout.sessions.retrieve(body.stripeSessionId);
    // if (session.payment_status !== 'paid') {
    //   throw new Error('Payment not completed');
    // }

    // For now, we check if stripeSessionId is provided (placeholder for Stripe verification)
    if (!body.stripeSessionId) {
      console.warn(`[upgrade-to-pro] User ${user.id} attempted upgrade without Stripe session`);
      return new Response(
        JSON.stringify({
          error: 'Payment required',
          message: 'Please complete the payment process first',
          checkoutUrl: '/pricing' // Redirect user to pricing page
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the Stripe session ID format (basic validation)
    if (!body.stripeSessionId.startsWith('cs_')) {
      return new Response(
        JSON.stringify({ error: 'Invalid payment session' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.info(`[upgrade-to-pro] Processing upgrade for user ${user.id} to ${planType}`);

    // Calculate credits based on plan
    const planCredits: Record<string, number> = {
      'pro': 100,
      'enterprise': 999
    };

    // Update the user's profile with service role (bypasses RLS)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan: planType,
        credits: planCredits[planType] || 100,
        stripe_customer_id: `cus_${body.stripeSessionId.slice(3, 15)}` // Placeholder
      })
      .eq('id', user.id);

    if (updateError) {
      console.error(`[upgrade-to-pro] Failed to update profile:`, updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to upgrade account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.info(`[upgrade-to-pro] Successfully upgraded user ${user.id} to ${planType}`);

    return new Response(
      JSON.stringify({
        success: true,
        plan: planType,
        credits: planCredits[planType],
        message: `Successfully upgraded to ${planType}!`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[upgrade-to-pro] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
