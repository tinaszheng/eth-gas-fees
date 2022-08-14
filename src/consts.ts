import { BigNumber } from "ethers";

export const ZERO = BigNumber.from(0)

// these are hard-coded values set by optimism
// https://community.optimism.io/docs/developers/build/transaction-fees/#the-l1-data-fee
export const OP_FIXED_OVERHEAD = BigNumber.from(2100)
export const OP_DYNAMIC_OVERHEAD = BigNumber.from(1)
