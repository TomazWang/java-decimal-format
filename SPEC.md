# Java DecimalFormat Specification

This document specifies the behavior of Java's `DecimalFormat` class that this package aims to mirror exactly.

## Reference

Based on: [Java 8 DecimalFormat Documentation](https://docs.oracle.com/javase/8/docs/api/java/text/DecimalFormat.html)

## Pattern Syntax

### Special Pattern Characters

| Symbol | Location | Meaning |
|--------|----------|---------|
| `0` | Number | Digit |
| `#` | Number | Digit, zero shows as absent |
| `.` | Number | Decimal separator |
| `-` | Number | Minus sign |
| `,` | Number | Grouping separator |
| `E` | Number | Separates mantissa and exponent in scientific notation |
| `;` | Subpattern boundary | Separates positive and negative subpatterns |
| `%` | Prefix or suffix | Multiply by 100 and show as percentage |
| `‰` (`\u2030`) | Prefix or suffix | Multiply by 1000 and show as per mille |
| `¤` (`\u00A4`) | Prefix or suffix | Currency sign, replaced by currency symbol |
| `'` | Prefix or suffix | Used to quote special characters |

### Pattern Structure

```
pattern    := subpattern (';' subpattern)?
subpattern := (prefix)? integer ('.' fraction)? (suffix)?
prefix     := '\\u0000'..'\\uFFFD' - specialCharacters
suffix     := '\\u0000'..'\\uFFFD' - specialCharacters
integer    := '#'* '0'* '0'
fraction   := '0'* '#'*
```

## Key Behaviors

### 1. Positive and Negative Subpatterns

- Pattern: `positive_pattern;negative_pattern`
- If negative pattern is not specified, it is derived from positive pattern by prepending `-`
- Examples:
  - `#,##0.00` → positive: `#,##0.00`, negative: `-#,##0.00`
  - `$#,##0.00;($#,##0.00)` → positive: `$#,##0.00`, negative: `($#,##0.00)`

### 2. Negative Sign Placement

**CRITICAL:** When using a single pattern (no semicolon):
- Negative numbers get `-` prepended to the **entire formatted result**
- Example: Pattern `$#,##0.00`
  - Positive: `123.45` → `$123.45`
  - Negative: `-123.45` → `-$123.45` (NOT `$-123.45`)

This is THE KEY DIFFERENCE from many JavaScript implementations!

### 3. Prefix and Suffix

- Prefix/suffix can contain any character except special pattern characters
- Special characters must be quoted with single quotes `'`
- Examples:
  - `'#'#,##0.00` → `#123.45`
  - `'hello'#,##0.00` → `hello123.45`

### 4. Grouping

- Grouping separator (`,`) indicates where to place grouping separators
- The interval between the last separator and the decimal point determines the grouping size
- Examples:
  - `#,##0` → groups by 3: `1,234,567`
  - `#,####0` → groups by 4: `12,3456,7890`

### 5. Decimal and Integer Digits

- `0` = required digit (shows zero if no digit present)
- `#` = optional digit (does not show if zero)
- Integer part:
  - Must have at least one `0` or `#`
  - `#` can come before `0`
  - Pattern `#0` = at least 1 digit, `#00` = at least 2 digits
- Fraction part:
  - All digits are optional by default
  - `0.00` = always shows 2 decimal places
  - `0.##` = shows up to 2 decimal places, no trailing zeros

### 6. Scientific Notation

- Pattern contains `E` → scientific notation
- Example: `0.###E0` formats `1234` as `1.234E3`
- Minimum exponent digits determined by `0` count after `E`
- Example: `0.###E00` formats `1234` as `1.234E03`

### 7. Percentage and Per Mille

- `%` suffix → multiply by 100: `0.45` with `#%` → `45%`
- `‰` suffix → multiply by 1000: `0.45` with `#‰` → `450‰`

### 8. Rounding

Supported rounding modes (from `java.math.RoundingMode`):

- `UP` - Round away from zero
- `DOWN` - Round towards zero
- `CEILING` - Round towards positive infinity
- `FLOOR` - Round towards negative infinity
- `HALF_UP` - Round towards nearest neighbor, tie towards away from zero
- `HALF_DOWN` - Round towards nearest neighbor, tie towards zero
- `HALF_EVEN` - Round towards nearest neighbor, tie towards even neighbor
- `UNNECESSARY` - No rounding (throws exception if rounding needed)

Default: `HALF_EVEN`

## Test Cases (Expected Behaviors)

### Basic Formatting

| Pattern | Value | Expected Output |
|---------|-------|-----------------|
| `#,##0.00` | `1234.56` | `1,234.56` |
| `#,##0.00` | `-1234.56` | `-1,234.56` |
| `$#,##0.00` | `1234.56` | `$1,234.56` |
| `$#,##0.00` | `-1234.56` | `-$1,234.56` ⚠️ |
| `NT$#,##0` | `-1234` | `-NT$1,234` ⚠️ |

⚠️ **Critical behavior:** Negative sign appears BEFORE the entire pattern including prefix

### Positive/Negative Patterns

| Pattern | Value | Expected Output |
|---------|-------|-----------------|
| `$#,##0.00;($#,##0.00)` | `1234.56` | `$1,234.56` |
| `$#,##0.00;($#,##0.00)` | `-1234.56` | `($1,234.56)` |
| `#,##0;-#,##0` | `1234` | `1,234` |
| `#,##0;-#,##0` | `-1234` | `-1,234` |

### Digit Patterns

| Pattern | Value | Expected Output |
|---------|-------|-----------------|
| `000.00` | `1.5` | `001.50` |
| `###.##` | `0.5` | `.5` ⚠️ |
| `#,##0.##` | `1234.5` | `1,234.5` |
| `#,##0.00` | `0` | `0.00` |

⚠️ With all optional integer digits, zero is omitted (different from many implementations)

### Scientific Notation

| Pattern | Value | Expected Output |
|---------|-------|-----------------|
| `0.00E0` | `1234.56` | `1.23E3` |
| `0.00E0` | `-1234.56` | `-1.23E3` |
| `0.00E00` | `1234.56` | `1.23E03` |
| `#.##E0` | `0.00012` | `1.2E-4` |

### Percentage

| Pattern | Value | Expected Output |
|---------|-------|-----------------|
| `#,##0%` | `0.45` | `45%` |
| `#,##0.00%` | `-0.1234` | `-12.34%` |
| `#,##0‰` | `0.45` | `450‰` |

### Grouping

| Pattern | Value | Expected Output |
|---------|-------|-----------------|
| `#,##0` | `1234567` | `1,234,567` |
| `#,####0` | `12345678` | `1234,5678` |

### Rounding (with HALF_UP)

| Pattern | Value | Expected Output |
|---------|-------|-----------------|
| `#,##0.00` | `1.005` | `1.01` |
| `#,##0.00` | `-1.005` | `-1.01` |
| `#,##0.00` | `1.004` | `1.00` |

## API Methods to Implement

```typescript
class DecimalFormat {
  constructor(pattern?: string)

  // Format methods
  format(number: number | string): string

  // Pattern methods
  applyPattern(pattern: string): void
  toPattern(): string

  // Prefix/Suffix methods
  setPositivePrefix(prefix: string): void
  getPositivePrefix(): string
  setNegativePrefix(prefix: string): void
  getNegativePrefix(): string
  setPositiveSuffix(suffix: string): void
  getPositiveSuffix(): string
  setNegativeSuffix(suffix: string): void
  getNegativeSuffix(): string

  // Digit configuration
  setMinimumIntegerDigits(digits: number): void
  getMinimumIntegerDigits(): number
  setMaximumIntegerDigits(digits: number): void
  getMaximumIntegerDigits(): number
  setMinimumFractionDigits(digits: number): void
  getMinimumFractionDigits(): number
  setMaximumFractionDigits(digits: number): void
  getMaximumFractionDigits(): number

  // Grouping
  setGroupingUsed(used: boolean): void
  isGroupingUsed(): boolean
  setGroupingSize(size: number): void
  getGroupingSize(): number

  // Rounding
  setRoundingMode(mode: RoundingMode): void
  getRoundingMode(): RoundingMode

  // Multiplier
  setMultiplier(multiplier: number): void
  getMultiplier(): number

  // Decimal separator
  setDecimalSeparatorAlwaysShown(shown: boolean): void
  isDecimalSeparatorAlwaysShown(): boolean
}

enum RoundingMode {
  UP,
  DOWN,
  CEILING,
  FLOOR,
  HALF_UP,
  HALF_DOWN,
  HALF_EVEN,
  UNNECESSARY
}
```

## Implementation Requirements

1. **Exact Java Behavior**: Must match Java's DecimalFormat output exactly
2. **Negative Sign Placement**: Negative sign MUST prepend the entire formatted string (including prefix) when using single pattern
3. **Semicolon Pattern Support**: MUST support `positive;negative` pattern syntax
4. **Optional Integer Digits**: With all `#` in integer part, leading zeros must be omitted (including for `.5` → not `0.5`)
5. **Scientific Notation**: Must calculate exponent correctly (not like the JS decimal-format package which has bugs)
6. **Rounding**: Must support all Java rounding modes with exact same behavior
7. **Locale Independent**: Use `.` for decimal and `,` for grouping (no locale-specific formatting in v1)

## Out of Scope (for v1)

- Locale-specific formatting (different decimal/grouping separators)
- Currency symbol replacement (`¤`)
- Parsing (only formatting)
- Date/Time formatting

## References

- [Java DecimalFormat Javadoc](https://docs.oracle.com/javase/8/docs/api/java/text/DecimalFormat.html)
- [Java RoundingMode](https://docs.oracle.com/javase/8/docs/api/java/math/RoundingMode.html)
- [Java DecimalFormatSymbols](https://docs.oracle.com/javase/8/docs/api/java/text/DecimalFormatSymbols.html)
