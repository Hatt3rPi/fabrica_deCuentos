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
- `npm run cypress:run` - Run all Cypress tests in headless mode (26 tests)
- `npm run test:e2e` - Run end-to-end tests (alias for cypress:run)
- `npm run test:complete-flow` - Run ONLY the complete story flow test (recommended)
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
- Email: tester@lacuenteria.cl
- Password: test123

## Claude Code Best Practices

### Task Management
- **Always use TodoWrite/TodoRead tools** for complex tasks (3+ steps)
- Mark todos as `in_progress` BEFORE starting work
- Complete todos IMMEDIATELY after finishing each task
- Only have ONE task `in_progress` at any time
- Break large tasks into specific, actionable items

### Database Operations
- **Use RPC functions for complex operations** (e.g., `link_character_to_story`)
- Handle duplicates with `ON CONFLICT DO NOTHING` pattern
- Always verify user permissions in database functions
- Use `supabase.rpc()` for safer database operations than direct inserts

### Error Handling & Race Conditions
- Add loading states to prevent multiple simultaneous requests
- Implement proper error handling with user-friendly messages
- Use `try/catch/finally` blocks for async operations
- Log errors with context for debugging

### Testing Strategy
- **Run tests before every commit**: `npm run cypress:run`
- Use descriptive test names that explain the user flow
- Include cleanup at the beginning of comprehensive tests
- Update test credentials to match current demo user
- Use `data-testid` attributes for reliable test selectors

### Code Quality
- **Run linting before commits**: `npm run lint`
- Follow existing code patterns and conventions
- Use TypeScript types consistently
- Keep functions focused and single-purpose

### State Management
- **Separate concerns**: auto-save (content) vs wizard state (flow)
- Use direct persistence for critical state changes
- Implement backup strategies (localStorage + database)
- Clean up state properly on component unmount

### Git Workflow
- **NEVER make changes directly to main branch**
- Always create feature/fix branches for any changes
- Use descriptive commit messages following the established pattern
- Include context about WHY changes were made
- Test functionality before committing
- Create PRs for all changes, even documentation

### Development Commands Priority
1. **Before starting**: `npm run dev` (check app works)
2. **During development**: `npm run lint` (check code quality)
3. **Before committing**: `npm run cypress:run` (verify tests pass)
4. **For database changes**: `npm run supabase:pull` (sync schema)

### Common Pitfalls to Avoid
- Don't skip wizard flow validation rules
- Don't mix auto-save with wizard state persistence
- Don't create commits without running tests
- Don't use direct database inserts for complex operations
- Don't forget to handle race conditions in UI interactions
- **NEVER commit directly to main** - always use branches and PRs

### File Organization
- Place new test files in appropriate directories
- Back up old tests before major changes
- Keep database functions in `supabase/migrations/`
- Use clear, descriptive filenames
- Document new patterns in this file

### Issue Generation Guidelines
- Cuando crees issues, genéralos en español y en el título pon [auto][prioridad alta/media/baja]