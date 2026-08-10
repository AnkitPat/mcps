
import { loadUsers, findUserByEmail, verifyPassword } from './src/users.js';

async function test() {
    await loadUsers();
    const user = findUserByEmail('ankit@company.com');
    if (!user) {
        console.error('User not found');
        process.exit(1);
    }
    const isValid = await verifyPassword(user, 'Password123!');
    if (isValid) {
        console.log('Password verified successfully');
    } else {
        console.error('Password verification failed');
        process.exit(1);
    }
}

test().catch(err => {
    console.error(err);
    process.exit(1);
});
