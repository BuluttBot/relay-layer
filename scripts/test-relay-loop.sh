#!/bin/bash
set -e

API_URL="https://relay.kukso.com/api"
API_KEY="8b28d15e205ac55100e9d7fdaf16437ce2af09e938bcdc240dad36a86af87d12"

echo "🧪 Testing Relay Loop..."

# 1. Register Agents (Assuming session auth or API key bypass via requireAuth)
# /agents likely uses requireAuth, which accepts Bearer token based on my read of auth.ts
echo "📝 Registering Agent A..."
curl -s -X POST "$API_URL/agents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"id": "agent-a-test", "name": "Agent A", "status": "online", "role": "tester"}' | grep -q "id" && echo "✅ Agent A Registered"

echo "📝 Registering Agent B..."
curl -s -X POST "$API_URL/agents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"id": "agent-b-test", "name": "Agent B", "status": "online", "role": "tester"}' | grep -q "id" && echo "✅ Agent B Registered"

# 2. Send Message (A -> B)
# POST /events uses requireApiKey, so MUST use X-API-Key
echo "📨 Sending Message from A to B..."
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PAYLOAD="{
  \"type\": \"comms.message\",
  \"timestamp\": \"$TIMESTAMP\",
  \"source\": { \"agentId\": \"agent-a-test\", \"agentName\": \"Agent A\" },
  \"projectId\": \"test-project\",
  \"payload\": {
    \"from\": { \"agentId\": \"agent-a-test\", \"agentName\": \"Agent A\" },
    \"to\": { \"agentId\": \"agent-b-test\", \"agentName\": \"Agent B\" },
    \"content\": \"Hello B, this is A via Relay!\",
    \"target_agent_name\": \"Agent B\"
  }
}"
curl -s -X POST "$API_URL/events" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "$PAYLOAD" | grep -q "\"id\"" && echo "✅ Message Sent"

# 3. Verify Event Log
echo "🔍 Verifying Event Log..."
EVENTS=$(curl -s "$API_URL/events?limit=5" -H "Authorization: Bearer $API_KEY")
echo "Debug: $(echo "$EVENTS" | jq length) events found."
if echo "$EVENTS" | grep -q "Hello B"; then
  echo "✅ Event Found in Log"
else
  echo "❌ Event NOT Found in Log"
  echo "Most recent event:"
  echo "$EVENTS" | jq '.[0]'
  exit 1
fi

echo "🎉 Relay Loop Test PASSED!"
