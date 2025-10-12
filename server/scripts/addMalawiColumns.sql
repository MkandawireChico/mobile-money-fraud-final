-- Add Malawi-specific columns to existing tables
-- This script adds phone numbers and other Malawi mobile money specific fields

-- Add phone column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS msisdn VARCHAR(20),
ADD COLUMN IF NOT EXISTS mobile_money_provider VARCHAR(50);

-- Add Malawi-specific columns to transactions table if they don't exist
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS sender_msisdn VARCHAR(20),
ADD COLUMN IF NOT EXISTS receiver_msisdn VARCHAR(20),
ADD COLUMN IF NOT EXISTS telco_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS agent_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS transaction_fee DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS balance_before DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS balance_after DECIMAL(15, 2);

-- Create indexes for better performance on Malawi-specific fields
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);
CREATE INDEX IF NOT EXISTS idx_users_msisdn ON users (msisdn);
CREATE INDEX IF NOT EXISTS idx_transactions_sender_msisdn ON transactions (sender_msisdn);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver_msisdn ON transactions (receiver_msisdn);
CREATE INDEX IF NOT EXISTS idx_transactions_telco_provider ON transactions (telco_provider);
CREATE INDEX IF NOT EXISTS idx_transactions_reference_number ON transactions (reference_number);

-- Add comments to document the new columns
COMMENT ON COLUMN users.phone IS 'Malawi phone number with country code (e.g., 265888336810)';
COMMENT ON COLUMN users.msisdn IS 'Mobile Station International Subscriber Directory Number';
COMMENT ON COLUMN users.mobile_money_provider IS 'TNM Mpamba, Airtel Money, etc.';

COMMENT ON COLUMN transactions.sender_msisdn IS 'Sender Malawi phone number';
COMMENT ON COLUMN transactions.receiver_msisdn IS 'Receiver Malawi phone number';
COMMENT ON COLUMN transactions.telco_provider IS 'tnm_mpamba or airtel_money';
COMMENT ON COLUMN transactions.agent_code IS 'Mobile money agent code (6 digits)';
COMMENT ON COLUMN transactions.reference_number IS 'Transaction reference (TNM/Airtel format)';
COMMENT ON COLUMN transactions.transaction_fee IS 'Transaction fee in MWK';
COMMENT ON COLUMN transactions.balance_before IS 'Account balance before transaction';
COMMENT ON COLUMN transactions.balance_after IS 'Account balance after transaction';

-- Update existing transactions to have MWK currency
UPDATE transactions SET currency = 'MWK' WHERE currency IS NULL OR currency != 'MWK';

-- Update existing users to have Malawi as default country
UPDATE users SET country = 'Malawi' WHERE country IS NULL;

-- Create a view for Malawi transaction summary
CREATE OR REPLACE VIEW malawi_transaction_summary AS
SELECT 
    t.transaction_id,
    t.sender_msisdn,
    t.receiver_msisdn,
    t.amount,
    t.currency,
    t.transaction_fee,
    t.telco_provider,
    t.transaction_type,
    t.status,
    t.timestamp,
    t.location_city,
    t.description,
    t.is_fraud,
    u.username as user_name,
    u.phone as user_phone
FROM transactions t
LEFT JOIN users u ON t.user_id = u.id
WHERE t.currency = 'MWK'
ORDER BY t.timestamp DESC;

-- Create a view for Malawi user summary
CREATE OR REPLACE VIEW malawi_user_summary AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.phone,
    u.msisdn,
    u.mobile_money_provider,
    u.role,
    u.status,
    u.created_at,
    COUNT(t.id) as total_transactions,
    COALESCE(SUM(t.amount), 0) as total_amount_transacted,
    COALESCE(SUM(t.transaction_fee), 0) as total_fees_paid
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id AND t.currency = 'MWK'
GROUP BY u.id, u.username, u.email, u.phone, u.msisdn, u.mobile_money_provider, u.role, u.status, u.created_at
ORDER BY u.created_at DESC;

-- Insert sample Malawi locations if they don't exist
INSERT INTO transactions (transaction_id, user_id, amount, currency, timestamp, status, transaction_type, location_city, location_country, created_at, updated_at)
SELECT 
    'SAMPLE_' || generate_random_uuid()::text,
    (SELECT id FROM users LIMIT 1),
    1000.00,
    'MWK',
    NOW(),
    'completed',
    'sample',
    'Lilongwe',
    'Malawi',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE location_country = 'Malawi')
LIMIT 1;

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE '🇲🇼 Malawi Mobile Money Database Schema Updated Successfully!';
    RAISE NOTICE '📊 Added columns: phone, msisdn, mobile_money_provider to users';
    RAISE NOTICE '📊 Added columns: sender_msisdn, receiver_msisdn, telco_provider, agent_code, reference_number, transaction_fee, balance_before, balance_after to transactions';
    RAISE NOTICE '🔍 Created indexes for better performance';
    RAISE NOTICE '📈 Created views: malawi_transaction_summary, malawi_user_summary';
    RAISE NOTICE '✅ Database is now ready for Malawi mobile money transactions!';
END $$;
