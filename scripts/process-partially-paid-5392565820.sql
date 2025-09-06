-- Process partially paid payment 5392565820
-- User paid 16.478 USDT for 15 USD invoice (109.85% - more than enough)

DO $$
DECLARE
    _payment_id TEXT := '5392565820';
    _user_id UUID;
    _amount_usd DECIMAL(18,6) := 15.00; -- Invoice amount
    _actually_paid DECIMAL(18,6) := 16.478; -- What they actually paid
    _credits_per_usdt INTEGER := 30;
    _credits_to_add INTEGER;
    _new_balance INTEGER;
    _current_balance INTEGER;
    _total_purchased INTEGER;
BEGIN
    -- Calculate credits based on invoice amount (since they paid >= 95%)
    _credits_to_add := FLOOR(_amount_usd * _credits_per_usdt);
    
    -- Extract user ID from order_id
    -- Order ID: b45529c4-0c90-4798-9c37-5036e6b9f72c_1755535664460
    _user_id := 'b45529c4-0c90-4798-9c37-5036e6b9f72c'::uuid;
    
    RAISE NOTICE 'Processing payment % for user %', _payment_id, _user_id;
    RAISE NOTICE 'Invoice: % USD, Paid: % USDT, Credits: %', _amount_usd, _actually_paid, _credits_to_add;
    
    -- Check if payment already processed
    IF EXISTS (SELECT 1 FROM public.payment_transactions WHERE transaction_hash = _payment_id) THEN
        RAISE NOTICE 'Payment % already processed', _payment_id;
        RETURN;
    END IF;
    
    -- Insert payment transaction
    INSERT INTO public.payment_transactions (
        id, user_id, transaction_hash, from_address, to_address, amountusdt,
        credits_purchased, credits_per_usdt, status, confirmations, created_at, confirmed_at, metadata
    ) VALUES (
        gen_random_uuid(), 
        _user_id, 
        _payment_id, 
        'TB5g8AdsN9jZqXDKuahJxzAWArCkjZvXVH', -- From payment data
        'Balance', 
        _amount_usd, -- Use invoice amount for records
        _credits_to_add, 
        _credits_per_usdt, 
        'confirmed', 
        1, 
        '2025-08-19 12:57:00'::timestamp, 
        '2025-08-19 12:58:00'::timestamp,
        JSONB_BUILD_OBJECT(
            'manual_fix', true, 
            'notes', 'Processed partially paid - user paid more than 95% of invoice',
            'invoice_amount', _amount_usd,
            'actually_paid', _actually_paid,
            'pay_currency', 'usdttrc20'
        )
    );
    
    -- Update user credits
    SELECT balance, total_purchased INTO _current_balance, _total_purchased
    FROM public.user_credits
    WHERE user_id = _user_id;
    
    IF _current_balance IS NULL THEN
        INSERT INTO public.user_credits (user_id, balance, total_purchased, total_used)
        VALUES (_user_id, _credits_to_add, _credits_to_add, 0);
        _new_balance := _credits_to_add;
        RAISE NOTICE 'Created new credit balance for user %', _user_id;
    ELSE
        _new_balance := _current_balance + _credits_to_add;
        _total_purchased := COALESCE(_total_purchased, 0) + _credits_to_add;
        UPDATE public.user_credits
        SET
            balance = _new_balance,
            total_purchased = _total_purchased,
            last_updated = CURRENT_TIMESTAMP
        WHERE user_id = _user_id;
        RAISE NOTICE 'Updated credit balance for user %: % -> %', _user_id, _current_balance, _new_balance;
    END IF;
    
    -- Record credit transaction
    INSERT INTO public.credit_transactions (
        user_id, type, amount, balance_after, description, related_payment_id, metadata
    ) VALUES (
        _user_id, 
        'purchase', 
        _credits_to_add, 
        _new_balance,
        'Payment ' || _payment_id || ' (' || _amount_usd || ' USD)',
        _payment_id,
        JSONB_BUILD_OBJECT(
            'manual_fix', true, 
            'payment_id', _payment_id, 
            'invoice_amount_usd', _amount_usd,
            'actually_paid_usdt', _actually_paid,
            'payment_status', 'partially_paid_approved'
        )
    );
    
    RAISE NOTICE 'Successfully added % credits for user %', _credits_to_add, _user_id;
    RAISE NOTICE 'New balance: % credits', _new_balance;
    
END $$;

-- Verify the results
SELECT u.username, uc.balance, uc.total_purchased, uc.total_used
FROM users u
JOIN user_credits uc ON u.id = uc.user_id
WHERE u.id = 'b45529c4-0c90-4798-9c37-5036e6b9f72c';
