import { describe, it, expect } from 'vitest';
import {
  DEFAULT_HUAWEI_ACTIVATION_CONFIG,
  formatVlanDescription,
  calculatePeerIp,
  normalizeSubnetMask,
  generateStep1Vlan,
  generateStep2TrafficPolicy,
  generateStep3Vlanif,
  generateStep4StaticRoute,
  generateStep5TrunkTagging,
  generateHuaweiActivationScript,
} from './huaweiActivationUtils';
import type { HuaweiActivationConfig } from '../types/huaweiActivation';

describe('Huawei Activation Utils', () => {
  it('formats VLAN description correctly', () => {
    expect(formatVlanDescription('3191', 'GIA_CICURUG(TELKOM)')).toBe('VLAN-3191-GIA_CICURUG(TELKOM)');
    expect(formatVlanDescription('100', 'CLIENT_A')).toBe('VLAN-100-CLIENT_A');
  });

  it('calculates peer IP for /31 subnet correctly', () => {
    // 10.100.91.118 is even -> peer should be 10.100.91.119
    expect(calculatePeerIp('10.100.91.118', '255.255.255.254')).toBe('10.100.91.119');
    // 10.100.91.119 is odd -> peer should be 10.100.91.118
    expect(calculatePeerIp('10.100.91.119', '255.255.255.254')).toBe('10.100.91.118');
    // using CIDR /31
    expect(calculatePeerIp('192.168.1.0', '/31')).toBe('192.168.1.1');
    expect(calculatePeerIp('192.168.1.1', '/31')).toBe('192.168.1.0');
  });

  it('calculates peer IP for /30 subnet correctly', () => {
    // Subnet: 10.0.0.0/30 (usable: .1 and .2)
    expect(calculatePeerIp('10.0.0.1', '255.255.255.252')).toBe('10.0.0.2');
    expect(calculatePeerIp('10.0.0.2', '255.255.255.252')).toBe('10.0.0.1');
  });

  it('normalizes CIDR prefix to dotted decimal mask', () => {
    expect(normalizeSubnetMask('/31')).toBe('255.255.255.254');
    expect(normalizeSubnetMask('/32')).toBe('255.255.255.255');
    expect(normalizeSubnetMask('/30')).toBe('255.255.255.252');
    expect(normalizeSubnetMask('/24')).toBe('255.255.255.0');
    expect(normalizeSubnetMask('255.255.255.254')).toBe('255.255.255.254');
  });

  it('generates step 1 VLAN matching the user example', () => {
    const step1 = generateStep1Vlan(DEFAULT_HUAWEI_ACTIVATION_CONFIG);
    const expected = `vlan 3191\n description VLAN-3191-GIA_CICURUG(TELKOM)\n#`;
    expect(step1).toBe(expected);
  });

  it('generates step 2 Traffic Policy matching the user example', () => {
    const step2 = generateStep2TrafficPolicy(DEFAULT_HUAWEI_ACTIVATION_CONFIG);
    const expected = `traffic policy VLAN-3191-GIA_CICURUG(TELKOM)\n share-mode\n classifier 200MBPS behavior 200MBPS precedence 1\n#`;
    expect(step2).toBe(expected);
  });

  it('generates step 3 Vlanif interface matching the user example', () => {
    const step3 = generateStep3Vlanif(DEFAULT_HUAWEI_ACTIVATION_CONFIG);
    const expected = `interface Vlanif3191\n description VLAN-3191-GIA_CICURUG(TELKOM)\n ip address 10.100.91.118 255.255.255.254\n statistic enable\n traffic-policy VLAN-3191-GIA_CICURUG(TELKOM) inbound\n traffic-policy VLAN-3191-GIA_CICURUG(TELKOM) outbound\n#`;
    expect(step3).toBe(expected);
  });

  it('generates step 4 Static Route matching the user example', () => {
    const step4 = generateStep4StaticRoute(DEFAULT_HUAWEI_ACTIVATION_CONFIG);
    const expected = `ip route-static 103.97.140.151 255.255.255.255 10.100.91.119 description GIA_CICURUG(TELKOM)`;
    expect(step4).toBe(expected);
  });

  it('generates step 5 Trunk Tagging matching the user example for single & multiple interfaces', () => {
    const step5Single = generateStep5TrunkTagging(DEFAULT_HUAWEI_ACTIVATION_CONFIG);
    const expectedSingle = `interface Eth-Trunk4\n port trunk allow-pass vlan 3191\n#`;
    expect(step5Single).toBe(expectedSingle);

    const configMultiple: HuaweiActivationConfig = {
      ...DEFAULT_HUAWEI_ACTIVATION_CONFIG,
      physicalInterfaces: ['Eth-Trunk4', 'GigabitEthernet0/0/1'],
    };
    const step5Multiple = generateStep5TrunkTagging(configMultiple);
    const expectedMultiple = `interface Eth-Trunk4\n port trunk allow-pass vlan 3191\n#\ninterface GigabitEthernet0/0/1\n port trunk allow-pass vlan 3191\n#`;
    expect(step5Multiple).toBe(expectedMultiple);
  });

  it('generates complete fullConfig and undoConfig accurately', () => {
    const result = generateHuaweiActivationScript(DEFAULT_HUAWEI_ACTIVATION_CONFIG);

    expect(result.fullConfig).toContain('vlan 3191');
    expect(result.fullConfig).toContain('traffic policy VLAN-3191-GIA_CICURUG(TELKOM)');
    expect(result.fullConfig).toContain('interface Vlanif3191');
    expect(result.fullConfig).toContain('ip route-static 103.97.140.151 255.255.255.255 10.100.91.119 description GIA_CICURUG(TELKOM)');
    expect(result.fullConfig).toContain('interface Eth-Trunk4\n port trunk allow-pass vlan 3191');

    // Undo config should contain reversals
    expect(result.undoConfig).toContain('undo port trunk allow-pass vlan 3191');
    expect(result.undoConfig).toContain('undo ip route-static 103.97.140.151 255.255.255.255 10.100.91.119');
    expect(result.undoConfig).toContain('undo interface Vlanif3191');
    expect(result.undoConfig).toContain('undo traffic policy VLAN-3191-GIA_CICURUG(TELKOM)');
    expect(result.undoConfig).toContain('undo vlan 3191');
  });
});

