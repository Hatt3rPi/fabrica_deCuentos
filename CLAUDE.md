# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development
- `npm run dev` - Start development server with Vite
- `npm run build` - Build production bundle
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Testing
- `npm run cypress:open` - Open Cypress GUI for interactive testing
- `npm run cypress:run` - Run all Cypress tests in headless mode
- `npm run test:e2e` - Run end-to-end tests (alias for cypress:run)
- `npx cypress run --spec "cypress/e2e/flows/3_creacion_personaje.cy.js"` - Run specific test

### Supabase
- `npm run supabase:start` - Start local Supabase development environment
- `npm run supabase:pull` - Pull database schema and functions from remote

## Architecture Overview

**La CuenterIA** is a React-based platform for creating personalized children's stories with AI-generated illustrations. The app uses a wizard-based flow to guide users through character creation, story design, and book generation.

### Key Architecture Components

1. **Wizard Flow System**: Centralized state management for the multi-step story creation process
   - `WizardContext` - Manages wizard state and UI flow
   - `useWizardFlowStore` - Zustand store for step validation and progression
   - Sequential step progression with validation requirements
   - Auto-save functionality with localStorage backup

2. **Character Management**: 
   - Character creation with AI-generated thumbnails
   - Reusable character library across stories
   - Validation requires name, description, and generated thumbnail

3. **Supabase Integration**:
   - Authentication via Supabase Auth
   - PostgreSQL database with RLS policies
   - Edge Functions for AI generation (story, images, variations)
   - Real-time updates for admin analytics

4. **AI Generation Pipeline**:
   - Multiple providers (OpenAI, Flux, Stable Diffusion)
   - Edge functions in `supabase/functions/` directory
   - Metrics tracking for prompt usage and performance

### Important Patterns

- **Context Providers**: App uses nested providers (Auth, Admin, Wizard, Story)
- **Page Routing**: React Router with protected routes and animated transitions
- **State Management**: Mix of Context API and Zustand stores
- **Auto-save**: Critical for wizard flow persistence with dual localStorage/Supabase strategy

## Development Guidelines

### Testing Requirements
- Maintain `data-testid` attributes used by Cypress tests
- Run `npm run cypress:run` before creating PRs
- Tests use service role key for database cleanup between runs

### Edge Functions
- Located in `supabase/functions/` with shared utilities in `_shared/`
- All functions require JWT verification except `send-reset-email`
- Use `metrics.ts` helper for tracking prompt usage

### Wizard Flow Rules
1. Sequential progression - cannot skip steps
2. Previous step must be completed before advancing
3. Editing previous steps resets subsequent steps to draft
4. Auto-save runs continuously with story ID context
5. Cleanup controlled by `skipCleanup` flag for character editing

### Admin Features
- `/admin/flujo` - Real-time monitoring of active AI function calls
- Analytics dashboard tracks prompt usage and costs
- Activity can be enabled/disabled per edge function

## Environment Setup

Required environment variables:
```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (for tests)
```

Demo credentials:
- Email: tester@lacuenteria.com
- Password: test123