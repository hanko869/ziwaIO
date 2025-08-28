import bcrypt from 'bcryptjs';
import { supabase, DbUser, DbActivity, DbContact } from '@/lib/supabase';

// Re-export types for backward compatibility
export type User = DbUser;
export type UserActivity = DbActivity;

// User Management Functions
export const getAllUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const getUserById = async (id: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) return null;
  return data;
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();
  
  if (error) return null;
  return data;
};

export const createUser = async (username: string, password: string, role: 'admin' | 'user' = 'user'): Promise<User> => {
  // Check if username already exists
  const existing = await getUserByUsername(username);
  if (existing) {
    throw new Error('Username already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const { data, error } = await supabase
    .from('users')
    .insert({
      username: username.toLowerCase(),
      email: `${username.toLowerCase()}@example.com`, // Generate a default email
      password_hash: hashedPassword,
      role,
      is_active: true
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateUserLastLogin = async (userId: string): Promise<void> => {
  try {
    console.log('DEBUG: Updating last login for user:', userId);
    const { error } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) {
      console.error('ERROR updating last login:', error);
      throw error;
    }
    console.log('DEBUG: Last login updated successfully');
  } catch (error) {
    console.error('ERROR in updateUserLastLogin:', error);
    throw error;
  }
};

export const toggleUserStatus = async (userId: string): Promise<void> => {
  const user = await getUserById(userId);
  if (!user) return;
  
  const { error } = await supabase
    .from('users')
    .update({ is_active: !user.is_active })
    .eq('id', userId);
  
  if (error) throw error;
};

export const deleteUser = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);
  
  if (error) throw error;
};

// Activity Tracking Functions
export const getAllActivities = async (): Promise<UserActivity[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1000);
  
  if (error) throw error;
  return data || [];
};

export const getUserActivities = async (userId: string): Promise<UserActivity[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const getRecentActivities = async (limit: number = 50): Promise<UserActivity[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
};

export const logActivity = async (activity: Omit<UserActivity, 'id' | 'timestamp'>): Promise<void> => {
  try {
    console.log('DEBUG: Logging activity:', activity.action);
    const { error } = await supabase
      .from('activities')
      .insert({
        user_id: activity.user_id,
        username: activity.username,
        action: activity.action,
        details: activity.details,
        linkedin_url: activity.linkedin_url,
        contact_name: activity.contact_name,
        success: activity.success
      });
    
    if (error) {
      console.error('ERROR logging activity:', error);
      throw error;
    }
    console.log('DEBUG: Activity logged successfully');
  } catch (error) {
    console.error('ERROR in logActivity:', error);
    throw error;
  }
};

// Statistics Functions
export const getUserStatistics = async (userId: string) => {
  const [user, activities] = await Promise.all([
    getUserById(userId),
    getUserActivities(userId)
  ]);
  
  const loginCount = activities.filter(a => a.action === 'login').length;
  const extractionCount = activities.filter(a => a.action === 'extract_contact').length;
  const successfulExtractions = activities.filter(a => a.action === 'extract_contact' && a.success).length;
  
  return {
    user,
    loginCount,
    extractionCount,
    successfulExtractions,
    successRate: extractionCount > 0 ? (successfulExtractions / extractionCount * 100).toFixed(1) : '0',
    lastActivity: activities[0]?.timestamp || null
  };
};

export const getOverallStatistics = async () => {
  const [users, activities] = await Promise.all([
    getAllUsers(),
    getAllActivities()
  ]);
  
  // Get extraction count from extracted_contacts table
  const { count: totalExtractions, error: extractionError } = await supabase
    .from('extracted_contacts')
    .select('*', { count: 'exact', head: true });
    
  if (extractionError) {
    console.error('Error fetching extraction count:', extractionError);
  }
  
  // Get today's extractions
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const { count: todayExtractions, error: todayError } = await supabase
    .from('extracted_contacts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString());
    
  if (todayError) {
    console.error('Error fetching today extraction count:', todayError);
  }
  
  // Calculate revenue from credit_transactions
  const { data: transactions, error: transactionError } = await supabase
    .from('credit_transactions')
    .select('amount')
    .eq('transaction_type', 'payment_success');
    
  let totalRevenue = 0;
  if (!transactionError && transactions) {
    totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  }
  
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  
  const todayActivities = activities.filter(a => {
    const activityDate = new Date(a.timestamp).toDateString();
    return activityDate === today.toDateString();
  });
  
  const recentActivities = await getRecentActivities(10);
  
  return {
    totalUsers,
    activeUsers,
    totalExtractions: totalExtractions || 0,
    successfulExtractions: totalExtractions || 0, // All saved extractions are successful
    successRate: '100', // All saved extractions are successful
    todayActivityCount: todayExtractions || 0,
    totalRevenue,
    recentActivities
  };
};

// Contact Management Functions (new for Supabase)
export const saveExtractedContact = async (
  userId: string,
  contact: {
    name: string;
    title?: string;
    company?: string;
    emails: string[];
    phones: string[];
    linkedin_url: string;
  }
): Promise<void> => {
  const { error } = await supabase
    .from('contacts')
    .insert({
      user_id: userId,
      ...contact
    });
  
  if (error) throw error;
};

export const getUserContacts = async (userId: string): Promise<DbContact[]> => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('extracted_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}; 