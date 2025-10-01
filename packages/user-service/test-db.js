import pg from 'pg';


const { Pool } = pg;

console.log('--- Database Connection Test ---');
console.log('Attempting to connect with this configuration:');
console.log({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: '***', // Mask password for security
    port: process.env.DB_PORT,
});

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    connectionTimeoutMillis: 5000, // 5 second timeout
});

const testConnection = async () => {
    let client;
    try {
        console.log('\nRequesting a client from the pool...');
        client = await pool.connect();
        console.log('Client acquired!');
        console.log('Executing a simple query (SELECT NOW())...');
        const result = await client.query('SELECT NOW()');
        console.log('Query successful!');
        console.log('Server time:', result.rows[0].now);
        console.log('\n✅ --- Connection Successful! --- ✅');
    } catch (err) {
        console.error('\n❌ --- Connection FAILED --- ❌');
        console.error('Error details:', err.stack);
    } finally {
        if (client) {
            client.release();
            console.log('Client released.');
        }
        await pool.end();
        console.log('Pool has ended.');
    }
};

testConnection();
