# Phase 1: Design Document

## The Problem
Change a single source-of-truth blog post into a scheduled, multi-platform social media campaign using an adapter architecture. The system must guarantee idempotency (no duplicate posts on retries), enforce platform-specific constraints (length, tone, hashtags), and require human approval before scheduling.

## Non-Goal
Image generation, engagement analytics, and posting to real X/LinkedIn accounts are explicitly out of scope[cite: 1].

## Constraint Profiles
1. **Telegram (Real Target)**: Max 4096 characters, informative tone, max 3 hashtags.
2. **Mock X (Twitter)**: Max 280 characters, punchy/direct tone, max 2 hashtags.
3. **Mock LinkedIn**: Max 3000 characters, professional/networking tone, max 5 hashtags.

## Data Model (PostgreSQL Relational Structure)
* **posts**: `id`, `original_content`, `source_url`, `created_at`
* **variants**: `id`, `post_id`, `platform`, `content`, `status` (draft, approved, rejected, published)[cite: 1]
* **schedules**: `id`, `variant_id`, `publish_time`, `status` (pending, completed, failed), `idempotency_key`[cite: 1]
* **publish_history**: `id`, `schedule_id`, `platform`, `response_payload`, `attempted_at`

## API Surface
* `POST /api/posts`: Ingest URL or Markdown.
* `POST /api/variants/generate`: Trigger variant generation for a post.
* `PATCH /api/variants/:id/status`: Update status (approve/reject/edit).
* `POST /api/schedules`: Schedule an approved variant (returns 4xx if unapproved).