/* eslint-disable @typescript-eslint/no-explicit-any */
// Test suite for multi-agent-spec edge function
import { assert, assertEquals, assertExists } from 'jsr:@std/assert@1';
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';
import 'jsr:@std/dotenv/load';

// Configuration
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const options = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
};

// Test client creation
const testClientCreation = async () => {
  const client: SupabaseClient = createClient(supabaseUrl, supabaseKey, options);

  if (!supabaseUrl) throw new Error('SUPABASE_URL is required');
  if (!supabaseKey) throw new Error('SUPABASE_ANON_KEY is required');

  // Verify client can connect
  const { error } = await client.auth.getSession();
  assert(!error || error.message.includes('session'), 'Client should connect');
};

// Test discussion stage
const testDiscussionStage = async () => {
  const client: SupabaseClient = createClient(supabaseUrl, supabaseKey, options);

  const { data, error } = await client.functions.invoke('multi-agent-spec', {
    body: {
      stage: 'discussion',
      userInput: 'Test AI product: collaborative task manager',
      discussionTurns: 4,
      agentConfigs: [
        {
          agent: 'steve',
          systemPrompt: 'You are Steve Jobs. Focus on product vision.',
          temperature: 0.7,
          enabled: true
        }
      ]
    },
  });

  if (error) throw new Error(`Discussion failed: ${error.message}`);

  assertExists(data, 'Discussion data should exist');
  assertExists(data.dialogue, 'Dialogue array should exist');
  assert(Array.isArray(data.dialogue), 'Dialogue should be an array');
  assert(data.dialogue.length > 0, 'Dialogue should have entries');

  console.log(`✅ Discussion stage: ${data.dialogue.length} turns`);
};

// Test full workflow (all stages)
const testFullWorkflow = async () => {
  const client: SupabaseClient = createClient(supabaseUrl, supabaseKey, options);

  const testInput = 'AI-powered project management tool with real-time collaboration';
  let roundData: any = {};

  // Stage 1: Discussion
  console.log('  → Testing discussion stage...');
  const { data: discussionData, error: discussionError } = await client.functions.invoke(
    'multi-agent-spec',
    {
      body: {
        stage: 'discussion',
        userInput: testInput,
        discussionTurns: 6
      }
    }
  );

  if (discussionError) throw new Error(`Discussion failed: ${discussionError.message}`);
  roundData = { ...roundData, ...discussionData };
  assertExists(discussionData.dialogue, 'Discussion should return dialogue');

  // Stage 2: Research
  console.log('  → Testing research stage...');
  const { data: researchData, error: researchError } = await client.functions.invoke(
    'multi-agent-spec',
    {
      body: {
        stage: 'research',
        userInput: testInput,
        roundData
      }
    }
  );

  if (researchError) throw new Error(`Research failed: ${researchError.message}`);
  roundData = { ...roundData, ...researchData };
  assertExists(researchData.research, 'Research should return research data');

  // Stage 3: Synthesis
  console.log('  → Testing synthesis stage...');
  const { data: synthesisData, error: synthesisError } = await client.functions.invoke(
    'multi-agent-spec',
    {
      body: {
        stage: 'synthesis',
        roundData
      }
    }
  );

  if (synthesisError) throw new Error(`Synthesis failed: ${synthesisError.message}`);
  roundData = { ...roundData, ...synthesisData };
  assertExists(synthesisData.syntheses, 'Synthesis should return syntheses');

  // Stage 4: Voting
  console.log('  → Testing voting stage...');
  const { data: votingData, error: votingError } = await client.functions.invoke(
    'multi-agent-spec',
    {
      body: {
        stage: 'voting',
        roundData
      }
    }
  );

  if (votingError) throw new Error(`Voting failed: ${votingError.message}`);
  roundData = { ...roundData, ...votingData };
  assertExists(votingData.votes, 'Voting should return votes');

  // Stage 5: Spec Generation
  console.log('  → Testing spec generation stage...');
  const { data: specData, error: specError } = await client.functions.invoke(
    'multi-agent-spec',
    {
      body: {
        stage: 'spec',
        roundData
      }
    }
  );

  if (specError) throw new Error(`Spec generation failed: ${specError.message}`);

  // Validate spec output quality
  assertExists(specData.spec, 'Spec should be generated');
  assert(typeof specData.spec === 'string', 'Spec should be a string');
  assert(specData.spec.length >= 1000, `Spec too short: ${specData.spec.length} chars`);

  // Check required sections
  const requiredSections = [
    'Executive Summary',
    'Core Requirements',
    'Technical Architecture',
    'Implementation Phases',
    'Dependencies',
    'Risk',
    'Success Metrics'
  ];

  const missingSections = requiredSections.filter(section =>
    !new RegExp(section, 'i').test(specData.spec)
  );

  assert(
    missingSections.length === 0,
    `Missing sections: ${missingSections.join(', ')}`
  );

  // Validate consensus data
  assertExists(specData.approvedBy, 'approvedBy should exist');
  assertExists(specData.dissentedBy, 'dissentedBy should exist');
  assertExists(specData.consensusScore, 'consensusScore should exist');

  assert(
    typeof specData.consensusScore === 'number',
    'consensusScore should be a number'
  );

  assert(
    specData.consensusScore >= 0 && specData.consensusScore <= 1,
    'consensusScore should be between 0 and 1'
  );

  console.log(`✅ Full workflow complete:`);
  console.log(`   - Spec length: ${specData.spec.length} chars`);
  console.log(`   - Consensus: ${(specData.consensusScore * 100).toFixed(1)}%`);
  console.log(`   - Approved: ${specData.approvedBy.length}`);
  console.log(`   - Dissented: ${specData.dissentedBy.length}`);
  console.log(`   - All sections present: ${requiredSections.length}`);
};

// Test error handling
const testErrorHandling = async () => {
  const client: SupabaseClient = createClient(supabaseUrl, supabaseKey, options);

  // Test missing input
  const { error: error1 } = await client.functions.invoke('multi-agent-spec', {
    body: {
      stage: 'discussion',
      // Missing userInput
    }
  });

  assert(error1, 'Should error on missing input');

  // Test invalid stage
  const { error: error2 } = await client.functions.invoke('multi-agent-spec', {
    body: {
      stage: 'invalid_stage',
      userInput: 'test'
    }
  });

  assert(error2, 'Should error on invalid stage');

  console.log('✅ Error handling validated');
};

// Register tests
Deno.test('Client Creation', testClientCreation);
Deno.test('Discussion Stage', { sanitizeResources: false, sanitizeOps: false }, testDiscussionStage);
Deno.test('Full Workflow with Spec Quality Validation', {
  sanitizeResources: false,
  sanitizeOps: false,
  timeout: 120000 // 2 minutes for full workflow
}, testFullWorkflow);
Deno.test('Error Handling', { sanitizeResources: false, sanitizeOps: false }, testErrorHandling);

console.log('\n🧪 All tests registered. Run with: deno test --allow-all');

