/**
 * Data masking utilities for protecting sensitive information
 */

/**
 * Masks phone numbers by showing only first 3 and last 2 digits
 * Example: +265888123456 -> +265***456
 */
const maskPhoneNumber = (phoneNumber) => {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        return phoneNumber;
    }
    
    // Remove any spaces or special characters except +
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    
    if (cleanPhone.length < 6) {
        return phoneNumber; // Too short to mask meaningfully
    }
    
    // For international format (+265888123456)
    if (cleanPhone.startsWith('+')) {
        const countryCode = cleanPhone.substring(0, 4); // +265
        const remaining = cleanPhone.substring(4);
        if (remaining.length >= 5) {
            const first = remaining.substring(0, 2);
            const last = remaining.substring(remaining.length - 3);
            return `${countryCode}${first}***${last}`;
        }
    }
    
    // For local format (0888123456)
    if (cleanPhone.length >= 8) {
        const first = cleanPhone.substring(0, 3);
        const last = cleanPhone.substring(cleanPhone.length - 3);
        return `${first}***${last}`;
    }
    
    return phoneNumber;
};

/**
 * Masks user ID by showing only first 3 and last 2 characters
 * Example: USER123456789 -> USE***89
 */
const maskUserId = (userId) => {
    if (!userId || typeof userId !== 'string') {
        return userId;
    }
    
    if (userId.length <= 5) {
        return userId; // Too short to mask meaningfully
    }
    
    const first = userId.substring(0, 3);
    const last = userId.substring(userId.length - 2);
    
    return `${first}***${last}`;
};

/**
 * Masks account numbers by showing only last 4 digits
 * Example: 1234567890123456 -> ***3456
 */
const maskAccountNumber = (accountNumber) => {
    if (!accountNumber || typeof accountNumber !== 'string') {
        return accountNumber;
    }
    
    if (accountNumber.length <= 4) {
        return accountNumber;
    }
    
    const last4 = accountNumber.substring(accountNumber.length - 4);
    
    return `***${last4}`;
};

/**
 * Masks email addresses by showing only first character and domain
 * Example: john.doe@example.com -> j***@example.com
 */
const maskEmail = (email) => {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return email;
    }
    
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 1) {
        return email;
    }
    
    const maskedLocal = localPart[0] + '***';
    return `${maskedLocal}@${domain}`;
};

/**
 * Applies masking to transaction data based on user role
 */
const maskTransactionData = (transaction, userRole) => {
    if (!transaction) return transaction;
    
    // Admin users see everything unmasked
    if (userRole === 'admin') {
        return transaction;
    }
    
    // Create a copy to avoid mutating original data
    const maskedTransaction = { ...transaction };
    
    // Mask sensitive fields for non-admin users
    if (maskedTransaction.user_id) {
        maskedTransaction.user_id = maskUserId(maskedTransaction.user_id);
    }
    
    if (maskedTransaction.sender_account) {
        maskedTransaction.sender_account = maskPhoneNumber(maskedTransaction.sender_account);
    }
    
    if (maskedTransaction.receiver_account) {
        maskedTransaction.receiver_account = maskPhoneNumber(maskedTransaction.receiver_account);
    }
    
    if (maskedTransaction.merchant_id) {
        maskedTransaction.merchant_id = maskUserId(maskedTransaction.merchant_id);
    }
    
    return maskedTransaction;
};

/**
 * Applies masking to an array of transactions
 */
const maskTransactionArray = (transactions, userRole) => {
    if (!Array.isArray(transactions)) {
        return transactions;
    }
    
    return transactions.map(transaction => maskTransactionData(transaction, userRole));
};

/**
 * Applies masking to user data based on user role
 */
const maskUserData = (user, userRole, requestingUserId) => {
    if (!user) return user;
    
    // Admin users see everything unmasked
    if (userRole === 'admin') {
        return user;
    }
    
    // Users can see their own data unmasked
    if (requestingUserId && user.id === requestingUserId) {
        return user;
    }
    
    // Create a copy to avoid mutating original data
    const maskedUser = { ...user };
    
    // Mask sensitive fields for other users
    if (maskedUser.email) {
        maskedUser.email = maskEmail(maskedUser.email);
    }
    
    if (maskedUser.phone) {
        maskedUser.phone = maskPhoneNumber(maskedUser.phone);
    }
    
    return maskedUser;
};

module.exports = {
    maskPhoneNumber,
    maskUserId,
    maskAccountNumber,
    maskEmail,
    maskTransactionData,
    maskTransactionArray,
    maskUserData
};
