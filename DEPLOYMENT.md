# Malloulinova - Vercel Deployment Guide

This guide walks you through deploying the Malloulinova B2B IoT consulting site to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional but recommended): `npm install -g vercel`
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)
4. **Supabase Project**: You need a Supabase project with:
   - Database table: `articles`
   - Storage bucket: `articles` (public)
   - Service role key

## Environment Variables

You'll need these environment variables for Vercel:

- `SUPABASE_URL`: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (keep this secret!)
- `SUPABASE_MEDIA_BUCKET`: Storage bucket name (default: `articles`)

## Deployment Methods

### Method 1: Deploy via Vercel Dashboard (Recommended for First-Time)

1. **Connect Your Repository**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - Select the repository containing your Malloulinova project

2. **Configure Project Settings**
   - **Framework Preset**: Select "Vite" or "Other"
   - **Root Directory**: Leave as `.` (root)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm install`

3. **Add Environment Variables**
   - Go to "Environment Variables" section
   - Add the following variables:
     ```
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     SUPABASE_MEDIA_BUCKET=articles
     ```
   - Make sure to add them for all environments (Production, Preview, Development)

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (usually 2-3 minutes)
   - Your site will be live at `https://your-project.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Navigate to Project Directory**
   ```bash
   cd d:\Malloulinova
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add SUPABASE_MEDIA_BUCKET
   ```
   - Follow the prompts to enter values for each environment

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

6. **Deploy to Preview (for testing)**
   ```bash
   vercel
   ```

## Project Structure for Vercel

The project is configured to work with Vercel's deployment structure:

```
/Malloulinova
├── api/
│   └── [...path].js          # Vercel serverless functions (handles all /api/* routes)
├── frontend/
│   ├── dist/                 # Built frontend (generated during deployment)
│   ├── src/
│   └── package.json
├── vercel.json               # Vercel configuration
└── package.json
```

## Routing Configuration

The `vercel.json` file configures the following routes:

- `/` → Home page
- `/projects` → All projects listing
- `/projects/:id` → Individual article/project page
- `/admin` → Admin dashboard
- `/api/*` → Serverless API functions

All routes are properly configured for SPA (Single Page Application) routing with fallback to `index.html`.

## Post-Deployment Steps

1. **Verify Deployment**
   - Visit your Vercel URL
   - Check that the home page loads
   - Navigate to `/projects` to see all articles
   - Click on an article to verify `/projects/:id` routing works

2. **Test API Endpoints**
   - Open browser console
   - Check that articles are loading from `/api/articles`
   - Verify no CORS errors

3. **Test Admin Panel**
   - Navigate to `/admin`
   - Login with your Firebase credentials
   - Try creating a test article

4. **Custom Domain (Optional)**
   - In Vercel dashboard, go to your project
   - Click "Settings" → "Domains"
   - Add your custom domain
   - Follow DNS configuration instructions

## Local Development with Vercel

To test the Vercel environment locally:

1. **Install Dependencies**
   ```bash
   npm install
   cd frontend && npm install
   cd ..
   ```

2. **Create `.env` File**
   Create a `.env` file in the root directory:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_MEDIA_BUCKET=articles
   ```

3. **Run Vercel Dev Server**
   ```bash
   vercel dev
   ```
   - This starts a local Vercel environment
   - Frontend will be available at `http://localhost:3000`
   - API functions will be available at `http://localhost:3000/api/*`

## Troubleshooting

### Build Fails

**Problem**: Build fails with "Module not found" error

**Solution**: 
- Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify
- Check that `frontend/package.json` has all required dependencies

### API Returns 500 Error

**Problem**: API endpoints return 500 Internal Server Error

**Solution**:
- Check Vercel logs: Dashboard → Your Project → Deployments → Click deployment → View Function Logs
- Verify environment variables are set correctly
- Ensure Supabase credentials are valid

### Routes Not Working

**Problem**: Direct navigation to `/projects` or `/projects/:id` returns 404

**Solution**:
- Verify `vercel.json` is in the root directory
- Check that routes configuration includes SPA fallback
- Redeploy the project

### CORS Errors

**Problem**: Browser shows CORS errors when calling API

**Solution**:
- Verify API functions include CORS headers
- Check that `api/[...path].js` has proper CORS configuration
- Ensure you're calling `/api/*` routes (not external URLs)

## Continuous Deployment

Vercel automatically deploys your site when you push to your Git repository:

- **Production**: Pushes to `main` or `master` branch
- **Preview**: Pushes to any other branch or pull requests

To disable automatic deployments:
1. Go to Project Settings → Git
2. Configure deployment branches

## Monitoring and Analytics

1. **View Deployment Logs**
   - Dashboard → Your Project → Deployments
   - Click on any deployment to see build logs

2. **Function Logs**
   - Dashboard → Your Project → Deployments → View Function Logs
   - Real-time logs for serverless functions

3. **Analytics** (Vercel Pro)
   - Dashboard → Your Project → Analytics
   - View page views, performance metrics, etc.

## Rollback

If a deployment has issues:

1. Go to Dashboard → Your Project → Deployments
2. Find a previous working deployment
3. Click "..." → "Promote to Production"

## Security Best Practices

1. **Never commit** `.env` files or expose `SUPABASE_SERVICE_ROLE_KEY`
2. Use Vercel environment variables for all secrets
3. Enable Vercel's **Authentication** for admin routes if needed
4. Regularly rotate Supabase keys
5. Monitor function logs for suspicious activity

## Cost Considerations

**Vercel Free Tier includes:**
- 100 GB bandwidth per month
- Unlimited serverless function executions (with fair use limits)
- Automatic HTTPS
- Preview deployments

**Upgrade to Pro if you need:**
- More bandwidth
- Advanced analytics
- Team collaboration features
- Priority support

## Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)

## Quick Reference Commands

```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel

# View logs
vercel logs

# List deployments
vercel ls

# Remove deployment
vercel rm [deployment-url]

# Add environment variable
vercel env add [variable-name]

# Pull environment variables to local
vercel env pull
```

---

**Last Updated**: November 2024
**Deployment Platform**: Vercel
**Framework**: React + Vite + Vercel Serverless Functions
