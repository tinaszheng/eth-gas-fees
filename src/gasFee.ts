import { providers } from "ethers";
import * as OptimismSDK from '@eth-optimism/sdk'
import { GAS_FAST_MULTIPLIER, GAS_LIMIT_INFLATION_FACTOR, GAS_URGENT_MULTIPLIER, OP_DYNAMIC_OVERHEAD, OP_FIXED_OVERHEAD, ZERO } from "./consts";
import { CHAIN_INFO, EIP_1559_CHAINS, SupportedChainId } from "./provider";
import { suggestFees } from "./eip1559FeeSuggestion";
import { FeeResponse, FeeResponseEip1559, FeeResponseLegacy, FeeType } from "./types";

export const calculateGasFee = async (request: providers.TransactionRequest): Promise<FeeResponse> => {
    const chainId = (request.chainId as SupportedChainId) ?? SupportedChainId.Mainnet

    // mainnet and polygon 
    if (EIP_1559_CHAINS.includes(chainId)) return await calculateEIP1559Fee(request)

    // optimism
    if (chainId === SupportedChainId.Optimism) return await calculateOptimismFee(request)

    // arbitrum
    return await calculateArbitrumFee(request)
}

const calculateEIP1559Fee = async (request: providers.TransactionRequest): Promise<FeeResponseEip1559> => {
    const provider = CHAIN_INFO[request.chainId as SupportedChainId].provider 
    const baseGasLimit = await provider.estimateGas(request)
    const gasLimit = baseGasLimit.mul(GAS_LIMIT_INFLATION_FACTOR)
    
    const { baseFeeSuggestion, priorityFeeSuggestions } = await suggestFees(provider)
    const normalFeePerGas = baseFeeSuggestion.add(priorityFeeSuggestions.normal)
    const fastFeePerGas = baseFeeSuggestion.add(priorityFeeSuggestions.fast)
    const urgentFeePerGas = baseFeeSuggestion.add(priorityFeeSuggestions.urgent)
    const normalFee = normalFeePerGas.mul(gasLimit)
    const fastFee = fastFeePerGas.mul(gasLimit)
    const urgentFee = urgentFeePerGas.mul(gasLimit)
    return {
        type: FeeType.Eip1559,
        gasLimit: gasLimit.toString(),
        gasFee: {
            normal: normalFee.toString(),
            fast: fastFee.toString(),
            urgent: urgentFee.toString(),
        },
        maxBaseFeePerGas: baseFeeSuggestion.toString(),
        maxPriorityFeePerGas: {
            normal: priorityFeeSuggestions.normal.toString(),
            fast: priorityFeeSuggestions.fast.toString(),
            urgent: priorityFeeSuggestions.urgent.toString(),
        },
    }
}

const calculateOptimismFee = async (request: providers.TransactionRequest): Promise<FeeResponseLegacy> => {
    const provider = CHAIN_INFO[request.chainId as SupportedChainId].provider 
    const baseGasLimit = await provider.estimateGas(request)
    const gasLimit = baseGasLimit.mul(GAS_LIMIT_INFLATION_FACTOR)
    const gasPrice = await provider.getGasPrice() 

    const { l1DataFee, l1DataGas } = await calculateOptimismL1DataFee(request)
    const l2ExecutionFee = gasPrice.mul(gasPrice)
    const baseGasFee = l1DataFee.add(l2ExecutionFee)

    return {
        type: FeeType.Legacy,
        gasLimit: gasLimit.toString(),
        gasFee: {
            normal: baseGasFee.toString(),
            fast: baseGasFee.mul(GAS_FAST_MULTIPLIER).toString(),
            urgent: baseGasFee.mul(GAS_URGENT_MULTIPLIER).toString(),
        },
        gasPrice: {
            normal: gasPrice.toString(),
            fast: gasPrice.mul(GAS_FAST_MULTIPLIER).toString(),
            urgent: gasPrice.mul(GAS_URGENT_MULTIPLIER).toString(),
        },
        l1DataFee: l1DataFee.toString(),
        l1DataGas: l1DataGas.toString(),
    }
}

const calculateArbitrumFee = async (request: providers.TransactionRequest): Promise<FeeResponseLegacy> => {
    const provider = CHAIN_INFO[request.chainId as SupportedChainId].provider 
    const baseGasLimit = await provider.estimateGas(request)
    const gasPrice = await provider.getGasPrice() 

    const gasLimit = baseGasLimit.mul(GAS_LIMIT_INFLATION_FACTOR)
    const baseGasFee = gasLimit.mul(gasPrice)

    return {
        type: FeeType.Legacy,
        gasLimit: gasLimit.toString(),
        gasFee: {
            normal: baseGasFee.toString(),
            fast: baseGasFee.mul(GAS_FAST_MULTIPLIER).toString(),
            urgent: baseGasFee.mul(GAS_URGENT_MULTIPLIER).toString(),
        },
        gasPrice: {
            normal: gasPrice.toString(),
            fast: gasPrice.mul(GAS_FAST_MULTIPLIER).toString(),
            urgent: gasPrice.mul(GAS_URGENT_MULTIPLIER).toString(),
        },
    }
}

const calculateOptimismL1DataFee = async (request: providers.TransactionRequest) => {
    const mainnetProvider = CHAIN_INFO[SupportedChainId.Mainnet].provider 
    const opProvider = CHAIN_INFO[SupportedChainId.Optimism].provider
    const mainnetGasPrice = await mainnetProvider.getGasPrice()
    const l2Provider = OptimismSDK.asL2Provider(opProvider)
    const l1DataGas = await l2Provider.estimateL1Gas(request)

    return { l1DataGas, l1DataFee: l1DataGas.mul(mainnetGasPrice).mul(OP_DYNAMIC_OVERHEAD)}
} 


