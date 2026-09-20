import express from 'express'
import pool from './db.js'
import {discordProfile, mockXProfile} from './validators.js'
import cors from 'cors'

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
        
        console.error("Full error log:", error); // This will print the actual error in your terminal

        if (error.errors) {
            // If it's a Zod error, it will have the .errors array
            return res.status(400).json({ error: "Constraint Profile Failed", details: error.errors });
        }
        
        // If it's a database or server error, it will hit this
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

app.listen(3000, () => console.log(`Server is running on PORT 3000`)
);