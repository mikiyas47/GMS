/**
 * Frontend Validation Utilities
 * Enforces Ethiopian phone numbers (+251), valid emails, and proper format integrity
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  error?: string;
}

export interface GenericValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates and normalizes Ethiopian phone numbers.
 * Supports Ethio Telecom (+251 9...) and Safaricom Ethiopia (+251 7...).
 * Accepts:
 *  - +2519XXXXXXXX, +2517XXXXXXXX
 *  - 09XXXXXXXX, 07XXXXXXXX
 *  - 2519XXXXXXXX, 2517XXXXXXXX
 *  - 9XXXXXXXX, 7XXXXXXXX
 *  - Common formatting (spaces, dashes, parentheses)
 * 
 * Returns normalized E.164: +251XXXXXXXXX
 */
export function validateEthiopianPhone(input: string): PhoneValidationResult {
  if (!input || !input.trim()) {
    return {
      isValid: false,
      normalized: '',
      error: 'Phone number is required.'
    };
  }

  // Strip spaces, dashes, dots, parentheses
  const clean = input.trim().replace(/[\s\-\(\)\.]/g, '');

  let normalized = '';

  if (/^\+251[79]\d{8}$/.test(clean)) {
    normalized = clean;
  } else if (/^251[79]\d{8}$/.test(clean)) {
    normalized = `+${clean}`;
  } else if (/^0[79]\d{8}$/.test(clean)) {
    normalized = `+251${clean.slice(1)}`;
  } else if (/^[79]\d{8}$/.test(clean)) {
    normalized = `+251${clean}`;
  } else {
    return {
      isValid: false,
      normalized: '',
      error: 'Invalid Ethiopian phone number. Must start with +251 9, +251 7, 09, or 07 followed by 8 digits (e.g. +251911223344 or 0911223344).'
    };
  }

  return {
    isValid: true,
    normalized,
    error: undefined
  };
}

export interface EmailValidationResult {
  isValid: boolean;
  normalized: string;
  error?: string;
}

/**
 * Validates email format
 */
export function validateEmail(input: string, isRequired = false): EmailValidationResult {
  if (!input || !input.trim()) {
    if (isRequired) {
      return { isValid: false, normalized: '', error: 'Email address is required.' };
    }
    return { isValid: true, normalized: '', error: undefined };
  }

  const trimmed = input.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed) || trimmed.length > 254) {
    return {
      isValid: false,
      normalized: '',
      error: `Invalid email address format. Please enter a valid email (e.g. name@domain.com).`
    };
  }

  return { isValid: true, normalized: trimmed, error: undefined };
}

/**
 * Validates text name fields
 */
export function validateName(input: string, fieldName = 'Name', isRequired = true): GenericValidationResult {
  if (!input || !input.trim()) {
    if (isRequired) {
      return { isValid: false, error: `${fieldName} is required.` };
    }
    return { isValid: true, error: undefined };
  }

  const trimmed = input.trim();
  if (trimmed.length < 2) {
    return {
      isValid: false,
      error: `${fieldName} must be at least 2 characters.`
    };
  }

  return { isValid: true, error: undefined };
}

/**
 * Validates staff password length
 */
export function validatePassword(password: string, minLength = 6): GenericValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required.' };
  }

  if (password.length < minLength) {
    return {
      isValid: false,
      error: `Password must be at least ${minLength} characters.`
    };
  }

  return { isValid: true, error: undefined };
}

/**
 * Formats Ethiopian phone number with clean spacing for UI display
 * e.g. +251911223344 -> +251 91 122 3344
 */
export function formatEthiopianPhone(phone: string): string {
  if (!phone) return '';
  const clean = phone.replace(/[\s\-\(\)\.]/g, '');
  if (/^\+251[79]\d{8}$/.test(clean)) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 6)} ${clean.slice(6, 9)} ${clean.slice(9)}`;
  }
  return phone;
}
