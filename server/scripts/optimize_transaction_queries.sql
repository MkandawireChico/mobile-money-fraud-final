-- Transaction Query Performance Optimization
-- Run this in your PostgreSQL database to improve COUNT(*) performance

-- Create optimized indexes for faster counting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_count_optimized 
ON transactions (transaction_id) 
WHERE transaction_id IS NOT NULL;

-- Create partial indexes for common filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_status_flagged 
ON transactions (status, timestamp DESC) 
WHERE status = 'flagged';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_fraud_status 
ON transactions (is_fraud, timestamp DESC);

-- Create covering index for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_list_covering 
ON transactions (timestamp DESC, transaction_id, user_id, amount, status, is_fraud);

-- Update table statistics
ANALYZE transactions;

-- Show index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'transactions'
ORDER BY idx_tup_read DESC;
