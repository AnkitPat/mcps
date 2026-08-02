import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface User {
    email: string;
    password: string; // Will store hash after startup
    role: string;
}

const usersPath = path.join(__dirname, '..', 'config', 'users.json');
let users: User[] = [];

export const loadUsers = async () => {
    const data = fs.readFileSync(usersPath, 'utf-8');
    const rawUsers: User[] = JSON.parse(data);
    
    users = await Promise.all(rawUsers.map(async (u) => ({
        ...u,
        password: await bcrypt.hash(u.password, 10)
    })));
};

export const findUserByEmail = (email: string) => users.find(u => u.email === email);

export const verifyPassword = async (user: User, password: string) => {
    return await bcrypt.compare(password, user.password);
};
