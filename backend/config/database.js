const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

function normalizeSql(text) {
    let index = 0;
    return text.replace(/\?/g, () => `$${++index}`);
}

function buildPoolConfig() {
    const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || process.env.SUPABASE_DB_URL;

    if (connectionString) {
        return {
            connectionString,
            ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
        };
    }

    const supabaseHost = process.env.SUPABASE_DB_HOST;
    const supabasePort = Number(process.env.SUPABASE_DB_PORT || 5432);
    const supabaseUser = process.env.SUPABASE_DB_USER || 'postgres';
    const supabasePassword = process.env.SUPABASE_DB_PASSWORD || '';
    const supabaseDatabase = process.env.SUPABASE_DB_NAME || 'postgres';

    if (!supabaseHost) {
        throw new Error('Missing PostgreSQL configuration. Set DATABASE_URL or SUPABASE_DB_HOST/SUPABASE_DB_PASSWORD in backend/.env for Supabase.');
    }

    return {
        host: supabaseHost,
        port: supabasePort,
        user: supabaseUser,
        password: supabasePassword,
        database: supabaseDatabase,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };
}

const pool = new Pool(buildPoolConfig());

function query(text, params, callback) {
    let values = params;
    let cb = callback;

    if (typeof params === 'function') {
        cb = params;
        values = [];
    }

    const promise = pool.query(normalizeSql(text), values).then((result) => result.rows);

    if (cb) {
        promise.then((rows) => cb(null, rows)).catch((err) => cb(err));
        return;
    }

    return promise;
}

module.exports = { pool, query };
