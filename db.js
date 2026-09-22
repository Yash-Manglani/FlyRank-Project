import {Pool} from 'pg';

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'social_studio',
    password: 'password',
    port: 5432,
});

const initDB = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS posts(
            id SERIAL PRIMARY KEY,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS variants(
            id SERIAL PRIMARY KEY,
            post_id INTEGER REFERENCES posts(id),
            platform VARCHAR(50) NOT NULL,
            content TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'draft'
        );

        CREATE TABLE IF NOT EXISTS schedules (
            id SERIAL PRIMARY KEY,
            variant_id INTEGER REFERENCES variants(id),
            publish_time TIMESTAMP NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            idempotency_key VARCHAR(255) UNIQUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS publish_history(
            id SERIAL PRIMARY KEY,
            schedule_id INTEGER REFERENCES schedules(id),
            platform VARCHAR(50) NOT NULL,
            status VARCHAR(20) NOT NULL,
            response_payload TEXT,
            attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    
    `);
}

initDB();
export default pool;