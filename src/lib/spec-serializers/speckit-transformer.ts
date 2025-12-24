/**
 * GitHub Spec Kit Transformer
 *
 * Transforms Specificity specs into GitHub Spec Kit format:
 * - spec.md: Feature specification with Given/When/Then acceptance criteria
 * - plan.md: Implementation plan from tech stack
 *
 * @see https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/
 * @see https://github.com/github/spec-kit
 */

import { TechStackItem } from '@/types/spec';

export interface SpecKitOutput {
  specMd: string;
  planMd: string;
}

/**
 * Extract project name from spec content
 */
function extractProjectName(specContent: string): string {
  const titleMatch = specContent.match(/^#\s+(.+?)(?:\n|$)/m);
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  return 'Untitled Project';
}

/**
 * Extract user stories from spec content and format as Given/When/Then
 */
function extractUserStories(specContent: string): string[] {
  const stories: string[] = [];

  // Find user story section
  const userStorySection = specContent.match(/(?:user\s+stories?|requirements?)[:\s]*\n([\s\S]*?)(?=\n##|\n#|$)/i);
  if (!userStorySection) {
    return stories;
  }

  const section = userStorySection[1];

  // Look for numbered or bulleted items
  const storyPatterns = [
    /(?:^|\n)\s*[-*]\s*(?:As\s+a[n]?\s+)?(.+?)(?:,\s*I\s+want|should\s+be\s+able\s+to|can)(.+?)(?:so\s+that|in\s+order\s+to)?(.+)?(?=\n\s*[-*]|\n\n|\n##|$)/gi,
    /(?:^|\n)\s*\d+\.\s*(.+?)(?=\n\s*\d+\.|\n\n|\n##|$)/gi,
  ];

  let match;
  for (const pattern of storyPatterns) {
    while ((match = pattern.exec(section)) !== null) {
      const story = match[0].trim();
      if (story.length > 20 && story.length < 500) {
        stories.push(story);
      }
    }
  }

  return stories.slice(0, 10); // Limit to 10 user stories
}

/**
 * Convert a user story to Given/When/Then format
 */
function formatAsGivenWhenThen(story: string, index: number): string {
  // Extract the key action and outcome from the story
  const storyLower = story.toLowerCase();

  // Try to parse "As a X, I want Y, so that Z" format
  const asAMatch = story.match(/as\s+a[n]?\s+([^,]+),?\s*I\s+want\s+to?\s*([^,]+)(?:,?\s*so\s+that\s*(.+))?/i);

  if (asAMatch) {
    const user = asAMatch[1].trim();
    const action = asAMatch[2].trim();
    const benefit = asAMatch[3]?.trim() || 'the system behaves as expected';

    return `### User Story ${index + 1}: ${action.charAt(0).toUpperCase() + action.slice(1)} (Priority: P${Math.min(index + 1, 4)})

**As a** ${user}
**I want** ${action}
**So that** ${benefit}

**Acceptance Criteria:**
1. **Given** the user is ${storyLower.includes('logged') || storyLower.includes('auth') ? 'authenticated' : 'on the relevant page'}, **When** they ${action}, **Then** the system should respond appropriately
2. **Given** valid input is provided, **When** the action is completed, **Then** ${benefit}
3. **Given** an error occurs, **When** the user attempts the action, **Then** a helpful error message should be displayed

**Why P${Math.min(index + 1, 4)}**: ${index === 0 ? 'Core functionality for MVP' : index < 3 ? 'Important feature for user experience' : 'Enhancement for complete solution'}
`;
  }

  // Fallback for simpler story formats
  const cleanStory = story.replace(/^[-*\d.]+\s*/, '').trim();
  return `### User Story ${index + 1}: ${cleanStory.substring(0, 50)}... (Priority: P${Math.min(index + 1, 4)})

${cleanStory}

**Acceptance Criteria:**
1. **Given** the user is ready, **When** they perform this action, **Then** the expected outcome occurs
2. **Given** valid conditions, **When** the feature is used, **Then** it works correctly
3. **Given** edge cases, **When** handled, **Then** graceful degradation occurs

**Why P${Math.min(index + 1, 4)}**: ${index === 0 ? 'Core functionality' : 'Supporting feature'}
`;
}

/**
 * Extract functional requirements from spec
 */
function extractFunctionalRequirements(specContent: string): string[] {
  const requirements: string[] = [];

  // Look for "must", "shall", "should" statements
  const patterns = [
    /(?:system|application|api|service)\s+(?:must|shall|should)\s+(.+?)(?:\.|$)/gi,
    /(?:users?|clients?)\s+(?:must|shall|should)\s+be\s+able\s+to\s+(.+?)(?:\.|$)/gi,
    /(?:FR-\d+)[:\s]+(.+?)(?:\.|$)/gi,
  ];

  const seenRequirements = new Set<string>();

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(specContent)) !== null) {
      const req = match[1].trim();
      const reqKey = req.toLowerCase().substring(0, 50);
      if (req.length > 10 && req.length < 200 && !seenRequirements.has(reqKey)) {
        seenRequirements.add(reqKey);
        requirements.push(req);
      }
    }
  }

  return requirements.slice(0, 15);
}

/**
 * Extract success criteria from spec
 */
function extractSuccessCriteria(specContent: string): string[] {
  const criteria: string[] = [];

  // Look for success/metric mentions
  const patterns = [
    /(?:success\s+criteria?|metrics?|kpis?)[:\s]*([^.\n]+)/gi,
    /(?:target|goal)[:\s]*([^.\n]+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(specContent)) !== null) {
      const criterion = match[1].trim();
      if (criterion.length > 10 && criterion.length < 200) {
        criteria.push(criterion);
      }
    }
  }

  return criteria.slice(0, 5);
}

/**
 * Generate spec.md in GitHub Spec Kit format
 */
function generateSpecMd(specContent: string, techStack: TechStackItem[]): string {
  const projectName = extractProjectName(specContent);
  const userStories = extractUserStories(specContent);
  const requirements = extractFunctionalRequirements(specContent);
  const successCriteria = extractSuccessCriteria(specContent);
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let output = `# Feature Specification: ${projectName}

**Created**: ${date}
**Status**: Ready for Implementation
**Generator**: Specificity AI Multi-Agent Pipeline

---

## Executive Summary

${extractExecutiveSummary(specContent)}

---

## User Scenarios & Testing

`;

  // Add user stories in Given/When/Then format
  if (userStories.length > 0) {
    userStories.forEach((story, index) => {
      output += formatAsGivenWhenThen(story, index);
      output += '\n---\n\n';
    });
  } else {
    // Generate placeholder stories from spec content
    output += `### User Story 1: Core Functionality (Priority: P1)

**As a** user
**I want** to use the main features of this application
**So that** I can accomplish my goals efficiently

**Acceptance Criteria:**
1. **Given** the user accesses the application, **When** they navigate to the main feature, **Then** they can use it successfully
2. **Given** valid input, **When** the user submits data, **Then** the system processes it correctly
3. **Given** an error condition, **When** it occurs, **Then** the user receives a helpful message

**Why P1**: Core functionality required for MVP

---

`;
  }

  // Add requirements section
  output += `## Requirements

### Functional Requirements

`;

  if (requirements.length > 0) {
    requirements.forEach((req, index) => {
      output += `- **FR-${String(index + 1).padStart(3, '0')}**: System MUST ${req}\n`;
    });
  } else {
    output += `- **FR-001**: System MUST implement the core functionality described above
- **FR-002**: System MUST validate all user inputs
- **FR-003**: System MUST handle errors gracefully
`;
  }

  // Add success criteria
  output += `\n### Success Criteria

#### Measurable Outcomes

`;

  if (successCriteria.length > 0) {
    successCriteria.forEach((criterion, index) => {
      output += `- **SC-${String(index + 1).padStart(3, '0')}**: ${criterion}\n`;
    });
  } else {
    output += `- **SC-001**: Core features are functional and tested
- **SC-002**: User acceptance testing passes
- **SC-003**: Performance meets baseline requirements
`;
  }

  // Add tech stack summary
  output += `\n---

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
`;

  techStack.forEach(item => {
    const version = item.selected.version || 'latest';
    output += `| ${item.category} | ${item.selected.name} | ${version} |\n`;
  });

  output += `
---

## Notes for Implementation

This specification was generated by Specificity AI using a multi-agent expert panel.
For detailed implementation guidance, see the accompanying \`plan.md\` file.

> Generated with [Specificity AI](https://specificity.ai) on ${date}
`;

  return output;
}

/**
 * Extract executive summary from spec
 */
function extractExecutiveSummary(specContent: string): string {
  const summaryMatch = specContent.match(/(?:executive\s+summary|overview)[:\s]*\n([\s\S]*?)(?=\n##|\n#|$)/i);
  if (summaryMatch) {
    return summaryMatch[1].trim().substring(0, 800);
  }

  // Fallback to first meaningful paragraph
  const afterHeader = specContent.match(/^#[^#].*?\n\n([\s\S]*?)(?:\n\n|\n#)/s);
  if (afterHeader) {
    return afterHeader[1].trim().substring(0, 500);
  }

  return 'See full specification for project details.';
}

/**
 * Generate plan.md from tech stack and spec content
 */
function generatePlanMd(specContent: string, techStack: TechStackItem[]): string {
  const projectName = extractProjectName(specContent);
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let output = `# Implementation Plan: ${projectName}

**Created**: ${date}
**Status**: Ready for Development
**Generator**: Specificity AI

---

## Phase 1: Project Setup

### Environment Configuration

\`\`\`bash
# Initialize project
pnpm create next-app ${projectName.toLowerCase().replace(/\s+/g, '-')} --typescript --tailwind --app

# Install core dependencies
pnpm add ${techStack.map(t => t.selected.name.toLowerCase().replace(/\s+/g, '-')).join(' ')}

# Install dev dependencies
pnpm add -D vitest @testing-library/react playwright
\`\`\`

### Directory Structure

\`\`\`
${projectName.toLowerCase().replace(/\s+/g, '-')}/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   └── api/             # API routes
│   ├── components/          # React components
│   │   └── ui/              # shadcn/ui components
│   ├── lib/                 # Utilities
│   ├── hooks/               # Custom hooks
│   └── types/               # TypeScript types
├── supabase/
│   ├── migrations/          # Database migrations
│   └── functions/           # Edge functions
├── tests/                   # Test files
└── public/                  # Static assets
\`\`\`

---

## Phase 2: Core Implementation

### Tech Stack Setup

`;

  techStack.forEach((item, index) => {
    const version = item.selected.version || 'latest';
    output += `#### ${index + 1}. ${item.category}: ${item.selected.name}

- **Version**: ${version}
- **Domain**: ${item.selected.domain || 'N/A'}
- **Pros**: ${item.selected.pros.slice(0, 2).join(', ')}
- **Cons**: ${item.selected.cons.slice(0, 2).join(', ')}

`;
  });

  output += `---

## Phase 3: Testing & Validation

### Testing Strategy

1. **Unit Tests**: Use Vitest for component and utility testing
2. **Integration Tests**: Test API endpoints and database interactions
3. **E2E Tests**: Use Playwright for critical user flows

### Test Commands

\`\`\`bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Generate coverage report
pnpm test:coverage
\`\`\`

---

## Phase 4: Deployment

### Vercel Deployment

\`\`\`bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy to production
vercel --prod
\`\`\`

### Environment Variables

Configure these in your Vercel dashboard:

\`\`\`
DATABASE_URL=
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
\`\`\`

---

## Milestones

| Milestone | Description | Status |
|-----------|-------------|--------|
| M1 | Project setup and core dependencies | ⏳ Pending |
| M2 | Core feature implementation | ⏳ Pending |
| M3 | Testing and validation | ⏳ Pending |
| M4 | Production deployment | ⏳ Pending |

---

> Generated with [Specificity AI](https://specificity.ai) on ${date}
`;

  return output;
}

/**
 * Transform Specificity spec to GitHub Spec Kit format
 */
export function transformToSpecKit(
  specContent: string,
  techStack: TechStackItem[]
): SpecKitOutput {
  return {
    specMd: generateSpecMd(specContent, techStack),
    planMd: generatePlanMd(specContent, techStack),
  };
}

/**
 * Generate combined Spec Kit markdown (spec.md + plan.md)
 */
export function generateSpecKitMarkdown(
  specContent: string,
  techStack: TechStackItem[]
): string {
  const { specMd, planMd } = transformToSpecKit(specContent, techStack);
  return `${specMd}\n\n---\n---\n\n${planMd}`;
}
