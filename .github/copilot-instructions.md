# MALLOULINOVA Homepage - AI Agent Instructions

## Project Overview
B2B marketing homepage for MALLOULINOVA, a Tunisia-based embedded systems/IoT development company. Built as a modern Next.js 15 application with Git-based CMS for lead generation and cost-reduction messaging to European clients.

## Architecture & Key Patterns

### Git Submodule Structure
- **Root repo**: Contains documentation (`doc/project_requirements_document.md`) and deployment configs
- **`frontend/` submodule**: Separate Git repo for the Next.js application
- **Always work in `/frontend` directory** for development tasks
- Handle Git operations carefully due to submodule setup (see common Git lock issues below)

### Technology Stack Specifics
- **Next.js 15** with App Router (not Pages Router) - all routes in `src/app/`
- **Tailwind CSS v3** (NOT v4) - uses `@tailwind` directives, not `@import`
- **React Hook Form + Zod** for form validation patterns
- **Decap CMS** (Git-based) for content management at `/admin`

### Critical File Structure
```
frontend/
├── src/app/                 # Next.js App Router pages
│   ├── layout.tsx          # Root layout with SEO metadata
│   ├── page.tsx            # Main homepage (single-page design)
│   └── api/contact/        # Contact form API endpoint
├── src/components/         # Reusable React components
│   ├── ClientWrapper.tsx   # Hydration-safe wrapper for client components
│   ├── ContactForm.tsx     # Main contact form with validation
│   └── Navigation.tsx      # Sticky nav with mobile menu
├── content/home.md         # CMS-managed homepage content
├── public/admin/           # Decap CMS admin interface
└── src/styles/globals.css  # Tailwind + custom CSS variables
```

## Development Workflows

### Starting Development
```bash
cd frontend/                    # Always work in frontend submodule
npm install                     # Install dependencies
npm run dev                     # Start development server
```

### Common Commands
- `npm run build` - Production build (test before deployment)
- `npm run lint` - ESLint checking
- Access CMS at `http://localhost:3000/admin` (requires authentication)

### Styling System
- **Color Palette**: Professional ColorHunt-inspired theme optimized for B2B readability
  - **Primary**: `#447D9B` (Medium blue) - Trustworthy tech color for links and accents
  - **Secondary**: `#FE7743` (Bright coral) - Vibrant CTA buttons and highlights  
  - **Accent**: `#273F4F` (Dark blue-gray) - Main text color for excellent contrast
  - **Light**: `#D7D7D7` (Light gray) - Clean background elements
  - **Supporting colors**: `card-bg: rgba(71, 125, 155, 0.1)`, `border-color: rgba(215, 215, 215, 0.2)`
- **Text Contrast Strategy**: 
  - Headlines: `text-accent` (#273F4F) - Maximum readability on bright backgrounds
  - Body text: `text-accent/80` - Comfortable reading contrast
  - Secondary text: `text-accent/70` - Descriptions and less critical content
  - Subtle text: `text-accent/60` - Fine print and disclaimers
- **Custom CSS Classes**: `.glassmorphism`, `.btn-primary`, `.btn-secondary`, `.form-input`, `.gradient-text`
- **Responsive Strategy**: Mobile-first with Tailwind breakpoints
- **Anti-Hydration CSS**: Prevents browser autofill styling conflicts

#### Color Usage Guidelines
- **NEVER use white text on bright backgrounds** - causes readability issues for B2B users
- **Primary gradient**: Used for main CTA buttons (`from-primary to-secondary`)
- **Glassmorphism effects**: Semi-transparent cards with backdrop blur for modern feel
- **Background gradients**: Light gradients (`from-slate-50 via-blue-50 to-slate-100`) for clean appearance

## Design System & Visual Identity

### ColorHunt Palette Implementation
The homepage uses a carefully selected ColorHunt palette (#FE7743, #273F4F, #447D9B, #D7D7D7) optimized for B2B professional presentation:

```css
/* Tailwind Config Colors */
colors: {
  primary: '#447D9B',        // Medium blue - trustworthy tech color
  secondary: '#FE7743',      // Bright coral - vibrant accent  
  accent: '#273F4F',         // Dark blue-gray - professional
  light: '#D7D7D7',          // Light gray - clean background
}
```

### Text Hierarchy & Contrast
- **Critical**: All text must have sufficient contrast against bright backgrounds
- **Headlines**: `text-accent` for maximum impact and readability
- **Body Copy**: `text-accent/80` for comfortable extended reading
- **Supporting Text**: `text-accent/70` for descriptions and secondary content
- **Meta Text**: `text-accent/60` for timestamps, disclaimers, fine print

### Visual Effects
- **Glassmorphism**: Semi-transparent cards with `backdrop-blur-sm` for modern depth
- **Gradient Text**: `.gradient-text` class for brand highlighting in hero section
- **Button Gradients**: Primary CTAs use `from-primary to-secondary` gradient
- **Background Layers**: Subtle gradients and floating shapes for visual interest

## Component Patterns

### Hydration-Safe Components
- Wrap client components in `<ClientWrapper>` to prevent SSR/client mismatches
- Use `suppressHydrationWarning` in layout for browser extension conflicts
- Forms include `autoComplete="off"` to prevent autofill styling issues

### Form Handling
- Contact form uses React Hook Form + Zod validation pattern
- API route at `/api/contact/route.ts` logs submissions (ready for email integration)
- Error states and loading states built into form components

### Navigation & UX
- Sticky navigation with scroll effects and mobile hamburger menu
- Smooth scroll behavior for anchor links (`#services`, `#contact`)
- `ScrollToTop` component appears after scrolling

## Content Management

### Decap CMS Integration
- Content stored in `/content/home.md` with frontmatter
- Admin interface at `/public/admin/` with Git-gateway backend
- Changes commit directly to Git repository
- Configuration in `/public/admin/config.yml`

### Content Structure
- Homepage uses markdown content with YAML frontmatter
- Hero section content editable via CMS
- Contact information centralized in multiple files (update all when changing)

## Common Issues & Solutions

### Git Submodule Problems
- **Lock file error**: `rm .git/modules/frontend/index.lock` if Git operations fail
- **Submodule sync issues**: Use `git submodule update --remote` in root repo

### Tailwind CSS Setup
- **Must use v3 syntax**: `@tailwind base/components/utilities` not `@import "tailwindcss"`
- **PostCSS config**: Use object syntax `{tailwindcss: {}, autoprefixer: {}}` in `postcss.config.mjs`
- **Config file**: `tailwind.config.js` (not .mjs) with proper content paths

### Hydration Errors
- Common with forms due to browser autofill - use `ClientWrapper` pattern
- Add `suppressHydrationWarning` to `<html>` tag for browser extensions
- Never use conditional rendering based on `typeof window` in SSR components

### Color & Contrast Issues
- **Text Readability**: Always test white text on bright backgrounds - use `text-accent` instead
- **ColorHunt Palette**: Stick to the defined palette (#FE7743, #273F4F, #447D9B, #D7D7D7)
- **Contrast Testing**: Dark blue-gray (#273F4F) provides excellent contrast on light backgrounds
- **Glassmorphism**: Ensure text inside glass cards uses proper contrast colors

## Deployment Context
- **Target**: Vercel deployment with automatic builds
- **Environment**: Professional B2B site for cost-reduction messaging
- **SEO**: Optimized for "embedded systems Tunisia", "IoT development outsourcing"
- **Performance**: Must load <3s for B2B decision makers

## Business Context
The homepage serves **lead generation** for European/Middle Eastern B2B clients seeking embedded systems development. Key messaging focuses on 40-60% cost reduction while maintaining quality, leveraging Tunisia's technical expertise and timezone advantages.
