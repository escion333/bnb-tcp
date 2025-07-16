import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getUserConfig } from './userConfig';

// Create dynamic Supabase client
export function createSupabaseClient(): SupabaseClient | null {
  const config = getUserConfig()
  
  if (!config.supabase.url || !config.supabase.anonKey) {
    console.warn('⚠️ Supabase configuration missing - database features disabled')
    return null
  }

  try {
    return createClient(config.supabase.url, config.supabase.anonKey)
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error)
    return null
  }
}

// Safe Supabase operations with null handling
export function getSupabaseClient(): SupabaseClient | null {
  return createSupabaseClient()
}

// Helper function to check if Supabase is available
export function isSupabaseAvailable(): boolean {
  const client = createSupabaseClient()
  return client !== null
}

// Helper to execute Supabase operations safely
async function executeSupabaseOperation<T>(
  operation: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Supabase not configured - please set up your database connection in Settings')
  }
  return await operation(client)
}

// Legacy export - maintaining for backward compatibility but may be null
// TODO: Replace all usages with executeSupabaseOperation for proper null handling
export const supabase = createSupabaseClient() as SupabaseClient;

// Database types (auto-generated later, manual for now)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          wallet_address: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          wallet_address: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          idle_fund_strategy: 'bnb' | 'usdt' | 'disabled';
          slippage_tolerance: number;
          max_position_size: number;
          notifications_enabled: boolean;
          auto_execute_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          idle_fund_strategy?: 'bnb' | 'usdt' | 'disabled';
          slippage_tolerance?: number;
          max_position_size?: number;
          notifications_enabled?: boolean;
          auto_execute_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          idle_fund_strategy?: 'bnb' | 'usdt' | 'disabled';
          slippage_tolerance?: number;
          max_position_size?: number;
          notifications_enabled?: boolean;
          auto_execute_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      trade_ideas: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          entry_price: number;
          take_profit_price: number;
          stop_loss_price: number;
          reasoning: string;
          confidence: number;
          status: 'pending' | 'monitoring' | 'active' | 'closed' | 'ignored';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol?: string;
          entry_price: number;
          take_profit_price: number;
          stop_loss_price: number;
          reasoning: string;
          confidence: number;
          status?: 'pending' | 'monitoring' | 'active' | 'closed' | 'ignored';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          entry_price?: number;
          take_profit_price?: number;
          stop_loss_price?: number;
          reasoning?: string;
          confidence?: number;
          status?: 'pending' | 'monitoring' | 'active' | 'closed' | 'ignored';
          created_at?: string;
          updated_at?: string;
        };
      };
      trades: {
        Row: {
          id: string;
          user_id: string;
          trade_idea_id: string | null;
          type: 'buy' | 'sell';
          token_pair: string;
          entry_price: number;
          amount: number;
          take_profit_price: number | null;
          stop_loss_price: number | null;
          current_price: number | null;
          pnl: number | null;
          status: 'open' | 'closed' | 'pending';
          transaction_hash: string | null;
          opened_at: string;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          trade_idea_id?: string | null;
          type: 'buy' | 'sell';
          token_pair?: string;
          entry_price: number;
          amount: number;
          take_profit_price?: number | null;
          stop_loss_price?: number | null;
          current_price?: number | null;
          pnl?: number | null;
          status?: 'open' | 'closed' | 'pending';
          transaction_hash?: string | null;
          opened_at?: string;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          trade_idea_id?: string | null;
          type?: 'buy' | 'sell';
          token_pair?: string;
          entry_price?: number;
          amount?: number;
          take_profit_price?: number | null;
          stop_loss_price?: number | null;
          current_price?: number | null;
          pnl?: number | null;
          status?: 'open' | 'closed' | 'pending';
          transaction_hash?: string | null;
          opened_at?: string;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Helper functions with null safety
export const db = {
  // User operations
  async createUser(userId: string, walletAddress: string) {
    const client = getSupabaseClient()
    if (!client) {
      throw new Error('Supabase not configured - please set up your database connection')
    }
    
    return await client
      .from('users')
      .insert({
        id: userId,
        wallet_address: walletAddress,
      })
      .select()
      .single();
  },

  async getUser(userId: string) {
    return await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
  },

  // User settings operations
  async getUserSettings(userId: string) {
    return await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
  },

  async updateUserSettings(userId: string, settings: Partial<Database['public']['Tables']['user_settings']['Update']>) {
    return await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        ...settings,
      })
      .select()
      .single();
  },

  // Trade ideas operations
  async createTradeIdea(tradeIdea: Database['public']['Tables']['trade_ideas']['Insert']) {
    return await supabase
      .from('trade_ideas')
      .insert(tradeIdea)
      .select()
      .single();
  },

  async getTradeIdeas(userId: string) {
    return await supabase
      .from('trade_ideas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  },

  async updateTradeIdea(id: string, updates: Database['public']['Tables']['trade_ideas']['Update']) {
    return await supabase
      .from('trade_ideas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  // Trades operations
  async createTrade(trade: Database['public']['Tables']['trades']['Insert']) {
    return await supabase
      .from('trades')
      .insert(trade)
      .select()
      .single();
  },

  async getTrades(userId: string) {
    return await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  },

  async updateTrade(id: string, updates: Database['public']['Tables']['trades']['Update']) {
    return await supabase
      .from('trades')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },
}; 