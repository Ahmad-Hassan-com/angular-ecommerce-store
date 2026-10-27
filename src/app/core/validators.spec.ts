import { FormControl } from '@angular/forms';
import {
  cardNumberValidator,
  detectCardBrand,
  expiryValidator,
  formatCardNumber,
  formatExpiry,
  luhnCheck,
} from './validators';

describe('card validators', () => {
  it('accepts valid card numbers with or without spaces', () => {
    expect(cardNumberValidator(new FormControl('4242 4242 4242 4242'))).toBeNull();
    expect(cardNumberValidator(new FormControl('378282246310005'))).toBeNull();
  });

  it('rejects numbers that fail the Luhn check', () => {
    expect(luhnCheck('4242424242424241')).toBe(false);
    expect(cardNumberValidator(new FormControl('4242 4242 4242 4241'))).toEqual({ luhn: true });
  });

  it('reports length and format problems separately', () => {
    expect(cardNumberValidator(new FormControl('4242'))).toEqual({ cardLength: true });
    expect(cardNumberValidator(new FormControl('4242-4242'))).toEqual({ cardFormat: true });
  });

  it('detects common brands', () => {
    expect(detectCardBrand('4242')).toBe('Visa');
    expect(detectCardBrand('5555 5555')).toBe('Mastercard');
    expect(detectCardBrand('3782')).toBe('American Express');
  });

  it('formats input as the user types', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
    expect(formatExpiry('1228')).toBe('12/28');
    expect(formatExpiry('1')).toBe('1');
  });
});

describe('expiryValidator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 27));
  });
  afterEach(() => vi.useRealTimers());

  it('accepts the current month and later', () => {
    expect(expiryValidator(new FormControl('10/26'))).toBeNull();
    expect(expiryValidator(new FormControl('01/30'))).toBeNull();
  });

  it('rejects past months', () => {
    expect(expiryValidator(new FormControl('09/26'))).toEqual({ expired: true });
  });

  it('rejects malformed values', () => {
    expect(expiryValidator(new FormControl('13/27'))).toEqual({ expiryFormat: true });
    expect(expiryValidator(new FormControl('1227'))).toEqual({ expiryFormat: true });
  });
});
