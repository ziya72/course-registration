// Debug utility to track cross-tab behavior (development only)
export const debugCrossTabs = () => {
  // Only enable in development mode
  if (import.meta.env.MODE !== 'development') {
    return;
  }
  
  console.log('🔍 Cross-tab debug utility loaded (development mode)');
  
  // Track localStorage changes (less verbose)
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key: string, value: string) {
    // Only log auth-related changes
    if (key === 'authToken' || key === 'userData') {
      console.log('📝 localStorage.setItem:', key, value ? '[DATA SET]' : '[DATA CLEARED]');
    }
    originalSetItem.call(this, key, value);
  };
  
  const originalGetItem = localStorage.getItem;
  localStorage.getItem = function(key: string) {
    const value = originalGetItem.call(this, key);
    // Only log auth-related access occasionally
    if ((key === 'authToken' || key === 'userData') && Math.random() < 0.1) {
      console.log('📖 localStorage.getItem:', key, value ? '[DATA EXISTS]' : '[NO DATA]');
    }
    return value;
  };
  
  // Track storage events (cross-tab communication)
  window.addEventListener('storage', (e) => {
    console.log('🔄 Storage event detected:', {
      key: e.key,
      oldValue: e.oldValue ? '[HIDDEN]' : null,
      newValue: e.newValue ? '[HIDDEN]' : null,
      url: e.url
    });
  });
  
  // Remove noisy window focus/blur events
  // window.addEventListener('focus', () => {
  //   console.log('👁️ Window focused');
  // });
  
  // window.addEventListener('blur', () => {
  //   console.log('😴 Window blurred');
  // });
  
  // Track visibility changes
  document.addEventListener('visibilitychange', () => {
    console.log('👀 Visibility changed:', document.hidden ? 'hidden' : 'visible');
  });
  
  console.log('✅ Cross-tab debugging enabled (development only).');
};