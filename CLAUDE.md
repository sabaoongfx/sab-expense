@AGENTS.md

# Sab Expense

A minimal, modern expense tracker built with Next.js and Firebase.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Auth**: Firebase Auth (Google + Email/Password + Password Reset)
- **Database**: Firestore (real-time subscriptions)
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss"` syntax)
- **Testing**: Playwright with Firefox (Chromium incompatible with macOS Big Sur)

## Project Structure

- `src/app/` — Next.js app routes, layout, globals.css, favicon (icon.svg)
- `src/components/` — UI components (Dashboard, Summary, ExpenseList, modals, tabs)
- `src/lib/` — Firebase config, expenses/accounts/settings CRUD
- `src/context/` — AuthContext provider
- `tests/` — Playwright specs

## Key Patterns

- **Deterministic Firestore IDs**: Default account uses `setDoc` with ID `default_{userId}` to prevent duplicates
- **Firestore security rules**: Separate rules for read/delete (checks `resource.data`) vs create (checks `request.resource.data`)
- **Settings**: User preferences (showIncome, showDetails, showAccounts) stored in `settings/{userId}` collection
- **Transaction types**: `"expense" | "income"` — old entries default to `"expense"`
- **Tailwind dynamic classes**: Don't use template literals for class names (e.g. `ring-${color}-500`). Use full static class strings so Tailwind can detect them.

## Design

- Dark zinc gradient summary card with animated floating orbs (pink/cyan/amber), shimmer, pulse rings
- Favicon and login logo share the same gradient `$` symbol (dark bg, pink→cyan→amber gradient)
- Violet accent for expenses, green accent for income
- Bottom nav with filled icons (active) / outlined icons (inactive)
- Edit/delete via tap-to-edit modal with two-tap delete confirmation

## Firebase Collections

- `expenses` — userId, title, amount, type, category, accountId, date
- `accounts` — userId, name, type (mix/bank/cash), isDefault
- `settings` — showIncome, showDetails, showAccounts

## GitHub

- Repo: `sabaoongfx/sab-expense`
- gh CLI binary: `/tmp/gh/gh_2.40.1_macOS_amd64/bin/gh`
