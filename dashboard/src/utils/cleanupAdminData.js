/**
 * Admin Data Cleanup Utility
 * Removes all admin-related data and references from the system
 */

export function cleanupAdminData() {
  console.log('🧹 Starting admin data cleanup...');
  
  try {
    // Clear localStorage data
    const keysToRemove = [
      'userData',
      'authMethod',
      'adminSetupResult',
      'setupResult'
    ];
    
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`✅ Removed localStorage key: ${key}`);
      }
    });
    
    // Clear sessionStorage data
    keysToRemove.forEach(key => {
      if (sessionStorage.getItem(key)) {
        sessionStorage.removeItem(key);
        console.log(`✅ Removed sessionStorage key: ${key}`);
      }
    });
    
    // Clear any admin-related cookies
    const cookiesToClear = [
      'admin_session',
      'admin_token',
      'firebase_auth_token'
    ];
    
    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    
    // Clear IndexedDB data related to Firebase
    if ('indexedDB' in window) {
      try {
        // Clear Firebase IndexedDB stores
        const firebaseDBNames = [
          'firebaseLocalStorageDb',
          'firebase-heartbeat-database',
          'firebase-installations-database'
        ];
        
        firebaseDBNames.forEach(dbName => {
          const deleteReq = indexedDB.deleteDatabase(dbName);
          deleteReq.onsuccess = () => {
            console.log(`✅ Cleared IndexedDB: ${dbName}`);
          };
          deleteReq.onerror = () => {
            console.log(`⚠️ Could not clear IndexedDB: ${dbName}`);
          };
        });
      } catch (error) {
        console.warn('⚠️ Error clearing IndexedDB:', error);
      }
    }
    
    // Force reload to clear any in-memory state
    console.log('🔄 Reloading page to clear in-memory state...');
    
    return {
      success: true,
      message: 'Admin data cleanup completed successfully',
      clearedItems: [
        'localStorage userData',
        'localStorage authMethod', 
        'sessionStorage data',
        'admin cookies',
        'Firebase IndexedDB stores'
      ]
    };
    
  } catch (error) {
    console.error('❌ Error during admin data cleanup:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  window.cleanupAdminData = cleanupAdminData;
}

export default cleanupAdminData;