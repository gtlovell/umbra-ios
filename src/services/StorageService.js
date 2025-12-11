import * as SQLite from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

// Initialize the database
let db;

export const initDB = async () => {
    try {
        db = await SQLite.openDatabaseAsync('umbra.db');
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY NOT NULL,
                title TEXT,
                content TEXT,
                type TEXT,
                createdAt INTEGER,
                updatedAt INTEGER,
                metadata TEXT,
                embedding TEXT 
            );
        `);
        // Simple migration check (idempotent-ish via catch or check)
        try {
            await db.runAsync('ALTER TABLE notes ADD COLUMN embedding TEXT');
        } catch (e) {
            // Ignore error if column exists
        }
        console.log('Database initialized');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

export const addNote = async (title, content, type = 'text', metadata = {}) => {
    if (!db) await initDB();
    const id = uuidv4();
    const now = Date.now();
    try {
        await db.runAsync(
            'INSERT INTO notes (id, title, content, type, createdAt, updatedAt, metadata, embedding) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title, content, type, now, now, JSON.stringify(metadata), null]
        );
        return id;
    } catch (error) {
        console.error('Error adding note:', error);
        throw error;
    }
};

export const getNotes = async () => {
    if (!db) await initDB();
    try {
        const result = await db.getAllAsync('SELECT * FROM notes ORDER BY createdAt DESC');
        return result.map(note => ({
            ...note,
            metadata: JSON.parse(note.metadata || '{}')
        }));
    } catch (error) {
        console.error('Error getting notes:', error);
        return [];
    }
};

export const clearNotes = async () => {
    if (!db) await initDB();
    try {
        await db.runAsync('DELETE FROM notes');
    } catch (error) {
        console.error('Error clearing notes:', error);
    }
};

export const updateNote = async (id, updates) => {
    if (!db) await initDB();
    const now = Date.now();
    try {
        // Construct SET clause
        const fields = Object.keys(updates).filter(k => k !== 'id');
        if (fields.length === 0) return;

        const setClause = fields.map(k => `${k} = ?`).join(', ');
        const values = fields.map(k => {
            if (k === 'metadata') return JSON.stringify(updates[k]);
            return updates[k];
        });
        values.push(now); // For updatedAt
        values.push(id);

        await db.runAsync(
            `UPDATE notes SET ${setClause}, updatedAt = ? WHERE id = ?`,
            values
        );
    } catch (error) {
        console.error('Error updating note:', error);
        throw error;
    }
};
