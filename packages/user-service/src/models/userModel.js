import { pool } from '../../../database/client.js'

// Helper to sanitize column names to prevent SQL injection
const sanitizeColumnName = (name) => {
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
        throw new Error('Invalid field name. Only alphanumeric characters and underscores are allowed.');
    }
    return `"${name}"`; // Quote the column name to handle case sensitivity and reserved words
};

export const findUserByEmail = async (email) => {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
};

export const createUser = async (userData) => {
    // Filter out keys that should not be manually inserted or are empty
    const fields = Object.keys(userData).filter(key => 
        !['id', 'created_at', 'updated_at'].includes(key) && userData[key] !== '' && userData[key] !== null && userData[key] !== undefined
    );
    
    if (fields.length === 0) {
        throw new Error("No valid fields provided for user creation.");
    }

    const sanitizedColumns = fields.map(sanitizeColumnName).join(', ');
    const valuePlaceholders = fields.map((_, index) => `$${index + 1}`).join(', ');
    const values = fields.map(field => userData[field]);
    
    const returningColumns = "id, email, name, role";

    const query = `
        INSERT INTO users (${sanitizedColumns}) 
        VALUES (${valuePlaceholders}) 
        RETURNING ${returningColumns}
    `;

    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const findAllUsers = async () => {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY name');
    return rows;
}

export const findUserById = async (id) => {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0];
}

export const updateUser = async (id, userData) => {
    // Dynamically build the SET clause, filtering out protected fields
    const fields = Object.keys(userData).filter(key => !['id', 'created_at', 'updated_at'].includes(key));
    
    if (fields.length === 0) {
        // If there are no fields to update, just return the current user data
        return findUserById(id);
    }

    const setClause = fields.map((field, index) => `${sanitizeColumnName(field)} = $${index + 1}`).join(', ');
    const values = fields.map(field => userData[field]);
    
    const { rows } = await pool.query(
        `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${fields.length + 1} RETURNING *`,
        [...values, id]
    );
    return rows[0];
}

export const deleteUser = async (id, client = pool) => {
    await client.query('DELETE FROM users WHERE id = $1', [id]);
}

export const findUserFields = async () => {
    const { rows } = await pool.query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_schema = 'public' AND table_name = 'users' AND column_name NOT LIKE '%_hash' AND column_name NOT LIKE '%_at'`
    );
    return rows.map(row => row.column_name);
};

export const addUserField = async (fieldName) => {
    const sanitizedFieldName = sanitizeColumnName(fieldName);
    // Add new columns as TEXT by default. You could extend this to support other types.
    await pool.query(`ALTER TABLE users ADD COLUMN ${sanitizedFieldName} TEXT`);
};

export const deleteUserField = async (fieldName) => {
    const sanitizedFieldName = sanitizeColumnName(fieldName);
    // Core fields that should not be deleted
    const protectedFields = ['id', 'email', 'name', 'password_hash', 'role', 'created_at', 'updated_at'];
    if (protectedFields.includes(fieldName.toLowerCase())) {
        throw new Error(`Cannot delete a core system field: ${fieldName}`);
    }
    await pool.query(`ALTER TABLE users DROP COLUMN ${sanitizedFieldName}`);
};