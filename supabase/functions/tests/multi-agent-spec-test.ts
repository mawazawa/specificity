/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert, assertExists } from 'jsr:@std/assert@1';
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';
import 'jsr:@std/dotenv/load';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const testEmail = Deno.env.get('TEST_USER_EMAIL') ?? '';
const testPassword = Deno.env.get('TEST_USER_PASSWORD') ?? '';

const shouldRun = Boolean(supabaseUrl && supabaseKey && testEmail && testPassword);
const shouldRunFullPipeline = shouldRun && Deno.env.get('RUN_FULL_SPEC_PIPELINE') === '1';

const options = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
};

const createAuthedClient = async (): Promise<{ client: SupabaseClient; accessToken: string }> => {
  const client = createClient(supabaseUrl, supabaseKey, options);

  const { data, error } = await client.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });

  if (error) {
    throw new Error(`Failed to sign in test user: ${error.message}`);
  }

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error('Missing access token for test user');
  }

  return { client, accessToken };
};

const invokeStage = async (
  client: SupabaseClient,
  accessToken: string,
  body: Record<string, unknown>
) => {
  return client.functions.invoke('multi-agent-spec', {
    body,
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
};

Deno.test({
  name: 'Questions stage (smoke)',
  ignore: !shouldRun,
  sanitizeResources: false,
  sanitizeOps: false
}, async () => {
  const { client, accessToken } = await createAuthedClient();

  const { data, error } = await invokeStage(client, accessToken, {
    stage: 'questions',
    userInput: 'AI-powered task manager with real-time collaboration'
  });

  if (error) {
    throw new Error(`Questions stage failed: ${error.message}`);
  }

  assertExists(data, 'Questions response should exist');
  assert(Array.isArray(data.questions), 'questions should be an array');
  assert(data.questions.length > 0, 'questions should contain items');
});

Deno.test({
  name: 'Full pipeline (questions -> research -> challenge -> synthesis -> voting -> spec)',
  ignore: !shouldRunFullPipeline,
  sanitizeResources: false,
  sanitizeOps: false,
  timeout: 180000
}, async () => {
  const { client, accessToken } = await createAuthedClient();

  const agentConfigs = [
    {
      agent: 'elon',
      systemPrompt: 'You are Elon Musk. Challenge everything with first-principles thinking.',
      temperature: 0.7,
      enabled: true
    },
    {
      agent: 'steve',
      systemPrompt: 'You are Steve Jobs. Focus on product vision and user experience.',
      temperature: 0.7,
      enabled: true
    }
  ];

  const { data: questionsData, error: questionsError } = await invokeStage(client, accessToken, {
    stage: 'questions',
    userInput: 'AI-powered task manager with real-time collaboration'
  });

  if (questionsError) {
    throw new Error(`Questions stage failed: ${questionsError.message}`);
  }

  assertExists(questionsData?.questions, 'questions should exist');

  const { data: researchData, error: researchError } = await invokeStage(client, accessToken, {
    stage: 'research',
    agentConfigs,
    roundData: {
      questions: questionsData.questions,
      roundNumber: 1
    }
  });

  if (researchError) {
    throw new Error(`Research stage failed: ${researchError.message}`);
  }

  assertExists(researchData?.researchResults, 'researchResults should exist');

  const { data: challengeData, error: challengeError } = await invokeStage(client, accessToken, {
    stage: 'challenge',
    userInput: 'AI-powered task manager with real-time collaboration',
    agentConfigs,
    roundData: {
      researchResults: researchData.researchResults,
      roundNumber: 1
    }
  });

  if (challengeError) {
    throw new Error(`Challenge stage failed: ${challengeError.message}`);
  }

  assertExists(challengeData?.debateResolutions, 'debateResolutions should exist');

  const { data: synthesisData, error: synthesisError } = await invokeStage(client, accessToken, {
    stage: 'synthesis',
    roundData: {
      researchResults: researchData.researchResults,
      debateResolutions: challengeData.debateResolutions
    }
  });

  if (synthesisError) {
    throw new Error(`Synthesis stage failed: ${synthesisError.message}`);
  }

  assertExists(synthesisData?.syntheses, 'syntheses should exist');

  const { data: votingData, error: votingError } = await invokeStage(client, accessToken, {
    stage: 'voting',
    agentConfigs,
    roundData: {
      syntheses: synthesisData.syntheses
    }
  });

  if (votingError) {
    throw new Error(`Voting stage failed: ${votingError.message}`);
  }

  assertExists(votingData?.votes, 'votes should exist');

  const { data: specData, error: specError } = await invokeStage(client, accessToken, {
    stage: 'spec',
    roundData: {
      syntheses: synthesisData.syntheses,
      votes: votingData.votes,
      researchResults: researchData.researchResults,
      debateResolutions: challengeData.debateResolutions
    }
  });

  if (specError) {
    throw new Error(`Spec stage failed: ${specError.message}`);
  }

  assertExists(specData?.spec, 'spec should exist');
  assert(typeof specData.spec === 'string', 'spec should be a string');
  assert(specData.spec.length >= 500, `spec too short: ${specData.spec.length} chars`);
});

if (!shouldRun) {
  console.warn('Skipping edge-function tests: SUPABASE_URL, SUPABASE_ANON_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD required.');
}

if (shouldRun && !shouldRunFullPipeline) {
  console.warn('Full pipeline test skipped: set RUN_FULL_SPEC_PIPELINE=1 to enable.');
}
