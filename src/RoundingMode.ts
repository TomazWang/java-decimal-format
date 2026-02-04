/**
 * Rounding modes matching java.math.RoundingMode
 */
export enum RoundingMode {
  /**
   * Rounding mode to round away from zero.
   * Always increments the digit prior to a non-zero discarded fraction.
   */
  UP = 0,

  /**
   * Rounding mode to round towards zero.
   * Never increments the digit prior to a discarded fraction (i.e., truncates).
   */
  DOWN = 1,

  /**
   * Rounding mode to round towards positive infinity.
   * If positive, behaves as UP; if negative, behaves as DOWN.
   */
  CEILING = 2,

  /**
   * Rounding mode to round towards negative infinity.
   * If positive, behaves as DOWN; if negative, behaves as UP.
   */
  FLOOR = 3,

  /**
   * Rounding mode to round towards "nearest neighbor"
   * unless both neighbors are equidistant, in which case round up.
   */
  HALF_UP = 4,

  /**
   * Rounding mode to round towards "nearest neighbor"
   * unless both neighbors are equidistant, in which case round down.
   */
  HALF_DOWN = 5,

  /**
   * Rounding mode to round towards the "nearest neighbor"
   * unless both neighbors are equidistant, in which case, round towards the even neighbor.
   * Also known as "Banker's rounding".
   */
  HALF_EVEN = 6,

  /**
   * Rounding mode to assert that the requested operation has an exact result,
   * hence no rounding is necessary.
   * If this rounding mode is specified on an operation that yields an inexact result,
   * an exception is thrown.
   */
  UNNECESSARY = 7,
}
