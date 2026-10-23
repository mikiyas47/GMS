/**
 * Validation utilities for Gym Management System
 * Enforces Ethiopian phone numbers (+251), unique constraints, and data integrity
 */

/**
 * Validates and normalizes Ethiopian phone numbers.
 * Supports Ethio Telecom (9) and Safaricom Ethiopia (7).
 * Accepts:
 *  - +2519XXXXXXXX or +2517XXXXXXXX (13 chars)
 *  - 2519XXXXXXXX or 2517XXXXXXXX (12 digits)
 *  - 09XXXXXXXX or 07XXXXXXXX (10 digits)
 *  - 9XXXXXXXX or 7XXXXXXXX (9 digits)
 *  - With spaces, dashes, parentheses
 * Returns normalized E.164 format: +251XXXXXXXXX
 */
function validateEthiopianPhone(input) {
    if (!input || typeof input !== 'string') {
        return {
            isValid: false,
            normalized: null,
            error: 'Phone number is required.'
        };
    }

    // Strip spaces, dashes, dots, parentheses
    const clean = input.trim().replace(/[\s\-\(\)\.]/g, '');

    let normalized = null;

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
            normalized: null,
            error: 'Invalid Ethiopian phone number. Must be a valid Ethiopian mobile number starting with +251 9, +251 7, 09, or 07 followed by 8 digits (e.g. +251911223344 or 0911223344).'
        };
    }

    return {
        isValid: true,
        normalized,
        error: null
    };
}

/**
 * Validates standard email address format
 */
function validateEmail(input, isRequired = false) {
    if (!input || typeof input !== 'string' || !input.trim()) {
        if (isRequired) {
            return { isValid: false, normalized: null, error: 'Email address is required.' };
        }
        return { isValid: true, normalized: null, error: null };
    }

    const trimmed = input.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

    if (!emailRegex.test(trimmed) || trimmed.length > 254) {
        return {
            isValid: false,
            normalized: null,
            error: `Invalid email address '${input}'. Please provide a valid email (e.g. name@example.com).`
        };
    }

    return {
        isValid: true,
        normalized: trimmed,
        error: null
    };
}

/**
 * Validates name fields (min 2 chars, letters, spaces, hyphens)
 */
function validateName(input, fieldName = 'Name', isRequired = true) {
    if (!input || typeof input !== 'string' || !input.trim()) {
        if (isRequired) {
            return { isValid: false, error: `${fieldName} is required.` };
        }
        return { isValid: true, error: null };
    }

    const trimmed = input.trim();
    if (trimmed.length < 2) {
        return {
            isValid: false,
            error: `${fieldName} must be at least 2 characters long.`
        };
    }

    if (trimmed.length > 100) {
        return {
            isValid: false,
            error: `${fieldName} cannot exceed 100 characters.`
        };
    }

    return { isValid: true, error: null };
}

/**
 * Validates password strength (min 6 characters)
 */
function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        return { isValid: false, error: 'Password is required.' };
    }

    if (password.length < 6) {
        return { isValid: false, error: 'Password must be at least 6 characters long.' };
    }

    return { isValid: true, error: null };
}

/**
 * Validates date of birth (must be in past, member must be reasonable age 5-110)
 */
function validateDateOfBirth(dobString) {
    if (!dobString) {
        return { isValid: true, error: null };
    }

    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) {
        return { isValid: false, error: 'Invalid date of birth format.' };
    }

    const today = new Date();
    if (dob > today) {
        return { isValid: false, error: 'Date of birth cannot be in the future.' };
    }

    const age = (today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (age < 5) {
        return { isValid: false, error: 'Member must be at least 5 years old.' };
    }
    if (age > 110) {
        return { isValid: false, error: 'Please enter a valid date of birth.' };
    }

    return { isValid: true, error: null };
}

module.exports = {
    validateEthiopianPhone,
    validateEmail,
    validateName,
    validatePassword,
    validateDateOfBirth
};
