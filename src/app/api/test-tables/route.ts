import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    // Test each table
    const tables = [
      'users',
      'user_credits', 
      'payment_transactions',
      'credit_transactions',
      'activities',
      'contacts'
    ];

    const results: any = {};

    for (const table of tables) {
      try {
        // Try to select from each table
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(0); // Just check structure, don't fetch data

        if (error) {
          results[table] = { exists: false, error: error.message };
        } else {
          results[table] = { exists: true };
        }
      } catch (e: any) {
        results[table] = { exists: false, error: e.message };
      }
    }

    // Specifically test payment_transactions columns
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('id, user_id, transaction_hash, amountusdt')
        .limit(0);

      results.payment_transactions_columns = error ? { error: error.message } : { success: true };
    } catch (e: any) {
      results.payment_transactions_columns = { error: e.message };
    }

    return NextResponse.json({
      success: true,
      tables: results,
      supabaseConfigured: !!supabaseUrl && !!supabaseKey
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 