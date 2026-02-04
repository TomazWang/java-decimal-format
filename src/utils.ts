/**
 * Utility functions for precise decimal arithmetic
 */

/**
 * Parse a number into integer and decimal parts as strings
 */
export function parseNumber(value: number, decimalPlaces: number): { intPart: string; decPart: string; isNegative: boolean } {
  const isNegative = value < 0;
  const absValue = Math.abs(value);

  // Convert to string with enough precision
  const str = absValue.toFixed(Math.max(decimalPlaces + 2, 10));
  const [intPart, decPart = ''] = str.split('.');

  return {
    intPart,
    decPart: decPart.padEnd(decimalPlaces + 1, '0'),
    isNegative,
  };
}

/**
 * Round a string representation of a number's decimal part
 */
export function roundDecimalString(
  intPart: string,
  decPart: string,
  scale: number,
  mode: 'ceil' | 'floor'
): { intPart: string; decPart: string } {
  // Get the part we're keeping and the part that determines rounding
  const keepPart = decPart.substring(0, scale);
  const roundPart = decPart.substring(scale);

  // Check if we need to round up
  const needsRoundUp = mode === 'ceil' && roundPart.replace(/0/g, '').length > 0;

  if (!needsRoundUp) {
    return { intPart, decPart: keepPart };
  }

  // Add 1 to the decimal part
  let carry = 1;
  const decDigits = keepPart.split('').reverse().map(d => parseInt(d, 10));

  for (let i = 0; i < decDigits.length; i++) {
    decDigits[i] += carry;
    if (decDigits[i] >= 10) {
      decDigits[i] = 0;
      carry = 1;
    } else {
      carry = 0;
      break;
    }
  }

  // If there's still a carry, add to integer part
  if (carry > 0) {
    const intValue = parseInt(intPart, 10) + 1;
    return { intPart: intValue.toString(), decPart: '0'.repeat(scale) };
  }

  return { intPart, decPart: decDigits.reverse().join('') };
}
