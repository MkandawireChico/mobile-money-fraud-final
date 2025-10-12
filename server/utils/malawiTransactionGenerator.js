

const PROVIDERS = {
    TNM_MPAMBA: 'tnm_mpamba',
    AIRTEL_MONEY: 'airtel_money'
};

const AIRTEL_PREFIXES = {
    CASH_OUT: 'CO',      // Cash Out - CO250917.1058.B49830
    BANK_WITHDRAWAL: 'BW', // Bank Withdrawal - BW250917.1056.L43493
    MERCHANT_PAYMENT: 'MP', // Merchant Payment - MP250917.0748.L97468
    P2P_TRANSFER: 'PP'    // Person to Person - PP250911.0430.Y00084
};

const TNM_PATTERNS = [
    'CHB', 'CH', 'CGS', 'CF', 'CBC', 'CHA', 'CHC', 'CHD', 'CHE', 'CHF'
];

const MALAWI_PHONE_PREFIXES = [
    '26588', '26599', '26577', '26521', '26531', // TNM
    '26588', '26599', '26577', '26521', '26531', // Airtel
    '26596', '26597', '26598'  // Other networks
];

const MALAWI_NAMES = {
    FIRST_NAMES: [
        'CHISOMO', 'TEMWA', 'KONDWANI', 'MPHATSO', 'CHIMWEMWE',
        'GRACE', 'MERCY', 'FAITH', 'HOPE', 'CHARITY',
        'WILLIAM', 'JAMES', 'JOHN', 'PETER', 'PAUL',
        'MARY', 'ELIZABETH', 'CATHERINE', 'ROSE', 'PROMISE',
        'BRIAN', 'CHARLES', 'ANGELLA', 'JESSICA', 'UCHIZI',
        'PATRICK', 'FRANCIS', 'JOSEPH', 'DANIEL', 'SAMUEL',
        'ESTHER', 'RUTH', 'SARAH', 'REBECCA', 'MARTHA'
    ],
    LAST_NAMES: [
        'PHIRI', 'BANDA', 'MWALE', 'TEMBO', 'NYIRENDA',
        'CHIWAYA', 'MPHASI', 'MSOWOYA', 'KAMPONDA', 'KHUNTHA',
        'SILIYA', 'GONDWE', 'MBEWE', 'LUNGU', 'SAKALA',
        'MUMBA', 'ZULU', 'DAKA', 'KACHALE', 'MVULA',
        'CHIRWA', 'MKANDAWIRE', 'KANYAMA', 'CHIPETA', 'KALULU'
    ]
};

const MALAWI_BANKS = [
    'STANDARD BANK',
    'NATIONAL BANK OF MALAWI Plc',
    'FDH BANK',
    'NBS BANK',
    'CDH INVESTMENT BANK',
    'OPPORTUNITY BANK',
    'FIRST CAPITAL BANK'
];

const generateAgentCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateMalawiPhoneNumber = () => {
    const prefix = MALAWI_PHONE_PREFIXES[Math.floor(Math.random() * MALAWI_PHONE_PREFIXES.length)];
    const suffix = Math.floor(1000000 + Math.random() * 9000000).toString();
    return prefix + suffix;
};

const generateTNMReference = () => {
    const pattern = TNM_PATTERNS[Math.floor(Math.random() * TNM_PATTERNS.length)];
    const numbers = Math.floor(100 + Math.random() * 900).toString();
    const letters = Math.random().toString(36).substring(2, 8).toUpperCase();
    return pattern + numbers + letters;
};

const generateAirtelTransactionId = (transactionType = null) => {
    const prefixes = Object.values(AIRTEL_PREFIXES);
    const prefix = transactionType || prefixes[Math.floor(Math.random() * prefixes.length)];

    // Date part (YYMMDD format)
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const dateStr = year + month + day;

    // Time part (HHMM format)
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const timeStr = hour + minute;

    // Random suffix (Letter + 5 digits)
    const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
    const digits = Math.floor(10000 + Math.random() * 90000);

    return `${prefix}${dateStr}.${timeStr}.${letter}${digits}`;
};

const generateMalawiName = () => {
    const firstName = MALAWI_NAMES.FIRST_NAMES[Math.floor(Math.random() * MALAWI_NAMES.FIRST_NAMES.length)];
    const lastName = MALAWI_NAMES.LAST_NAMES[Math.floor(Math.random() * MALAWI_NAMES.LAST_NAMES.length)];
    return `${firstName} ${lastName}`;
};

const generateMalawiBank = () => {
    return MALAWI_BANKS[Math.floor(Math.random() * MALAWI_BANKS.length)];
};

const generateMalawiTransaction = (provider = null, transactionType = null) => {
    const selectedProvider = provider || (Math.random() > 0.5 ? PROVIDERS.TNM_MPAMBA : PROVIDERS.AIRTEL_MONEY);

    let transactionId;
    if (selectedProvider === PROVIDERS.TNM_MPAMBA) {
        transactionId = generateTNMReference();
    } else {
        transactionId = generateAirtelTransactionId(transactionType);
    }

    const senderPhone = generateMalawiPhoneNumber();
    const receiverPhone = generateMalawiPhoneNumber();
    const senderName = generateMalawiName();
    const receiverName = generateMalawiName();
    const agentCode = generateAgentCode();
    const bankName = generateMalawiBank();

    // Generate realistic amounts in MWK
    const amounts = [500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000, 15000, 20000, 25000, 50000, 100000];
    const amount = amounts[Math.floor(Math.random() * amounts.length)];

    // Generate fees based on amount (realistic Malawi mobile money fees)
    let fee = 0;
    if (amount <= 1000) fee = 25;
    else if (amount <= 5000) fee = 65;
    else if (amount <= 10000) fee = 125;
    else if (amount <= 50000) fee = 250;
    else fee = 500;

    return {
        transactionId,
        provider: selectedProvider,
        senderPhone,
        receiverPhone,
        senderName,
        receiverName,
        agentCode,
        bankName,
        amount,
        fee,
        currency: 'MWK',
        timestamp: new Date(),
        // Additional Malawi-specific fields
        location: getRandomMalawiLocation(),
        network: selectedProvider === PROVIDERS.TNM_MPAMBA ? 'TNM' : 'AIRTEL'
    };
};

const getRandomMalawiLocation = () => {
    const locations = [
        'Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba', 'Kasungu',
        'Mangochi', 'Salima', 'Balaka', 'Chiradzulu', 'Nsanje',
        'Thyolo', 'Dedza', 'Dowa', 'Ntcheu', 'Nkhotakota',
        'Rumphi', 'Karonga', 'Chitipa', 'Likoma', 'Machinga'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
};

const generateTransactionDescription = (transaction, type) => {
    const { transactionId, senderName, receiverName, amount, fee, provider, agentCode, bankName } = transaction;

    switch (type) {
        case 'money_sent':
            if (provider === PROVIDERS.TNM_MPAMBA) {
                return `Money Sent to ${transaction.receiverPhone} ${receiverName} on ${new Date().toLocaleString('en-GB')}. Amount: ${amount.toLocaleString()}.00MWK Fee: ${fee}.00MWK Ref: ${transactionId}`;
            } else {
                return `Trans ID: ${transactionId}. You have sent MK ${amount.toLocaleString()}.00 to ${transaction.receiverPhone.slice(-6)},${receiverName}. Your balance is MK ${Math.floor(Math.random() * 10000)}.32`;
            }

        case 'money_received':
            if (provider === PROVIDERS.TNM_MPAMBA) {
                return `Money Received from ${transaction.senderPhone} ${senderName} on ${new Date().toLocaleString('en-GB')}. Amount: ${amount.toLocaleString()}.00MWK Ref: ${transactionId}`;
            } else {
                return `Trans. ID: ${transactionId} You have received MK ${amount.toLocaleString()}.00 from ${senderName}. Your balance is ${amount + Math.floor(Math.random() * 1000)}.32MK.`;
            }

        case 'cash_in':
            return `Cash In from ${agentCode}-${senderName} on ${new Date().toLocaleString('en-GB')}. Amt: ${amount.toLocaleString()}.00MWK Fee: 0.00MWK Ref: ${transactionId}`;

        case 'bank_transfer':
            return `Dear customer, you have received ${amount.toLocaleString()}.00MWK from ${bankName} on ${new Date().toLocaleString('en-GB')}. Ref: ${transactionId} Balance: ${amount + Math.floor(Math.random() * 100)}.00MWK`;

        case 'airtel_payment':
            return `Trans ID: ${transactionId}. You have paid MK ${amount.toLocaleString()}.00 toward Airtel product. Bal:MK ${Math.floor(Math.random() * 1000)}.32.`;

        default:
            return `Transaction ${transactionId}: ${amount.toLocaleString()}.00MWK`;
    }
};

const generateBatchMalawiTransactions = (count = 100) => {
    const transactions = [];
    const transactionTypes = ['money_sent', 'money_received', 'cash_in', 'bank_transfer', 'airtel_payment'];

    for (let i = 0; i < count; i++) {
        const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
        const transaction = generateMalawiTransaction();

        transactions.push({
            ...transaction,
            type,
            description: generateTransactionDescription(transaction, type),
            // Add database-compatible fields
            transaction_id: transaction.transactionId,
            sender_phone: transaction.senderPhone,
            receiver_phone: transaction.receiverPhone,
            sender_name: transaction.senderName,
            receiver_name: transaction.receiverName,
            transaction_type: type,
            status: Math.random() > 0.05 ? 'completed' : 'failed', // 95% success rate
            created_at: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)) // Random date within last 30 days
        });
    }

    return transactions;
};

module.exports = {
    PROVIDERS,
    AIRTEL_PREFIXES,
    TNM_PATTERNS,
    MALAWI_PHONE_PREFIXES,
    MALAWI_NAMES,
    MALAWI_BANKS,
    generateAgentCode,
    generateMalawiPhoneNumber,
    generateTNMReference,
    generateAirtelTransactionId,
    generateMalawiName,
    generateMalawiBank,
    generateMalawiTransaction,
    generateTransactionDescription,
    generateBatchMalawiTransactions,
    getRandomMalawiLocation
};
