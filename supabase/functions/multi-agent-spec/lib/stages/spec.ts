import { corsHeaders, callGroq, GROQ_MODEL } from '../utils/api.ts';
import { callOpenRouter } from '../../../lib/openrouter-client.ts';
import type { RoundData } from '../types.ts';
import { renderPrompt, trackPromptUsage } from '../../../lib/prompt-service.ts';

// Type definitions for tech stack
interface TechOption {
  name: string;
  domain?: string;
  version?: string;
  rating?: number;
  pros?: string[];
  cons?: string[];
  logo?: string;
}

interface TechStackItem {
  category: string;
  selected: TechOption;
  alternatives?: TechOption[];
}

// ═══════════════════════════════════════════════════════════════
// MULTI-PASS SPEC GENERATION
// Each section is generated separately with dedicated token budget
// ═══════════════════════════════════════════════════════════════

const SPEC_MODEL = 'gpt-5.2';

// Section definitions with dedicated prompts and token budgets
interface SpecSection {
  id: string;
  title: string;
  tokens: number;
  prompt: string;
}

const SPEC_SECTIONS: SpecSection[] = [
  {
    id: 'executive_summary',
    title: '1. Executive Summary',
    tokens: 1500,
    prompt: `Generate the Executive Summary section:
- Product vision and value proposition (2-3 sentences)
- Target market and user personas (specific demographics, pain points)
- Key differentiators from competitors (name 3-5 specific competitors)
- Success criteria with QUANTIFIABLE metrics (DAU, conversion %, response time)
- MVP scope and timeline estimate`
  },
  {
    id: 'requirements',
    title: '2. Core Requirements',
    tokens: 2500,
    prompt: `Generate the Core Requirements section:
- Functional requirements as user stories with acceptance criteria (Given/When/Then format)
- Non-functional requirements (performance: specific ms targets, security: specific standards, scalability: specific user counts)
- Must-have vs nice-to-have (P0, P1, P2 priority labels)
- Constraints and assumptions
- Out of scope items (explicitly state what this does NOT include)`
  },
  {
    id: 'database',
    title: '3. Database Schema',
    tokens: 3000,
    prompt: `Generate COMPLETE database schema in SQL:
\`\`\`sql
-- Include ALL tables with:
-- - Column names, types, constraints (NOT NULL, UNIQUE, DEFAULT)
-- - Primary keys (UUID recommended)
-- - Foreign key relationships with ON DELETE behavior
-- - Indexes for performance (on foreign keys, commonly queried fields)
-- - created_at/updated_at timestamps
-- - Row Level Security policies for multi-tenant apps

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... complete schema
);
\`\`\`

Include migration strategy and seed data examples.`
  },
  {
    id: 'api',
    title: '4. API Specification',
    tokens: 3500,
    prompt: `Generate API specification in OpenAPI 3.1 YAML format:
\`\`\`yaml
openapi: 3.1.0
paths:
  /api/v1/resource:
    post:
      summary: Create resource
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [field1, field2]
              properties:
                field1: { type: string }
      responses:
        201: { description: Created }
        400: { description: Validation error }
        401: { description: Unauthorized }
\`\`\`

Include ALL endpoints with:
- Request/response schemas
- Authentication requirements
- Rate limiting rules
- Error response formats`
  },
  {
    id: 'frontend',
    title: '5. Frontend Architecture',
    tokens: 2500,
    prompt: `Generate Frontend Implementation Details:
- Exact folder structure (/src/app, /src/components, /src/lib, /src/hooks)
- Component hierarchy with props interfaces
- State management setup (Zustand/Redux store structure)
- Routing with exact paths and protected routes
- Form validation schemas (Zod)
- Key React component examples with TypeScript interfaces`
  },
  {
    id: 'backend',
    title: '6. Backend Architecture',
    tokens: 2000,
    prompt: `Generate Backend Implementation Details:
- Folder structure (/src/routes, /src/services, /src/middleware)
- Authentication flow (JWT/session, refresh tokens)
- Authorization middleware with role-based access
- Error handling patterns
- Background job setup if needed
- File upload handling if needed`
  },
  {
    id: 'tech_stack',
    title: '7. Technology Stack',
    tokens: 1500,
    prompt: `Generate Technology Stack with EXACT versions (December 2025):
| Category | Technology | Version | Why Chosen |
|----------|------------|---------|------------|
| Frontend Framework | Next.js | 15.1.0 | App Router, RSC |
| UI Library | shadcn/ui | latest | Accessible, customizable |
| State | Zustand | 5.0.0 | Simple, performant |
| Database | Supabase | latest | Real-time, auth, storage |
| AI | OpenAI | gpt-5.2 | Best reasoning |

Include installation commands and key configuration.`
  },
  {
    id: 'environment',
    title: '8. Environment & Configuration',
    tokens: 1000,
    prompt: `Generate complete .env.example:
\`\`\`bash
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...

# Auth
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# External Services
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
\`\`\`

Include where to get each key and any setup steps.`
  },
  {
    id: 'security',
    title: '9. Security Implementation',
    tokens: 1500,
    prompt: `Generate Security section:
- OWASP Top 10 mitigations specific to this app
- Input validation strategy
- SQL injection prevention (parameterized queries)
- XSS protection (CSP headers, sanitization)
- CSRF protection
- Rate limiting (endpoints, limits, algorithm)
- Secrets management
- Security headers (helmet.js config)`
  },
  {
    id: 'testing',
    title: '10. Testing Strategy',
    tokens: 1200,
    prompt: `Generate Testing Strategy:
- Unit tests: What to test, coverage goal (80%+), framework (Vitest)
- Integration tests: API endpoint tests with example
- E2E tests: Critical flows with Playwright example
- Test data: Fixtures and factories
- CI/CD integration: GitHub Actions workflow snippet`
  },
  {
    id: 'deployment',
    title: '11. Deployment & DevOps',
    tokens: 1200,
    prompt: `Generate Deployment section:
- Step-by-step deployment commands
- Vercel/Netlify configuration
- Environment variable setup per environment
- Database migration commands
- Health check endpoints
- Rollback procedure
- Monitoring setup (Sentry, LogRocket)`
  }
];

// Base system prompt for all sections
const SECTION_SYSTEM_PROMPT = `You are a Principal Software Architect generating a specific section of a technical specification.

RULES:
1. Be SPECIFIC - use actual names, types, paths, not generic descriptions
2. Include CODE SNIPPETS where appropriate - real, working code
3. Make it ACTIONABLE - a developer should be able to implement directly from this
4. Use December 2025 best practices and latest stable versions
5. Output ONLY the section content in markdown, no preamble

This section will be combined with others to form a complete specification that an AI coding agent can use to build the entire application.`;

// Context builder for section generation
function buildSectionContext(roundData: RoundData | undefined): string {
  const syntheses = roundData?.syntheses || [];
  const votes = roundData?.votes || [];

  const expertContext = syntheses.map(s =>
    `${s.expertName}: ${s.synthesis?.substring(0, 500)}...`
  ).join('\n\n');

  const keyRequirements = votes.flatMap(v => v.keyRequirements || []).join('\n- ');

  const debateContext = roundData?.debateResolutions?.map(d =>
    `Decision: ${d.resolution}`
  ).join('\n') || '';

  return `EXPERT INSIGHTS:\n${expertContext}\n\nKEY REQUIREMENTS:\n- ${keyRequirements}\n\nDECISIONS:\n${debateContext}`;
}

// Generate a single section
async function generateSection(
  section: SpecSection, 
  context: string,
  productIdea: string
): Promise<string> {
  console.info(`[Spec] Generating section: ${section.title} (${section.tokens} tokens)...`);
  
  const response = await callOpenRouter({
    model: SPEC_MODEL,
    messages: [
      { role: 'system', content: SECTION_SYSTEM_PROMPT },
      { role: 'user', content: `PRODUCT: ${productIdea}\n\n${context}\n\nGENERATE THIS SECTION:\n# ${section.title}\n\n${section.prompt}` }
    ],
    temperature: 0.7,
    maxTokens: section.tokens
  });
  
  console.info(`[Spec] Section ${section.id}: ${response.usage.completionTokens} tokens, $${response.cost.toFixed(4)}`);
  
  return response.content;
}

// Legacy single-pass function for backwards compatibility
export const handleSpecStage = async (roundData: RoundData | undefined) => {
    console.info('[Enhanced] Generating final specification...');

    const syntheses = roundData?.syntheses || [];
    const votes = roundData?.votes || [];
    const researchResults = roundData?.researchResults || [];

    const avgToolsUsed = researchResults.reduce((sum: number, r) =>
        sum + (r.toolsUsed?.length || 0), 0) / Math.max(researchResults.length, 1);

    const weightedContext = syntheses.map(s => {
        const quality = s.researchQuality || {};
        const researchDepth = avgToolsUsed > 0 ? (quality.toolsUsed || 0) / avgToolsUsed : 1;
        const weight = Math.min(researchDepth * 100, 100);
        return `${s.expertName} (research depth: ${weight.toFixed(0)}%):\n${s.synthesis}`;
    }).join('\n\n');

    const keyRequirements = votes.flatMap(v => v.keyRequirements || []).join('\n');

    const debateContext = roundData?.debateResolutions ?
        `\n\nDEBATE RESOLUTIONS:\n${roundData.debateResolutions.map(d =>
            `Resolution: ${d.resolution}\nAdopted: ${d.adoptedAlternatives.join(', ')}`
        ).join('\n\n')}` : '';

    const specPrompt = await renderPrompt('specification_generation', {
        weightedContext,
        keyRequirements,
        debateContext
    });

    return { specPrompt, weightedContext, keyRequirements, debateContext };
};

// Common tech domains mapping for Brandfetch logo lookup
// When the LLM outputs a domain, Brandfetch will provide the logo automatically
const KNOWN_TECH_DOMAINS: Record<string, string> = {
  'react': 'react.dev',
  'vue': 'vuejs.org',
  'angular': 'angular.io',
  'svelte': 'svelte.dev',
  'next.js': 'nextjs.org',
  'nextjs': 'nextjs.org',
  'nuxt': 'nuxt.com',
  'vite': 'vitejs.dev',
  'webpack': 'webpack.js.org',
  'node.js': 'nodejs.org',
  'nodejs': 'nodejs.org',
  'deno': 'deno.land',
  'bun': 'bun.sh',
  'express': 'expressjs.com',
  'fastify': 'fastify.io',
  'supabase': 'supabase.com',
  'firebase': 'firebase.google.com',
  'postgresql': 'postgresql.org',
  'postgres': 'postgresql.org',
  'mongodb': 'mongodb.com',
  'redis': 'redis.io',
  'prisma': 'prisma.io',
  'drizzle': 'orm.drizzle.team',
  'openai': 'openai.com',
  'anthropic': 'anthropic.com',
  'groq': 'groq.com',
  'google': 'google.com',
  'gemini': 'gemini.google.com',
  'vercel': 'vercel.com',
  'netlify': 'netlify.com',
  'cloudflare': 'cloudflare.com',
  'aws': 'aws.amazon.com',
  'docker': 'docker.com',
  'kubernetes': 'kubernetes.io',
  'github': 'github.com',
  'typescript': 'typescriptlang.org',
  'tailwindcss': 'tailwindcss.com',
  'tailwind': 'tailwindcss.com',
  'shadcn': 'ui.shadcn.com',
  'radix': 'radix-ui.com',
  'framer': 'framer.com',
  'stripe': 'stripe.com',
  'clerk': 'clerk.com',
  'auth0': 'auth0.com',
  'sentry': 'sentry.io',
  'vitest': 'vitest.dev',
  'jest': 'jestjs.io',
  'playwright': 'playwright.dev',
  'cypress': 'cypress.io',
  'zustand': 'zustand-demo.pmnd.rs',
  'redux': 'redux.js.org',
  'tanstack': 'tanstack.com',
};

// Helper to generate tech stack extraction prompt
const generateTechStackPrompt = (specText: string) => `Analyze the following technical specification and extract the recommended Technology Stack into a structured JSON format.

SPECIFICATION:
${specText.substring(0, 15000)}... [truncated]

Extract the key technology decisions for these categories: Frontend, Backend, Database, AI/ML, DevOps.
For each decision, identify the "Selected" tech and 1-2 "Alternatives" mentioned (or reasonable alternatives if not explicit).

IMPORTANT: Include the "domain" field for each technology - this is the official website domain (e.g., "react.dev", "nextjs.org", "supabase.com").
The domain is used for automatic logo lookup via Brandfetch CDN.

Output ONLY JSON with this schema:
[
  {
    "category": "Frontend",
    "selected": {
      "name": "React",
      "domain": "react.dev",
      "version": "19.0.2",
      "rating": 5,
      "pros": ["Ecosystem", "Components"],
      "cons": ["Complexity"],
      "logo": ""
    },
    "alternatives": [{
      "name": "Vue",
      "domain": "vuejs.org",
      "version": "3.5.0",
      "rating": 4,
      "pros": [...],
      "cons": [...],
      "logo": ""
    }]
  },
  ...
]

Common domains: ${Object.entries(KNOWN_TECH_DOMAINS).slice(0, 20).map(([k, v]) => `${k}=${v}`).join(', ')}

Leave "logo" empty - logos are fetched dynamically from Brandfetch CDN using the domain.
Ensure "rating" is 1-5.`;

// ═══════════════════════════════════════════════════════════════
// BRANDFETCH LOGO URL BUILDER
// ═══════════════════════════════════════════════════════════════

const BRANDFETCH_CLIENT_ID = Deno.env.get('BRANDFETCH_BRAND_API_KEY') || '';

function getBrandfetchLogoUrl(domain: string): string {
  if (!domain || !BRANDFETCH_CLIENT_ID) return '';
  // Brandfetch CDN URL format
  return `https://cdn.brandfetch.io/${domain}/w/128/h/128/theme/dark/icon?c=${BRANDFETCH_CLIENT_ID}`;
}

function resolveTechDomain(techName: string, providedDomain?: string): string {
  if (providedDomain) return providedDomain;
  const normalizedName = techName.toLowerCase().replace(/[.\s]/g, '');
  return KNOWN_TECH_DOMAINS[normalizedName] || KNOWN_TECH_DOMAINS[techName.toLowerCase()] || '';
}

// Add Brandfetch logo URLs to tech stack items
function enrichTechStackWithLogos(techStack: TechStackItem[]): TechStackItem[] {
  return techStack.map(item => ({
    ...item,
    selected: {
      ...item.selected,
      domain: resolveTechDomain(item.selected?.name, item.selected?.domain),
      logo: getBrandfetchLogoUrl(resolveTechDomain(item.selected?.name, item.selected?.domain))
    },
    alternatives: (item.alternatives || []).map(alt => ({
      ...alt,
      domain: resolveTechDomain(alt.name, alt.domain),
      logo: getBrandfetchLogoUrl(resolveTechDomain(alt.name, alt.domain))
    }))
  }));
}

// ═══════════════════════════════════════════════════════════════
// MULTI-PASS SPEC GENERATION - MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

export const handleSpecStageComplete = async (roundData: RoundData | undefined, groqApiKey: string) => {
    const specStart = Date.now();
    
    // Build context from research/debate phases
    const context = buildSectionContext(roundData);
    
    // Extract product idea from first synthesis or use fallback
    const productIdea = roundData?.syntheses?.[0]?.synthesis?.substring(0, 200) || 'Product specification';
    
    console.info(`[Spec] Starting multi-pass generation with ${SPEC_SECTIONS.length} sections...`);
    
    // Generate each section in parallel (batched to avoid rate limits)
    const sectionContents: string[] = [];
    
    // Generate sections in batches of 3 for parallelism without overwhelming the API
    // Use Promise.allSettled for graceful partial failure - spec can still be useful with some sections missing
    for (let i = 0; i < SPEC_SECTIONS.length; i += 3) {
      const batch = SPEC_SECTIONS.slice(i, i + 3);
      const settledResults = await Promise.allSettled(
        batch.map(section => generateSection(section, context, productIdea))
      );

      settledResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          sectionContents.push(result.value);
        } else {
          const section = batch[idx];
          console.error(`[Spec] Section ${section.id} failed:`, result.reason);
          sectionContents.push(`## ${section.title}\n\n*Generation failed - please regenerate this section*`);
        }
      });
    }
    
    // Combine all sections into final spec
    const spec = `# Technical Specification

*Generated by Specificity AI on ${new Date().toISOString().split('T')[0]}*
*Multi-agent consensus from ${roundData?.syntheses?.length || 0} expert advisors*

---

${sectionContents.join('\n\n---\n\n')}

---

## Appendix: Generation Metadata

- **Sections Generated**: ${SPEC_SECTIONS.length}
- **Model**: ${SPEC_MODEL}
- **Total Tokens**: ~${SPEC_SECTIONS.reduce((sum, s) => sum + s.tokens, 0)}
- **Generation Time**: ${((Date.now() - specStart) / 1000).toFixed(1)}s
`;

    console.info(`[Spec] Multi-pass complete: ${SPEC_SECTIONS.length} sections in ${((Date.now() - specStart) / 1000).toFixed(1)}s`);

    await trackPromptUsage('specification_generation', {
        latency_ms: Date.now() - specStart,
        model_used: SPEC_MODEL
    });

    // Extract Tech Stack with Brandfetch logos
    console.info('[Spec] Extracting structured tech stack with logos...');
    const techStackPrompt = generateTechStackPrompt(spec);

    let techStack: TechStackItem[] = [];
    try {
        const techStackJson = await callGroq(
            groqApiKey,
            "You are a JSON extractor. Output valid JSON only.",
            techStackPrompt,
            0.2,
            1500
        );
        const match = techStackJson.match(/```json\n([\s\S]*?)\n```/) || techStackJson.match(/\[[\s\S]*\]/);
        const jsonStr = match ? match[1] || match[0] : techStackJson;
        techStack = JSON.parse(jsonStr);
        
        // Enrich with Brandfetch logo URLs
        techStack = enrichTechStackWithLogos(techStack);
        console.info(`[Spec] Tech stack extracted: ${techStack.length} categories with logos`);
    } catch (e) {
        console.error('[Spec] Failed to extract tech stack:', e);
        // Provide a default tech stack with logos
        techStack = enrichTechStackWithLogos([
          {
            category: 'Frontend',
            selected: { name: 'React', rating: 5, pros: ['Ecosystem', 'Components'], cons: ['Complexity'] },
            alternatives: [{ name: 'Vue', rating: 4, pros: ['Simplicity'], cons: ['Smaller ecosystem'] }]
          },
          {
            category: 'Backend',
            selected: { name: 'Supabase', rating: 5, pros: ['Real-time', 'Auth', 'PostgreSQL'], cons: ['Vendor lock-in'] },
            alternatives: [{ name: 'Firebase', rating: 4, pros: ['Easy setup'], cons: ['NoSQL only'] }]
          }
        ]);
    }

    return new Response(
        JSON.stringify({ spec, techStack }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
}
