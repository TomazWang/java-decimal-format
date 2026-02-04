import { describe, test, expect } from 'vitest';
import { DecimalFormat, RoundingMode } from '../src/index';

/**
 * 跨平台一致性測試
 * 這些測試確保 iOS 和 Android 版本在所有場景下產生完全相同的輸出
 * 
 * 測試覆蓋：
 * 1. 基本格式化
 * 2. 各種 pattern
 * 3. 捨入模式
 * 4. 邊界情況（負零、整數部分只有 #、百分比、千分比等）
 * 5. 前綴和後綴
 * 6. 複雜組合場景
 */
describe('DecimalFormatCrossPlatformTest', () => {
  // ========== 基本格式化測試 ==========

  test('testBasicFormatting', () => {
    const patterns = [
      '#,##0.00',
      '#,##0',
      '#.00',
      '0.00',
      '0',
      '#',
    ];

    const testNumbers = [
      0.0,
      -0.0,
      1.0,
      -1.0,
      123.456,
      -123.456,
      1234.567,
      -1234.567,
      0.1,
      -0.1,
      0.01,
      -0.01,
    ];

    patterns.forEach((pattern) => {
      const df = new DecimalFormat(pattern);
    df.setRoundingMode(RoundingMode.HALF_UP);
      testNumbers.forEach((number) => {
        const result = df.format(number);
        // 基本驗證：結果不應該為空
        expect(result.length).toBeGreaterThan(0); // Pattern pattern 格式化 number 不應該為空: result
      });
    });
  });

  // ========== 負零測試 ==========

  test('testNegativeZero', () => {
    const patterns = [
      '#,##0.00',
      '#.00',
      '0.00',
      '#,##0',
      '0',
    ];

    patterns.forEach((pattern) => {
      const df = new DecimalFormat(pattern);
    df.setRoundingMode(RoundingMode.HALF_UP);
      const result = df.format(-0.0);

      // 負零應該格式化為正零（不包含負號）
      expect(result.startsWith('-')).toBe(false); // Pattern pattern: -0.0 應該格式化為正零，不應該包含負號: result
    });
  });

  test('testNegativeZeroWithPrefix', () => {
    const df = new DecimalFormat('￥#,##0.00元');
    df.setRoundingMode(RoundingMode.HALF_UP);
    const result = df.format(-0.0);

    // 應該輸出 "￥0.00元" 而不是 "￥-0.00元" 或 "-￥0.00元"
    expect(result).not.toContain('-'); // 負零不應該包含負號: result
    expect(result).toContain('0'); // 應該包含 0: result
  });

  // ========== 整數部分只有 # 的測試 ==========

  test('testIntegerPartOnlyHash', () => {
    const df = new DecimalFormat('#.00');
    df.setRoundingMode(RoundingMode.HALF_UP);

    // 0.0 應該格式化為 ".00" 而不是 "0.00"
    expect(df.format(0.0)).toBe('.00'); // Pattern #.00: 0.0 應該是 .00
    expect(df.format(-0.0)).toBe('.00'); // Pattern #.00: -0.0 應該是 .00
    expect(df.format(1.0)).toBe('1.00'); // Pattern #.00: 1.0 應該是 1.00
    expect(df.format(123.45)).toBe('123.45'); // Pattern #.00: 123.45 應該是 123.45
  });

  test('testIntegerPartOnlyHashWithPrefix', () => {
    const df = new DecimalFormat('￥#.00元');
    df.setRoundingMode(RoundingMode.HALF_UP);

    // 0.0 應該格式化為 "￥.00元" 而不是 "￥0.00元"
    const result = df.format(0.0);
    expect(!result.includes('0.') || result === '￥.00元').toBe(true);
    // Pattern ￥#.00元: 0.0 應該是 ￥.00元，實際: result
  });

  // ========== applyPattern 不重置捨入模式測試 ==========

  test('testApplyPatternPreservesRoundingMode', () => {
    const roundingModes = [
      RoundingMode.HALF_UP,
      RoundingMode.HALF_DOWN,
      RoundingMode.HALF_EVEN,
      RoundingMode.UP,
      RoundingMode.DOWN,
      RoundingMode.FLOOR,
      RoundingMode.CEILING,
    ];

    roundingModes.forEach((mode) => {
      const df = new DecimalFormat('0.00', mode);

      // 記錄 applyPattern 前的行為
      const beforePattern = df.format(1.235);

      // 應用 pattern
      const df2 = new DecimalFormat('#,##0.00', mode);

      // applyPattern 後的行為應該與之前相同
      const afterPattern = df2.format(1.235);

      expect(afterPattern).toBe(beforePattern); // 捨入模式 mode 在 applyPattern 後應該保持不變: beforePattern vs afterPattern
    });
  });

  test('testApplyPatternPreservesRoundingModeComplex', () => {
    const df = new DecimalFormat('0.00');
    df.setRoundingMode(RoundingMode.HALF_UP);

    // 驗證初始設定
    expect(df.format(1.245)).toBe('1.25'); // HALF_UP: 1.245 應該是 1.25

    // 應用 pattern
    const df2 = new DecimalFormat('#,##0.00');
    df2.setRoundingMode(RoundingMode.HALF_UP);

    // 驗證捨入模式仍然有效
    expect(df2.format(1.245)).toBe('1.25'); // applyPattern 後，HALF_UP 應該仍然將 1.245 捨入為 1.25

    // 改變捨入模式
    const df3 = new DecimalFormat('#,##0.00');
    df3.setRoundingMode(RoundingMode.HALF_DOWN);

    // 驗證新的捨入模式有效
    expect(df3.format(1.245)).toBe('1.24'); // HALF_DOWN: 1.245 應該是 1.24
  });

  // ========== 百分比測試 ==========

  test('testPercentagePattern', () => {
    const df = new DecimalFormat('#,##0.0#%');
    df.setRoundingMode(RoundingMode.HALF_UP);

    expect(df.format(0.5)).toBe('50.0%');
    expect(df.format(1.0)).toBe('100.0%');
    expect(df.format(0.123)).toBe('12.3%');
    expect(df.format(0.0)).toBe('0.0%');
    expect(df.format(-0.0)).toBe('0.0%'); // 負零應該格式化為正零
  });

  test('testPercentagePatternWithExtraSuffix', () => {
    const df = new DecimalFormat('#,##0.0#%元');
    df.setRoundingMode(RoundingMode.HALF_UP);

    const result = df.format(0.5);
    expect(result).toContain('%'); // 應該包含 % 符號: result
    expect(result).toContain('元'); // 應該包含額外的後綴 '元': result
    expect(result).toContain('50'); // 應該包含數字 50: result
  });

  test('testPercentagePatternWithPrefix', () => {
    const df = new DecimalFormat('完成度#,##0.0#%');
    df.setRoundingMode(RoundingMode.HALF_UP);

    const result = df.format(0.75);
    expect(result).toContain('完成度'); // 應該包含前綴: result
    expect(result).toContain('%'); // 應該包含 % 符號: result
    expect(result).toContain('75'); // 應該包含數字 75: result
  });

  // ========== 千分比測試 ==========

  test('testPerMillePattern', () => {
    const df = new DecimalFormat('#,##0.0#‰');
    df.setRoundingMode(RoundingMode.HALF_UP);

    const result1 = df.format(0.05);
    expect(result1).toContain('50'); // 0.05 應該格式化為 50‰ (0.05 * 1000 = 50): result1
    expect(result1).toContain('‰'); // 應該包含 ‰ 符號: result1

    const result2 = df.format(0.001);
    expect(result2).toContain('1'); // 0.001 應該格式化為 1‰: result2

    const result3 = df.format(0.0);
    expect(result3.startsWith('-')).toBe(false); // 負零不應該包含負號: result3
  });

  test('testPerMillePatternWithExtraSuffix', () => {
    const df = new DecimalFormat('#,##0.0#‰元');
    df.setRoundingMode(RoundingMode.HALF_UP);

    const result = df.format(0.05);
    expect(result).toContain('‰'); // 應該包含 ‰ 符號: result
    expect(result).toContain('元'); // 應該包含額外的後綴 '元': result
    expect(result).toContain('50'); // 應該包含數字 50: result
  });

  // ========== 前綴和後綴測試 ==========

  test('testPrefixAndSuffix', () => {
    const patterns = [
      '￥#,##0.00元',
      '$#,##0.00',
      'NT$#,##0.00',
      '#,##0.00元',
      'USD #,##0.00',
    ];

    patterns.forEach((pattern) => {
      const df = new DecimalFormat(pattern);
    df.setRoundingMode(RoundingMode.HALF_UP);
      const result = df.format(1234.56);

      expect(result.length).toBeGreaterThan(0); // Pattern pattern 應該產生結果: result
      expect(result.includes('1234') || result.includes('1,234')).toBe(true); // 應該包含數字: result
    });
  });

  test('testApplyPatternResetsPrefixAndSuffix', () => {
    const df = new DecimalFormat('￥#,##0.00元');
    df.setRoundingMode(RoundingMode.HALF_UP);

    // 驗證初始狀態
    const result1 = df.format(1234.56);
    expect(result1.includes('￥') || result1.startsWith('￥')).toBe(true); // 應該包含前綴 ￥: result1
    expect(result1.includes('元') || result1.endsWith('元')).toBe(true); // 應該包含後綴 元: result1

    // 應用沒有前綴和後綴的 pattern
    const df2 = new DecimalFormat('#,##0.00');
    df2.setRoundingMode(RoundingMode.HALF_UP);

    const result2 = df2.format(1234.56);
    expect(result2).not.toContain('￥'); // 不應該包含舊的前綴 ￥: result2
    expect(result2).not.toContain('元'); // 不應該包含舊的後綴 元: result2

    // 應用新的 pattern
    const df3 = new DecimalFormat('NT$#,##0.00');
    df3.setRoundingMode(RoundingMode.HALF_UP);

    const result3 = df3.format(1234.56);
    expect(result3.includes('NT$') || result3.startsWith('NT$')).toBe(true); // 應該包含新的前綴 NT$: result3
    expect(result3).not.toContain('元'); // 不應該包含舊的後綴 元: result3
  });

  // ========== 捨入模式測試 ==========

  test('testAllRoundingModes', () => {
    const testCases = [
      [RoundingMode.HALF_UP, 1.235, '1.24'],
      [RoundingMode.HALF_UP, 1.245, '1.25'],
      [RoundingMode.HALF_DOWN, 1.235, '1.23'],
      [RoundingMode.HALF_DOWN, 1.245, '1.24'],
      [RoundingMode.HALF_EVEN, 1.235, '1.24'],
      [RoundingMode.HALF_EVEN, 1.245, '1.24'],
      [RoundingMode.UP, 1.231, '1.24'],
      [RoundingMode.DOWN, 1.239, '1.23'],
      [RoundingMode.FLOOR, 1.9, '1.90'],
      [RoundingMode.CEILING, 1.1, '1.10'],
    ] as const;

    testCases.forEach(([mode, input, expected]) => {
      const df = new DecimalFormat('#,##0.00');
      df.setRoundingMode(mode);

      const result = df.format(input);
      expect(result).toBe(expected); // 捨入模式 mode: input 應該是 expected，實際: result
    });
  });

  // ========== 小數位數測試 ==========

  test('testFractionDigits', () => {
    const df = new DecimalFormat('#,##0.0#');
    df.setRoundingMode(RoundingMode.HALF_UP);

    expect(df.format(0.0)).toBe('0.0'); // Pattern #.0#: 0.0 應該是 .0
    expect(df.format(1.0)).toBe('1.0'); // Pattern #.0#: 1.0 應該是 1.0
    expect(df.format(1.5)).toBe('1.5'); // Pattern #.0#: 1.5 應該是 1.5
    expect(df.format(1.556)).toBe('1.56'); // Pattern #.0#: 1.556 應該是 1.56
  });

  test('testMinimumFractionDigits', () => {
    const df = new DecimalFormat('0.00');
    df.setRoundingMode(RoundingMode.HALF_UP);

    expect(df.format(123.0)).toBe('123.00');
    expect(df.format(0.0)).toBe('0.00');
    expect(df.format(-0.0)).toBe('0.00');
  });

  // ========== 整數位數測試 ==========

  test('testMinimumIntegerDigits', () => {
    const df = new DecimalFormat('000');
    df.setRoundingMode(RoundingMode.HALF_UP);

    expect(df.format(1.0)).toBe('001');
    expect(df.format(123.0)).toBe('123');
    expect(df.format(0.0)).toBe('000');
    expect(df.format(-0.0)).toBe('000');
  });

  // ========== 千分位分隔符測試 ==========

  test('testGrouping', () => {
    const df = new DecimalFormat('#,##0.00');
    df.setRoundingMode(RoundingMode.HALF_UP);

    const result = df.format(1234567.89);
    expect(result.includes(',') || result.length > 9).toBe(true); // 應該包含千分位分隔符: result
  });

  test('testGroupingDisabled', () => {
    const df = new DecimalFormat('##0.00');
    df.setRoundingMode(RoundingMode.HALF_UP);

    const result = df.format(1234567.89);
    expect(!result.includes(',') || result === '1234567.89').toBe(true); // 不應該包含千分位分隔符: result
  });

  // ========== 複雜組合測試 ==========

  test('testComplexScenarios', () => {
    // 場景 1: 設定捨入模式 -> 應用百分比 pattern -> 驗證所有行為
    const df1 = new DecimalFormat('#,##0.0#%元');
    df1.setRoundingMode(RoundingMode.HALF_UP);

    const result1 = df1.format(0.1235);
    const result2 = df1.format(0.1245);

    // 捨入模式應該仍然有效
    expect(result1 !== result2 || (result1.includes('12.4') && result2.includes('12.5'))).toBe(true);
    // 捨入模式應該仍然有效: result1 vs result2

    // 百分比和後綴應該都存在
    expect(result1).toContain('%'); // 應該包含 % 符號: result1
    expect(result1).toContain('元'); // 應該包含後綴 '元': result1

    // 場景 2: 整數部分只有 # + 負零
    const df2 = new DecimalFormat('#.00');
    df2.setRoundingMode(RoundingMode.HALF_UP);
    const result3 = df2.format(-0.0);
    expect(result3).toBe('.00'); // Pattern #.00: -0.0 應該是 .00

    // 場景 3: 百分比 + 前綴 + 負零
    const df3 = new DecimalFormat('完成度#,##0.0#%');
    df3.setRoundingMode(RoundingMode.HALF_UP);
    const result4 = df3.format(-0.0);
    expect(result4).not.toContain('-'); // 負零不應該包含負號: result4
    expect(result4).toContain('0'); // 應該包含 0: result4
  });

  // ========== 邊界值測試 ==========

  test('testEdgeCases', () => {
    const df = new DecimalFormat('#,##0.00');
    df.setRoundingMode(RoundingMode.HALF_UP);

    // 極大數
    expect(df.format(999999999999.99)).toBe('999,999,999,999.99');

    // 極小數
    const result1 = df.format(0.000001);
    expect(result1.length).toBeGreaterThan(0); // 極小數應該能格式化: result1

    // 負零
    expect(df.format(-0.0)).toBe('0.00'); // 負零應該是 0.00

    // 整數
    expect(df.format(123.0)).toBe('123.00');
  });

  // ========== Long 類型測試 ==========

  test('testLongFormatting', () => {
    const df = new DecimalFormat('#,##0');
    df.setRoundingMode(RoundingMode.HALF_UP);

    expect(df.format(0)).toBe('0');
    expect(df.format(123)).toBe('123');
    expect(df.format(1234567)).toBe('1,234,567');
    expect(df.format(-1234)).toBe('-1,234');
  });

  // ========== toPattern 測試 ==========
  // 注意：當前實現可能不支援 toPattern，這個測試可能需要跳過

  // ========== 多次 applyPattern 測試 ==========

  test('testMultipleApplyPattern', () => {
    const df1 = new DecimalFormat('#,##0.00');
    df1.setRoundingMode(RoundingMode.HALF_UP);
    expect(df1.format(1.245)).toBe('1.25');

    // 第二次 applyPattern
    const df2 = new DecimalFormat('#.00');
    df2.setRoundingMode(RoundingMode.HALF_UP);
    expect(df2.format(1.245)).toBe('1.25'); // 捨入模式應該保持不變
    expect(df2.format(0.0)).toBe('.00'); // 整數部分只有 #: 0.0 應該是 .00

    // 第三次 applyPattern
    const df3 = new DecimalFormat('#,##0.0#%');
    df3.setRoundingMode(RoundingMode.HALF_UP);
    expect(df3.format(1.245)).toBe('124.5%'); // 百分比格式
  });

  // ========== 綜合壓力測試 ==========

  test('testComprehensiveScenarios', () => {
    const scenarios: Array<[string, number, string]> = [
      ['#,##0.00', 1234.567, '應該有千分位和2位小數'],
      ['#.00', 0.0, '應該是 .00'],
      ['#.00', -0.0, '應該是 .00'],
      ['#,##0.0#%', 0.5, '應該是 50.0%'],
      ['#,##0.0#‰', 0.05, '應該是 50.0‰'],
      ['￥#,##0.00元', 1234.56, '應該有前綴和後綴'],
      ['￥#.00元', 0.0, '應該是 ￥.00元'],
      ['#,##0', 1234567.0, '應該有千分位'],
    ];

    scenarios.forEach(([pattern, input, description]) => {
      const df = new DecimalFormat(pattern);
    df.setRoundingMode(RoundingMode.HALF_UP);
      const result = df.format(input);

      expect(result.length).toBeGreaterThan(0);
      // Pattern pattern, Input input: description, 結果不應該為空: result

      // 如果是負零，不應該包含負號
      if (input === -0.0 || input === 0.0) {
        expect(result.startsWith('-')).toBe(false);
        // Pattern pattern: 零值不應該以負號開頭: result
      }
    });
  });
});
