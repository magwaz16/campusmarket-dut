// ===============================================
// SECURITY UTILITIES
// Include this in every page: <script src="security-utils.js"></script>
// ===============================================

// ===== XSS SANITIZATION =====
function sanitizeHTML(str) {
  if (!str) return '';
  const temp = document.createElement('div');
  temp.textContent = str; // This escapes HTML automatically
  return temp.innerHTML;
}

function sanitizeInput(value) {
  if (!value) return '';
  return String(value)
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .substring(0, 10000); // Hard limit on length
}

// ===== INPUT VALIDATION =====
const VALIDATION_RULES = {
  title: {
    minLength: 5,
    maxLength: 60,
    pattern: /^[a-zA-Z0-9\s\-_.,!?()]+$/,
    errorMessage: 'Title must be 5-60 characters (letters, numbers, basic punctuation only)'
  },
  description: {
    minLength: 10,
    maxLength: 2000,
    errorMessage: 'Description must be 10-2000 characters'
  },
  price: {
    min: 10,
    max: 1000000,
    errorMessage: 'Price must be between R10 and R1,000,000'
  },
  sellerName: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s\-'.]+$/,
    errorMessage: 'Name must be 2-50 characters (letters only)'
  },
  sellerPhone: {
    pattern: /^0[0-9]{9}$/,
    errorMessage: 'Phone must be 10 digits starting with 0'
  }
};

function validateField(fieldName, value) {
  const rules = VALIDATION_RULES[fieldName];
  if (!rules) return { valid: true };

  const cleanValue = sanitizeInput(value);

  // Check min length
  if (rules.minLength && cleanValue.length < rules.minLength) {
    return { valid: false, error: rules.errorMessage };
  }

  // Check max length
  if (rules.maxLength && cleanValue.length > rules.maxLength) {
    return { valid: false, error: rules.errorMessage };
  }

  // Check pattern
  if (rules.pattern && !rules.pattern.test(cleanValue)) {
    return { valid: false, error: rules.errorMessage };
  }

  // Check numeric range
  if (fieldName === 'price') {
    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue) || numValue < rules.min || numValue > rules.max) {
      return { valid: false, error: rules.errorMessage };
    }
  }

  return { valid: true, value: cleanValue };
}

// ===== SPAM DETECTION =====
const SPAM_KEYWORDS = [
  'viagra', 'cialis', 'porn', 'xxx', 'casino', 'lottery', 'bitcoin scam',
  'get rich quick', 'work from home', 'guaranteed income', 'click here',
  'limited time offer', 'act now', 'buy now', 'free money'
];

function containsSpam(text) {
  const lowerText = text.toLowerCase();
  return SPAM_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

// ===== PROFANITY FILTER =====
const PROFANITY_LIST = [
  'fuck', 'shit', 'bitch', 'asshole', 'damn', 'crap', 'piss',
  // Add more as needed, but keep it reasonable
];

function containsProfanity(text) {
  const lowerText = text.toLowerCase();
  return PROFANITY_LIST.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });
}

// ===== RATE LIMITING (CLIENT-SIDE) =====
const RATE_LIMIT_KEY = 'last_listing_submit';
const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

function checkRateLimit() {
  const lastSubmit = localStorage.getItem(RATE_LIMIT_KEY);
  if (!lastSubmit) return { allowed: true };

  const timeSince = Date.now() - parseInt(lastSubmit);
  const timeRemaining = RATE_LIMIT_MS - timeSince;

  if (timeRemaining > 0) {
    const minutesLeft = Math.ceil(timeRemaining / 60000);
    return {
      allowed: false,
      minutesRemaining: minutesLeft,
      error: `Please wait ${minutesLeft} more minute(s) before submitting another listing.`
    };
  }

  return { allowed: true };
}

function recordSubmission() {
  localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
}

// ===== COMPREHENSIVE VALIDATION =====
function validateListingData(data) {
  const errors = [];

  // Validate each field
  const titleCheck = validateField('title', data.title);
  if (!titleCheck.valid) errors.push(titleCheck.error);

  const descCheck = validateField('description', data.description);
  if (!descCheck.valid) errors.push(descCheck.error);

  const priceCheck = validateField('price', data.price);
  if (!priceCheck.valid) errors.push(priceCheck.error);

  const nameCheck = validateField('sellerName', data.seller_name);
  if (!nameCheck.valid) errors.push(nameCheck.error);

  const phoneCheck = validateField('sellerPhone', data.seller_phone);
  if (!phoneCheck.valid) errors.push(phoneCheck.error);

  // Check for spam
  const textToCheck = `${data.title} ${data.description}`;
  if (containsSpam(textToCheck)) {
    errors.push('Your listing contains prohibited content. Please revise and try again.');
  }

  // Check for profanity (warning, not blocking)
  if (containsProfanity(textToCheck)) {
    console.warn('⚠️ Profanity detected in listing');
    // Don't block, but flag for admin review
  }

  // Check rate limit
  const rateLimit = checkRateLimit();
  if (!rateLimit.allowed) {
    errors.push(rateLimit.error);
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    sanitizedData: {
      ...data,
      title: sanitizeInput(data.title),
      description: sanitizeInput(data.description),
      seller_name: sanitizeInput(data.seller_name),
      seller_phone: sanitizeInput(data.seller_phone)
    }
  };
}

// ===== EXPORT FOR USE IN OTHER FILES =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sanitizeHTML,
    sanitizeInput,
    validateField,
    validateListingData,
    checkRateLimit,
    recordSubmission
  };
}

console.log('🔒 Security utilities loaded');
