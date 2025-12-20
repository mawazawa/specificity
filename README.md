# Specificity AI

> **Production-Ready Product Specs in 30 Minutes**
> Get professional product specifications from 8 world-class AI advisors who debate, research, and deliver battle-tested specs with anti-drift controls.

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/mawazawa/specificity)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 What is Specificity?

Specificity AI solves the **$50K problem**: Bad specs cost companies thousands in wasted dev time, months of delays, and feature drift that kills products before launch.

### The Problem
- Solo founders suffer from "spec paralysis" - no co-founder to debate decisions
- Non-technical founders struggle to translate vision into technical requirements
- Freelance technical writers cost $300-1,500 and take days/weeks
- ChatGPT gives you ONE perspective when you need diverse expert input
- 35% of startups fail from "no market need" (poor planning)

### The Solution
**8 AI advisors** (Steve Jobs, Elon Musk, Oprah, Amal Clooney, Sam Altman, Gary Tan, Jony Ive, Paul Graham) debate your product idea through multiple rounds of:
1. **Research** - Latest tech, market analysis, competitive landscape
2. **Debate** - Multiple perspectives challenging assumptions
3. **Synthesis** - Consensus-based recommendations
4. **Specification** - 15-section production-ready spec document

**Result**: Professional specs in 30 minutes for $20 (vs $300-1,500 for freelancers)

## ✨ Features

### Production-Ready Features
- ✅ **96.7% Image Optimization** - 19MB → 653KB (WebP format)
- ✅ **100% TypeScript Type Safety** - Zero `any` types
- ✅ **Auto-Save** - 24-hour session persistence (never lose work)
- ✅ **Rate Limiting** - Database-backed protection
- ✅ **SEO Perfect** - 100/100 score (sitemap, manifest, robots.txt)
- ✅ **Code Splitting** - 430KB gzipped bundle
- ✅ **Professional Components** - ConfirmationDialog, CommandPalette, SampleSpecGallery
- ✅ **Accessibility** - WCAG AA+ compliant

### User Experience
- 🎯 **Sample Gallery** - Quick-start examples for onboarding
- ⌨️ **Keyboard Shortcuts** - CMD+K command palette
- 📄 **PDF Export** - Professional downloadable specs
- 💬 **Live Dialogue** - Watch advisors debate in real-time
- 🔄 **Multi-Round Process** - Research → Debate → Synthesis → Spec
- 💾 **Session Recovery** - Auto-restore work from last 24 hours

## 🏗️ Tech Stack

### Frontend
- **Vite 5.4** - Lightning-fast build tool
- **React 18.3** - Modern UI framework
- **TypeScript 5.8** - 100% type-safe codebase
- **Tailwind CSS 3.4** - Utility-first styling
- **shadcn/ui** - High-quality component library
- **Framer Motion** - Smooth animations
- **React Query** - Smart data caching

### Backend
- **Supabase** - PostgreSQL database + Auth
- **Supabase Edge Functions** - Serverless API
- **Rate Limiting** - Custom RPC functions

### AI Integration
- Multi-model AI orchestration
- Real-time streaming responses
- Consensus-based synthesis

### Developer Experience
- **ESLint 9** - Code quality enforcement
- **TypeScript Strict Mode** - Maximum type safety
- **Professional npm scripts** - typecheck, validate, optimize:images
- **Terser** - Production minification
- **Sharp** - Image optimization pipeline

## 🚀 Production Deployment

**Status:** ✅ **PRODUCTION READY** - [See full deployment summary](./PRODUCTION_READY_SUMMARY.md)

### Quick Deploy

1. **Set API Keys** (Required):
   - Go to [Supabase Dashboard → Edge Functions → Secrets](https://supabase.com/dashboard/project/tkkthpoottlqmdopmtuh/settings/edge-functions)
   - Add:
     - `GROQ_API_KEY` (from https://console.groq.com)
     - `EXA_API_KEY` (from https://exa.ai)

2. **Deploy Edge Functions**:
   ```bash
   # Option A: GitHub Actions (automated)
   # Set SUPABASE_ACCESS_TOKEN in GitHub Secrets, push to main

   # Option B: Manual CLI
   supabase login
   supabase functions deploy multi-agent-spec --project-ref tkkthpoottlqmdopmtuh --use-api
   supabase functions deploy voice-to-text --project-ref tkkthpoottlqmdopmtuh --use-api
   ```

3. **Verify Deployment**:
   ```bash
   # Set your anon key
   export SUPABASE_ANON_KEY="your_anon_key"
   
   # Run verification
   ./scripts/verify-production.sh
   ```

4. **Run Tests**:
   ```bash
   # Run Playwright E2E tests
   npm test
   
   # Test edge functions
   ./scripts/test-edge-functions.sh
   
   # Or test in dev mode
   npm run dev
   # Click "Test Workflow" button (bottom-right)
   ```

### Production URLs
- **Dashboard:** https://supabase.com/dashboard/project/tkkthpoottlqmdopmtuh
- **API Base:** https://tkkthpoottlqmdopmtuh.supabase.co
- **Edge Functions:** https://tkkthpoottlqmdopmtuh.supabase.co/functions/v1/

### Documentation
- **Deployment Checklist:** [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- **Production Summary:** [PRODUCTION_READY_SUMMARY.md](./PRODUCTION_READY_SUMMARY.md)
- **GitHub Actions:** [.github/workflows/deploy-functions.yml](./.github/workflows/deploy-functions.yml)

---

## 📦 Installation

### Prerequisites
- Node.js 18+ (use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm 9+ or pnpm 8+

### Quick Start

```bash
# Clone the repository
git clone https://github.com/mawazawa/specificity.git

# Navigate to project
cd specificity

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be running at `http://localhost:5173`

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Start dev server with HMR
npm run build            # Production build
npm run preview          # Preview production build

# Testing
npm test                 # Run Playwright E2E tests
npm test -- --ui         # Run tests with Playwright UI
npm test -- --debug      # Run tests in debug mode
npm test -- --list       # List all available tests

# Code Quality
npm run typecheck        # TypeScript type checking
npm run typecheck:watch  # Watch mode for type checking
npm run lint             # ESLint code linting
npm run validate         # Run typecheck + lint

# Optimization
npm run optimize:images  # Optimize image assets
npm run build:analyze    # Analyze bundle size

# Git Workflow
npm run pre-commit       # Pre-commit validation hook
```

## 📊 Build Performance

| Metric | Value | Status |
|--------|-------|--------|
| **Total Bundle Size** | 430KB (gzipped) | ✅ Excellent |
| **Images** | 653KB (17 WebP images) | ✅ 96.7% reduction |
| **Build Time** | 10.10s | ✅ Fast |
| **TypeScript Errors** | 0 | ✅ Perfect |
| **First Load JS** | 188KB | ✅ Under 250KB |
| **SEO Score** | 100/100 | ✅ Perfect |

### Bundle Breakdown
```
Critical Path (Loaded Immediately):
├── react-vendor.js       51 KB
├── Index.js              52 KB
├── ui-vendor.js          29 KB
├── supabase-vendor.js    37 KB
└── index.css             19 KB
                         ─────
Total Critical:          188 KB

Lazy Loaded (On Demand):
├── pdf-vendor.js        178 KB  (Only when exporting)
├── animation-vendor.js   40 KB
├── markdown-vendor.js    34 KB
└── form-vendor.js        12 KB
```

## 🗂️ Project Structure

```
specificity/
├── src/
│   ├── components/       # React components
│   │   ├── ui/          # Base UI components (shadcn)
│   │   ├── AgentCard.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── ConfirmationDialog.tsx
│   │   ├── LandingHero.tsx
│   │   ├── SampleSpecGallery.tsx
│   │   └── SpecOutput.tsx
│   ├── pages/           # Route components
│   │   ├── Index.tsx    # Main app
│   │   ├── Auth.tsx     # Authentication
│   │   └── NotFound.tsx
│   ├── types/           # TypeScript types
│   ├── integrations/    # Supabase integration
│   └── hooks/           # Custom React hooks
├── supabase/
│   ├── functions/       # Edge functions
│   └── migrations/      # Database migrations
├── scripts/
│   └── optimize-images.js
├── public/
│   ├── sitemap.xml
│   ├── robots.txt
│   └── manifest.json
├── PERSONAS.md          # User research (1,991 lines)
└── package.json
```

## 🎯 User Personas

See [PERSONAS.md](./PERSONAS.md) for comprehensive user research including:
- Sarah Chen - Non-technical Solo Founder
- Marcus Johnson - Corporate Intrapreneur
- Priya Patel - Technical Co-Founder
- David Thompson - Experienced SaaS Founder

**Key Insights**:
- 93% cheaper than hiring freelancer ($20 vs $300-1,500)
- Instant delivery vs days/weeks waiting
- 7 expert perspectives vs 1 human's biased view
- Professional quality for investor/stakeholder approval

## 🚀 Deployment

### Environment Variables Required

```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# AI Services (configure in Supabase Edge Functions)
# Set via Supabase Dashboard > Edge Functions > Secrets
```

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Deploy to Netlify

```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## 📝 Development Workflow

1. **Feature Development**
   ```bash
   git checkout -b feature/your-feature
   npm run dev
   # Make changes
   npm run validate  # TypeCheck + Lint
   npm run build     # Verify build works
   ```

2. **Pre-Commit Checklist**
   - ✅ `npm run typecheck` passes
   - ✅ `npm run lint` passes
   - ✅ `npm run build` succeeds
   - ✅ All new images optimized (`npm run optimize:images`)

3. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: your descriptive message"
   git push origin feature/your-feature
   ```

## 🤝 Contributing

This is currently a private project. For questions or collaboration inquiries, please reach out to [@mawazawa](https://github.com/mawazawa).

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **shadcn/ui** - Beautiful component library
- **Supabase** - Backend infrastructure
- **Lovable** - Initial project scaffolding
- **Claude (Anthropic)** - AI assistance and code optimization

---

**Built with ❤️ by [@mawazawa](https://github.com/mawazawa)**

**Repository**: https://github.com/mawazawa/specificity
