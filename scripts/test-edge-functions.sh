#!/bin/bash
set -e

echo "🧪 Testing Supabase Edge Functions"
echo "==================================="
echo ""

# Check if Supabase is running locally
if ! curl -s http://localhost:54321 > /dev/null 2>&1; then
  echo "⚠️  Supabase is not running locally"
  echo "Start it with: supabase start"
  echo ""
  echo "Or test against production by setting:"
  echo "  export SUPABASE_URL=https://tkkthpoottlqmdopmtuh.supabase.co"
  echo "  export SUPABASE_ANON_KEY=your_anon_key"
  echo ""
fi

# Set test environment
if [ -f ".env.test" ]; then
  set -a
  source .env.test
  set +a
elif [ -f ".env.local" ]; then
  set -a
  source .env.local
  set +a
elif [ -f ".env" ]; then
  set -a
  source .env
  set +a
else
  echo "⚠️  No env file found (.env.test, .env.local, .env)"
  echo "Set SUPABASE_URL, SUPABASE_ANON_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD"
fi

echo "Testing against: $SUPABASE_URL"
echo ""

# Run tests
echo "Running test suite..."
deno test \
  --allow-all \
  supabase/functions/tests/multi-agent-spec-test.ts

echo ""
echo "✅ Tests complete!"
