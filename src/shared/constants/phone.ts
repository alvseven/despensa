// International phone number regex (allows for country codes, spaces, dashes, parentheses)
export const phoneNumberRegex =
  /^\+?[0-9]{1,4}?[-.\s]?\(?[0-9]{1,3}?\)?[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}$/;

// E.164 format regex (most standardized international format: +CountryCodeNumber)
export const e164PhoneNumberRegex = /^\+[1-9]\d{1,14}$/;

// Basic phone number validation (minimum 7 digits, maximum 15 digits)
export const basicPhoneNumberRegex = /^[0-9]{7,15}$/;

// Phone number with optional country code
export const phoneWithOptionalCountryCodeRegex =
  /^(\+\d{1,3})?[-.\s]?\(?[0-9]{1,4}\)?[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}$/;
