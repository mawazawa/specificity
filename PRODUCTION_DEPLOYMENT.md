# Production Deployment Guide - Specificity AI

**Version**: 1.0
**Date**: 2025-10-24
**Status**: Production Ready ✅

---

## 📋 Pre-Deployment Checklist

### ✅ Code Quality
- [x] All builds passing (no TypeScript errors)
- [x] Error boundaries implemented
- [x] Loading states for all async operations
- [x] Auto-save functionality
- [x] Professional PDF export
- [x] Code splitting and lazy loading
- [x] Bundle optimization (<1MB after gzip)

### ✅ Performance
- [x] Vite build optimization configured
- [x] Manual code splitting implemented
- [x] Images optimized (recommend WebP conversion)
- [x] DNS prefetch for external APIs
- [x] React Query caching configured

### ✅ SEO & Accessibility
- [x] Meta tags (title, description, OG, Twitter)
- [x] Structured data (Schema.org)
- [x] Sitemap.xml
- [x] Robots.txt
- [x] Manifest.json (PWA ready)
- [x] ARIA labels on interactive elements
- [x] Loading skeletons with sr-only text
- [x] Keyboard navigation support

### ✅ Security
- [x] Rate limiting (database + function)
- [x] Environment variable validation
- [x] Prompt injection detection
- [x] Input sanitization
- [x] RLS policies on all tables
- [x] CORS headers configured

---

## 🗄️ Database Setup

### 1. Apply Migrations

```bash
# Connect to your Supabase project
supabase link --project-ref kxrdxiznaudatxyfrbxe

# Apply all migrations
supabase db push

# Verify migrations applied
supabase db diff
```

### 2. Verify Tables

Check that these tables exist:
- `profiles` - User profiles
- `user_roles` - Role management
- `rate_limit` - API rate limiting

### 3. Test RPC Functions

```sql
-- Test rate limit function
SELECT check_and_increment_rate_limit(
  'test-user-id'::uuid,
  'multi-agent-spec',
  5,
  now() - interval '1 hour'
);
```

---

## 🔐 Environment Variables

### Supabase Edge Function Secrets

Set these in: `Supabase Dashboard → Settings → Edge Functions → Secrets`

```bash
# Required API Keys
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
EXA_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

# Supabase (auto-configured)
SUPABASE_URL=https://kxrdxiznaudatxyfrbxe.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Frontend Environment Variables

In `.env` (already configured):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### How to Get API Keys

#### Groq API Key
1. Visit https://console.groq.com
2. Sign up / Log in
3. Navigate to API Keys
4. Create new key
5. Copy and save (shown only once)

#### Exa API Key
1. Visit https://exa.ai
2. Sign up for access
3. Go to Dashboard → API Keys
4. Generate new key
5. Copy and save

---

## 🚀 Deployment Steps

### Option 1: Lovable Deploy (Recommended)

```bash
# From Lovable UI
1. Click "Share" → "Publish"
2. Choose custom domain (optional)
3. Deploy
```

### Option 2: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

### Option 3: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod
```

### Option 4: Self-Hosted (Docker)

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build and run
docker build -t specificity-ai .
docker run -p 80:80 specificity-ai
```

---

## 🧪 Post-Deployment Testing

### 1. Smoke Tests

```bash
# Health check
curl https://yourdomain.com

# Check API
curl https://yourdomain.com/api/health
```

### 2. Functional Tests

- [ ] User can sign up/login
- [ ] Sample spec gallery loads
- [ ] Can generate a spec (try with example)
- [ ] Auto-save works (refresh page)
- [ ] PDF export downloads correctly
- [ ] Rate limiting triggers after 5 requests
- [ ] Mobile responsive (test on phone)
- [ ] Keyboard shortcuts work (CMD+K)

### 3. Performance Tests

```bash
# Lighthouse audit
npx lighthouse https://yourdomain.com --view

# Expected scores:
# Performance: 90+
# Accessibility: 95+
# Best Practices: 95+
# SEO: 100
```

### 4. Security Tests

- [ ] HTTPS enabled
- [ ] Security headers present
- [ ] No API keys in client bundle
- [ ] Rate limiting works
- [ ] CORS configured correctly

---

## 📊 Monitoring & Analytics

### Error Tracking (Recommended: Sentry)

```bash
npm install @sentry/react

# Add to main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
});
```

### Analytics (Recommended: Plausible or PostHog)

```html
<!-- Add to index.html -->
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

### Performance Monitoring

```javascript
// Add to App.tsx
if ('PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log('Performance:', entry);
    }
  });
  observer.observe({ entryTypes: ['navigation', 'paint'] });
}
```

---

## 🔧 Troubleshooting

### Issue: 503 "Service configuration error"

**Cause**: Missing API keys
**Fix**: Set `GROQ_API_KEY` and `EXA_API_KEY` in Supabase secrets

```bash
# Verify secrets are set
supabase secrets list
```

### Issue: 429 "Rate limit exceeded"

**Cause**: Database migration not applied
**Fix**: Apply `20251024051300_add_rate_limiting.sql`

```bash
supabase db push
```

### Issue: PDF export fails

**Cause**: Content too large
**Fix**: Increase timeout or split into multiple PDFs

### Issue: Slow load time

**Cause**: Large bundle size
**Fix**:
1. Convert images to WebP
2. Enable gzip compression on server
3. Use CDN for static assets

---

## 🎯 Performance Targets

### Bundle Size
- Initial JS: <200KB (gzipped)
- Total JS: <500KB (gzipped)
- CSS: <30KB (gzipped)
- Images: <2MB total (after WebP conversion)

### Load Times (4G)
- FCP (First Contentful Paint): <1.5s
- LCP (Largest Contentful Paint): <2.5s
- TTI (Time to Interactive): <3.5s
- CLS (Cumulative Layout Shift): <0.1

### API Performance
- Spec generation: <15s
- Research phase: <5s
- Synthesis: <8s
- PDF export: <2s

---

## 📱 CDN & Caching

### Recommended CDN: Cloudflare

```
Cache Rules:
- /assets/*: 1 year (immutable)
- /*.js: 1 week
- /*.css: 1 week
- /images/*: 1 month
- index.html: no-cache
```

### Cache Headers

```nginx
# nginx.conf
location /assets/ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

location ~ \.(js|css)$ {
  expires 7d;
  add_header Cache-Control "public";
}

location = /index.html {
  add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions (`.github/workflows/deploy.yml`)

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 🛡️ Security Best Practices

### 1. Content Security Policy

Add to `index.html`:

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self';
           script-src 'self' 'unsafe-inline' 'unsafe-eval';
           style-src 'self' 'unsafe-inline';
           img-src 'self' data: https:;
           connect-src 'self' https://kxrdxiznaudatxyfrbxe.supabase.co https://api.groq.com https://api.exa.ai;">
```

### 2. Security Headers

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### 3. API Key Rotation

- Rotate API keys every 90 days
- Use separate keys for dev/staging/prod
- Never commit keys to git

---

## 📞 Support & Maintenance

### Health Monitoring

```bash
# Set up cron job to ping health endpoint
*/5 * * * * curl -f https://yourdomain.com || echo "Site down!"
```

### Backup Strategy

- Database: Automated daily backups (Supabase handles this)
- Code: Git repository (GitHub)
- Assets: S3 or equivalent

### Update Schedule

- Dependencies: Monthly security updates
- Features: Weekly deployments
- Hotfixes: As needed

---

## ✅ Launch Checklist

### Pre-Launch
- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] API keys tested and working
- [ ] Error tracking configured
- [ ] Analytics installed
- [ ] Domain configured
- [ ] SSL certificate active

### Launch Day
- [ ] Deploy to production
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Test from different devices/browsers
- [ ] Announce launch

### Post-Launch (Week 1)
- [ ] Monitor user feedback
- [ ] Check error logs daily
- [ ] Review performance metrics
- [ ] Optimize based on real usage
- [ ] Plan next iteration

---

## 🎉 Success Metrics

### Week 1 Targets
- Uptime: >99.5%
- Error rate: <1%
- Average load time: <3s
- User signups: 50+

### Month 1 Targets
- Active users: 200+
- Specs generated: 500+
- PDF downloads: 300+
- User satisfaction: 4.5+/5

---

**Last Updated**: 2025-10-24
**Maintainer**: Specificity AI Team
**Support**: support@specificity.ai
