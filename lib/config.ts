import { createConfig, http } from 'wagmi'
import { base } from 'wagmi/chains'

export const CONTROLLER_ADDRESS = process.env.NEXT_PUBLIC_CONTROLLER_ADDRESS as `0x${string}` | undefined

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC || 'https://mainnet.base.org'),
  },
})
