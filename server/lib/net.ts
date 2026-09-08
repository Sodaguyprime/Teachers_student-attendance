import { networkInterfaces } from 'node:os';

/** The LAN address students' phones should hit, for building the QR URL. */
export function localNetworkAddress(): string {
  for (const addrs of Object.values(networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.family === 'IPv4' && !addr.internal) return addr.address;
    }
  }
  return '127.0.0.1';
}

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost']);

export function isLoopback(address: string | undefined): boolean {
  if (!address) return false;
  return LOOPBACK.has(address);
}
