# Vercel Auto-Deployment Setup

This repository is configured to automatically deploy to Vercel when pull requests are merged to the `main` branch.

## Prerequisites

Before the auto-deployment will work, you need to set up the following:

### 1. Vercel Project Setup

1. **Create/Link Vercel Project:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your GitHub repository or link existing project
   - Framework Preset: **Vite**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`

2. **Get Project IDs:**
   ```bash
   # Install Vercel CLI (if not already installed)
   npm i -g vercel

   # Login to Vercel
   vercel login

   # Link your project (run in project root)
   vercel link

   # This creates .vercel/project.json with your IDs
   ```

3. **Find Your IDs:**
   - After running `vercel link`, check `.vercel/project.json`
   - You'll see `orgId` and `projectId`

### 2. GitHub Secrets Setup

Add the following secrets to your GitHub repository:

**Go to: Repository → Settings → Secrets and variables → Actions → New repository secret**

Required secrets:

1. **VERCEL_TOKEN**
   - Go to Vercel → Settings → Tokens
   - Create new token with appropriate scope
   - Copy and paste into GitHub secret

2. **VERCEL_ORG_ID**
   - Found in `.vercel/project.json` as `"orgId"`
   - Or in Vercel dashboard URL: `vercel.com/<org-id>/...`

3. **VERCEL_PROJECT_ID**
   - Found in `.vercel/project.json` as `"projectId"`
   - Or in Vercel Project Settings → General

4. **VITE_SUPABASE_URL**
   - Your Supabase project URL
   - Format: `https://xxxxx.supabase.co`

5. **VITE_SUPABASE_ANON_KEY**
   - Your Supabase anonymous key
   - Found in Supabase → Project Settings → API

### 3. Vercel Environment Variables

Set these in Vercel dashboard (Project Settings → Environment Variables):

- `VITE_SUPABASE_URL` → Your Supabase URL
- `VITE_SUPABASE_ANON_KEY` → Your Supabase anon key

**Important:** Set these for all environments (Production, Preview, Development)

## How Auto-Deployment Works

### On PR Merge to Main

When you merge a pull request to the `main` branch:

1. ✅ GitHub Actions workflow triggers (`.github/workflows/deploy-vercel.yml`)
2. ✅ Code is checked out
3. ✅ Dependencies are installed (`npm ci`)
4. ✅ Project is built (`npm run build`)
5. ✅ Build artifacts are deployed to Vercel (production)
6. ✅ Comment is posted on the PR with deployment status

### On Push to Main

Direct pushes to `main` also trigger deployment (same workflow).

## Testing the Workflow

1. **Create a test PR:**
   ```bash
   git checkout -b test-deployment
   echo "# Test" >> TEST.md
   git add TEST.md
   git commit -m "test: deployment workflow"
   git push origin test-deployment
   ```

2. **Merge the PR** on GitHub

3. **Check Actions tab** to see deployment progress

4. **Verify deployment** at your Vercel URL

## Manual Deployment

If you need to deploy manually:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Troubleshooting

### Build Failing?

- **Check build logs** in GitHub Actions
- **Verify all secrets** are set correctly
- **Test locally**: `npm run build`

### Deployment Succeeds but App Broken?

- **Check environment variables** in Vercel dashboard
- **Verify Supabase keys** are correct
- **Check browser console** for errors

### Workflow Not Triggering?

- **Verify workflow file** is in `.github/workflows/deploy-vercel.yml`
- **Check GitHub Actions** is enabled for repository
- **Verify branch name** is exactly `main` (not `master`)

## Current Status

✅ **Payment System:** Disabled (FREE for testing)
✅ **Auto-deployment:** Configured via GitHub Actions
✅ **Vercel Config:** Created (`vercel.json`)
✅ **Build Command:** `npm run build`
✅ **Output Directory:** `dist`

## Next Steps

1. Set up GitHub secrets (listed above)
2. Set up Vercel environment variables
3. Merge this PR to deploy automatically
4. Test the deployed application
5. Enable payments when ready (update `ConfirmationDialog.tsx`)

---

**Questions?** Check the [Vercel GitHub Integration docs](https://vercel.com/docs/git/vercel-for-github)
