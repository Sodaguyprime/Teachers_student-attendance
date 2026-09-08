import { networkInterfaces } from 'node:os';

/**
 * Virtual adapters — VPNs, hypervisors, container bridges — are usually listed
 * before the real network card, and a phone on the classroom WiFi cannot reach
 * any of them. Match on the adapter name so they lose to a real interface.
 */
const VIRTUAL = /vpn|virtual|vmware|hyper-?v|radmin|hamachi|docker|wsl|loopback|bluetooth|tailscale|zerotier|tap-|tun\d/i;

/** RFC 1918, the ranges a phone on the same WiFi can actually route to. */
function isPrivate(address: string): boolean {
  const [a = 0, b = 0] = address.split('.').map(Number);
  if (a === 192 && b === 168) return true;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

/**
 * The LAN address students' phones should hit, for building the QR URL.
 * Override with HOST_IP when the guess is wrong.
 */
export function localNetworkAddress(): string {
  const override = process.env.HOST_IP;
  if (override) return override;

  const candidates: { name: string; address: string }[] = [];
  for (const [name, addrs] of Object.entries(networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.family === 'IPv4' && !addr.internal) candidates.push({ name, address: addr.address });
    }
  }

  return pickAddress(candidates) ?? '127.0.0.1';
}

/** Exported for testing: highest score wins, ties broken by original order. */
export function pickAddress(candidates: { name: string; address: string }[]): string | null {
  let best: { score: number; address: string } | null = null;

  for (const { name, address } of candidates) {
    let score = 0;
    if (!VIRTUAL.test(name)) score += 2;
    if (isPrivate(address)) score += 1;
    if (!best || score > best.score) best = { score, address };
  }

  return best?.address ?? null;
}

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost']);

export function isLoopback(address: string | undefined): boolean {
  if (!address) return false;
  return LOOPBACK.has(address);
}
