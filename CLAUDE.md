# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Registration service for the "Наставник" (Nastavnyk) mentoring platform. TypeScript library code only: there is no HTTP server, build step or linter. Requires Node.js 20+.

## Commands

- `npm install`: install dev dependencies
- `npm test`: run all Jest tests (ts-jest runs `.ts` directly, no compile step)
- `npx jest src/registration/registerUser.test.ts`: run one test file
- `npx jest -t "rejects an invalid email"`: run tests whose name matches
- `npm run typecheck`: `tsc --noEmit` (strict mode); no output means it passed

On Windows PowerShell, Jest/npm output written to stderr may appear wrapped in a red `NativeCommandError`; check the actual result lines, not the wrapper.

## Architecture

Flow: `registration/registerUser.ts` → `validation/` (rules + patterns) → `users/userRepository.ts`.

- **`registerUser`** normalizes the email (`trim().toLowerCase()`) *before* both validation and the duplicate lookup, collects per-field errors, then throws a single `RegistrationError`.
- **Errors** (`registration/errors.ts`): `RegistrationError` carries a `code` (`INVALID_INPUT` | `EMAIL_TAKEN` | `USERNAME_TAKEN`) and `fields: Record<field, string[]>`. The error `message` comes from `REGISTRATION_MESSAGES[code]`, and tests assert on those exact strings, so changing a message breaks tests.
- **Validation** (`validation/rules.ts`): a `Rule` is `(value) => errorMessage | null`; build rules with factories (`lengthBetween`, `matches`) and run them with `validate(value, rules)`, which returns the error list. Regexes live in `validation/patterns.ts`.
- **`userRepository`** is a module-level in-memory singleton seeded with two users (`john@example.com`, `olena@example.com`); ids are `users.length + 1`. `reset()` restores the seed data and is called in each test's `beforeEach`, so any new test file that touches the repository must do the same.

Usernames are trimmed first (like emails), then must be 3–20 chars of `[A-Za-z0-9_]`, and are unique case-insensitively (`findByUsername` lowercases both sides), but are stored with the case the user typed. Duplicate checks run after format validation: `EMAIL_TAKEN` first, then `USERNAME_TAKEN`.

Current gaps (the code doesn't do these, so don't assume it does): the password isn't stored, and `SLUG_PATTERN` isn't used yet.

Code comments and README are in Ukrainian; user-facing error messages are in English.
