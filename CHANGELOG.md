# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-07

Initial public release, built for the **AI Agents Innovation Hackathon** at
Heriot-Watt University Dubai (organized by the Heriot-Watt Tech Club and
Rabbitron Lab), where it placed **3rd** and won a **1,000 AED** prize.

### Added

- Gmail OAuth 2.0 connection with encrypted token storage and automatic refresh worker
- Real-time mailbox sync via Gmail push notifications (Google Pub/Sub) with history-based delta sync and 404 full-resync fallback
- Support-case tracking dashboard (Next.js 16 + Tailwind 4) with live thread inbox
- AI reply drafting (OpenAI) over full thread context with confidence scoring
- Safety-gate pipeline: inbound classification (reply / needs_human / escalate), per-user guardrails, and auto vs. approval send modes
- Human-intervention notification panel with per-thread context
- Draft approve / edit / reject flow — rejected drafts never send
- BullMQ + Redis background workers for sync, reply generation, and token refresh
- REST API for auth, threads, replies, user settings, and Pub/Sub push
- Drizzle ORM schema with SQL migrations for users, OAuth tokens, threads, emails, replies, guardrails, and notifications

### Fixed

- Production build: wrap dashboard `useSearchParams` in a Suspense boundary (Next.js 16)
- Backend type safety: ioredis `Redis` import, Express route param normalization, nullable Gmail profile fields, Gmail history pagination typing

[1.0.0]: https://github.com/arjun-kuttikkat/AutoResolve/releases/tag/v1.0.0
