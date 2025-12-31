# Stripe Integration Setup

The project now includes full Stripe subscription support.

## 1. Environment Variables
Add these to your Supabase Edge Functions secrets:

```bash
# Stripe API Keys (from Stripe Dashboard > Developers > API keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Product Config
STRIPE_PRICE_ID_PRO=price_...  # Create a product in Stripe with recurring pricing

# App Config
FRONTEND_URL=https://your-app.com # or http://localhost:5173 for dev
```

## 2. Deploy Functions
```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

## 3. Webhook Setup
1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://[project-ref].supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## 4. Testing
1. Run `supabase functions serve` locally
2. Use Stripe CLI to forward webhooks: `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`
3. Click "Upgrade" in the app UI
