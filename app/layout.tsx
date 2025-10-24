import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'RED / BLUE Vault',
  description: 'Deposit ETH → RED, swap RED→BLUE, redeem BLUE, withdraw vault.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="max-w-5xl mx-auto p-6">
            <header className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">RED / BLUE Thirds Vault</h1>
              <a href="https://basescan.org" target="_blank" className="text-sm opacity-70 hover:opacity-100">Base Mainnet</a>
            </header>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
