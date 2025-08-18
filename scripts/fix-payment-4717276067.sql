-- Fix credits for payment ID 4717276067
-- User paid 21 USD and should receive 630 credits (21 * 30)

DO $$
DECLARE
    _payment_id TEXT := '4717276067';
    _user_id UUID := 'anonymous'; -- This needs to be updated to the actual user ID
    _amount_usdt DECIMAL(18,6) := 21.00; -- The amount shown in invoice
    _credits_per_usdt INTEGER := 30;
    _credits_to_add INTEGER;
    _new_balance INTEGER;
    _current_balance INTEGER;
    _total_purchased INTEGER;
BEGIN
    -- Calculate credits to add
    _credits_to_add := FLOOR(_amount_usdt * _credits_per_usdt);
    
    -- First, we need to find the actual user ID from the order_id
    -- The order_id format is: userId_timestamp
    -- From the screenshot: anonymous_1755500678241
    
    -- Since the user ID is 'anonymous', we need to identify the user differently
    -- You'll need to check your database to find which user made this payment
    
    RAISE NOTICE 'Payment ID: %, Amount: % USDT, Credits to add: %', _payment_id, _amount_usdt, _credits_to_add;
    RAISE NOTICE 'IMPORTANT: You need to update the _user_id variable with the actual user UUID';
    
    -- Once you have the correct user_id, uncomment the following:
    /*
    -- Check if payment already processed
    IF EXISTS (SELECT 1 FROM public.payment_transactions WHERE transaction_hash = _payment_id) THEN
        RAISE NOTICE 'Payment % already processed', _payment_id;
    ELSE
        -- Insert payment transaction
        INSERT INTO public.payment_transactions (
            id, user_id, transaction_hash, from_address, to_address, amountusdt,
            credits_purchased, credits_per_usdt, status, confirmations, created_at, confirmed_at, metadata
        ) VALUES (
            gen_random_uuid(), _user_id, _payment_id, 'N/A', 'N/A', _amount_usdt,
            _credits_to_add, _credits_per_usdt, 'confirmed', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
            JSONB_BUILD_OBJECT('manual_fix', true, 'notes', 'Manually added - payment was not credited automatically')
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
            _total_purchased := _total_purchased + _credits_to_add;
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
            'Manual credit addition for payment ' || _payment_id || ' (' || _amount_usdt || ' USDT)',
            _payment_id,
            JSONB_BUILD_OBJECT('manual_fix', true, 'payment_id', _payment_id, 'amount_usdt', _amount_usdt)
        );
        
        RAISE NOTICE 'Successfully added % credits for user %', _credits_to_add, _user_id;
    END IF;
    */
    
END $$;
