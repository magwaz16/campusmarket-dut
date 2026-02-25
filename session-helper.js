// ================= SESSION HELPER FOR CAMPUSMARKET DUT =================
// This file handles seller sessions using Supabase + device fingerprinting

// ================= DEVICE ID GENERATION =================
async function getDeviceId() {
  // Check if already stored in localStorage
  let deviceId = localStorage.getItem('device_id');
  
  if (!deviceId) {
    // Generate unique device fingerprint
    const nav = navigator;
    const screen = window.screen;
    
    const components = [
      nav.userAgent,
      nav.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
      Date.now()  // Add timestamp for uniqueness
    ];
    
    // Create fingerprint
    const fingerprint = components.join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    deviceId = 'dev_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
    
    // Store for future use
    localStorage.setItem('device_id', deviceId);
  }
  
  return deviceId;
}

// ================= SESSION MANAGEMENT =================

// Save seller session to Supabase
async function saveSellerSession(phone, name) {
  try {
    const deviceId = await getDeviceId();
    
    console.log('💾 Saving session:', { deviceId, phone, name });
    
    const { data, error } = await supabaseClient
      .from('seller_sessions')
      .upsert({
        device_id: deviceId,
        seller_phone: phone,
        seller_name: name,
        last_active: new Date().toISOString()
      }, {
        onConflict: 'device_id'  // Update if device_id already exists
      })
      .select()
      .single();
    
    if (error) {
      console.warn('⚠️ Session save failed (table may not exist yet):', error);
      // Fallback to localStorage only
      localStorage.setItem('seller_phone', phone);
      localStorage.setItem('seller_name', name);
      return { success: true, fallback: true };
    }
    
    console.log('✅ Session saved to Supabase:', data);
    
    // Also cache in localStorage for instant access
    localStorage.setItem('seller_phone', phone);
    localStorage.setItem('seller_name', name);
    
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ Error saving session:', error);
    
    // Fallback to localStorage
    localStorage.setItem('seller_phone', phone);
    localStorage.setItem('seller_name', name);
    
    return { success: true, fallback: true };
  }
}

// Load seller session from Supabase
async function loadSellerSession() {
  try {
    // First check localStorage for instant load
    const cachedPhone = localStorage.getItem('seller_phone');
    const cachedName = localStorage.getItem('seller_name');
    
    const deviceId = await getDeviceId();
    
    console.log('🔍 Loading session for device:', deviceId);
    
    // Try to load from Supabase
    const { data, error } = await supabaseClient
      .from('seller_sessions')
      .select('*')
      .eq('device_id', deviceId)
      .maybeSingle();  // Returns null if not found instead of error
    
    if (error) {
      console.warn('⚠️ Session load failed (table may not exist yet):', error);
      // Return cached data if available
      if (cachedPhone) {
        return {
          seller_phone: cachedPhone,
          seller_name: cachedName,
          device_id: deviceId,
          fallback: true
        };
      }
      return null;
    }
    
    if (data) {
      console.log('✅ Session loaded from Supabase:', data);
      
      // Update localStorage cache
      localStorage.setItem('seller_phone', data.seller_phone);
      if (data.seller_name) {
        localStorage.setItem('seller_name', data.seller_name);
      }
      
      // Update last_active
      await supabaseClient
        .from('seller_sessions')
        .update({ last_active: new Date().toISOString() })
        .eq('device_id', deviceId);
      
      return data;
    }
    
    // No session found in Supabase, check localStorage
    if (cachedPhone) {
      console.log('📦 Using cached session from localStorage');
      return {
        seller_phone: cachedPhone,
        seller_name: cachedName,
        device_id: deviceId,
        fallback: true
      };
    }
    
    console.log('ℹ️ No session found - new user');
    return null;
    
  } catch (error) {
    console.error('❌ Error loading session:', error);
    
    // Fallback to localStorage
    const cachedPhone = localStorage.getItem('seller_phone');
    const cachedName = localStorage.getItem('seller_name');
    
    if (cachedPhone) {
      return {
        seller_phone: cachedPhone,
        seller_name: cachedName,
        fallback: true
      };
    }
    
    return null;
  }
}

// Clear seller session (logout)
async function clearSellerSession() {
  try {
    const deviceId = await getDeviceId();
    
    // Remove from Supabase
    await supabaseClient
      .from('seller_sessions')
      .delete()
      .eq('device_id', deviceId);
    
    // Clear localStorage
    localStorage.removeItem('seller_phone');
    localStorage.removeItem('seller_name');
    
    console.log('✅ Session cleared');
    return true;
    
  } catch (error) {
    console.error('❌ Error clearing session:', error);
    
    // Still clear localStorage
    localStorage.removeItem('seller_phone');
    localStorage.removeItem('seller_name');
    
    return true;
  }
}

// Check if user is a seller (has created listings before)
async function isSellerUser() {
  const session = await loadSellerSession();
  return session !== null;
}

// Get seller info
async function getSellerInfo() {
  const session = await loadSellerSession();
  
  if (session) {
    return {
      phone: session.seller_phone,
      name: session.seller_name || 'DUT Student',
      deviceId: session.device_id
    };
  }
  
  return null;
}

console.log('✅ Session helper loaded');
