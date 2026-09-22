This was brilliant project. I learned so much while building this. 

That excitement when that discord-variant of the message landed in my discord server by a bot was something else. 

Throughout this, I used AI assistance multiple times. Specially while building the webhook part.

I used AI as a mentor and a guide rather than a code-generation tool. My goal was to understand the code and learn rather than simply capstone for the certificate. 

I would say I did good. Got to learn a lot.


### Where AI Assisted
The Adapter Pattern & Webhooks: I leaned heavily on AI guidance while building the webhook component for Discord. Instead of asking for a pre-written script, I used the AI to discuss how to properly decouple the core business logic from the platform-specific delivery mechanism. 

Structuring Idempotency: The concept of durable scheduling was new to me. I used AI as a sounding board to map out the exact sequence of SQL queries required to check the `publish_history` table before allowing a publish execution to proceed, ensuring zero duplicate posts.

Targeted Debugging When I encountered a PostgreSQL parameter binding error (supplying 6 parameters to a 5-parameter prepared statement), the AI helped me trace the syntax mismatch back to my SQL string without rewriting the entire function for me.

### Where I Took the Wheel
Environment Setup: I manually configured the Node.js environment, the Express routing, and the Docker Compose setup for PostgreSQL to ensure I fully understood the foundational infrastructure.

Evidence Gathering & Testing: I drove the end-to-end testing process using Thunder Client. I manually orchestrated the failure states—intentionally overloading hashtag constraints and attempting to schedule unapproved drafts—to capture the exact 400 and 403 error responses required for the evidence log.

Business Logic Implementation: The strict enforcement of the constraint profiles using Zod, and the manual state transitions for the review workflow, were implemented by translating the capstone requirements directly into my routing logic.




