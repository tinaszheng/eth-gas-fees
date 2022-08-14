import { BigNumber, BigNumberish, FixedNumber, utils } from 'ethers'


export function isValidNumber(n: any) {
  // is not NaN: `NaN === NaN` => `false`
  // eslint-disable-next-line no-self-compare
  return typeof n === 'number' && n === n
}


export function gweiToWei(gweiAmount: number): BigNumber {
  return utils.parseUnits(gweiAmount.toFixed(9), 'gwei')
}

export function weiToGwei(weiAmount: BigNumberish): number {
  if (!weiAmount) return 0
  return FixedNumber.from(utils.formatUnits(weiAmount, 'gwei')).toUnsafeFloat()
}

// Based on https://github.com/rainbow-me/fee-suggestions/blob/39e57a34a509dd916c55a5f160ea2c64cdc879e0/src/utils.ts#L68
export function linearRegression(y: number[]) {
    const x = Array.from(Array(y.length + 1).keys())
    const n = y.length
    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumXX = 0
  
    for (let i = 0; i < y.length; i++) {
      const cY = Number(y[i])
      const cX = Number(x[i])
      sumX += cX
      sumY += cY
      sumXY += cX * cY
      sumXX += cX * cX
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  
    return slope
  }

  // Based on https://github.com/rainbow-me/fee-suggestions/blob/main/src/utils.ts#L42
export function samplingCurve(sumWeight: number, sampleMin: number, sampleMax: number) {
  if (sumWeight <= sampleMin) return 0
  if (sumWeight >= sampleMax) return 1
  return (1 - Math.cos(((sumWeight - sampleMin) * 2 * Math.PI) / (sampleMax - sampleMin))) / 2
}

/** Calculates the percentage difference between two numbers. */
export function percentDifference(t1: number, t2: number) {
  return 100 * (Math.abs(t2 - t1) / t1)
}

/**
 * Calculates the Dynamic Weighted Moving Average
 * Based on https://github.com/kaelzhang/moving-averages/blob/master/src/dma.js
 */
 export function dynamicMovingAverage(
  data: number[],
  alpha: number | number[],
  noHead = false
): number[] {
  const length = data.length
  if (alpha > 1) return Array(length)
  if (alpha === 1) return data.slice()

  const noArrayWeight = !Array.isArray(alpha)
  const ret = []
  let datum
  // period `i`
  let i = 0
  // `s` is the value of the DWMA at any time period `i`
  let s = 0

  // Handles head
  for (; i < length; i++) {
    datum = data[i]
    if (isValidNumber(datum) && (noArrayWeight || isValidNumber(datum))) {
      ret[i] = noHead ? 0 : datum
      s = datum
      i++
      break
    }
  }

  // Dynamic weights: an array of weights
  // Ref: https://en.wikipedia.org/wiki/Moving_average#Exponential_moving_average
  // with a dynamic alpha
  if (!noArrayWeight) {
    for (; i < length; i++) {
      datum = data[i]
      isValidNumber(datum) && isValidNumber(alpha[i])
        ? (s = ret[i] = alpha[i] * datum + (1 - alpha[i]) * s)
        : (ret[i] = ret[i - 1])
    }
    return ret
  }

  const o = 1 - alpha

  // Fixed alpha
  for (; i < length; i++) {
    datum = data[i]
    isValidNumber(datum) ? (s = ret[i] = alpha * datum + o * s) : (ret[i] = ret[i - 1])
  }

  return ret
}

/**
 * Calculates the most frequent used exponential average which covers about 86% of the total weight (when alpha = 2 / (N + 1)).
 * Based on https://github.com/kaelzhang/moving-averages/blob/master/src/ema.js
 */
export function exponentialMovingAverage(data: number[], size: number): number[] {
  return dynamicMovingAverage(data, 2 / (size + 1))
}