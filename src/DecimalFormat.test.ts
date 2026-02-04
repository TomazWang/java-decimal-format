import { describe, it, expect } from 'vitest';
import { DecimalFormat } from './DecimalFormat';
import { RoundingMode } from './RoundingMode';

describe('DecimalFormat - Java Behavior Mirror', () => {
  describe('CRITICAL: Negative sign placement', () => {
    it('should place negative sign BEFORE entire pattern including prefix', () => {
      const df = new DecimalFormat('$#,##0.00');
      expect(df.format(123.45)).toBe('$123.45');
      expect(df.format(-123.45)).toBe('-$123.45'); // NOT $-123.45
    });

    it('should place negative sign before NT$ prefix', () => {
      const df = new DecimalFormat('NT$#,##0');
      expect(df.format(1234)).toBe('NT$1,234');
      expect(df.format(-1234)).toBe('-NT$1,234'); // NOT NT$-1,234
    });

    it('should place negative sign before emoji prefix', () => {
      const df = new DecimalFormat('💰#,##0.00');
      expect(df.format(123.45)).toBe('💰123.45');
      expect(df.format(-999.99)).toBe('-💰999.99');
    });

    it('should place negative sign before complex prefix', () => {
      const df = new DecimalFormat('USD $#,##0.00');
      expect(df.format(100)).toBe('USD $100.00');
      expect(df.format(-100)).toBe('-USD $100.00');
    });
  });

  describe('Positive/Negative patterns with semicolon', () => {
    it('should support custom negative pattern with parentheses', () => {
      const df = new DecimalFormat('$#,##0.00;($#,##0.00)');
      expect(df.format(1234.56)).toBe('$1,234.56');
      expect(df.format(-1234.56)).toBe('($1,234.56)');
    });

    it('should support different negative prefix', () => {
      const df = new DecimalFormat('#,##0;-#,##0');
      expect(df.format(1234)).toBe('1,234');
      expect(df.format(-1234)).toBe('-1,234');
    });

    it('should support custom negative format with suffix', () => {
      const df = new DecimalFormat('#,##0.00 CR;#,##0.00 DB');
      expect(df.format(100)).toBe('100.00 CR');
      expect(df.format(-100)).toBe('100.00 DB');
    });
  });

  describe('Basic formatting', () => {
    it('should format positive numbers', () => {
      const df = new DecimalFormat('#,##0.00');
      expect(df.format(1234.56)).toBe('1,234.56');
    });

    it('should format negative numbers', () => {
      const df = new DecimalFormat('#,##0.00');
      expect(df.format(-1234.56)).toBe('-1,234.56');
    });

    it('should format zero', () => {
      const df = new DecimalFormat('#,##0.00');
      expect(df.format(0)).toBe('0.00');
    });

    it('should format negative zero as positive zero', () => {
      const df = new DecimalFormat('#,##0.00');
      expect(df.format(-0)).toBe('0.00');
    });
  });

  describe('Grouping', () => {
    it('should apply grouping by 3', () => {
      const df = new DecimalFormat('#,##0');
      expect(df.format(1234567)).toBe('1,234,567');
    });

    it('should apply grouping by 5', () => {
      const df = new DecimalFormat('#,####0');
      // Pattern #,####0 has 5 characters after the comma: ####0
      // So grouping size is 5
      expect(df.format(123456789)).toBe('1234,56789');
    });

    it('should not apply grouping when pattern has no comma', () => {
      const df = new DecimalFormat('#0');
      expect(df.format(1234)).toBe('1234');
    });

    it('should handle grouping with negative numbers', () => {
      const df = new DecimalFormat('$#,##0.00');
      expect(df.format(-1234567.89)).toBe('-$1,234,567.89');
    });
  });

  describe('Integer and fraction digits', () => {
    it('should pad with zeros for minimum integer digits', () => {
      const df = new DecimalFormat('000.00');
      expect(df.format(1.5)).toBe('001.50');
    });

    it('should show minimum fraction digits', () => {
      const df = new DecimalFormat('#.00');
      expect(df.format(5)).toBe('5.00');
    });

    it('should trim trailing zeros beyond minimum fraction digits', () => {
      const df = new DecimalFormat('#,##0.##');
      expect(df.format(1234.5)).toBe('1,234.5');
      expect(df.format(1234.56)).toBe('1,234.56');
      expect(df.format(1234)).toBe('1,234');
    });

    it('should handle all optional integer digits', () => {
      const df = new DecimalFormat('###.##');
      expect(df.format(0.5)).toBe('.5');
      expect(df.format(12.34)).toBe('12.34');
    });

    it('should handle mixed required and optional digits', () => {
      const df = new DecimalFormat('#,##0.0#');
      expect(df.format(100.5)).toBe('100.5');
      expect(df.format(100.56)).toBe('100.56');
      expect(df.format(100)).toBe('100.0');
    });
  });

  describe('Prefix and suffix', () => {
    it('should add dollar sign prefix', () => {
      const df = new DecimalFormat('$#,##0.00');
      expect(df.format(100)).toBe('$100.00');
    });

    it('should add text prefix and suffix', () => {
      const df = new DecimalFormat('USD #,##0.00');
      expect(df.format(100)).toBe('USD 100.00');
    });

    it('should add suffix', () => {
      const df = new DecimalFormat('#,##0.00 USD');
      expect(df.format(100)).toBe('100.00 USD');
    });

    it('should add both prefix and suffix', () => {
      const df = new DecimalFormat('[$#,##0.00]');
      expect(df.format(100)).toBe('[$100.00]');
    });
  });

  describe('Percentage', () => {
    it('should format as percentage', () => {
      const df = new DecimalFormat('#,##0%');
      expect(df.format(0.45)).toBe('45%');
    });

    it('should format negative percentage', () => {
      const df = new DecimalFormat('#,##0.00%');
      expect(df.format(-0.1234)).toBe('-12.34%');
    });

    it('should format percentage with prefix', () => {
      const df = new DecimalFormat('Growth: #,##0%');
      expect(df.format(0.15)).toBe('Growth: 15%');
    });
  });

  describe('Per mille', () => {
    it('should format as per mille', () => {
      const df = new DecimalFormat('#,##0‰');
      expect(df.format(0.45)).toBe('450‰');
    });

    it('should format negative per mille', () => {
      const df = new DecimalFormat('#,##0.00‰');
      expect(df.format(-0.1234)).toBe('-123.40‰');
    });
  });

  describe('Scientific notation', () => {
    it('should format in scientific notation with E', () => {
      const df = new DecimalFormat('0.00E0');
      expect(df.format(1234.56)).toBe('1.23E3');
    });

    it('should format negative in scientific notation', () => {
      const df = new DecimalFormat('0.00E0');
      expect(df.format(-1234.56)).toBe('-1.23E3');
    });

    it('should format small numbers in scientific notation', () => {
      const df = new DecimalFormat('0.00E0');
      expect(df.format(0.00012)).toBe('1.20E-4');
    });

    it('should format with minimum exponent digits', () => {
      const df = new DecimalFormat('0.00E00');
      expect(df.format(1234.56)).toBe('1.23E03');
    });
  });

  describe('Rounding modes', () => {
    describe('HALF_UP (default)', () => {
      it('should round 1.005 to 1.01', () => {
        const df = new DecimalFormat('#,##0.00');
        df.setRoundingMode(RoundingMode.HALF_UP);
        expect(df.format(1.005)).toBe('1.01');
      });

      it('should round -1.005 to -1.01', () => {
        const df = new DecimalFormat('#,##0.00');
        df.setRoundingMode(RoundingMode.HALF_UP);
        expect(df.format(-1.005)).toBe('-1.01');
      });
    });

    describe('UP', () => {
      it('should round away from zero', () => {
        const df = new DecimalFormat('#,##0.00');
        df.setRoundingMode(RoundingMode.UP);
        expect(df.format(1.001)).toBe('1.01');
        expect(df.format(-1.001)).toBe('-1.01');
      });
    });

    describe('DOWN', () => {
      it('should round towards zero', () => {
        const df = new DecimalFormat('#,##0.00');
        df.setRoundingMode(RoundingMode.DOWN);
        expect(df.format(1.999)).toBe('1.99');
        expect(df.format(-1.999)).toBe('-1.99');
      });
    });

    describe('CEILING', () => {
      it('should round towards positive infinity', () => {
        const df = new DecimalFormat('#,##0.00');
        df.setRoundingMode(RoundingMode.CEILING);
        expect(df.format(1.001)).toBe('1.01');
        expect(df.format(-1.999)).toBe('-1.99');
      });
    });

    describe('FLOOR', () => {
      it('should round towards negative infinity', () => {
        const df = new DecimalFormat('#,##0.00');
        df.setRoundingMode(RoundingMode.FLOOR);
        expect(df.format(1.999)).toBe('1.99');
        expect(df.format(-1.001)).toBe('-1.01');
      });
    });

    describe('HALF_DOWN', () => {
      it('should round towards nearest neighbor, tie towards zero', () => {
        const df = new DecimalFormat('#,##0.0');
        df.setRoundingMode(RoundingMode.HALF_DOWN);
        expect(df.format(1.15)).toBe('1.1');
        expect(df.format(1.25)).toBe('1.2');
      });
    });

    describe('HALF_EVEN', () => {
      it('should round towards nearest neighbor, tie towards even', () => {
        const df = new DecimalFormat('#,##0.0');
        df.setRoundingMode(RoundingMode.HALF_EVEN);
        expect(df.format(1.15)).toBe('1.2'); // Round to even (2)
        expect(df.format(1.25)).toBe('1.2'); // Round to even (2)
        expect(df.format(1.35)).toBe('1.4'); // Round to even (4)
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle very large numbers', () => {
      const df = new DecimalFormat('$#,##0.00');
      expect(df.format(1234567890.12)).toBe('$1,234,567,890.12');
    });

    it('should handle very small numbers', () => {
      const df = new DecimalFormat('#,##0.0000');
      expect(df.format(0.0001)).toBe('0.0001');
    });

    it('should format string numbers', () => {
      const df = new DecimalFormat('$#,##0.00');
      expect(df.format('-1234.56')).toBe('-$1,234.56');
    });

    it('should handle infinity', () => {
      const df = new DecimalFormat('#,##0.00');
      expect(df.format(Infinity)).toBe('∞');
      expect(df.format(-Infinity)).toBe('-∞');
    });

    it('should throw on NaN', () => {
      const df = new DecimalFormat('#,##0.00');
      expect(() => df.format(NaN)).toThrow('Cannot format NaN');
    });
  });

  describe('API methods', () => {
    it('should get and set positive prefix', () => {
      const df = new DecimalFormat('#,##0.00');
      df.setPositivePrefix('$');
      expect(df.getPositivePrefix()).toBe('$');
      expect(df.format(100)).toBe('$100.00');
    });

    it('should get and set negative prefix', () => {
      const df = new DecimalFormat('#,##0.00');
      df.setNegativePrefix('($');
      df.setNegativeSuffix(')');
      expect(df.format(-100)).toBe('($100.00)');
    });

    it('should apply new pattern', () => {
      const df = new DecimalFormat('#,##0.00');
      expect(df.format(1234.56)).toBe('1,234.56');

      df.applyPattern('$#,##0.00');
      expect(df.format(1234.56)).toBe('$1,234.56');
    });

    it('should get pattern', () => {
      const df = new DecimalFormat('$#,##0.00');
      expect(df.toPattern()).toBe('$#,##0.00');
    });

    it('should set and get grouping used', () => {
      const df = new DecimalFormat('#,##0');
      expect(df.isGroupingUsed()).toBe(true);

      df.setGroupingUsed(false);
      expect(df.isGroupingUsed()).toBe(false);
      expect(df.format(1234)).toBe('1234');
    });

    it('should set and get minimum fraction digits', () => {
      const df = new DecimalFormat('#.##');
      df.setMinimumFractionDigits(2);
      expect(df.getMinimumFractionDigits()).toBe(2);
      expect(df.format(5)).toBe('5.00');
    });
  });
});
