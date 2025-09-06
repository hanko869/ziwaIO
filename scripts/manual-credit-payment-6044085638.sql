-- Manual credit addition for NOWPayments payment ID 6044085638
-- User paid 16.454 USDT for 15 USDT worth of credits (450 credits)

DO $$
DECLARE
    _payment_id TEXT := '6044085638';
    _user_id UUID := 'YOUR_USER_ID_HERE'; -- Replace with actual user ID
    _amount_usdt DECIMAL(18,6) := 15.00; -- The intended deposit amount
    _credits_to_add INTEGER := 450; -- 15 USDT × 30 credits/USDT
    _new_balance INTEGER;
    _current_balance INTEGER;
BEGIN
    -- Get current user credits
    SELECT balance INTO _current_balance
    FROM public.user_credits
    WHERE user_id = _user_id;
    
    IF _current_balance IS NULL THEN
        RAISE NOTICE 'User credits not found for user_id %', _user_id;
        -- Initialize user credits
        INSERT INTO public.user_credits (user_id, balance, total_purchased, total_used, last_updated)
        VALUES (_user_id, _credits_to_add, _credits_to_add, 0, CURRENT_TIMESTAMP);
        _new_balance := _credits_to_add;
    ELSE
        _new_balance := _current_balance + _credits_to_add;
        RAISE NOTICE 'Updating user credits from % to %', _current_balance, _new_balance;
        UPDATE public.user_credits
        SET
            balance = _new_balance,
            total_purchased = total_purchased + _credits_to_add,
            last_updated = CURRENT_TIMESTAMP
        WHERE user_id = _user_id;
    END IF;
    
    -- Record the payment transaction
    INSERT INTO public.payment_transactions (
        id, user_id, transaction_hash, from_address, to_address, amountusdt,
        credits_purchased, credits_per_usdt, status, confirmations, created_at, confirmed_at, metadata
    ) VALUES (
        gen_random_uuid(), 
        _user_id, 
        _payment_id,
        'User Wallet',
        'NOWPayments', 
        _amount_usdt,
        _credits_to_add, 
        30, 
        'confirmed', 
        1, 
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP,
        JSONB_BUILD_OBJECT(
            'manual_fix', true,
            'notes', 'Manual credit addition for NOWPayments payment',
            'np_id', _payment_id,
            'actual_paid', 16.454
        )
    ) ON CONFLICT (transaction_hash) DO NOTHING;
    
    -- Record credit transaction
    INSERT INTO public.credit_transactions (
        user_id, type, amount, balance_after, description, related_payment_id, metadata
    ) VALUES (
        _user_id, 
        'purchase', 
        _credits_to_add, 
        _new_balance,
        'Manual credit addition for payment ' || _payment_id || ' (15 USDT)',
        _payment_id,
        JSONB_BUILD_OBJECT(
            'manual_fix', true,
            'payment_id', _payment_id,
            'amount_usdt', _amount_usdt
        )
    );
    
    RAISE NOTICE 'Successfully added % credits for payment %', _credits_to_add, _payment_id;
    RAISE NOTICE 'User % now has % credits', _user_id, _new_balance;
END $$;

-- To use this script:
-- 1. Replace YOUR_USER_ID_HERE with the actual user ID
-- 2. Run this script in your Supabase SQL editor
