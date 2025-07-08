import { supabase } from '../lib/supabase';

export async function testDatabaseConnection() {
  try {
    console.log('🔄 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('📊 Database response:', data);
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  }
}

export async function testDatabaseSchema() {
  try {
    console.log('🔄 Testing database schema...');
    
    // Test if all tables exist by trying to query them
    const tables = ['users', 'user_settings', 'trade_ideas', 'trades'];
    const results = [];
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.error(`❌ Table '${table}' error:`, error.message);
        results.push({ table, status: 'error', error: error.message });
      } else {
        console.log(`✅ Table '${table}' exists and accessible`);
        results.push({ table, status: 'ok' });
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ Schema test error:', error);
    return [];
  }
}

// Call this function from browser console to test
if (typeof window !== 'undefined') {
  (window as any).testDB = {
    connection: testDatabaseConnection,
    schema: testDatabaseSchema,
  };
} 