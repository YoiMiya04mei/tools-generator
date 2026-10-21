import { describe, it, expect } from 'vitest';
import {
  convertSpeedToKbps,
  calculateCBS,
  calculatePBS,
  formatSpeedName,
  getSuggestedNames,
  generateTrafficClassifierConfig,
  generateTrafficBehaviorConfig,
  generateTrafficQoS,
  parseBandwidthString,
  parseBatchBandwidths,
} from './trafficQosUtils';

describe('trafficQosUtils', () => {
  describe('convertSpeedToKbps', () => {
    it('converts 100 MBPS to 102400 kbps (100 * 1024)', () => {
      expect(convertSpeedToKbps(100, 'MBPS')).toBe(102400);
    });

    it('converts 1 GBPS to 1048576 kbps (1 * 1024 * 1024)', () => {
      expect(convertSpeedToKbps(1, 'GBPS')).toBe(1048576);
    });

    it('converts 1.2 GBPS (direct binary) to 1258291 kbps (1.2 * 1024 * 1024)', () => {
      expect(convertSpeedToKbps(1.2, 'GBPS', 'direct')).toBe(1258291);
    });

    it('converts 1.2 GBPS (decimal / 1G 200MBPS) to 1228800 kbps (1200 * 1024)', () => {
      expect(convertSpeedToKbps(1.2, 'GBPS', 'decimal')).toBe(1228800);
    });

    it('converts 512 KBPS to 512 kbps', () => {
      expect(convertSpeedToKbps(512, 'KBPS')).toBe(512);
    });

    it('converts 1 TBPS to 1073741824 kbps', () => {
      expect(convertSpeedToKbps(1, 'TBPS')).toBe(1073741824);
    });

    it('handles decimal speeds like 2.5 MBPS', () => {
      expect(convertSpeedToKbps(2.5, 'MBPS')).toBe(2560);
    });
  });

  describe('calculateCBS and calculatePBS', () => {
    it('multiplies cir by 8 to get cbs (102400 * 8 = 819200)', () => {
      expect(calculateCBS(102400)).toBe(819200);
    });

    it('multiplies pir by 8 to get pbs (102400 * 8 = 819200)', () => {
      expect(calculatePBS(102400)).toBe(819200);
    });
  });

  describe('formatSpeedName & getSuggestedNames', () => {
    it('formats 100 and MBPS as 100MBPS', () => {
      expect(formatSpeedName(100, 'MBPS')).toBe('100MBPS');
    });

    it('formats 1 and GBPS as 1GBPS', () => {
      expect(formatSpeedName(1, 'GBPS')).toBe('1GBPS');
    });

    it('formats 1.2 and GBPS as 1.2GBPS', () => {
      expect(formatSpeedName(1.2, 'GBPS')).toBe('1.2GBPS');
    });

    it('suggests names including 1G200MBPS for 1.2 GBPS', () => {
      const suggestions = getSuggestedNames(1.2, 'GBPS');
      expect(suggestions).toContain('1.2GBPS');
      expect(suggestions).toContain('1G200MBPS');
      expect(suggestions).toContain('1200MBPS');
    });
  });

  describe('generateTrafficClassifierConfig', () => {
    it('generates exact syntax requested by user', () => {
      const result = generateTrafficClassifierConfig('100MBPS', 'if-match any', 'or');
      expect(result).toBe(
        'traffic classifier 100MBPS operator or\n if-match any\n#'
      );
    });

    it('generates classifier for 1.2GBPS', () => {
      const result = generateTrafficClassifierConfig('1.2GBPS', 'if-match any', 'or');
      expect(result).toBe(
        'traffic classifier 1.2GBPS operator or\n if-match any\n#'
      );
    });
  });

  describe('generateTrafficBehaviorConfig', () => {
    it('generates exact syntax requested by user with car cir pir cbs pbs', () => {
      const result = generateTrafficBehaviorConfig('100MBPS', 102400, 102400, 819200, 819200);
      expect(result).toBe(
        'traffic behavior 100MBPS\n car cir 102400 pir 102400 cbs 819200 pbs 819200 green pass yellow pass red discard\n#'
      );
    });
  });

  describe('generateTrafficQoS (End-to-End)', () => {
    it('produces the exact configuration requested in the prompt for 100MBPS', () => {
      const qos = generateTrafficQoS(100, 'MBPS');

      expect(qos.name).toBe('100MBPS');
      expect(qos.cir).toBe(102400);
      expect(qos.pir).toBe(102400);
      expect(qos.cbs).toBe(819200);
      expect(qos.pbs).toBe(819200);

      const expected =
        'traffic classifier 100MBPS operator or\n' +
        ' if-match any\n' +
        '#\n\n' +
        'traffic behavior 100MBPS\n' +
        ' car cir 102400 pir 102400 cbs 819200 pbs 819200 green pass yellow pass red discard\n' +
        '#\n';

      expect(qos.fullConfig).toBe(expected);
    });

    it('supports 1.2 GBPS with decimal conversion (1G 200MBPS = 1228800 kbps)', () => {
      const qos = generateTrafficQoS(1.2, 'GBPS', { gbpsConversionMode: 'decimal' });
      expect(qos.name).toBe('1.2GBPS');
      expect(qos.cir).toBe(1228800);
      expect(qos.cbs).toBe(1228800 * 8);
    });

    it('supports custom classifier/behavior names', () => {
      const qos = generateTrafficQoS(100, 'MBPS', { customName: 'CUST_VIP_100M' });
      expect(qos.name).toBe('CUST_VIP_100M');
      expect(qos.fullConfig).toContain('traffic classifier CUST_VIP_100M operator or');
      expect(qos.fullConfig).toContain('traffic behavior CUST_VIP_100M');
    });
  });

  describe('parseBandwidthString', () => {
    it('parses "100MBPS" correctly', () => {
      const parsed = parseBandwidthString('100MBPS');
      expect(parsed).toEqual({ speed: 100, unit: 'MBPS' });
    });

    it('parses decimal with comma like "1,2GBPS"', () => {
      const parsed = parseBandwidthString('1,2GBPS');
      expect(parsed).toEqual({ speed: 1.2, unit: 'GBPS' });
    });

    it('parses "1,2 GBPS" with space', () => {
      const parsed = parseBandwidthString('1,2 GBPS');
      expect(parsed).toEqual({ speed: 1.2, unit: 'GBPS' });
    });

    it('parses "1G 200M" combo as 1.2 GBPS', () => {
      const parsed = parseBandwidthString('1G 200M');
      expect(parsed).toEqual({ speed: 1.2, unit: 'GBPS' });
    });

    it('parses "1G200MBPS" combo as 1.2 GBPS', () => {
      const parsed = parseBandwidthString('1G200MBPS');
      expect(parsed).toEqual({ speed: 1.2, unit: 'GBPS' });
    });

    it('parses "100 Mbps" correctly', () => {
      const parsed = parseBandwidthString('100 Mbps');
      expect(parsed).toEqual({ speed: 100, unit: 'MBPS' });
    });

    it('parses "1 Gbps" correctly', () => {
      const parsed = parseBandwidthString('1 Gbps');
      expect(parsed).toEqual({ speed: 1, unit: 'GBPS' });
    });

    it('parses "512 kbps" correctly', () => {
      const parsed = parseBandwidthString('512 kbps');
      expect(parsed).toEqual({ speed: 512, unit: 'KBPS' });
    });

    it('parses "100M" correctly', () => {
      const parsed = parseBandwidthString('100M');
      expect(parsed).toEqual({ speed: 100, unit: 'MBPS' });
    });

    it('parses "2.5G" correctly', () => {
      const parsed = parseBandwidthString('2.5G');
      expect(parsed).toEqual({ speed: 2.5, unit: 'GBPS' });
    });

    it('parses "100" (no unit) as default MBPS', () => {
      const parsed = parseBandwidthString('100');
      expect(parsed).toEqual({ speed: 100, unit: 'MBPS' });
    });
  });

  describe('parseBatchBandwidths', () => {
    it('parses multiple bandwidth entries including decimals', () => {
      const result = parseBatchBandwidths('10M, 20M, 1,2G, 100M, 1G');
      expect(result).toHaveLength(5);
      expect(result[0]).toMatchObject({ speed: 10, unit: 'MBPS' });
      expect(result[2]).toMatchObject({ speed: 1.2, unit: 'GBPS' });
      expect(result[3]).toMatchObject({ speed: 100, unit: 'MBPS' });
      expect(result[4]).toMatchObject({ speed: 1, unit: 'GBPS' });
    });

    it('parses newline-separated bandwidth entries', () => {
      const result = parseBatchBandwidths('100MBPS\n200MBPS\n500MBPS');
      expect(result).toHaveLength(3);
      expect(result[0].speed).toBe(100);
      expect(result[1].speed).toBe(200);
      expect(result[2].speed).toBe(500);
    });
  });
});
