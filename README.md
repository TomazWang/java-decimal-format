# java-decimal-format

[![npm version](https://img.shields.io/npm/v/java-decimal-format.svg)](https://www.npmjs.com/package/java-decimal-format)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A faithful JavaScript/TypeScript implementation of Java's `DecimalFormat` class with **exact** behavior matching.

## Why This Package?

Other JavaScript decimal formatting packages (like `decimal-format`) claim to mirror Java's `DecimalFormat`, but they have critical differences that can break your application:

### ❌ Other Packages
```javascript
// WRONG behavior with negative numbers
const df = new DecimalFormat('$#,##0.00');
df.format(-123.45); // Returns: "$-123.45" ❌
```

### ✅ This Package
```javascript
// CORRECT Java behavior
const df = new DecimalFormat('$#,##0.00');
df.format(-123.45); // Returns: "-$123.45" ✓
```

**Key Difference:** In Java's `DecimalFormat`, the negative sign appears **BEFORE** the entire pattern (including prefix), not after the prefix. This package implements the exact Java behavior.

## Installation

```bash
npm install java-decimal-format
```

## Quick Start

```typescript
import { DecimalFormat, RoundingMode } from 'java-decimal-format';

// Basic formatting
const df = new DecimalFormat('#,##0.00');
console.log(df.format(1234.56));    // "1,234.56"
console.log(df.format(-1234.56));   // "-1,234.56"

// Currency formatting
const currency = new DecimalFormat('$#,##0.00');
console.log(currency.format(99.99));   // "$99.99"
console.log(currency.format(-99.99));  // "-$99.99" (NOT "$-99.99")

// Percentage
const percent = new DecimalFormat('#,##0.00%');
console.log(percent.format(0.1234));  // "12.34%"

// Custom positive/negative patterns
const accounting = new DecimalFormat('$#,##0.00;($#,##0.00)');
console.log(accounting.format(100));   // "$100.00"
console.log(accounting.format(-100));  // "($100.00)"
```

## Features

✅ **Exact Java Behavior**
- Negative sign placement matches Java exactly
- Semicolon pattern syntax supported: `positive;negative`
- All rounding modes from `java.math.RoundingMode`
- Scientific notation support
- Percentage and per mille formatting

✅ **Comprehensive Pattern Support**
- `0` - Required digit
- `#` - Optional digit
- `.` - Decimal separator
- `,` - Grouping separator
- `E`/`e` - Scientific notation
- `;` - Positive/negative pattern separator
- `%` - Percentage (multiply by 100)
- `‰` - Per mille (multiply by 1000)
- `'` - Quote special characters

✅ **TypeScript Support**
- Full type definitions included
- No additional `@types` packages needed

## Pattern Syntax

### Basic Patterns

| Pattern | Value | Output |
|---------|-------|--------|
| `#,##0.00` | `1234.56` | `1,234.56` |
| `#,##0.00` | `-1234.56` | `-1,234.56` |
| `000.00` | `1.5` | `001.50` |
| `###.##` | `0.5` | `.5` |

### Currency Patterns

| Pattern | Value | Output |
|---------|-------|--------|
| `$#,##0.00` | `123.45` | `$123.45` |
| `$#,##0.00` | `-123.45` | `-$123.45` ⚠️ |
| `NT$#,##0` | `-1234` | `-NT$1,234` ⚠️ |

⚠️ **Critical:** Negative sign appears BEFORE prefix (Java behavior)

### Positive/Negative Patterns

```typescript
// Accounting format with parentheses
const df = new DecimalFormat('$#,##0.00;($#,##0.00)');
df.format(100);   // "$100.00"
df.format(-100);  // "($100.00)"

// Custom negative format
const df2 = new DecimalFormat('#,##0 CR;#,##0 DB');
df2.format(100);   // "100 CR"
df2.format(-100);  // "100 DB"
```

### Scientific Notation

```typescript
const df = new DecimalFormat('0.00E0');
df.format(1234.56);   // "1.23E3"
df.format(-1234.56);  // "-1.23E3"
df.format(0.00012);   // "1.20E-4"
```

### Percentage and Per Mille

```typescript
const percent = new DecimalFormat('#,##0.00%');
percent.format(0.1234);   // "12.34%"
percent.format(-0.05);    // "-5.00%"

const permille = new DecimalFormat('#,##0‰');
permille.format(0.45);    // "450‰"
```

## Rounding Modes

```typescript
import { RoundingMode } from 'java-decimal-format';

const df = new DecimalFormat('#,##0.00');

// HALF_UP (default) - Round towards nearest neighbor, tie away from zero
df.setRoundingMode(RoundingMode.HALF_UP);
df.format(1.005);   // "1.01"

// UP - Round away from zero
df.setRoundingMode(RoundingMode.UP);
df.format(1.001);   // "1.01"

// DOWN - Round towards zero
df.setRoundingMode(RoundingMode.DOWN);
df.format(1.999);   // "1.99"

// CEILING - Round towards positive infinity
df.setRoundingMode(RoundingMode.CEILING);
df.format(1.001);   // "1.01"
df.format(-1.999);  // "-1.99"

// FLOOR - Round towards negative infinity
df.setRoundingMode(RoundingMode.FLOOR);
df.format(1.999);   // "1.99"
df.format(-1.001);  // "-1.01"

// HALF_EVEN - Banker's rounding
df.setRoundingMode(RoundingMode.HALF_EVEN);
df.format(1.15);    // "1.2"
df.format(1.25);    // "1.2"
```

## API Reference

### Constructor

```typescript
new DecimalFormat(pattern?: string)
```

Creates a new DecimalFormat instance with the specified pattern.

### Formatting

```typescript
format(number: number | string): string
```

Formats a number according to the pattern.

### Pattern Methods

```typescript
applyPattern(pattern: string): void
toPattern(): string
```

### Prefix/Suffix Methods

```typescript
setPositivePrefix(prefix: string): void
getPositivePrefix(): string
setNegativePrefix(prefix: string): void
getNegativePrefix(): string
setPositiveSuffix(suffix: string): void
getPositiveSuffix(): string
setNegativeSuffix(suffix: string): void
getNegativeSuffix(): string
```

### Digit Configuration

```typescript
setMinimumIntegerDigits(digits: number): void
getMinimumIntegerDigits(): number
setMaximumIntegerDigits(digits: number): void
getMaximumIntegerDigits(): number
setMinimumFractionDigits(digits: number): void
getMinimumFractionDigits(): number
setMaximumFractionDigits(digits: number): void
getMaximumFractionDigits(): number
```

### Grouping

```typescript
setGroupingUsed(used: boolean): void
isGroupingUsed(): boolean
setGroupingSize(size: number): void
getGroupingSize(): number
```

### Rounding

```typescript
setRoundingMode(mode: RoundingMode): void
getRoundingMode(): RoundingMode
```

### Other

```typescript
setMultiplier(multiplier: number): void
getMultiplier(): number
setDecimalSeparatorAlwaysShown(shown: boolean): void
isDecimalSeparatorAlwaysShown(): boolean
```

## Comparison with Other Packages

| Feature | java-decimal-format | decimal-format (npm) |
|---------|-------------------|---------------------|
| Negative sign placement | ✅ Before prefix (Java behavior) | ❌ After prefix |
| Semicolon pattern syntax | ✅ Supported | ❌ Not supported |
| Scientific notation | ✅ Correct exponent | ❌ Incorrect exponent |
| All rounding modes | ✅ All 8 modes | ✅ All 8 modes |
| TypeScript support | ✅ Built-in | ✅ Built-in |
| Optional integer digits | ✅ Java behavior | ❌ Always shows zero |

## Testing

This package includes comprehensive tests (52 test cases) covering:
- Basic formatting
- Negative number handling with prefixes
- Positive/negative pattern syntax
- All rounding modes
- Grouping
- Scientific notation
- Percentage and per mille
- Edge cases

```bash
npm test
```

## Browser Support

Works in all modern browsers and Node.js environments.

- Node.js: 14+
- Chrome, Firefox, Safari, Edge: Latest 2 versions

## License

MIT

## Contributing

Contributions are welcome! Please ensure:
1. All tests pass
2. New features include tests
3. Behavior matches Java's DecimalFormat

## References

- [Java DecimalFormat Documentation](https://docs.oracle.com/javase/8/docs/api/java/text/DecimalFormat.html)
- [Java RoundingMode Documentation](https://docs.oracle.com/javase/8/docs/api/java/math/RoundingMode.html)

## Credits

Created to provide an accurate JavaScript implementation of Java's DecimalFormat, particularly for applications that need exact cross-platform number formatting behavior.
