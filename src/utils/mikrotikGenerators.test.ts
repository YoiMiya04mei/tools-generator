import { describe, it, expect } from 'vitest';
import {
  generatePCCScript,
  generateNTHScript,
  generateECMPScript,
  generateRecursiveFailoverScript,
  generateGamesRoutingScript,
  generateWebsiteRoutingScript,
  generateClientIpRoutingScript,
  generatePortForwardingScript,
  generatePortTcpUdpRoutingScript,
  generateAllTrafficVPNScript,
  generateRemoteAccessScript,
  generateVPNGamesScript,
  generateVPNRemoteClientScript,
  generateSocialMediaRoutingScript,
} from './mikrotikGenerators';

describe('MikroTik Script Generators', () => {
  const sampleWans = [
    { id: '1', name: 'WAN1', interface: 'ether1-ISP1', gateway: '192.168.1.1', distance: 1, weight: 1 },
    { id: '2', name: 'WAN2', interface: 'ether2-ISP2', gateway: '192.168.2.1', distance: 2, weight: 1 },
  ];

  it('1. PCC Generator generates valid v6 and v7 scripts', () => {
    const v6Script = generatePCCScript({
      rosVersion: 'v6',
      lanInterface: 'ether3-LAN',
      lanSubnet: '192.168.88.0/24',
      pccClassifier: 'both-addresses-and-ports',
      wans: sampleWans,
      addDefaultRoute: true,
      addNatMasquerade: true,
      addLocalAcceptRule: true,
    });
    expect(v6Script).toContain('Load Balancing PCC (2 WAN Lines)');
    expect(v6Script).toContain('routing-mark="to_WAN1"');
    expect(v6Script).toContain('per-connection-classifier=both-addresses-and-ports:2/0');
    expect(v6Script).not.toContain('/routing table');

    const v7Script = generatePCCScript({
      rosVersion: 'v7',
      lanInterface: 'ether3-LAN',
      lanSubnet: '192.168.88.0/24',
      pccClassifier: 'both-addresses-and-ports',
      wans: sampleWans,
      addDefaultRoute: true,
      addNatMasquerade: true,
      addLocalAcceptRule: true,
    });
    expect(v7Script).toContain('/routing table');
    expect(v7Script).toContain('add name="to_WAN1" fib');
    expect(v7Script).toContain('routing-table="to_WAN1"');
  });

  it('2. NTH Generator produces round-robin rules', () => {
    const script = generateNTHScript({
      rosVersion: 'v6',
      lanInterface: 'bridge-LAN',
      lanSubnet: '192.168.88.0/24',
      wans: sampleWans,
      addDefaultRoute: true,
      addNatMasquerade: true,
    });
    expect(script).toContain('nth=2,1');
    expect(script).toContain('nth=2,2');
    expect(script).toContain('WAN1_conn');
  });

  it('3. ECMP Generator produces multi-gateway and fallback routes', () => {
    const script = generateECMPScript({
      rosVersion: 'v7',
      wans: sampleWans,
      checkGateway: 'ping',
      addNatMasquerade: true,
    });
    expect(script).toContain('gateway=192.168.1.1,192.168.2.1 check-gateway=ping');
    expect(script).toContain('action=masquerade');
  });

  it('4. Failover Recursive Gateway produces host route check targets', () => {
    const script = generateRecursiveFailoverScript({
      rosVersion: 'v7',
      primaryWan: sampleWans[0],
      secondaryWan: sampleWans[1],
      primaryTargetDns: '8.8.8.8',
      secondaryTargetDns: '1.1.1.1',
      addNatMasquerade: true,
    });
    expect(script).toContain('dst-address=8.8.8.8/32 gateway=192.168.1.1 scope=10');
    expect(script).toContain('dst-address=1.1.1.1/32 gateway=192.168.2.1 scope=10');
    expect(script).toContain('dst-address=0.0.0.0/0 gateway=8.8.8.8 distance=1 check-gateway=ping target-scope=30');
    expect(script).toContain('dst-address=0.0.0.0/0 gateway=1.1.1.1 distance=2 check-gateway=ping target-scope=30');
  });

  it('5 & 6. Games Routing supports Filter Raw and Mangle Port', () => {
    const rawScript = generateGamesRoutingScript({
      rosVersion: 'v7',
      lanInterface: 'ether3-LAN',
      targetWan: 'WAN1',
      targetGateway: '192.168.1.1',
      routingMarkName: 'GAMES_TRAFFIC',
      method: 'raw',
      selectedGameIds: ['mlbb', 'ff'],
      customPortsTcp: '',
      customPortsUdp: '',
    });
    expect(rawScript).toContain('/ip firewall raw');
    expect(rawScript).toContain('address-list=GAMES_IP');
    expect(rawScript).toContain('routing-table="GAMES_TRAFFIC"');

    const mangleScript = generateGamesRoutingScript({
      rosVersion: 'v6',
      lanInterface: 'ether3-LAN',
      targetWan: 'WAN1',
      targetGateway: '192.168.1.1',
      routingMarkName: 'GAMES_TRAFFIC',
      method: 'mangle',
      selectedGameIds: ['valorant'],
      customPortsTcp: '',
      customPortsUdp: '',
    });
    expect(mangleScript).toContain('/ip firewall mangle');
    expect(mangleScript).toContain('action=mark-connection new-connection-mark="GAMES_conn"');
    expect(mangleScript).toContain('routing-mark="GAMES_TRAFFIC"');
  });

  it('7. Website Static Routing adds address-list and mark-routing', () => {
    const script = generateWebsiteRoutingScript({
      rosVersion: 'v7',
      lanInterface: 'ether3-LAN',
      targetWan: 'WAN2',
      targetGateway: '192.168.2.1',
      routingMarkName: 'BANK_TRAFFIC',
      selectedPresets: ['bank_bca'],
      customDomains: ['mycustombank.com'],
    });
    expect(script).toContain('list=STATIC_WEBSITES');
    expect(script).toContain('klikbca.com');
    expect(script).toContain('mycustombank.com');
    expect(script).toContain('routing-table="BANK_TRAFFIC"');
  });

  it('8. Local Client IP Routing groups VIP clients', () => {
    const script = generateClientIpRoutingScript({
      rosVersion: 'v6',
      lanInterface: 'bridge-LAN',
      targetWan: 'WAN1',
      targetGateway: '192.168.1.1',
      routingMarkName: 'VIP_ROUTE',
      clientIpList: '192.168.88.50, 192.168.88.100',
      description: 'Billing Room',
    });
    expect(script).toContain('list=VIP_CLIENTS');
    expect(script).toContain('192.168.88.50');
    expect(script).toContain('192.168.88.100');
    expect(script).toContain('routing-mark="VIP_ROUTE"');
  });

  it('9. Port Forwarding NAT generates dst-nat and optional Hairpin NAT', () => {
    const script = generatePortForwardingScript({
      rosVersion: 'v7',
      wanInterface: 'ether1-ISP1',
      publicIp: '',
      protocol: 'tcp',
      externalPort: '8080',
      internalIp: '192.168.88.55',
      internalPort: '80',
      comment: 'Web Server',
      includeHairpinNat: true,
      lanSubnet: '192.168.88.0/24',
    });
    expect(script).toContain('action=dst-nat to-addresses=192.168.88.55 to-ports=80');
    expect(script).toContain('Hairpin NAT');
  });

  it('10. Port TCP/UDP Static Routing marks specified ports', () => {
    const script = generatePortTcpUdpRoutingScript({
      rosVersion: 'v7',
      lanInterface: 'ether3-LAN',
      targetWan: 'WAN2',
      targetGateway: '192.168.2.1',
      routingMarkName: 'PORT_ROUTING',
      protocol: 'tcp',
      ports: '80,443,8080',
      description: 'Web Ports',
    });
    expect(script).toContain('dst-port="80,443,8080"');
    expect(script).toContain('routing-table="PORT_ROUTING"');
  });

  it('11. All Traffic to VPN Tunnel handles server IP exclusion & killswitch', () => {
    const script = generateAllTrafficVPNScript({
      rosVersion: 'v7',
      vpnInterface: 'wireguard1',
      lanInterface: 'ether3-LAN',
      vpnServerIp: '103.150.200.5',
      addNatMasquerade: true,
      enableKillSwitch: true,
      clientSubnet: '',
    });
    expect(script).toContain('dst-address=103.150.200.5/32 gateway=main');
    expect(script).toContain('KILL SWITCH');
    expect(script).toContain('routing-table="to_VPN"');
  });

  it('12. Remote Access ISP protects management ports and adds reply rule', () => {
    const script = generateRemoteAccessScript({
      rosVersion: 'v7',
      wanInterface: 'ether1-ISP1',
      wanGateway: '192.168.1.1',
      allowedSourceIps: '202.150.10.0/24',
      enableWinbox: true,
      winboxPort: '8291',
      enableWebfig: true,
      webfigPort: '80,443',
      enableSSH: true,
      sshPort: '22',
      enableApi: false,
      apiPort: '8728',
      addMangleReplyRule: true,
    });
    expect(script).toContain('dst-port=8291');
    expect(script).toContain('src-address="202.150.10.0/24"');
    expect(script).toContain('Mark Incoming Admin Connection');
  });

  it('13 & 14. VPN Routing for Games supports both Port and IP mode', () => {
    const portScript = generateVPNGamesScript({
      rosVersion: 'v7',
      vpnInterface: 'ovpn-gaming',
      routingMarkName: 'VPN_GAMES',
      type: 'port',
      selectedGameIds: ['mlbb'],
      customPortsTcp: '',
      customPortsUdp: '',
      customIps: '',
    });
    expect(portScript).toContain('VPN Routing: Port Games');
    expect(portScript).toContain('new-connection-mark="VPN_GAMES_conn"');

    const ipScript = generateVPNGamesScript({
      rosVersion: 'v7',
      vpnInterface: 'ovpn-gaming',
      routingMarkName: 'VPN_GAMES',
      type: 'ip',
      selectedGameIds: [],
      customPortsTcp: '',
      customPortsUdp: '',
      customIps: '103.28.54.0/24, 103.28.55.0/24',
    });
    expect(ipScript).toContain('VPN Routing: IP Address Games');
    expect(ipScript).toContain('103.28.54.0/24');
  });

  it('15. VPN Remote Client generates SSTP/L2TP and WireGuard configs', () => {
    const sstp = generateVPNRemoteClientScript({
      rosVersion: 'v7',
      vpnType: 'sstp',
      serverAddress: 'id1.tunnel.id',
      serverPort: '443',
      username: 'user123',
      password: 'pass123',
      profileName: 'default-encryption',
      interfaceName: 'sstp-out1',
      addDefaultRoute: false,
    });
    expect(sstp).toContain('/interface sstp-client');
    expect(sstp).toContain('connect-to="id1.tunnel.id"');

    const wg = generateVPNRemoteClientScript({
      rosVersion: 'v7',
      vpnType: 'wireguard',
      serverAddress: 'wg.server.com',
      serverPort: '51820',
      username: '',
      password: '',
      profileName: '',
      interfaceName: 'wg-client1',
      addDefaultRoute: false,
      wireguardClientIp: '10.200.0.2/24',
    });
    expect(wg).toContain('/interface wireguard');
    expect(wg).toContain('/interface wireguard peers');
    expect(wg).toContain('endpoint-address="wg.server.com"');
  });

  it('16. Social Media & Streaming Static Routing configures platforms', () => {
    const script = generateSocialMediaRoutingScript({
      rosVersion: 'v7',
      lanInterface: 'ether3-LAN',
      targetWan: 'WAN2',
      targetGateway: '192.168.2.1',
      routingMarkName: 'SOSMED_TRAFFIC',
      selectedPlatforms: ['youtube', 'tiktok', 'whatsapp'],
      customDomains: ['threads.net'],
    });
    expect(script).toContain('youtube.com');
    expect(script).toContain('tiktok.com');
    expect(script).toContain('threads.net');
    expect(script).toContain('routing-table="SOSMED_TRAFFIC"');
  });
});
