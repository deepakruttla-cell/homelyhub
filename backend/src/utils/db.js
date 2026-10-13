import 'dotenv/config';
import pg from 'pg';

// ADD THE DIAGNOSTIC CODE HERE
console.log(
    'DATABASE_URL exists:',
    Boolean(process.env.DATABASE_URL)
);

console.log(
    'DATABASE_URL host:',
    process.env.DATABASE_URL
        ? (() => {
            try {
                return new URL(process.env.DATABASE_URL).host;
            } catch {
                return 'Invalid URL';
            }
        })()
        : 'MISSING'
);

const { Pool } = pg;


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const connectDB = async () => {
    const client = await pool.connect();

    try {
        await client.query('SELECT 1');
        console.log('PostgreSQL connected successfully');
    } finally {
        client.release();
    }
};

export { pool };
export default connectDB;
