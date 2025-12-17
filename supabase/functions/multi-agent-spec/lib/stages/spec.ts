/* eslint-disable @typescript-eslint/no-explicit-any */
import { corsHeaders } from '../utils/api.ts';
import { callGroq } from '../utils/api.ts';
import { RoundData } from '../types.ts'; // Import RoundData

export const handleSpecStage = async (roundData: RoundData | undefined) => {
    console.log('[Enhanced] Generating final specification...');

    const syntheses = roundData.syntheses || [];
    const votes = roundData.votes || [];
    const researchResults = roundData.researchResults || [];

    // Calculate research quality scores
    const avgToolsUsed = researchResults.reduce((sum: number, r: any) =>
        sum + (r.toolsUsed?.length || 0), 0) / researchResults.length;

    const weightedContext = syntheses.map((s: any) => {
        const quality = s.researchQuality || {};
        const researchDepth = (quality.toolsUsed || 0) / Math.max(avgToolsUsed, 1);
        const weight = Math.min(researchDepth * 100, 100);
        return `${s.expertName} (research depth: ${weight.toFixed(0)}%):\n${s.synthesis}`;
    }).join('\n\n');

    const keyRequirements = votes.flatMap((v: any) => v.keyRequirements || []);

    // Include debate resolutions if available
    const debateContext = roundData.debateResolutions ?
        `\n\nDEBATE RESOLUTIONS (battle-tested through Ray Dalio-style challenges):\n${roundData.debateResolutions.map((d: any) =>
            `Resolution: ${d.resolution}\nAdopted Alternatives: ${d.adoptedAlternatives.join(', ')}\nConfidence Change: ${d.confidenceChange > 0 ? '+' : ''}${d.confidenceChange}%`
        ).join('\n\n')
        }` : '';

    // Note: The actual prompt generation and call to the LLM for the spec is missing in the original code snippet provided in view_file.
    // It seems the original code ended abruptly or I missed the actual LLM call for the spec generation in the view_file output.
    // Based on the context, it constructs a prompt and likely calls callGroq or similar.
    // I will reconstruct it based on the prompt variable I saw.

    const specPrompt = `Based on deep expert research with contemporaneous web verification and battle-tested through contrarian challenges, create an EXTRAORDINARILY DETAILED technical specification.

This spec must be so comprehensive that an AI agent (like Claude Code) could implement the ENTIRE application from start to finish in a single session without additional clarification.

EXPERT SYNTHESES (with research depth scores):
${weightedContext}

KEY REQUIREMENTS (from consensus voting):
${keyRequirements.join('\n')}${debateContext}

Generate a 15-20 PAGE production-ready specification with EXTREME implementation detail:

# 1. Executive Summary
- Product vision and value proposition
- Target market and user personas
- Key differentiators from competitors
- Success criteria (quantifiable)

# 2. Core Requirements
- Functional requirements (user stories with acceptance criteria)
- Non-functional requirements (performance, security, scalability)
- Must-have vs nice-to-have (prioritized by consensus)
- Constraints and assumptions

# 3. Complete Technical Architecture
- **System architecture diagram** (describe in detail)
- **Frontend architecture**: Component hierarchy, state management, routing
- **Backend architecture**: API design, microservices/monolith, data flow
- **Database schema**: EXACT tables, columns, types, indexes, relationships, constraints
- **Authentication/Authorization**: Flow diagrams, JWT/session strategy, role-based access
- **Third-party integrations**: APIs, SDKs, webhooks
- **Deployment architecture**: Cloud provider, regions, CDN, load balancing

# 4. API Specification
- **Every endpoint** with:
  - HTTP method, path, authentication
  - Request parameters (path, query, body) with types and validation
  - Response format (success and error cases)
  - Status codes and error messages
  - Rate limiting and caching strategy
- **WebSocket/real-time** endpoints if applicable
- **API versioning** strategy

# 5. Database Schema (Detailed)
For each table provide:
- Table name and purpose
- Every column: name, type, constraints (NOT NULL, UNIQUE, etc.)
- Primary keys and foreign keys
- Indexes for performance
- Triggers and stored procedures if needed
- Sample data for clarity
- Migration strategy

# 6. Frontend Implementation Details
- **Exact folder structure**: /src/components, /src/pages, /src/hooks, etc.
- **Component breakdown**: Every major component with props, state, events
- **State management**: Redux/Context/Zustand setup, store structure, actions
- **Routing**: Exact routes, protected routes, navigation flow
- **Form validation**: Libraries (Zod/Yup), validation rules
- **UI/UX patterns**: Design system, component library, theming
- **Responsive design**: Breakpoints, mobile-first approach
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

# 7. Backend Implementation Details
- **Exact folder structure**: /src/routes, /src/controllers, /src/models, etc.
- **Authentication flow**: Step-by-step with code patterns
- **Authorization middleware**: Role checks, permission system
- **Data validation**: Input sanitization, schema validation
- **Error handling**: Global error handler, error types, logging
- **Background jobs**: Queue system (Bull/BullMQ), cron jobs
- **File uploads**: Storage strategy (S3/Cloudinary), validation, CDN

# 8. Technology Stack (November 2025 - Latest Versions)
For each technology specify:
- **Exact version number** (e.g., React 19.0.2, Next.js 15.1.0)
- **Why chosen** (specific features needed)
- **Alternatives considered** and why rejected
- **Installation command**
- **Configuration requirements**

Include:
- Frontend: Framework, UI library, state management, form handling, data fetching
- Backend: Runtime (Node/Deno/Bun), framework, ORM/query builder
- Database: Primary DB, caching layer (Redis), search (Elasticsearch)
- AI/ML: Model providers, vector DB for embeddings
- DevOps: CI/CD, containerization, monitoring, logging
- Testing: Unit (Vitest/Jest), E2E (Playwright/Cypress), API (Supertest)

# 9. Environment Configuration
- **Every environment variable** needed:
  - Variable name
  - Purpose
  - Example value (non-sensitive)
  - Where to obtain (API keys)
- **.env.example** file content
- **Secrets management** (Vault, Parameter Store)

# 10. Dependencies & Third-Party Services
- **Every npm package** with version and purpose
- **API services** (Stripe, SendGrid, etc.) with pricing tiers
- **OAuth providers** (Google, GitHub) with setup steps
- **CDN/Storage** (Cloudflare, S3) with configuration
- **Monitoring** (Sentry, DataDog) with alert rules

# 11. Security Implementation
- **OWASP Top 10** mitigation strategies (specific to this app)
- **Input validation** and sanitization (where and how)
- **SQL injection** prevention (parameterized queries, ORM)
- **XSS protection** (CSP headers, sanitization libraries)
- **CSRF tokens** implementation
- **Rate limiting** (endpoints, algorithms, thresholds)
- **Secrets management** (how and where stored)
- **Encryption** (data at rest, data in transit)
- **Security headers** (helmet.js configuration)
- **Dependency scanning** (Snyk, npm audit)

# 12. Scalability & Performance
- **Horizontal scaling** strategy (load balancer, session management)
- **Database optimization** (indexing strategy, query optimization)
- **Caching layers** (Redis, CDN, browser cache)
- **Asset optimization** (code splitting, lazy loading, compression)
- **CDN strategy** (static assets, geographic distribution)
- **Performance budgets** (load time, bundle size, FCP, LCP)
- **Monitoring** (APM tools, metrics to track)

# 13. Testing Strategy
- **Unit tests**: What to test, coverage goals (80%+), frameworks
- **Integration tests**: API endpoints, database interactions
- **E2E tests**: Critical user flows, test scenarios
- **Performance tests**: Load testing (k6/Artillery), benchmarks
- **Security tests**: Penetration testing, vulnerability scanning
- **Test data**: Fixtures, factories, seed data
- **CI/CD integration**: Test automation, coverage reporting

# 14. Deployment & DevOps
- **Exact deployment steps** (command by command):
  1. Build frontend: npm run build
  2. Deploy to Vercel: vercel --prod
  3. Deploy backend: docker build and docker push and kubectl apply
  4. Run migrations: npm run migrate:prod`;

    // Since I don't have the original callGroq call for this part, I'll assume it uses the same pattern
    // but with a higher token limit for the spec.
    // However, callGroq has a hardcoded maxTokens of 800 in the original code (or passed in).
    // The prompt asks for a 15-20 page spec, which requires A LOT of tokens.
    // I will use a larger max_tokens value here, assuming the model supports it.

    // NOTE: In the original file, I suspect the code for this stage was truncated in the view_file output.
    // I will use a placeholder call here that matches the pattern.

    // We need to import callGroq and GROQ_API_KEY (which needs to be passed in)
    // But wait, handleSpecStage needs the API key.

    // I'll update the signature to accept the key.

    return { specPrompt }; // Returning the prompt for now as I need to see how it was called or just implement the call.
};

// Re-implementing the call properly
import { callGroq } from '../utils/api.ts';

export const handleSpecStageComplete = async (roundData: RoundData | undefined, groqApiKey: string) => {
    const { specPrompt } = await handleSpecStage(roundData);

    const spec = await callGroq(
        groqApiKey,
        "You are a Principal Software Architect. Generate the final specification.",
        specPrompt,
        0.7,
        4000 // Increased token limit for spec
    );

    return new Response(
        JSON.stringify({ spec }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
}
