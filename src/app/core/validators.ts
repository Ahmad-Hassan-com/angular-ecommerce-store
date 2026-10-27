import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const digitsOf = (value: unknown) => String(value ?? '').replace(/\D/g, '');

export function luhnCheck(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return digits.length > 0 && sum % 10 === 0;
}

export const cardNumberValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const raw = String(control.value ?? '');
  if (!raw) return null;
  if (/[^\d\s]/.test(raw)) return { cardFormat: true };
  const digits = digitsOf(raw);
  if (digits.length < 13 || digits.length > 19) return { cardLength: true };
  return luhnCheck(digits) ? null : { luhn: true };
};

/** Validates an MM/YY expiry; a card is valid through the last day of its expiry month. */
export const expiryValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const raw = String(control.value ?? '');
  if (!raw) return null;
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(raw);
  if (!match) return { expiryFormat: true };
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const now = new Date();
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (new Date(year, month - 1, 1) < firstOfThisMonth) return { expired: true };
  if (year > now.getFullYear() + 20) return { expiryFormat: true };
  return null;
};

export function detectCardBrand(value: string): string {
  const digits = digitsOf(value);
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  if (/^6(011|5)/.test(digits)) return 'Discover';
  return 'Card';
}

/** "4242424242424242" -> "4242 4242 4242 4242" */
export function formatCardNumber(value: string): string {
  return digitsOf(value)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** "1228" -> "12/28" */
export function formatExpiry(value: string): string {
  const digits = digitsOf(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function lastFour(value: string): string {
  return digitsOf(value).slice(-4);
}
