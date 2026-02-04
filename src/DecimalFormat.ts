import { RoundingMode } from './RoundingMode';

interface ParsedPattern {
  positivePrefix: string;
  positiveSuffix: string;
  negativePrefix: string;
  negativeSuffix: string;
  minIntegerDigits: number;
  maxIntegerDigits: number;
  minFractionDigits: number;
  maxFractionDigits: number;
  groupingSize: number;
  groupingUsed: boolean;
  decimalSeparatorAlwaysShown: boolean;
  useExponentialNotation: boolean;
  minExponentDigits: number;
  multiplier: number;
}

/**
 * DecimalFormat is a concrete class for formatting decimal numbers.
 *
 * This implementation mirrors Java's java.text.DecimalFormat behavior exactly.
 * Key difference from other JavaScript implementations:
 * - Negative sign appears BEFORE the entire pattern including prefix
 *   Example: Pattern "$#,##0.00" with -123 → "-$123.00" (NOT "$-123.00")
 */
export class DecimalFormat {
  private pattern: string = '#,##0.###';
  private parsedPattern: ParsedPattern;
  private roundingMode: RoundingMode = RoundingMode.HALF_EVEN;

  constructor(pattern?: string) {
    if (pattern) {
      this.pattern = pattern;
    }
    this.parsedPattern = this.parsePattern(this.pattern);
  }

  /**
   * Formats a number according to this format's pattern.
   */
  public format(number: number | string): string {
    const num = typeof number === 'string' ? parseFloat(number) : number;

    if (isNaN(num)) {
      throw new Error('Cannot format NaN');
    }

    if (!isFinite(num)) {
      return num > 0 ? '∞' : '-∞';
    }

    // Apply multiplier (for percentage, permille)
    let value = num * this.parsedPattern.multiplier;

    // Determine if negative (handle -0 as +0)
    const isNegative = value < 0 && value !== 0;

    // Get prefix and suffix
    const prefix = isNegative ? this.parsedPattern.negativePrefix : this.parsedPattern.positivePrefix;
    const suffix = isNegative ? this.parsedPattern.negativeSuffix : this.parsedPattern.positiveSuffix;

    // Format the number (keep sign for proper rounding)
    let formatted: string;
    if (this.parsedPattern.useExponentialNotation) {
      formatted = this.formatExponential(Math.abs(value));
    } else {
      // Pass the signed value for proper rounding, format will handle sign
      formatted = this.formatStandard(value);
    }

    return prefix + formatted + suffix;
  }

  private formatStandard(value: number): string {
    // Round to the maximum fraction digits (preserving sign for correct rounding)
    const rounded = this.round(value, this.parsedPattern.maxFractionDigits);

    // Work with absolute value for formatting (sign is handled by prefix)
    const absRounded = Math.abs(rounded);
    const factor = Math.pow(10, this.parsedPattern.maxFractionDigits);

    // Scale up, round to integer to eliminate floating point errors, then scale down
    const scaled = Math.round(absRounded * factor);
    let integerPart = Math.floor(scaled / factor).toString();
    let fractionPart = (scaled % factor).toString().padStart(this.parsedPattern.maxFractionDigits, '0');

    // Apply minimum integer digits (zero padding)
    // If minIntegerDigits is 0 and integerPart is "0", make it empty
    if (this.parsedPattern.minIntegerDigits === 0 && integerPart === '0') {
      integerPart = '';
    } else if (integerPart.length < this.parsedPattern.minIntegerDigits) {
      integerPart = '0'.repeat(this.parsedPattern.minIntegerDigits - integerPart.length) + integerPart;
    }

    // Apply grouping
    if (this.parsedPattern.groupingUsed && this.parsedPattern.groupingSize > 0) {
      integerPart = this.applyGrouping(integerPart, this.parsedPattern.groupingSize);
    }

    // Handle fraction part
    // Remove trailing zeros down to minimum fraction digits
    while (fractionPart.length > this.parsedPattern.minFractionDigits && fractionPart.endsWith('0')) {
      fractionPart = fractionPart.slice(0, -1);
    }

    // Build result
    if (fractionPart.length > 0 || this.parsedPattern.decimalSeparatorAlwaysShown) {
      return integerPart + '.' + fractionPart;
    } else {
      return integerPart;
    }
  }

  private formatExponential(value: number): string {
    if (value === 0) {
      const zeros = '0'.repeat(this.parsedPattern.minIntegerDigits);
      const expZeros = '0'.repeat(this.parsedPattern.minExponentDigits);
      return zeros + (this.parsedPattern.maxFractionDigits > 0 ? '.' : '') + 'E' + expZeros;
    }

    // Calculate exponent
    const exponent = Math.floor(Math.log10(value));
    const mantissa = value / Math.pow(10, exponent);

    // Round mantissa
    const rounded = this.round(mantissa, this.parsedPattern.maxFractionDigits);

    // Format mantissa
    let mantissaStr = rounded.toFixed(this.parsedPattern.maxFractionDigits);
    const parts = mantissaStr.split('.');
    let intPart = parts[0];
    let fracPart = parts[1] || '';

    // Remove trailing zeros in fraction
    while (fracPart.length > this.parsedPattern.minFractionDigits && fracPart.endsWith('0')) {
      fracPart = fracPart.slice(0, -1);
    }

    // Build mantissa
    let result = intPart;
    if (fracPart.length > 0) {
      result += '.' + fracPart;
    }

    // Build exponent
    const expStr = Math.abs(exponent).toString().padStart(this.parsedPattern.minExponentDigits, '0');
    result += 'E' + (exponent >= 0 ? '' : '-') + expStr;

    return result;
  }

  private applyGrouping(integerStr: string, groupSize: number): string {
    const reversed = integerStr.split('').reverse();
    const grouped: string[] = [];

    for (let i = 0; i < reversed.length; i++) {
      if (i > 0 && i % groupSize === 0) {
        grouped.push(',');
      }
      grouped.push(reversed[i]);
    }

    return grouped.reverse().join('');
  }

  private round(value: number, scale: number): number {
    if (scale === 0) {
      return this.roundInteger(value);
    }

    const factor = Math.pow(10, scale);
    const sign = value >= 0 ? 1 : -1;
    const absValue = Math.abs(value);
    const scaled = absValue * factor;

    let roundedScaled: number;

    switch (this.roundingMode) {
      case RoundingMode.UP:
        // Round away from zero
        roundedScaled = Math.ceil(scaled);
        break;

      case RoundingMode.DOWN:
        // Round towards zero
        roundedScaled = Math.floor(scaled);
        break;

      case RoundingMode.CEILING:
        // Round towards positive infinity
        if (sign > 0) {
          roundedScaled = Math.ceil(scaled);
        } else {
          roundedScaled = Math.floor(scaled);
        }
        break;

      case RoundingMode.FLOOR:
        // Round towards negative infinity
        if (sign > 0) {
          roundedScaled = Math.floor(scaled);
        } else {
          roundedScaled = Math.ceil(scaled);
        }
        break;

      case RoundingMode.HALF_UP: {
        // Add a tiny amount to handle floating point precision for .005 cases
        roundedScaled = Math.round(scaled + 0.0000000001);
        break;
      }

      case RoundingMode.HALF_DOWN: {
        const floored = Math.floor(scaled);
        const fraction = scaled - floored;
        if (fraction > 0.5) {
          roundedScaled = floored + 1;
        } else {
          roundedScaled = floored;
        }
        break;
      }

      case RoundingMode.HALF_EVEN: {
        const floored = Math.floor(scaled);
        const fraction = scaled - floored;
        if (fraction > 0.5 + 0.0000000001) {
          roundedScaled = floored + 1;
        } else if (fraction < 0.5 - 0.0000000001) {
          roundedScaled = floored;
        } else {
          // Exactly 0.5 - round to even
          if (floored % 2 === 0) {
            roundedScaled = floored;
          } else {
            roundedScaled = floored + 1;
          }
        }
        break;
      }

      case RoundingMode.UNNECESSARY:
        if (Math.abs(scaled - Math.round(scaled)) > 0.0000000001) {
          throw new Error('Rounding necessary');
        }
        roundedScaled = Math.round(scaled);
        break;

      default:
        throw new Error('Unknown rounding mode');
    }

    // Return the precisely rounded value
    // Use parseFloat with toFixed to eliminate floating point errors
    const result = roundedScaled / factor;
    return sign * parseFloat(result.toFixed(scale));
  }

  private roundInteger(value: number): number {
    const sign = value < 0 ? -1 : 1;
    const absValue = Math.abs(value);

    switch (this.roundingMode) {
      case RoundingMode.UP:
        return sign * Math.ceil(absValue);

      case RoundingMode.DOWN:
        return sign * Math.floor(absValue);

      case RoundingMode.CEILING:
        return Math.ceil(value);

      case RoundingMode.FLOOR:
        return Math.floor(value);

      case RoundingMode.HALF_UP:
        return sign * Math.round(absValue);

      case RoundingMode.HALF_DOWN:
        return sign * (Math.floor(absValue + 0.5) === Math.ceil(absValue - 0.5) ? Math.floor(absValue) : Math.round(absValue));

      case RoundingMode.HALF_EVEN: {
        const floored = Math.floor(absValue);
        const fraction = absValue - floored;
        let result: number;
        if (fraction > 0.5) {
          result = floored + 1;
        } else if (fraction < 0.5) {
          result = floored;
        } else {
          result = floored % 2 === 0 ? floored : floored + 1;
        }
        return sign * result;
      }

      case RoundingMode.UNNECESSARY:
        if (value !== Math.floor(value)) {
          throw new Error('Rounding necessary');
        }
        return value;

      default:
        throw new Error('Unknown rounding mode');
    }
  }

  private parsePattern(pattern: string): ParsedPattern {
    // Split positive and negative subpatterns
    const semicolonIndex = this.findUnquotedSemicolon(pattern);
    const positivePattern = semicolonIndex >= 0 ? pattern.substring(0, semicolonIndex) : pattern;
    const negativePattern = semicolonIndex >= 0 ? pattern.substring(semicolonIndex + 1) : null;

    // Parse positive pattern
    const positive = this.parseSubpattern(positivePattern);

    // Parse negative pattern or derive it
    let negative: ReturnType<typeof this.parseSubpattern>;
    if (negativePattern) {
      negative = this.parseSubpattern(negativePattern);
    } else {
      // Derive negative from positive by prepending minus sign
      negative = {
        ...positive,
        prefix: '-' + positive.prefix,
      };
    }

    return {
      positivePrefix: positive.prefix,
      positiveSuffix: positive.suffix,
      negativePrefix: negative.prefix,
      negativeSuffix: negative.suffix,
      minIntegerDigits: positive.minIntegerDigits,
      maxIntegerDigits: positive.maxIntegerDigits,
      minFractionDigits: positive.minFractionDigits,
      maxFractionDigits: positive.maxFractionDigits,
      groupingSize: positive.groupingSize,
      groupingUsed: positive.groupingUsed,
      decimalSeparatorAlwaysShown: positive.decimalSeparatorAlwaysShown,
      useExponentialNotation: positive.useExponentialNotation,
      minExponentDigits: positive.minExponentDigits,
      multiplier: positive.multiplier,
    };
  }

  private findUnquotedSemicolon(pattern: string): number {
    let inQuote = false;
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === "'") {
        inQuote = !inQuote;
      } else if (pattern[i] === ';' && !inQuote) {
        return i;
      }
    }
    return -1;
  }

  private parseSubpattern(subpattern: string) {
    let prefix = '';
    let suffix = '';
    let numberPart = '';
    let minIntegerDigits = 1;
    let maxIntegerDigits = Number.MAX_SAFE_INTEGER;
    let minFractionDigits = 0;
    let maxFractionDigits = 0;
    let groupingSize = 0;
    let groupingUsed = false;
    let decimalSeparatorAlwaysShown = false;
    let useExponentialNotation = false;
    let minExponentDigits = 0;
    let multiplier = 1;

    // Extract prefix, number part, and suffix
    let state: 'prefix' | 'number' | 'suffix' | 'exponent' = 'prefix';
    let inQuote = false;
    let i = 0;

    while (i < subpattern.length) {
      const ch = subpattern[i];

      if (ch === "'") {
        inQuote = !inQuote;
        i++;
        continue;
      }

      if (inQuote) {
        if (state === 'prefix') prefix += ch;
        else if (state === 'suffix' || state === 'exponent') suffix += ch;
        i++;
        continue;
      }

      // Check for special characters
      if ((ch === '0' || ch === '#' || ch === ',' || ch === '.') && state === 'prefix') {
        state = 'number';
      }

      if (state === 'prefix') {
        if (ch === '%') {
          multiplier = 100;
          prefix += ch;
        } else if (ch === '\u2030') { // permille
          multiplier = 1000;
          prefix += ch;
        } else {
          prefix += ch;
        }
      } else if (state === 'number') {
        if (ch === '0' || ch === '#' || ch === ',' || ch === '.') {
          numberPart += ch;
        } else if (ch === 'E' || ch === 'e') {
          useExponentialNotation = true;
          state = 'exponent';
        } else {
          state = 'suffix';
          if (ch === '%') {
            multiplier = 100;
            suffix += ch;
          } else if (ch === '\u2030') {
            multiplier = 1000;
            suffix += ch;
          } else {
            suffix += ch;
          }
        }
      } else if (state === 'exponent') {
        if (ch === '0') {
          minExponentDigits++;
        } else {
          state = 'suffix';
          suffix += ch;
        }
      } else if (state === 'suffix') {
        suffix += ch;
      }

      i++;
    }

    // Parse number part
    if (numberPart) {
      const dotIndex = numberPart.indexOf('.');
      let integerPart: string;
      let fractionPart: string;

      if (dotIndex >= 0) {
        integerPart = numberPart.substring(0, dotIndex);
        fractionPart = numberPart.substring(dotIndex + 1);
        decimalSeparatorAlwaysShown = fractionPart.length === 0;
      } else {
        integerPart = numberPart;
        fractionPart = '';
      }

      // Parse integer part
      const lastComma = integerPart.lastIndexOf(',');
      if (lastComma >= 0) {
        groupingUsed = true;
        groupingSize = integerPart.length - lastComma - 1;
      }

      // Count digits in integer part
      const intDigits = integerPart.replace(/,/g, '');
      let zeroCount = 0;
      let hashCount = 0;
      for (const ch of intDigits) {
        if (ch === '0') zeroCount++;
        else if (ch === '#') hashCount++;
      }
      minIntegerDigits = zeroCount;
      maxIntegerDigits = zeroCount + hashCount;

      // Parse fraction part
      for (const ch of fractionPart) {
        if (ch === '0') {
          minFractionDigits++;
          maxFractionDigits++;
        } else if (ch === '#') {
          maxFractionDigits++;
        }
      }
    }

    return {
      prefix,
      suffix,
      minIntegerDigits,
      maxIntegerDigits,
      minFractionDigits,
      maxFractionDigits,
      groupingSize,
      groupingUsed,
      decimalSeparatorAlwaysShown,
      useExponentialNotation,
      minExponentDigits,
      multiplier,
    };
  }

  // ===== Public API Methods =====

  public applyPattern(pattern: string): void {
    this.pattern = pattern;
    this.parsedPattern = this.parsePattern(pattern);
  }

  public toPattern(): string {
    return this.pattern;
  }

  public setPositivePrefix(prefix: string): void {
    this.parsedPattern.positivePrefix = prefix;
  }

  public getPositivePrefix(): string {
    return this.parsedPattern.positivePrefix;
  }

  public setNegativePrefix(prefix: string): void {
    this.parsedPattern.negativePrefix = prefix;
  }

  public getNegativePrefix(): string {
    return this.parsedPattern.negativePrefix;
  }

  public setPositiveSuffix(suffix: string): void {
    this.parsedPattern.positiveSuffix = suffix;
  }

  public getPositiveSuffix(): string {
    return this.parsedPattern.positiveSuffix;
  }

  public setNegativeSuffix(suffix: string): void {
    this.parsedPattern.negativeSuffix = suffix;
  }

  public getNegativeSuffix(): string {
    return this.parsedPattern.negativeSuffix;
  }

  public setMinimumIntegerDigits(digits: number): void {
    this.parsedPattern.minIntegerDigits = digits;
  }

  public getMinimumIntegerDigits(): number {
    return this.parsedPattern.minIntegerDigits;
  }

  public setMaximumIntegerDigits(digits: number): void {
    this.parsedPattern.maxIntegerDigits = digits;
  }

  public getMaximumIntegerDigits(): number {
    return this.parsedPattern.maxIntegerDigits;
  }

  public setMinimumFractionDigits(digits: number): void {
    this.parsedPattern.minFractionDigits = digits;
  }

  public getMinimumFractionDigits(): number {
    return this.parsedPattern.minFractionDigits;
  }

  public setMaximumFractionDigits(digits: number): void {
    this.parsedPattern.maxFractionDigits = digits;
  }

  public getMaximumFractionDigits(): number {
    return this.parsedPattern.maxFractionDigits;
  }

  public setGroupingUsed(used: boolean): void {
    this.parsedPattern.groupingUsed = used;
  }

  public isGroupingUsed(): boolean {
    return this.parsedPattern.groupingUsed;
  }

  public setGroupingSize(size: number): void {
    this.parsedPattern.groupingSize = size;
  }

  public getGroupingSize(): number {
    return this.parsedPattern.groupingSize;
  }

  public setRoundingMode(mode: RoundingMode): void {
    this.roundingMode = mode;
  }

  public getRoundingMode(): RoundingMode {
    return this.roundingMode;
  }

  public setMultiplier(multiplier: number): void {
    this.parsedPattern.multiplier = multiplier;
  }

  public getMultiplier(): number {
    return this.parsedPattern.multiplier;
  }

  public setDecimalSeparatorAlwaysShown(shown: boolean): void {
    this.parsedPattern.decimalSeparatorAlwaysShown = shown;
  }

  public isDecimalSeparatorAlwaysShown(): boolean {
    return this.parsedPattern.decimalSeparatorAlwaysShown;
  }
}
