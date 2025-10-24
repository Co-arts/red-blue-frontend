'use client'
import { useEffect, useMemo, useState } from 'react'
import { WalletConnect } from '@/components/WalletConnect'
import { CONTROLLER_ADDRESS } from '@/lib/config'
import controllerAbi from '@/lib/abi/RedBlueController.json'
import erc20Abi from '@/lib/abi/ERC20.json'
import vaultAbi from '@/lib/abi/Vault.json'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { fmt } from '@/lib/format'

export default function Page() {
  const { address } = useAccount()
  const [valueEth, setValueEth] = useState('0.1')
  const [swapRedAmt, setSwapRedAmt] = useState('2.0')
  const [redeemBlueAmt, setRedeemBlueAmt] = useState('1.0')
  const [withdrawShares, setWithdrawShares] = useState('0.0')

  const controller = CONTROLLER_ADDRESS
  const { data: redAddr } = useReadContract({ address: controller, abi: controllerAbi, functionName: 'RED' })
  const { data: blueAddr } = useReadContract({ address: controller, abi: controllerAbi, functionName: 'BLUE' })
  const { data: vaultAddr } = useReadContract({ address: controller, abi: controllerAbi, functionName: 'vault' })
  const { data: paused } = useReadContract({ address: controller, abi: controllerAbi, functionName: 'paused' })

  const { data: redBal } = useReadContract({ address: redAddr as `0x${string}` | undefined, abi: erc20Abi, functionName: 'balanceOf', args: [address ?? '0x0000000000000000000000000000000000000000'] })
  const { data: blueBal } = useReadContract({ address: blueAddr as `0x${string}` | undefined, abi: erc20Abi, functionName: 'balanceOf', args: [address ?? '0x0000000000000000000000000000000000000000'] })
  const { data: shares } = useReadContract({ address: vaultAddr as `0x${string}` | undefined, abi: vaultAbi, functionName: 'shares', args: [address ?? '0x0000000000000000000000000000000000000000'] })
  const { data: unlockTime } = useReadContract({ address: vaultAddr as `0x${string}` | undefined, abi: vaultAbi, functionName: 'unlockTime' })

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: txLoading, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
      // could refetch here with react-query invalidation if using useQuery
    }
  }, [isSuccess])

  const now = Math.floor(Date.now()/1000)
  const canWithdraw = (unlockTime ? Number(unlockTime) <= now : false)

  if (!controller) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <WalletConnect />
        </div>
        <div className="card">
          <p className="opacity-80">Set <code className="px-2 py-1 bg-neutral-900 rounded">NEXT_PUBLIC_CONTROLLER_ADDRESS</code> in <code>.env.local</code> to use the dApp.</p>
          <p className="opacity-60 mt-2 text-sm">The treasury is set on-chain to your address during deployment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <WalletConnect />
        <div className="text-sm opacity-70">Controller: <span className="font-mono">{(controller as string).slice(0,6)}…{(controller as string).slice(-4)}</span></div>
      </div>

      <div className="grid2">
        {/* Deposit */}
        <div className="card space-y-3">
          <h2 className="text-lg font-semibold">Deposit ETH → Mint RED</h2>
          <input className="input" value={valueEth} onChange={e=>setValueEth(e.target.value)} />
          <button className="btn" disabled={!!isPending || !!txLoading || !!paused} onClick={()=>{
            writeContract({ address: controller, abi: controllerAbi, functionName: 'deposit', value: parseEther(valueEth || '0') })
          }}>{isPending || txLoading ? 'Submitting…' : 'Deposit'}</button>
          <p className="text-xs opacity-60">Split: 1/3 Vault • 1/3 LP • 1/3 Treasury (on-chain)</p>
        </div>

        {/* Swap RED->BLUE */}
        <div className="card space-y-3">
          <h2 className="text-lg font-semibold">Swap 2 RED → 1 BLUE</h2>
          <input className="input" value={swapRedAmt} onChange={e=>setSwapRedAmt(e.target.value)} />
          <button className="btn" disabled={isPending || txLoading || paused} onClick={()=>{
            const amt = parseEther(swapRedAmt || '0')
            writeContract({ address: controller, abi: controllerAbi, functionName: 'swapRedForBlue', args: [amt] })
          }}>{isPending || txLoading ? 'Submitting…' : 'Swap'}</button>
          <p className="text-xs opacity-60">Swapping marks you as early-exited (no vault claim).</p>
        </div>

        {/* Redeem BLUE */}
        <div className="card space-y-3">
          <h2 className="text-lg font-semibold">Redeem BLUE → ETH</h2>
          <input className="input" value={redeemBlueAmt} onChange={e=>setRedeemBlueAmt(e.target.value)} />
          <button className="btn" disabled={isPending || txLoading || paused} onClick={()=>{
            const amt = parseEther(redeemBlueAmt || '0')
            // minEthOut set to 0 for simplicity; add slippage UI later
            writeContract({ address: controller, abi: controllerAbi, functionName: 'redeemBlueForEth', args: [amt, 0n] })
          }}>{isPending || txLoading ? 'Submitting…' : 'Redeem'}</button>
          <p className="text-xs opacity-60">AMM fee goes to treasury.</p>
        </div>

        {/* Withdraw vault */}
        <div className="card space-y-3">
          <h2 className="text-lg font-semibold">Withdraw Vault (after unlock)</h2>
          <input className="input" value={withdrawShares} onChange={e=>setWithdrawShares(e.target.value)} />
          <button className="btn" disabled={isPending || txLoading || !canWithdraw || paused} onClick={()=>{
            writeContract({ address: controller, abi: controllerAbi, functionName: 'withdrawVault', args: [parseEther(withdrawShares || '0'), address!] })
          }}>{isPending || txLoading ? 'Submitting…' : (canWithdraw ? 'Withdraw' : 'Locked')}</button>
          <p className="text-xs opacity-60">You must still hold RED and not have early-exited.</p>
        </div>
      </div>

      <div className="card grid md:grid-cols-4 gap-4">
        <div>
          <div className="text-xs opacity-60">RED</div>
          <div className="text-xl font-mono">{redBal ? fmt(redBal as bigint) : '-'}</div>
        </div>
        <div>
          <div className="text-xs opacity-60">BLUE</div>
          <div className="text-xl font-mono">{blueBal ? fmt(blueBal as bigint) : '-'}</div>
        </div>
        <div>
          <div className="text-xs opacity-60">Shares</div>
          <div className="text-xl font-mono">{shares ? fmt(shares as bigint) : '-'}</div>
        </div>
        <div>
          <div className="text-xs opacity-60">Unlock</div>
          <div className="text-xl font-mono">{unlockTime ? new Date(Number(unlockTime)*1000).toLocaleString() : '-'}</div>
        </div>
      </div>
    </div>
  )
}
