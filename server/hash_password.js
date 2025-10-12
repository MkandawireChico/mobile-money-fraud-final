// hash_password.js
const bcrypt = require('bcryptjs');

async function hashPass(password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Hashed Password:', hashedPassword);
}

// Replace 'your_admin_password_here' with the actual password you want for your admin user
hashPass('mkandawire');

