import { BytesLike, providers } from "ethers";
import { hexlify } from "ethers/lib/utils";
import { OP_DYNAMIC_OVERHEAD, OP_FIXED_OVERHEAD, ZERO } from "./consts";
import { CHAIN_INFO, EIP_1559_CHAINS, SupportedChainId } from "./provider";

export const calculateGasFee = async (request: providers.TransactionRequest) => {
    const chainId = (request.chainId as SupportedChainId) ?? SupportedChainId.Mainnet
    if (EIP_1559_CHAINS.includes(chainId)) return await calculateEIP1559Fee(request)
    if (chainId === SupportedChainId.Optimism) return await calculateOptimismFee(request)
    if (chainId === SupportedChainId.ArbitrumOne) return await calculateArbitrumFee(request)
}

const calculateEIP1559Fee = async (request: providers.TransactionRequest) => {
    return { gasFee: 10000 }
}

const calculateOptimismFee = async (request: providers.TransactionRequest) => {
    const l1DataFee = await calculateOptimismL1DataFee(request)
    const l2ExecutionFee = await calculateL2ExecutionFee(request)
    return { gasFee: l1DataFee.add(l2ExecutionFee).toString() }
}

const calculateArbitrumFee = async (request: providers.TransactionRequest) => {
    const fee = await calculateL2ExecutionFee(request)
    return { gasFee: fee}
}

const calculateOptimismL1DataFee = async (request: providers.TransactionRequest) => {
    const mainnetProvider = CHAIN_INFO[SupportedChainId.Mainnet].provider 
    const mainnetGasPrice = await mainnetProvider.getGasPrice() // TODO: use eip-1559 gas price heuristic?
    const l1DataGas = await calculateOptimismDataGas(request.data)
    return l1DataGas.mul(mainnetGasPrice).mul(OP_DYNAMIC_OVERHEAD)
}

// based on @uniswap/smart-order-router and originally based on optimism OVM_GasPriceOracle contract
// https://github.com/Uniswap/smart-order-router/blob/cd8587a925f3841f71fb8a14f1d06b87f2975645/src/routers/alpha-router/gas-models/v3/v3-heuristic-gas-model.ts#L496-L512
export const calculateOptimismDataGas = async (byteData: BytesLike | undefined) => {
    if (!byteData) return ZERO

    const data = hexlify(byteData)
    const dataArr: string[] = data.slice(2).match(/.{1,2}/g)!;
    const numBytes = dataArr.length;
    let count = 0;
    for (let i = 0; i < numBytes; i += 1) {
      const byte = parseInt(dataArr[i]!, 16);
      if (byte == 0) {
        count += 4;
      } else {
        count += 16;
      }
    }

    const unsigned = OP_FIXED_OVERHEAD.add(count);
    const signedConversion = 68 * 16;
    return unsigned.add(signedConversion);
}

const calculateL2ExecutionFee = async (request: providers.TransactionRequest) => {
    const provider = CHAIN_INFO[request.chainId as SupportedChainId].provider 
    const gasLimit = await provider.estimateGas(request)
    const gasPrice = await provider.getGasPrice() 
    return gasLimit.mul(gasPrice)
}