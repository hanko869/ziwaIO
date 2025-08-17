-- Check the exact column names in payment_transactions table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'payment_transactions'
ORDER BY 
    ordinal_position;

-- Also check if the table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'payment_transactions'
) AS table_exists;

-- Try to see what's actually in the table structure
SELECT * FROM public.payment_transactions LIMIT 0; 