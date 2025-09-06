import { Contact } from '@/types/contact';

// Use user-specific storage key to prevent contacts from being shared across accounts
const getStorageKey = (userId?: string): string => {
  return userId ? `linkedin_contacts_${userId}` : 'linkedin_contacts_temp';
};

export const saveContact = (contact: Contact, userId?: string): void => {
  try {
    // Don't save to localStorage anymore - contacts should be in database only
    // This prevents contacts from being shared across users
    console.log('Contact saved (database only):', contact);
  } catch (error) {
    console.error('Error saving contact:', error);
  }
};

export const getStoredContacts = (userId?: string): Contact[] => {
  try {
    // Clear any old shared contacts from localStorage
    const oldSharedKey = 'linkedin_contacts';
    if (localStorage.getItem(oldSharedKey)) {
      localStorage.removeItem(oldSharedKey);
      console.log('Cleared old shared contacts from localStorage');
    }
    
    // Return empty array - contacts should come from database
    return [];
  } catch (error) {
    console.error('Error retrieving contacts:', error);
    return [];
  }
};

export const clearStoredContacts = (userId?: string): void => {
  try {
    // Clear all old localStorage keys
    const oldSharedKey = 'linkedin_contacts';
    localStorage.removeItem(oldSharedKey);
    
    // Clear user-specific key if it exists
    if (userId) {
      localStorage.removeItem(getStorageKey(userId));
    }
  } catch (error) {
    console.error('Error clearing contacts:', error);
  }
};

export const getContactCount = (userId?: string): number => {
  return 0; // Contacts should be counted from database
}; 