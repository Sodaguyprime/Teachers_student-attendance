import { describe, expect, it } from 'vitest';
import { isLoopback, pickAddress } from '../server/lib/net.js';

describe('pickAddress', () => {
  it('prefers the real network card over a VPN adapter listed first', () => {
    expect(
      pickAddress([
        { name: 'Radmin VPN', address: '26.119.4.66' },
        { name: 'Ethernet', address: '192.168.100.44' },
      ]),
    ).toBe('192.168.100.44');
  });

  it('skips hypervisor and container adapters', () => {
    expect(
      pickAddress([
        { name: 'vEthernet (WSL)', address: '172.20.16.1' },
        { name: 'VMware Network Adapter VMnet8', address: '192.168.56.1' },
        { name: 'Wi-Fi', address: '10.0.0.12' },
      ]),
    ).toBe('10.0.0.12');
  });

  it('prefers a private address when neither adapter looks virtual', () => {
    expect(
      pickAddress([
        { name: 'eth1', address: '203.0.113.7' },
        { name: 'eth0', address: '192.168.1.20' },
      ]),
    ).toBe('192.168.1.20');
  });

  it('falls back to a virtual adapter rather than nothing', () => {
    expect(pickAddress([{ name: 'Radmin VPN', address: '26.119.4.66' }])).toBe('26.119.4.66');
  });

  it('returns null when there is nothing to pick', () => {
    expect(pickAddress([])).toBeNull();
  });
});

describe('isLoopback', () => {
  it('recognises the loopback forms a Node socket reports', () => {
    for (const a of ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost']) {
      expect(isLoopback(a)).toBe(true);
    }
  });

  it('rejects LAN addresses and undefined', () => {
    expect(isLoopback('192.168.100.44')).toBe(false);
    expect(isLoopback(undefined)).toBe(false);
  });
});
