#!/usr/bin/env node
/**
 * Test script to verify data masking functionality
 */

const { 
    maskPhoneNumber, 
    maskUserId, 
    maskAccountNumber, 
    maskEmail,
    maskTransactionData,
    maskUserData 
} = require('../utils/dataMasking');

console.log('🔍 Testing Data Masking Functionality\n');

// Test individual masking functions
console.log('📱 Phone Number Masking:');
console.log('Original: +265888123456');
console.log('Masked:  ', maskPhoneNumber('+265888123456'));
console.log('Original: 0888123456');
console.log('Masked:  ', maskPhoneNumber('0888123456'));
console.log();

console.log('👤 User ID Masking:');
console.log('Original: USER123456789');
console.log('Masked:  ', maskUserId('USER123456789'));
console.log();

console.log('🏦 Account Number Masking:');
console.log('Original: 1234567890123456');
console.log('Masked:  ', maskAccountNumber('1234567890123456'));
console.log();

console.log('📧 Email Masking:');
console.log('Original: john.doe@example.com');
console.log('Masked:  ', maskEmail('john.doe@example.com'));
console.log();

// Test transaction masking
console.log('💰 Transaction Data Masking:');
const sampleTransaction = {
    transaction_id: 'TXN123456789',
    user_id: 'USER987654321',
    amount: 50000,
    sender_account: '+265888123456',
    receiver_account: '0999876543',
    merchant_id: 'MERCHANT123456',
    transaction_type: 'p2p_transfer',
    timestamp: new Date().toISOString()
};

console.log('Original Transaction:');
console.log(JSON.stringify(sampleTransaction, null, 2));

console.log('\nMasked for Admin (should be unmasked):');
const adminMasked = maskTransactionData(sampleTransaction, 'admin');
console.log(JSON.stringify(adminMasked, null, 2));

console.log('\nMasked for Analyst:');
const analystMasked = maskTransactionData(sampleTransaction, 'analyst');
console.log(JSON.stringify(analystMasked, null, 2));

console.log('\nMasked for Viewer:');
const viewerMasked = maskTransactionData(sampleTransaction, 'viewer');
console.log(JSON.stringify(viewerMasked, null, 2));

// Test user data masking
console.log('\n👥 User Data Masking:');
const sampleUser = {
    id: 1,
    username: 'john_doe',
    email: 'john.doe@example.com',
    phone: '+265888123456',
    role: 'analyst',
    status: 'active'
};

console.log('Original User:');
console.log(JSON.stringify(sampleUser, null, 2));

console.log('\nMasked for Admin (should be unmasked):');
const adminUserMasked = maskUserData(sampleUser, 'admin', null);
console.log(JSON.stringify(adminUserMasked, null, 2));

console.log('\nMasked for Analyst viewing own data (should be unmasked):');
const selfMasked = maskUserData(sampleUser, 'analyst', 1);
console.log(JSON.stringify(selfMasked, null, 2));

console.log('\nMasked for Analyst viewing other user:');
const otherUserMasked = maskUserData(sampleUser, 'analyst', 2);
console.log(JSON.stringify(otherUserMasked, null, 2));

console.log('\n✅ Data masking test completed!');
