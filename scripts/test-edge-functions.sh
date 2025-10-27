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
  echo "  export SUPABASE_URL=https://kxrdxiznaudatxyfrbxe.supabase.co"
  echo "  export SUPABASE_ANON_KEY=your_anon_key"
  echo ""
fi

# Set test environment
if [ -f ".env.test" ]; then
  export $(cat .env.test | xargs)
else
  echo "📝 Using .env.test.example (copy to .env.test for custom config)"
  export $(cat .env.test.example | xargs)
fi

echo "Testing against: $SUPABASE_URL"
echo ""

# Run tests
echo "Running test suite..."
deno test \
  --allow-all \
  --env-file=.env.test.example \
  supabase/functions/tests/multi-agent-spec-test.ts

echo ""
echo "✅ Tests complete!"

