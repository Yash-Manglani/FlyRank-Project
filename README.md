# Flyrank Backend Capstone - Social Media Studio

A multi-platform social media campaign publishing system built for the Flyrank Backend AI Engineering Internship. It takes a single blog post source, generates platform-specific variants under strict constraint profiles, enforces a human review workflow, and executes durable, idempotent publishing.

## Architecture Flow

[Blog Post: URL or Markdown]

       │

[Ingestion & Storage (PostgreSQL)]

       │
    
[Variant Generator & Zod Constraint Enforcement]

       │
       
[Review Workflow: Draft ➔ Approved / Rejected]

       │

[Scheduler & Idempotency Key Guard]

       │
    
[SocialPublisher Adapter Interface] -> [Discord (Real Target)]
                                  |-> [Mock X / Mock LinkedIn]

## Tech Stack
* **Language & Runtime:** Node.js with Express
* **Database:** PostgreSQL (via Docker)
* **Validation:** Zod (strict length and hashtag enforcement)
* **Publishing Targets:** Real Discord Webhook & Local Mock Adapters

## Exact Run Steps

Follow these steps to run the system locally:

1. **Clone the repository and install dependencies:**
   ```bash
   git clone [https://github.com/Yash-Manglani/FlyRank-Project]
   cd FlyRank-Project
   npm install

## API Endpoints Summary

* POST /api/posts - Ingest blog post content.
* POST /api/variants/generate - Generate platform variants with Zod validation.   
* PATCH /api/variants/:id/status - Update variant status (draft, approved, rejected).
* POST /api/schedules - Schedule an approved variant (rejects unapproved items with a 4xx code).   
* POST /api/publish/execute - Execute publication idempotently through the adapter layer.   
* GET /api/publish/history - View audit logs and delivery history.

