'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { base } from 'wagmi/chains'
import { parseEther, formatEther } from 'viem'
import { readContract } from '@wagmi/core'

import { WalletConnect } from '@/components/WalletConnect'
import { CONTROLLER_ADDRESS } from '@/lib/config'
import controllerAbi from '@/lib/abi/RedBlueController.json'
import erc20Abi from '@/lib/abi/ERC20.json'
import vaultAbi from '@/lib/abi/Vault.json'

export default function Home() {
  const { address, isConnected } = useAccount()
  const { writeContract, isPending } = useWriteContract()

  const [valueEth, setValueEth] = useState<string>('')
  const [paused, setPaused] = useState<boolean>(false)
  const [txLoading, setTxLoading] = useState<boolean>(false)

  const [totalDeposited, setTotalDeposited] = useState<string>('0')
  const [vaultBalance, setVaultBalance] = useState<string>('0')
  const [treasuryEarned, setTreasuryEarned] = useState<string>('0')

  const controller = CONTROLLER_ADDRESS
  const vaultAddress = '0x9Ad89424a3c6d4C4cD38709e70f0EAB5a668244c' // your deployed Vault
  const treasuryAddress = '0x3CFD81965E316714AFc621602ddB18929585A903' // your treasury wallet

  useEffect(() => {
    async function loadStats() {
      try {
        // 1️⃣ total deposited (from controller)
        const total = await readContract({
          address: controller,
          abi: controllerAbi,
          functionName: 'totalDeposited',
        })

        // 2️⃣ vault balance
        const vault = await readContract({
          address: vaultAddress,
          abi: vaultAbi,
          functionName: 'totalAssets',
        })

        // 3️⃣ treasury ETH balance
        const provider = (window as any).ethereum
        const treasuryBal = provider
          ? await provider.request({
              method: 'eth_getBalance',
              params: [treasuryAddress, 'latest'],
            })
          : '0x0'

        setTotalDeposited(formatEther(total))
        setVaultBalance(formatEther(vault))
        setTreasuryEarned(formatEther(BigInt(treasuryBal)))
      } catch (err) {
        console.error('Failed to load stats:', err)
      }
    }

    loadStats()
    const interval = setInterval(loadStats, 15000)
    return () => clearInterval(interval)
  }, [controller])

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        🔴 Red & 🔵 Blue Savings Protocol
      </h1>

      <WalletConnect />

      {isConnected && (
        <>
          {/* Deposit card */}
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
                  chain: base,
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

          {/* Stats panel */}
          <div className="mt-10 text-center bg-base-200 p-6 rounded-2xl shadow-md w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3">📊 Protocol Stats</h3>
            <p>Total Deposited: {Number(totalDeposited).toFixed(4)} ETH</p>
            <p>Vault Balance: {Number(vaultBalance).toFixed(4)} ETH</p>
            <p>Treasury Earned: {Number(treasuryEarned).toFixed(4)} ETH</p>
          </div>
        </>
      )}
    </main>
  )
}
