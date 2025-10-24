export function fmt(n: bigint, decimals = 18, precision = 6) {
  const s = n.toString().padStart(decimals + 1, '0')
  const i = s.slice(0, -decimals)
  const d = s.slice(-decimals).slice(0, precision)
  return `${i}.${d}`
}
