'use client'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  if (!isConnected) {
    return (
      <button className="btn" onClick={() => connect({ connector: injected() })} disabled={isPending}>
        {isPending ? 'Connecting…' : 'Connect Wallet'}
      </button>
    )
  }
  return (
    <div className="flex items-center gap-3">
      <span className="px-3 py-2 bg-neutral-800 rounded-xl border border-neutral-700 text-sm">
        {address?.slice(0,6)}…{address?.slice(-4)}
      </span>
      <button className="btn" onClick={() => disconnect()}>Disconnect</button>
    </div>
  )
}
