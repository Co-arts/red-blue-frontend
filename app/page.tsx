'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { base } from 'wagmi/chains'
import { parseEther } from 'viem'

import { WalletConnect } from '@/components/WalletConnect'
import { CONTROLLER_ADDRESS } from '@/lib/config'
import controllerAbi from '@/lib/abi/RedBlueController.json'

export default function Home() {
  const { address, isConnected } = useAccount()
  const { writeContract, isPending } = useWriteContract()

  const [valueEth, setValueEth] = useState<string>('')
  const [paused, setPaused] = useState<boolean>(false)
  const [txLoading, setTxLoading] = useState<boolean>(false)

  const controller = CONTROLLER_ADDRESS

  useEffect(() => {
    // You can later add a paused-state check here if your contract supports it.
  }, [])

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        🔴 Red & 🔵 Blue Savings Protocol
      </h1>

      <WalletConnect />

      {isConnected && (
        <div className="card bg-base-200 p-6 rounded-2xl shadow-xl w-full max-w-md mt-8">
          <h2 className="text-lg font-semibold mb-2">Deposit ETH → Mint RED</h2>

          <input
            className="input input-bordered w-full mb-3"
            placeholder="Amount in ETH"
            value={valueEth}
            onChange={(e) => setValueEth(e.target.value)}
          />

          <button
            className="btn btn-primary w-full"
            disabled={!!isPending || !!txLoading || !!paused}
            onClick={() => {
              if (!address) return
              setTxLoading(true)

              writeContract({
                address: controller,
                abi: controllerAbi,
                functionName: 'deposit',
                value: parseEther(valueEth || '0'),
                account: address,
                chain: base, // ✅ required for wagmi 2.x
              })

              setTxLoading(false)
            }}
          >
            {isPending || txLoading ? 'Submitting…' : 'Deposit'}
          </button>

          <p className="text-xs opacity-60 mt-2">
            Split: 1/3 Vault • 1/3 LP • 1/3 Treasury (on-chain)
          </p>
        </div>
      )}
    </main>
  )
}
