// generateHash.js
const bcrypt = require('bcrypt');

const plainPassword = '2397'; // Your desired password
const saltRounds = 10; // Standard number of salt rounds

bcrypt.hash(plainPassword, saltRounds, function(err, hash) {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    console.log('Plain Password:', plainPassword);
    console.log('Generated Bcrypt Hash:', hash);
});

$2b$10$Rdogpqnu4Or5y/ZWjtFbD.YGMkHYbfVraSEchfnU8ffoQ.HDD1qXq