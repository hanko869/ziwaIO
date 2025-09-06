-- Fix credits for payment ID 5273219420
-- User paid 16.4595 USDT (more than the 15 USD requested)
-- Should receive 450 credits (15 * 30)

DO $$
DECLARE
    _payment_id TEXT := '5273219420';
    _user_id UUID;
    _amount_usdt DECIMAL(18,6) := 15.00; -- Use the original invoice amount
    _credits_per_usdt INTEGER := 30;
    _credits_to_add INTEGER;
    _new_balance INTEGER;
    _current_balance INTEGER;
    _total_purchased INTEGER;
BEGIN
    -- Calculate credits to add
    _credits_to_add := FLOOR(_amount_usdt * _credits_per_usdt);
    
    -- First check if this is truly an anonymous user or if we can find the actual user
    -- The order_id is: anonymous_1755505131602
    
    -- Try to find the most recent user who doesn't have credits yet
    -- or check your application logs to identify the actual user
    
    -- For now, we'll need to identify the user manually
    -- You can find the user by checking who was logged in around 18 Aug 2025, 04:19 pm
    
    RAISE NOTICE 'Payment ID: %, Amount: % USD = % credits', _payment_id, _amount_usdt, _credits_to_add;
    RAISE NOTICE 'IMPORTANT: You need to identify the actual user and update the _user_id variable';
    RAISE NOTICE 'Check your logs or database for activity around 18 Aug 2025, 04:19 pm';
    
    -- Once you identify the user, set their UUID here:
    -- _user_id := 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
    
    -- Then uncomment and run the following:
    /*
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
        gen_random_uuid(), _user_id, _payment_id, 
        'TKTkD3KrKxNKRzXM7Zam47rEXHP8fCxv7', -- From payment data
        'N/A', 
        _amount_usdt,
        _credits_to_add, 
        _credits_per_usdt, 
        'confirmed', 
        1, 
        '2025-08-18 16:19:00'::timestamp, 
        '2025-08-18 16:21:00'::timestamp,
        JSONB_BUILD_OBJECT(
            'manual_fix', true, 
            'notes', 'Manually added - partially paid status but user paid more than requested',
            'actually_paid', '16.4595',
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
    ELSE
        _new_balance := _current_balance + _credits_to_add;
        _total_purchased := COALESCE(_total_purchased, 0) + _credits_to_add;
        UPDATE public.user_credits
        SET
            balance = _new_balance,
            total_purchased = _total_purchased,
            last_updated = CURRENT_TIMESTAMP
        WHERE user_id = _user_id;
    END IF;
    
    -- Record credit transaction
    INSERT INTO public.credit_transactions (
        user_id, type, amount, balance_after, description, related_payment_id, metadata
    ) VALUES (
        _user_id, 'purchase', _credits_to_add, _new_balance,
        'Payment ' || _payment_id || ' (' || _amount_usdt || ' USD)',
        _payment_id,
        JSONB_BUILD_OBJECT(
            'manual_fix', true, 
            'payment_id', _payment_id, 
            'amount_usd', _amount_usdt,
            'actually_paid_usdt', '16.4595'
        )
    );
    
    RAISE NOTICE 'Successfully added % credits for user %', _credits_to_add, _user_id;
    */
    
END $$;
