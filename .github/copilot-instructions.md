# GitHub Copilot Instructions for `crewcapital`

## Project Architecture & Tech Stack

This is a **SvelteKit** application using **Svelte 5 (Runes)**, **Tailwind CSS v4**, and **Drizzle ORM** with **PostgreSQL**.

- **Frontend**: Svelte 5 (Runes), Tailwind CSS, Skeleton UI v4.
- **Backend**: SvelteKit Server Actions/Loaders (`+page.server.ts`), Node.js.
- **Database**: PostgreSQL via `drizzle-orm/postgres-js`.
- **Auth**: `better-auth` with Generic OAuth.
- **Package Manager**: `pnpm`.

## Critical Developer Workflows

- **Development Server**: `pnpm run dev`
- **Database Migrations**:
The user will manually generate and run any migrations, do not do that yourself.
- **Formatting**: `pnpm run format` (Prettier).

## Project-Specific patterns

### 1. Database Access (`drizzle-orm`)
- Always import the database client from `$lib/server/db`:
  ```typescript
  import { db } from '$lib/server/db';
  import { user } from '$lib/server/db/schema';
  import { eq } from 'drizzle-orm';
  ```
- Define schemas in `src/lib/server/db/schema.ts` using `drizzle-orm/pg-core`.

### 2. Authentication (`better-auth`)
- Authentication is handled by `better-auth` in `src/lib/auth.ts`.
- **Protected Routes**: The `(app)` group layout (`src/routes/(app)/+layout.server.ts`) enforces authentication.
  ```typescript
  // Typical data pattern in +page.server.ts
  export const load = async ({ parent }) => {
    const { user, session } = await parent();
  };
  ```
- **Client-side Auth**: Use `$lib/auth-client.ts`.

### 3. Svelte 5 Syntax (Runes)
- Use Runes (`$state`, `$derived`, `$effect`) for reactivity.
- **Do not** use Svelte 4 store syntax (`$store`) unless interfacing with legacy libraries.
- **Do not** use `export let` for props; use `let { prop }: Props = $props();`.

### 4. Code Organization
- **Server Code**: Logic typically resides in `src/lib/server/**` and is called from `+page.server.ts`.
- **Environment Variables**: Use dynamic private imports for secrets: `import { env } from '$env/dynamic/private'`.

### 5. Documentation & Research (AI Specific)
- **Svelte Documentation**: When unsure about Svelte 5 or SvelteKit syntax, use the `mcp_svelte_list-sections` tool first to find relevant documentation topics, then `mcp_svelte_get-documentation`.
- **Code Validation**: Before finalizing Svelte components, run `mcp_svelte_svelte-autofixer`.

### 6. UI & Styling (Skeleton UI + Tailwind)
- Use Skeleton UI design tokens with Tailwind classes.
- **Reference**: See `.github/instructions/skeletonui.instructions.md` for full component documentation.
- **Themeing**: Use design tokens for colors, spacing, etc., instead of hardcoded values since we have a dynamic theming system.
- **Design Tokens**:
  - **Properties**: `accent`, `bg`, `border`, `caret`, `decoration`, `divide`, `fill`, `outline`, `ring`, `shadow`, `stroke`, `text`.
  - **Colors**: `primary`, `secondary`, `tertiary`, `success`, `warning`, `error`, `surface`.
  - **Shades**: `50` - `950` (e.g. `500`, `900`).
- **Examples**:
  ```html
  <div class="bg-primary-500">...</div>
  <div class="border border-secondary-600">...</div>
  <svg class="fill-surface-950">...</svg>
  ```

## Key Files
- `src/lib/server/db/schema.ts`: Database definition.
- `src/lib/auth.ts`: Auth configuration (Better Auth).
- `src/routes/(app)/+layout.server.ts`: Global auth guard for the app.
