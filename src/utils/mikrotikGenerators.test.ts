import { describe, it, expect } from 'vitest';
import {
  computePCCRatio,
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
  generateHotspotQRCodeScript,
  generateHotspotUserGenScript,
  generateBlockSharingTTLScript,
  generateBandwidthUpToScript,
  generateHotspotWizardScript,
  generateExpiredNotificationScript,
  generatePPPSecretsGenScript,
  generateDoHScript,
  generateBondingScript,
  generateNetwatchScript,
  generateRogueDHCPScript,
  generateMacChangeScript,
  generateHideRouterboardScript,
  generatePortKnockingScript,
  generateAdvancedProtectionScript,
  generateBlockWebsitesScript,
  generateAutoBackupEmailScript,
  generateMangleObfuscatorScript,
  generateBlockSocialMediaScript,
  calculatePCCDivisors,
  generateIndonesiaNTPScript,
  calculateMikroTikIP,
  generateWifiIdAutoLoginScript,
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

  it('1b. PCC Generator calculates bandwidth ratio correctly (e.g. WAN1 100Mbps, WAN2 200Mbps)', () => {
    const ratioWans = [
      { id: '1', name: 'WAN1', interface: 'ether1-ISP1', gateway: '192.168.1.1', distance: 1, speed: 100 },
      { id: '2', name: 'WAN2', interface: 'ether2-ISP2', gateway: '192.168.2.1', distance: 2, speed: 200 },
    ];

    const ratioInfo = computePCCRatio(ratioWans);
    expect(ratioInfo.totalSlots).toBe(3);
    expect(ratioInfo.allocations[0].slots).toBe(1);
    expect(ratioInfo.allocations[0].ratios).toEqual(['3/0']);
    expect(ratioInfo.allocations[1].slots).toBe(2);
    expect(ratioInfo.allocations[1].ratios).toEqual(['3/1', '3/2']);

    const script = generatePCCScript({
      rosVersion: 'v7',
      lanInterface: 'ether3-LAN',
      lanSubnet: '192.168.88.0/24',
      pccClassifier: 'both-addresses-and-ports',
      wans: ratioWans,
      addDefaultRoute: true,
      addNatMasquerade: true,
      addLocalAcceptRule: true,
    });

    expect(script).toContain('per-connection-classifier=both-addresses-and-ports:3/0');
    expect(script).toContain('per-connection-classifier=both-addresses-and-ports:3/1');
    expect(script).toContain('per-connection-classifier=both-addresses-and-ports:3/2');
    expect(script).toContain('Total Divisor: 3');
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

  it('17. Hotspot QR Code generates WiFi payload and walled garden', () => {
    const script = generateHotspotQRCodeScript({
      rosVersion: 'v7',
      ssid: 'Cafe_Free_WiFi',
      encryption: 'WPA',
      password: 'password123',
      hidden: false,
      loginUrl: 'http://hotspot.lan/login',
      hotspotServerName: 'hotspot1',
    });
    expect(script).toContain('WIFI:S:Cafe_Free_WiFi;T:WPA;P:password123;;');
    expect(script).toContain('walled-garden');
    expect(script).toContain('QR_FREE_USER');
  });

  it('18. Hotspot User Generator generates batch user accounts', () => {
    const script = generateHotspotUserGenScript({
      rosVersion: 'v7',
      server: 'hotspot1',
      profile: 'Voucher2Jam',
      prefix: 'vc-',
      userCount: 5,
      userType: 'different',
      charType: 'numeric',
      length: 4,
      uptimeLimit: '2h',
      comment: 'Voucher Test',
    });
    expect(script).toContain('/ip hotspot user');
    expect(script).toContain('profile="Voucher2Jam"');
    expect(script).toContain('limit-uptime=2h');
  });

  it('19. Block Sharing TTL generates anti-tethering rules', () => {
    const script = generateBlockSharingTTLScript({
      rosVersion: 'v7',
      hotspotInterface: 'ether3-Hotspot',
      ttlValue: 1,
      chain: 'postrouting',
      comment: 'Anti-Tethering',
    });
    expect(script).toContain('action=change-ttl new-ttl=set:1');
    expect(script).toContain('ttl=equal:1 action=drop');
  });

  it('20. Bandwidth Share Up-To generates PCQ queues', () => {
    const script = generateBandwidthUpToScript({
      rosVersion: 'v7',
      queueName: 'UpTo_Office',
      targetSubnet: '192.168.10.0/24',
      totalDownloadRate: '50M',
      totalUploadRate: '20M',
      minClientRate: '1M',
      maxClientRate: '10M',
    });
    expect(script).toContain('kind=pcq pcq-rate=10M');
    expect(script).toContain('queue="pcq_hotspot_up/pcq_hotspot_down"');
  });

  it('21. Easy Hotspot Wizard generates full setup script', () => {
    const script = generateHotspotWizardScript({
      rosVersion: 'v7',
      interfaceName: 'ether4-Hotspot',
      localIpAddress: '192.168.30.1/24',
      dhcpPoolRange: '192.168.30.10-192.168.30.250',
      dnsName: 'wifi.net',
      adminUser: 'superuser',
      adminPassword: 'superpassword',
      defaultProfileRateLimit: '10M/10M',
      sharedUsers: 2,
    });
    expect(script).toContain('hotspot-address=192.168.30.1');
    expect(script).toContain('dns-name="wifi.net"');
    expect(script).toContain('rate-limit="10M/10M"');
  });

  it('22. Expired Notification redirects client to notice', () => {
    const script = generateExpiredNotificationScript({
      rosVersion: 'v7',
      serviceType: 'pppoe',
      redirectUrl: 'http://billing.isp.net/isolir.html',
      internalProxyPort: '8080',
      addressListName: 'ISOLIR_CLIENTS',
    });
    expect(script).toContain('redirect-to="http://billing.isp.net/isolir.html"');
    expect(script).toContain('dst-port=80 action=redirect to-ports=8080');
  });

  it('23. PPP Secrets Generator creates accounts', () => {
    const script = generatePPPSecretsGenScript({
      rosVersion: 'v7',
      service: 'pppoe',
      profile: 'profile-50m',
      prefix: 'client_',
      userCount: 3,
      length: 4,
      remoteIpPrefix: '10.10.10.',
      comment: 'PPPoE Client',
    });
    expect(script).toContain('/ppp secret');
    expect(script).toContain('service=pppoe');
    expect(script).toContain('profile="profile-50m"');
  });

  it('24. DoH sets secure DNS resolvers', () => {
    const script = generateDoHScript({
      rosVersion: 'v7',
      provider: 'cloudflare',
      dohUrl: 'https://cloudflare-dns.com/dns-query',
      fallbackDns: '1.1.1.1,8.8.8.8',
      verifyCert: true,
      cleanStaticEntries: true,
    });
    expect(script).toContain('use-doh-server="https://cloudflare-dns.com/dns-query"');
    expect(script).toContain('cloudflare-dns.com');
  });

  it('25. Bonding Interface sets aggregation', () => {
    const script = generateBondingScript({
      rosVersion: 'v7',
      bondingName: 'bonding1',
      slaveInterfaces: ['ether1', 'ether2'],
      mode: '802.3ad',
      lacpRate: '1sec',
      transmitHashPolicy: 'layer-2-and-3',
      ipAddress: '10.0.0.1/30',
    });
    expect(script).toContain('slaves="ether1,ether2"');
    expect(script).toContain('mode=802.3ad');
  });

  it('26. Netwatch generates alert scripts', () => {
    const script = generateNetwatchScript({
      rosVersion: 'v7',
      hostIp: '8.8.8.8',
      hostName: 'GoogleDNS',
      checkInterval: '15s',
      timeout: '500ms',
      notifyChannel: 'telegram',
      telegramBotToken: '123456:ABC',
      telegramChatId: '987654',
    });
    expect(script).toContain('api.telegram.org/bot123456:ABC/sendMessage');
    expect(script).toContain('host=8.8.8.8');
  });

  it('27. Rogue DHCP alert and blocking works', () => {
    const script = generateRogueDHCPScript({
      rosVersion: 'v7',
      lanInterface: 'bridge-LAN',
      validServerMac: '00:11:22:33:44:55',
      alertTimeout: '1h',
      action: 'both',
    });
    expect(script).toContain('valid-server="00:11:22:33:44:55"');
    expect(script).toContain('Block Rogue DHCP Server Offer');
  });

  it('28. MAC address change generates command', () => {
    const script = generateMacChangeScript({
      rosVersion: 'v7',
      targetInterface: 'ether1',
      newMacAddress: 'AA:BB:CC:DD:EE:FF',
      backupOldMac: true,
    });
    expect(script).toContain('mac-address="AA:BB:CC:DD:EE:FF"');
  });

  it('29. Hide Routerboard Ninja disables discovery on WAN', () => {
    const script = generateHideRouterboardScript({
      rosVersion: 'v7',
      wanInterface: 'ether1-ISP1',
      lanInterface: 'ether2-LAN',
      disableNeighborDiscovery: true,
      disableMacServer: true,
      disableBandwidthServer: true,
      blockIcmpTracerouteToWan: true,
      normalizeOutboundTTL: true,
    });
    expect(script).toContain('discover-interface-list=!"ether1-ISP1"');
    expect(script).toContain('Ninja: Normal TTL 64');
  });

  it('30. Port Knocking generates sequential ICMP rules', () => {
    const script = generatePortKnockingScript({
      rosVersion: 'v7',
      wanInterface: 'ether1-ISP',
      targetPort: '8291',
      knockSize1: 128,
      knockSize2: 256,
      knockTimeout: '30s',
      accessDuration: '1h',
    });
    expect(script).toContain('packet-size=128');
    expect(script).toContain('packet-size=256');
    expect(script).toContain('KNOCK_AUTHORIZED');
  });

  it('31. Advanced Protection defends against attacks', () => {
    const script = generateAdvancedProtectionScript({
      rosVersion: 'v7',
      wanInterface: 'ether1-ISP',
      lanInterface: 'ether2-LAN',
      dropInvalid: true,
      blockSynFlood: true,
      blockPortScanners: true,
      protectBruteForceWinbox: true,
      protectBruteForceSSH: true,
      blockDnsOpenResolver: true,
    });
    expect(script).toContain('SYN Flood');
    expect(script).toContain('winbox_blacklist');
    expect(script).toContain('ssh_blacklist');
  });

  it('32. Block Websites filters gambling and piracy', () => {
    const script = generateBlockWebsitesScript({
      rosVersion: 'v7',
      lanInterface: 'ether3-LAN',
      categories: ['gambling', 'piracy'],
      customDomains: ['badsite.org'],
      blockMethod: 'address-list',
    });
    expect(script).toContain('sbobet.com');
    expect(script).toContain('thepiratebay.org');
    expect(script).toContain('badsite.org');
  });

  it('33. Auto Backup Email generates backup scheduler script', () => {
    const script = generateAutoBackupEmailScript({
      rosVersion: 'v7',
      emailRecipient: 'noc@perusahaan.com',
      backupPassword: 'SecretPassword',
      exportRsc: true,
      scheduleTime: '03:00:00',
      scheduleInterval: '1d',
      routerIdentity: 'Core-RB4011',
    });
    expect(script).toContain('noc@perusahaan.com');
    expect(script).toContain('AutoBackupToEmail');
    expect(script).toContain('/system scheduler');
  });

  it('34. Mangle Obfuscator strips comments', () => {
    const sample = `/ip firewall mangle\nadd chain=prerouting comment="Test" action=accept`;
    const obfuscated = generateMangleObfuscatorScript({
      rosVersion: 'v7',
      originalScript: sample,
      stripComments: true,
      addDecoyRules: true,
      renameIdentifiers: false,
    });
    expect(obfuscated).not.toContain('comment="Test"');
    expect(obfuscated).toContain('Decoy Rules');
  });

  it('35. Block Social Media blocks platforms during hours', () => {
    const script = generateBlockSocialMediaScript({
      rosVersion: 'v7',
      lanInterface: 'ether3-LAN',
      selectedPlatforms: ['youtube', 'tiktok'],
      blockTimeStart: '08:00:00',
      blockTimeEnd: '17:00:00',
      blockDays: 'mon,tue,wed,thu,fri',
    });
    expect(script).toContain('youtube.com');
    expect(script).toContain('tiktok.com');
    expect(script).toContain('time="08:00:00-17:00:00,mon,tue,wed,thu,fri"');
  });

  it('36. PCC Calculation computes correct divisors and ratios', () => {
    const calc = calculatePCCDivisors([100, 50]); // 2:1 ratio
    expect(calc.totalSlots).toBe(3);
    expect(calc.allocations[0].slots).toBe(2);
    expect(calc.allocations[1].slots).toBe(1);
    expect(calc.cliScript).toContain('per-connection-classifier=both-addresses-and-ports:3/0');
  });

  it('37. Indonesia NTP sets timezone and NTP servers', () => {
    const script = generateIndonesiaNTPScript({
      rosVersion: 'v7',
      timezone: 'Asia/Jakarta',
      ntpServers: ['id.pool.ntp.org'],
    });
    expect(script).toContain('time-zone-name="Asia/Jakarta"');
    expect(script).toContain('servers="id.pool.ntp.org"');
  });

  it('38. MikroTik IP Calculator calculates subnet details', () => {
    const res = calculateMikroTikIP('192.168.10.15/24', 'ether2', 'v7');
    expect(res.network).toBe('192.168.10.0');
    expect(res.broadcast).toBe('192.168.10.255');
    expect(res.totalHosts).toBe(256);
    expect(res.usableHosts).toBe(254);
    expect(res.hostMin).toBe('192.168.10.1');
    expect(res.hostMax).toBe('192.168.10.254');
    expect(res.cliScript).toContain('/ip address');
  });

  it('39. Wifi.id Auto-Login creates keepalive script', () => {
    const script = generateWifiIdAutoLoginScript({
      rosVersion: 'v7',
      loginType: 'wifi_id',
      username: 'wifi_user',
      password: 'wifi_pass',
      wanInterface: 'wlan1',
      checkInterval: '2m',
    });
    expect(script).toContain('welcome2.wifi.id/auth/process.php');
    expect(script).toContain('username=wifi_user');
    expect(script).toContain('WifiIdKeepAlive');
  });
});
