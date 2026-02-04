// Form validation utilities

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

export const validateMinLength = (value, minLength) => {
  return value && value.length >= minLength;
};

export const validateMaxLength = (value, maxLength) => {
  return !value || value.length <= maxLength;
};

export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validatePhone = (phone) => {
  // Basic phone validation - allows various formats
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  return phoneRegex.test(cleanPhone);
};

export const validateBadgeCode = (code) => {
  // Badge codes should be alphanumeric, 3-10 characters
  const badgeRegex = /^[A-Za-z0-9]{3,10}$/;
  return badgeRegex.test(code);
};

// Comprehensive form validation
export const validateForm = (data, rules) => {
  const errors = {};

  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = rules[field];

    if (fieldRules.required && !validateRequired(value)) {
      errors[field] = `${fieldRules.label || field} is required`;
      return;
    }

    if (value && fieldRules.minLength && !validateMinLength(value, fieldRules.minLength)) {
      errors[field] = `${fieldRules.label || field} must be at least ${fieldRules.minLength} characters`;
      return;
    }

    if (value && fieldRules.maxLength && !validateMaxLength(value, fieldRules.maxLength)) {
      errors[field] = `${fieldRules.label || field} must be no more than ${fieldRules.maxLength} characters`;
      return;
    }

    if (value && fieldRules.email && !validateEmail(value)) {
      errors[field] = 'Please enter a valid email address';
      return;
    }

    if (value && fieldRules.url && !validateUrl(value)) {
      errors[field] = 'Please enter a valid URL';
      return;
    }

    if (value && fieldRules.phone && !validatePhone(value)) {
      errors[field] = 'Please enter a valid phone number';
      return;
    }

    if (value && fieldRules.badgeCode && !validateBadgeCode(value)) {
      errors[field] = 'Badge code must be 3-10 alphanumeric characters';
      return;
    }

    if (fieldRules.custom) {
      const customError = fieldRules.custom(value, data);
      if (customError) {
        errors[field] = customError;
        return;
      }
    }
  });

  return errors;
};

// Validation rules for different forms
export const validationRules = {
  login: {
    email: { required: true, email: true, label: 'Email address' },
    password: { required: true, minLength: 6, label: 'Password' }
  },

  manualMapping: {
    badgeCode: { required: true, badgeCode: true, label: 'Badge Code' },
    visitorEmail: { required: true, email: true, label: 'Visitor Email' }
  },

  companyProfile: {
    companyName: { required: true, minLength: 2, maxLength: 100, label: 'Company Name' },
    description: { maxLength: 500, label: 'Description' },
    website: { url: true, label: 'Website' },
    phone: { phone: true, label: 'Phone Number' },
    address: { maxLength: 255, label: 'Address' }
  },

  consentText: {
    consentText: { required: true, minLength: 10, maxLength: 2000, label: 'Consent Text' }
  }
};