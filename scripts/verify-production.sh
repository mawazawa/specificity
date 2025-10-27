#!/bin/bash
set -e

PROJECT_REF="kxrdxiznaudatxyfrbxe"
PROD_URL="https://$PROJECT_REF.supabase.co"

echo "🔍 Verifying Production Deployment"
echo "===================================="
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo "⚠️  jq not installed. Install with: brew install jq"
  echo "Continuing without JSON formatting..."
  USE_JQ=false
else
  USE_JQ=true
fi

# Function to test endpoint
test_endpoint() {
  local endpoint=$1
  local test_name=$2
  local payload=$3
  
  echo "Testing: $test_name"
  echo "Endpoint: $endpoint"
  echo "Payload: $payload"
  echo ""
  
  if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "⚠️  SUPABASE_ANON_KEY not set. Get from:"
    echo "https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
    echo ""
    return 1
  fi
  
  response=$(curl -s -w "\n%{http_code}" --request POST \
    "$PROD_URL/functions/v1/$endpoint" \
    --header "Authorization: Bearer $SUPABASE_ANON_KEY" \
    --header "Content-Type: application/json" \
    --data "$payload")
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "200" ]; then
    echo "✅ Success (HTTP $http_code)"
    if [ "$USE_JQ" = true ]; then
      echo "$body" | jq '.'
    else
      echo "$body"
    fi
    echo ""
    return 0
  else
    echo "❌ Failed (HTTP $http_code)"
    echo "$body"
    echo ""
    return 1
  fi
}

# Test 1: Multi-agent spec - Discussion stage
echo "📝 Test 1: Discussion Stage"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "multi-agent-spec" "Discussion Stage" '{
  "stage": "discussion",
  "userInput": "AI-powered task manager with real-time collaboration",
  "discussionTurns": 4,
  "agentConfigs": [
    {
      "agent": "steve",
      "systemPrompt": "You are Steve Jobs. Focus on product vision and user experience.",
      "temperature": 0.7,
      "enabled": true
    },
    {
      "agent": "elon",
      "systemPrompt": "You are Elon Musk. Focus on innovation and ambitious technical solutions.",
      "temperature": 0.7,
      "enabled": true
    }
  ]
}' || echo "⚠️  Test 1 failed, check logs"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 2: Health check (if available)
echo "📊 Test 2: Function Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Checking function availability..."

health_check=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/functions/v1/multi-agent-spec")

if [ "$health_check" = "405" ] || [ "$health_check" = "400" ]; then
  echo "✅ multi-agent-spec function is deployed and responding"
else
  echo "⚠️  Unexpected response: HTTP $health_check"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Summary
echo "📋 Verification Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Project: $PROJECT_REF"
echo "Production URL: $PROD_URL"
echo ""
echo "Next steps:"
echo "1. Check function logs: supabase functions logs multi-agent-spec --project-ref $PROJECT_REF"
echo "2. Monitor dashboard: https://supabase.com/dashboard/project/$PROJECT_REF/functions"
echo "3. Run full test suite: ./scripts/test-edge-functions.sh"
echo ""
echo "✅ Production verification complete!"

