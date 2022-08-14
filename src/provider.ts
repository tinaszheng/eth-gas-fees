import { InfuraProvider } from "@ethersproject/providers"

const INFURA_KEY = process.env.INFURA_KEY 

export enum SupportedChainId {
    Mainnet = 1,
    Optimism = 10,
    Polygon = 137,
    ArbitrumOne = 42161
}

export const CHAIN_INFO = {
    [SupportedChainId.Mainnet]: {
        name: "Ethereum",
        nativeCurrency: {
            label: "ETH",
        },
        provider: new InfuraProvider(1, INFURA_KEY)
    },
    [SupportedChainId.Optimism]: {
        name: "Optimism",
        nativeCurrency: {
            label: "opETH",
        },
        provider: new InfuraProvider(10, INFURA_KEY)
    },
    [SupportedChainId.Polygon]: {
        name: "Polygon",
        nativeCurrency: {
            label: "MATIC",
        },
        provider: new InfuraProvider(137, INFURA_KEY)
    },
    [SupportedChainId.ArbitrumOne]: {
        name: "Arbitrum One",
        nativeCurrency: {
            label: "ETH",
        },
        provider: new InfuraProvider(42161, INFURA_KEY)
    }
}

export const EIP_1559_CHAINS = [SupportedChainId.Mainnet, SupportedChainId.Polygon]
export const SUPPORTED_CHAINS = Object.keys(CHAIN_INFO).map(Number)

export const isPolygonChain = (chainId: SupportedChainId) => chainId === SupportedChainId.Polygon
