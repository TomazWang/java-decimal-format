# java-decimal-format

A faithful JavaScript/TypeScript mirror of Java's DecimalFormat class with exact behavior matching.

## Project Overview

This package provides a complete implementation of Java's `java.text.DecimalFormat` in TypeScript, with exact behavior matching for cross-platform consistency.

### Key Features

- **Exact Java Behavior**: Negative sign placement matches Java (`-$123.45` not `$-123.45`)
- **Semicolon Pattern Syntax**: Supports `positive;negative` patterns like `$#,##0.00;($#,##0.00)`
- **All Rounding Modes**: Complete support for all 8 Java rounding modes
- **Scientific Notation**: Correct exponent calculation matching Java
- **TypeScript Native**: Full type definitions included

## Architecture

### Core Files

- `src/DecimalFormat.ts` - Main DecimalFormat implementation
- `src/RoundingMode.ts` - Enum for all 8 rounding modes
- `src/index.ts` - Public API exports
- `SPEC.md` - Complete Java DecimalFormat specification

### Testing

- `src/DecimalFormat.test.ts` - 52 comprehensive test cases
- All tests verify exact Java behavior
- Coverage includes edge cases and all rounding modes

## Critical Behaviors

### 1. Negative Sign Placement

**CRITICAL DIFFERENCE** from other JavaScript implementations:

```typescript
const df = new DecimalFormat('$#,##0.00');
df.format(-123.45); // Returns: "-$123.45" ✓
// NOT "$-123.45" like other packages
```

The negative sign appears BEFORE the entire pattern including prefix, matching Java's behavior.

### 2. Positive/Negative Pattern Syntax

```typescript
const df = new DecimalFormat('$#,##0.00;($#,##0.00)');
df.format(100);   // "$100.00"
df.format(-100);  // "($100.00)"
```

### 3. Rounding Precision

All rounding modes work correctly with proper floating-point handling:
- HALF_UP correctly rounds 1.005 to 1.01
- CEILING and FLOOR properly handle negative numbers
- Rounding is performed before formatting to avoid double-rounding

## Development

### Build

```bash
npm run build
```

Compiles TypeScript to `dist/` with type definitions.

### Test

```bash
npm test          # Run all tests
npm run test:watch # Watch mode
```

### Structure

```
java-decimal-format/
├── src/
│   ├── DecimalFormat.ts      # Main implementation
│   ├── RoundingMode.ts        # Rounding mode enum
│   ├── index.ts               # Public API
│   ├── utils.ts               # Utility functions
│   └── DecimalFormat.test.ts # Test suite
├── dist/                      # Compiled output
├── workflow/                  # Project workflow
│   ├── plan/                  # Planning documents
│   ├── tasks/                 # Task tracking
│   └── wip/                   # Work in progress
│       └── session-log/       # Development session logs
├── SPEC.md                    # Java DecimalFormat specification
├── README.md                  # User documentation
└── package.json
```

## Future Enhancements

### v1.x Roadmap

- [x] Core DecimalFormat implementation
- [x] All 8 rounding modes
- [x] Positive/negative patterns
- [x] Scientific notation
- [x] Comprehensive tests
- [ ] Locale-specific decimal/grouping separators
- [ ] Currency symbol replacement (¤)
- [ ] Parsing (reverse formatting)

### v2.x Ideas

- Locale support (different separators)
- Number parsing
- Format validation
- Performance optimizations

## Contributing

### Development Workflow

1. Create feature branch
2. Write tests first (TDD)
3. Implement feature matching Java behavior
4. Verify all tests pass
5. Update documentation
6. Submit PR

### Testing Philosophy

All features must have corresponding tests that verify:
1. Basic functionality
2. Edge cases (zero, negative, very large/small)
3. Exact Java behavior match
4. Rounding precision

## References

- [Java DecimalFormat API](https://docs.oracle.com/javase/8/docs/api/java/text/DecimalFormat.html)
- [Java RoundingMode](https://docs.oracle.com/javase/8/docs/api/java/math/RoundingMode.html)
- [Spec Document](./SPEC.md)

## Contact

- GitHub: https://github.com/TomazWang/java-decimal-format
- npm: https://www.npmjs.com/package/java-decimal-format

---

**Last Updated**: 2026-02-04
**Version**: 1.0.0
**Status**: Stable, ready for production use
