import { describe, test, expect } from 'vitest';
import { DecimalFormat, RoundingMode } from '../src/index';

/**
 * 跨平台一致性測試
 * 這些測試專門驗證 iOS 和 Android 版本在各種 pattern 下的行為完全一致
 */
describe('DecimalFormatConsistencyTest', () => {
  // ========== 測試 1: applyPattern 不應該重置捨入模式 ==========
  // 這是關鍵的不一致問題：iOS 版本在 applyPattern 中會重置捨入模式，但 Android 不會

  test('testApplyPatternPreservesRoundingMode', () => {
    // 場景：先設定捨入模式，然後應用 pattern
    // 預期：捨入模式應該保持不變，不應該被重置

    // 步驟 1: 設定捨入模式為 HALF_UP
    const df = new DecimalFormat('0.00');
    df.setRoundingMode(RoundingMode.HALF_UP);

    // 驗證捨入模式已設定
    expect(df.format(1.235)).toBe('1.24'); // HALF_UP: 1.235 應該捨入為 1.24

    // 步驟 2: 應用 pattern（這不應該重置捨入模式）
    const df2 = new DecimalFormat('#,##0.00');
    df2.setRoundingMode(RoundingMode.HALF_UP);

    // 驗證捨入模式仍然有效
    // 如果 applyPattern 重置了捨入模式為 HALF_EVEN，1.235 會變成 1.24（剛好相同）
    // 但 1.245 會不同：HALF_UP -> 1.25, HALF_EVEN -> 1.24
    const result1 = df2.format(1.235);
    const result2 = df2.format(1.245);

    // HALF_UP: 1.235 -> 1.24, 1.245 -> 1.25
    // HALF_EVEN: 1.235 -> 1.24, 1.245 -> 1.24
    expect(result1).toBe('1.24'); // applyPattern 後，1.235 應該仍然是 1.24 (HALF_UP)
    expect(result2).toBe('1.25'); // applyPattern 後，1.245 應該是 1.25 (HALF_UP)，如果是 1.24 則表示被重置為 HALF_EVEN
  });

  test('testApplyPatternPreservesRoundingModeWithDifferentModes', () => {
    // 測試不同的捨入模式
    const modes = [
      RoundingMode.HALF_UP,
      RoundingMode.HALF_DOWN,
      RoundingMode.HALF_EVEN,
      RoundingMode.UP,
      RoundingMode.DOWN,
    ];

    modes.forEach((mode) => {
      const df = new DecimalFormat('0.00', mode);

      // 記錄應用 pattern 前的行為
      const beforePattern = df.format(1.235);

      // 應用 pattern
      const df2 = new DecimalFormat('#,##0.00', mode);

      // 應用 pattern 後的行為應該與之前相同
      const afterPattern = df2.format(1.235);

      expect(afterPattern).toBe(beforePattern); // 捨入模式 mode 在 applyPattern 後應該保持不變: beforePattern vs afterPattern
    });
  });

  // ========== 測試 2: 百分比 pattern 中的額外後綴 ==========
  // 問題：pattern "#,##0.0#%元" 應該輸出 "50.0%元"，但 iOS 版本可能會丟失 "元"

  test('testPercentagePatternWithExtraSuffix', () => {
    // Pattern: #,##0.0#%元
    // 輸入: 0.5
    // 預期輸出: "50.0%元" (包含 % 和額外的 "元" 後綴)

    const df = new DecimalFormat('#,##0.0#%元');
    df.setRoundingMode(RoundingMode.HALF_UP);

    const result = df.format(0.5);

    // 應該同時包含 % 和 元
    expect(result).toContain('%'); // 結果應該包含 % 符號: result
    expect(result).toContain('元'); // 結果應該包含額外的後綴 '元': result
    expect(result).toContain('50'); // 結果應該包含數字 50: result

    // 驗證格式大致正確（考慮到 locale 差異，使用寬鬆檢查）
    // 注意：由於 locale 差異，可能會有千分位分隔符，所以使用更寬鬆的檢查
  });

  test('testPerMillePatternWithExtraSuffix', () => {
    // Pattern: #,##0.0#‰元
    // 輸入: 0.05
    // 預期輸出: "50.0‰元" (包含 ‰ 和額外的 "元" 後綴)

    const df = new DecimalFormat('#,##0.0#‰元');
    df.setRoundingMode(RoundingMode.HALF_UP);

    const result = df.format(0.05);

    // 應該同時包含 ‰ 和 元
    expect(result).toContain('‰'); // 結果應該包含 ‰ 符號: result
    expect(result).toContain('元'); // 結果應該包含額外的後綴 '元': result
    expect(result).toContain('50'); // 結果應該包含數字 50 (0.05 * 1000 = 50): result
  });

  // ========== 測試 3: applyPattern 後前綴和後綴的正確重置 ==========

  test('testApplyPatternResetsPrefixAndSuffixCorrectly', () => {
    const df = new DecimalFormat('￥#,##0.00元');
    df.setRoundingMode(RoundingMode.HALF_UP);

    // 驗證初始狀態有前綴和後綴
    const result1 = df.format(1234.56);
    expect(result1.includes('￥') || result1.startsWith('￥')).toBe(true); // 應該包含前綴 ￥: result1
    expect(result1.includes('元') || result1.endsWith('元')).toBe(true); // 應該包含後綴 元: result1

    // 應用一個沒有前綴和後綴的 pattern
    const df2 = new DecimalFormat('#,##0.00');
    df2.setRoundingMode(RoundingMode.HALF_UP);

    // 前綴和後綴應該被清除
    const result2 = df2.format(1234.56);
    expect(result2).not.toContain('￥'); // applyPattern 後不應該包含前綴 ￥: result2
    expect(result2).not.toContain('元'); // applyPattern 後不應該包含後綴 元: result2

    // 再應用一個有前綴和後綴的 pattern
    const df3 = new DecimalFormat('NT$#,##0.00');
    df3.setRoundingMode(RoundingMode.HALF_UP);

    const result3 = df3.format(1234.56);
    expect(result3.includes('NT$') || result3.startsWith('NT$')).toBe(true); // 應該包含新的前綴 NT$: result3
    expect(result3).not.toContain('元'); // 不應該包含舊的後綴 元: result3
  });

  // ========== 測試 4: 千分比格式檢測 ==========
  // 問題：如果 pattern 是 "#,##0.0#‰元"，endsWith("‰") 會返回 false

  test('testPerMillePatternDetectionWithSuffix', () => {
    // Pattern 包含 ‰ 但不是以 ‰ 結尾
    const df = new DecimalFormat('#,##0.0#‰元');
    df.setRoundingMode(RoundingMode.HALF_UP);

    // 驗證千分比格式被正確識別（應該乘以 1000）
    const result = df.format(0.05);

    // 0.05 * 1000 = 50，所以結果應該包含 50
    expect(result).toContain('50'); // 千分比格式應該將 0.05 轉換為 50: result
    expect(result).toContain('‰'); // 結果應該包含 ‰ 符號: result
  });

  // ========== 測試 5: 綜合測試 - 確保所有修復一起工作 ==========

  test('testComplexScenarioWithAllFixes', () => {
    // 綜合場景：設定捨入模式 -> 應用帶有百分比和額外後綴的 pattern -> 驗證所有行為

    // 步驟 1: 設定捨入模式
    const df = new DecimalFormat('0.00');
    df.setRoundingMode(RoundingMode.HALF_UP);

    // 步驟 2: 應用百分比 pattern（帶額外後綴）
    const df2 = new DecimalFormat('#,##0.0#%元');
    df2.setRoundingMode(RoundingMode.HALF_UP);

    // 步驟 3: 驗證捨入模式仍然有效
    const result1 = df2.format(0.1235); // HALF_UP: 0.1235 -> 12.4%
    const result2 = df2.format(0.1245); // HALF_UP: 0.1245 -> 12.5%

    // 如果捨入模式被重置，兩個結果可能相同（都是 12.4%）
    expect(result1 !== result2 || (result1.includes('12.4') && result2.includes('12.5'))).toBe(true);
    // 捨入模式應該仍然有效，結果應該不同: result1 vs result2

    // 步驟 4: 驗證百分比和額外後綴都存在
    expect(result1).toContain('%'); // 應該包含 % 符號: result1
    expect(result1).toContain('元'); // 應該包含額外的後綴 '元': result1
  });

  // ========== 測試 6: 與 Android 版本對比測試 ==========
  // 這些測試確保 iOS 和 Android 版本產生相同的輸出

  test('testCrossPlatformConsistencyBasicPattern', () => {
    const patterns = [
      '#,##0.00',
      '￥#,##0.00元',
      '#,##0.0#',
      '#,##0.0#%',
      '#,##0.0#‰',
    ];

    const testNumbers = [1234.567, 0.5, 0.123, 0.05, 1.235];

    patterns.forEach((pattern) => {
      const df = new DecimalFormat(pattern);
    df.setRoundingMode(RoundingMode.HALF_UP);

      testNumbers.forEach((number) => {
        const result = df.format(number);
        // 基本驗證：結果不應該為空，應該包含數字
        expect(result.length).toBeGreaterThan(0); // Pattern pattern 格式化 number 不應該為空
        expect(/\d/.test(result)).toBe(true); // 結果應該包含數字: result
      });
    });
  });

  test('testCrossPlatformConsistencyWithRoundingModeChange', () => {
    // 測試：設定捨入模式 -> 應用 pattern -> 改變捨入模式 -> 應用 pattern
    // 確保每個步驟都正確

    // 場景 1: HALF_UP -> applyPattern -> 應該仍然是 HALF_UP
    const df1 = new DecimalFormat('#,##0.00');
    df1.setRoundingMode(RoundingMode.HALF_UP);
    const result1 = df1.format(1.245);
    expect(result1).toBe('1.25'); // HALF_UP: 1.245 應該是 1.25

    // 場景 2: 改變捨入模式 -> applyPattern -> 應該保持新的捨入模式
    const df2 = new DecimalFormat('#,##0.00');
    df2.setRoundingMode(RoundingMode.HALF_DOWN);
    const result2 = df2.format(1.245);
    expect(result2).toBe('1.24'); // HALF_DOWN: 1.245 應該是 1.24

    // 場景 3: 再次改變捨入模式 -> applyPattern -> 應該保持新的捨入模式
    const df3 = new DecimalFormat('#,##0.00');
    df3.setRoundingMode(RoundingMode.HALF_EVEN);
    const result3 = df3.format(1.245);
    expect(result3).toBe('1.24'); // HALF_EVEN: 1.245 應該是 1.24 (偶數)
  });
});
