import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface User {
    email: string;
    password: string; // Already hashed
    role: string;
}

const usersPath = process.env.USERS_FILE_PATH || path.join(__dirname, '..', 'config', 'users.json');
let users: User[] = [];

export const loadUsers = async () => {
    try {
        const data = await fs.readFile(usersPath, 'utf-8');
        users = JSON.parse(data);
    } catch (error) {
        console.error(`Failed to load users from ${usersPath}:`, error);
        throw error;
    }
};

export const findUserByEmail = (email: string) => users.find(u => u.email === email);

export const verifyPassword = async (user: User, password: string) => {
    return await bcrypt.compare(password, user.password);
};
