
import bcrypt from 'bcrypt';

const password = 'Password123!';
bcrypt.hash(password, 10).then(hash => console.log(hash));
