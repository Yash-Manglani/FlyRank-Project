import express from 'express'
import dotenv from 'dotenv'
import pool from './db.js'
import {discordProfile, mockXProfile} from './validators.js'
import cors from 'cors'
import getPublisher from './adapters.js'

dotenv.config();
const app = express();
app.use(express.json());

app.use(cors())

app.post('/api/posts', async (req, res) => {
    const {content} = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO posts (content) VALUES($1) RETURNING *
        `, [content]);
        res.status(201).json(result.rows[0]);

    } catch (error) {
        res.status(500).json({error: error.message})
    }
});

app.post('/api/variants/generate', async (req, res) => {
    const {postId} = req.body;

    try {
        const postRes = await pool.query(`SELECT content FROM posts WHERE id = $1`, [postId]);
        if(postRes.rowCount === 0) return res.status(404).json({ error: "Post not found" });

        const sourceText = postRes.rows[0].content;

        const cleanSourceText = sourceText.replace(/#/g, '');

        const discordVariant = `📢 New Update:\n\n${cleanSourceText.substring(0, 100)}...\n\nRead more on our blog! #news #update`;
        const xVariant = `New drop! 🚀 ${cleanSourceText.substring(0, 50)}... #update`;

        discordProfile.parse({content: discordVariant});
        mockXProfile.parse({content: xVariant});

        await pool.query(`
            INSERT INTO variants (post_id, platform, content) VALUES ($1, $2, $3), ($4, $5, $6)    
        `, [postId, 'discord', discordVariant, postId, 'mock_x', xVariant]);

        res.status(201).json({ message: "Variants generated and stored successfully" });
        
    } catch (error) {
        
        console.error("Full error log:", error); 

        if (error.errors) {
            
            return res.status(400).json({ error: "Constraint Profile Failed", details: error.errors });
        }
        
        
        return res.status(500).json({ error: "Server Error", message: error.message });
    }
})

app.get('/api/posts', async (_, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM posts;  
        `);

        res.status(200).json(result.rows);

    } catch (error) {
        
    }
})



app.patch('/api/variants/:id/status', async (req, res) => {
    const {status} = req.body;
    const {id} = req.params;

    const validStatuses = ['draft', 'approved', 'rejected', 'published'];

    if(!validStatuses.includes(status)) return res.status(400).json({ error: "Invalid status. Must be draft, approved, rejected, or published." });

    try {
        const result = await pool.query(`
            UPDATE variants SET status = $1 WHERE id = $2 RETURNING *
        `, [status, id]);
        
        if(result.rowCount === 0) return res.status(404).json({ error: "Variant not found" });

        res.json(result.rows[0]);

    } catch (error) {
        res.status(500).json({ error: "Server Error", message: error.message });
    }
})

app.post('/api/schedules', async (req, res) => {
    const {variantId, publishTime, idempotencyKey} = req.body;

    try {
        const variantRes = await pool.query(`SELECT status FROM variants WHERE id = $1`, [variantId]);
        if(variantRes.rowCount === 0) return res.status(404).json({ error: "Variant not found" });

        if (variantRes.rows[0].status !== 'approved') {
            return res.status(403).json({ 
                error: "Schedule Rejected", 
                message: "Only approved variants can be scheduled." 
            });
        }

        const result = await pool.query(`
            INSERT INTO schedules (variant_id, publish_time, idempotency_key) VALUES ($1, $2, $3) 
            RETURNING *    
        `, [variantId, publishTime, idempotencyKey]);

        res.status(201).json(result.rows[0]);


    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: "Duplicate schedule request (Idempotency key already used)." });
        }
        res.status(500).json({ error: "Server Error", message: error.message });
    }
});

app.post('/api/publish/execute', async (req, res) => {
    const { scheduleId } = req.body;

    try {
        
        const scheduleRes = await pool.query(`
            SELECT 
                s.id as schedule_id, 
                s.status as schedule_status, 
                s.idempotency_key,
                v.id as variant_id, 
                v.platform, 
                v.content, 
                v.status as variant_status
            FROM schedules s
            JOIN variants v ON s.variant_id = v.id
            WHERE s.id = $1
        `, [scheduleId]);

        if (scheduleRes.rowCount === 0) return res.status(404).json({ error: "Schedule not found" });

        const item = scheduleRes.rows[0];

        
        const historyCheck = await pool.query(
            `SELECT * FROM publish_history WHERE schedule_id = $1 AND status = 'success'`,
            [scheduleId]
        );

        if (historyCheck.rowCount > 0) {
            return res.status(200).json({ 
                message: "Idempotency protection triggered: Variant was already successfully published. Zero duplicate posts made." 
            });
        }

        
        const publisher = getPublisher(item.platform, {
            discordWebhook: process.env.DISCORD_WEBHOOK_URL,
        });

        let publishResult;
        try {
            publishResult = await publisher.publish(item.content);
            

            await pool.query(
                `INSERT INTO publish_history (schedule_id, platform, status, response_payload) VALUES ($1, $2, $3, $4)`,
                [scheduleId, item.platform, 'success', JSON.stringify(publishResult)]
            );

            
            await pool.query(`UPDATE variants SET status = 'published' WHERE id = $1`, [item.variant_id]);
            
            await pool.query(`UPDATE schedules SET status = 'completed' WHERE id = $1`, [scheduleId]);

        } catch (pubError) {
            
            await pool.query(
                `INSERT INTO publish_history (schedule_id, platform, status, response_payload) VALUES ($1, $2, $3, $4)`,
                [scheduleId, item.platform, 'failed', pubError.message]
            );
            return res.status(502).json({ error: "Publish target failed", details: pubError.message });
        }

        res.status(200).json({ message: "Published successfully!", result: publishResult });

    } catch (error) {
        res.status(500).json({ error: "Server Error", message: error.message });
    }
});


app.get('/api/publish/history', async (req, res) => {
    try {
        
        const result = await pool.query(`
            SELECT ph.id, ph.schedule_id, ph.platform, ph.status, ph.response_payload, ph.attempted_at,
            s.idempotency_key, v.content as variant_content
            FROM publish_history ph
            JOIN schedules s ON ph.schedule_id = s.id
            JOIN variants v ON s.variant_id = v.id
            ORDER BY ph.attempted_at DESC
            
        `);

        res.json(result.rows);



    } catch (error) {
        res.status(500).json({ error: "Server Error", message: error.message });
    }
})











app.listen(3000, () => console.log(`Server is running on PORT 3000`)
);