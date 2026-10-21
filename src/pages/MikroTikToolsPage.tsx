import React, { useState, useMemo } from 'react';
import {
  Server,
  Layers,
  Network,
  Shield,
  Lock,
  Copy,
  Check,
  Download,
  Plus,
  Trash2,
  Info,
  Sliders,
  Terminal,
  Sun,
  Moon,
  Gamepad2,
  Globe,
  Share2,
  Radio,
  ArrowRightLeft,
  Key,
} from 'lucide-react';
import type {
  MikroTikToolId,
  ToolCategory,
  RouterOSVersion,
  WanLine,
  PCCConfig,
  VPNRemoteClientConfig,
} from '../types/mikrotikTools';
import type { ToastMessage } from '../components/Toast';
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
  GAME_PRESETS,
  WEBSITE_PRESETS,
  SOCIAL_PRESETS,
} from '../utils/mikrotikGenerators';

interface MikroTikToolsPageProps {
  addToast?: (type: ToastMessage['type'], title: string, message?: string) => void;
}

interface ToolItem {
  id: MikroTikToolId;
  name: string;
  category: ToolCategory;
  shortDesc: string;
  icon: React.ReactNode;
}

const TOOLS_LIST: ToolItem[] = [
  // Load Balancing
  {
    id: 'lb-pcc',
    name: 'Load Balancing PCC',
    category: 'load-balancing',
    shortDesc: 'Per Connection Classifier multi-WAN balancing',
    icon: <Network className="w-4 h-4 text-orange-600" />,
  },
  {
    id: 'lb-nth',
    name: 'Load Balancing NTH',
    category: 'load-balancing',
    shortDesc: 'Round-robin packet / connection counter balancing',
    icon: <Layers className="w-4 h-4 text-amber-600" />,
  },
  {
    id: 'lb-ecmp',
    name: 'Load Balancing ECMP',
    category: 'load-balancing',
    shortDesc: 'Equal Cost Multi-Path multi-gateway route',
    icon: <ArrowRightLeft className="w-4 h-4 text-blue-600" />,
  },
  {
    id: 'failover-recursive',
    name: 'Failover Recursive Gateway',
    category: 'load-balancing',
    shortDesc: 'DNS check (8.8.8.8 / 1.1.1.1) recursive gateway failover',
    icon: <Radio className="w-4 h-4 text-emerald-600" />,
  },

  // Traffic Steering
  {
    id: 'games-raw',
    name: 'Games Static Routing (Filter Raw)',
    category: 'traffic-steering',
    shortDesc: 'Route game traffic with low CPU Raw filter address-list',
    icon: <Gamepad2 className="w-4 h-4 text-purple-600" />,
  },
  {
    id: 'games-mangle',
    name: 'Games Static Routing (Mangle Port)',
    category: 'traffic-steering',
    shortDesc: 'Port-based game traffic steering to dedicated ISP',
    icon: <Gamepad2 className="w-4 h-4 text-indigo-600" />,
  },
  {
    id: 'website-routing',
    name: 'Website Static Routing',
    category: 'traffic-steering',
    shortDesc: 'Route Perbankan, DJP Online, Zoom ke ISP khusus',
    icon: <Globe className="w-4 h-4 text-teal-600" />,
  },
  {
    id: 'client-ip-routing',
    name: 'Local Client IP Static Routing',
    category: 'traffic-steering',
    shortDesc: 'Policy Based Routing untuk IP Client / Subnet VIP',
    icon: <Sliders className="w-4 h-4 text-cyan-600" />,
  },
  {
    id: 'port-tcp-udp-routing',
    name: 'Port TCP/UDP Static Routing',
    category: 'traffic-steering',
    shortDesc: 'Route traffic berdasarkan nomor port TCP atau UDP',
    icon: <Sliders className="w-4 h-4 text-sky-600" />,
  },
  {
    id: 'social-media-routing',
    name: 'Static Routing Youtube, Tiktok, FB, WA',
    category: 'traffic-steering',
    shortDesc: 'Pisahkan trafik sosmed & streaming ke ISP cadangan',
    icon: <Share2 className="w-4 h-4 text-rose-600" />,
  },

  // NAT & Firewall
  {
    id: 'port-forwarding',
    name: 'Port Forwarding with NAT',
    category: 'nat-firewall',
    shortDesc: 'DST-NAT untuk CCTV, Web Server, Winbox + Hairpin NAT',
    icon: <Shield className="w-4 h-4 text-green-600" />,
  },
  {
    id: 'remote-access-isp',
    name: 'Remote Access ISP "Public IP Static"',
    category: 'nat-firewall',
    shortDesc: 'Filter aman remote Winbox/WebFig & Multi-WAN reply rule',
    icon: <Lock className="w-4 h-4 text-slate-700" />,
  },

  // VPN
  {
    id: 'vpn-all-traffic',
    name: 'All Traffic to VPN Tunnel',
    category: 'vpn-tunnel',
    shortDesc: 'Arahkan seluruh internet ke VPN + proteksi Kill-Switch',
    icon: <Server className="w-4 h-4 text-indigo-600" />,
  },
  {
    id: 'vpn-port-games',
    name: 'VPN Routing Port Games',
    category: 'vpn-tunnel',
    shortDesc: 'Kirim hanya port game online ke tunnel VPN gaming',
    icon: <Key className="w-4 h-4 text-violet-600" />,
  },
  {
    id: 'vpn-ip-games',
    name: 'VPN Routing IP Address Games',
    category: 'vpn-tunnel',
    shortDesc: 'Route IP Address game server melalui tunnel VPN',
    icon: <Gamepad2 className="w-4 h-4 text-fuchsia-600" />,
  },
  {
    id: 'vpn-remote-client',
    name: 'VPN Remote SSTP - L2TP - PPTP - OVPN',
    category: 'vpn-tunnel',
    shortDesc: 'Client dialer untuk remote Mikrotik & Mikhmon Online',
    icon: <Server className="w-4 h-4 text-blue-700" />,
  },
];

export const MikroTikToolsPage: React.FC<MikroTikToolsPageProps> = ({ addToast }) => {
  const [selectedToolId, setSelectedToolId] = useState<MikroTikToolId>('lb-pcc');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ToolCategory>('all');
  const [rosVersion, setRosVersion] = useState<RouterOSVersion>('v7');
  const [terminalTheme, setTerminalTheme] = useState<'light' | 'dark'>('light');
  const [copied, setCopied] = useState<boolean>(false);

  // Common Multi-WAN State (used by PCC, NTH, ECMP)
  const [wans, setWans] = useState<WanLine[]>([
    { id: '1', name: 'WAN1', interface: 'ether1-ISP1', gateway: '192.168.1.1', distance: 1, weight: 1, targetDns: '8.8.8.8' },
    { id: '2', name: 'WAN2', interface: 'ether2-ISP2', gateway: '192.168.2.1', distance: 2, weight: 1, targetDns: '1.1.1.1' },
  ]);

  // PCC state
  const [pccLanInterface, setPccLanInterface] = useState<string>('ether3-LAN');
  const [pccLanSubnet, setPccLanSubnet] = useState<string>('192.168.88.0/24');
  const [pccClassifier, setPccClassifier] = useState<PCCConfig['pccClassifier']>('both-addresses-and-ports');

  // NTH state
  const [nthLanInterface, setNthLanInterface] = useState<string>('ether3-LAN');
  const [nthLanSubnet, setNthLanSubnet] = useState<string>('192.168.88.0/24');

  // ECMP state
  const [ecmpCheckGateway, setEcmpCheckGateway] = useState<'ping' | 'arp' | 'none'>('ping');

  // Recursive Failover state
  const [failoverPrimaryTarget, setFailoverPrimaryTarget] = useState<string>('8.8.8.8');
  const [failoverSecondaryTarget, setFailoverSecondaryTarget] = useState<string>('1.1.1.1');

  // Games Routing state
  const [gameLanInterface, setGameLanInterface] = useState<string>('ether3-LAN');
  const [gameTargetWan, setGameTargetWan] = useState<string>('WAN1');
  const [gameTargetGateway, setGameTargetGateway] = useState<string>('192.168.1.1');
  const [gameRoutingMark, setGameRoutingMark] = useState<string>('GAMES_TRAFFIC');
  const [selectedGames, setSelectedGames] = useState<string[]>(['mlbb', 'ff', 'valorant', 'pubgm']);
  const [customGameTcp, setCustomGameTcp] = useState<string>('');
  const [customGameUdp, setCustomGameUdp] = useState<string>('');

  // Website Routing state
  const [webLanInterface, setWebLanInterface] = useState<string>('ether3-LAN');
  const [webTargetWan, setWebTargetWan] = useState<string>('WAN1');
  const [webTargetGateway, setWebTargetGateway] = useState<string>('192.168.1.1');
  const [webRoutingMark, setWebRoutingMark] = useState<string>('WEBSITES_TRAFFIC');
  const [selectedWebsites, setSelectedWebsites] = useState<string[]>(['bank_bca', 'bank_mandiri', 'pajak_djp']);
  const [customWebDomains, setCustomWebDomains] = useState<string>('');

  // Client IP Routing state
  const [clientLanInterface, setClientLanInterface] = useState<string>('ether3-LAN');
  const [clientTargetWan, setClientTargetWan] = useState<string>('WAN2');
  const [clientTargetGateway, setClientTargetGateway] = useState<string>('192.168.2.1');
  const [clientRoutingMark, setClientRoutingMark] = useState<string>('VIP_CLIENTS_ROUTE');
  const [clientIpList, setClientIpList] = useState<string>('192.168.88.50, 192.168.88.100-192.168.88.120');
  const [clientDesc, setClientDesc] = useState<string>('Ruang Direktur & Server');

  // Port Forwarding state
  const [pfWanInterface, setPfWanInterface] = useState<string>('ether1-ISP1');
  const [pfPublicIp, setPfPublicIp] = useState<string>('');
  const [pfProtocol, setPfProtocol] = useState<'tcp' | 'udp' | 'both'>('tcp');
  const [pfExternalPort, setPfExternalPort] = useState<string>('8080');
  const [pfInternalIp, setPfInternalIp] = useState<string>('192.168.88.50');
  const [pfInternalPort, setPfInternalPort] = useState<string>('80');
  const [pfComment, setPfComment] = useState<string>('Web Server Internal');
  const [pfHairpin, setPfHairpin] = useState<boolean>(true);
  const [pfLanSubnet, setPfLanSubnet] = useState<string>('192.168.88.0/24');

  // Port Routing state
  const [prLanInterface, setPrLanInterface] = useState<string>('ether3-LAN');
  const [prTargetWan, setPrTargetWan] = useState<string>('WAN1');
  const [prTargetGateway, setPrTargetGateway] = useState<string>('192.168.1.1');
  const [prRoutingMark, setPrRoutingMark] = useState<string>('PORTS_TRAFFIC');
  const [prProtocol, setPrProtocol] = useState<'tcp' | 'udp' | 'both'>('tcp');
  const [prPorts, setPrPorts] = useState<string>('80,443,8080');
  const [prDesc, setPrDesc] = useState<string>('Browsing HTTP/HTTPS');

  // All Traffic to VPN state
  const [vpnTunnelInterface, setVpnTunnelInterface] = useState<string>('wireguard1');
  const [vpnLanInterface, setVpnLanInterface] = useState<string>('ether3-LAN');
  const [vpnServerEndpoint, setVpnServerEndpoint] = useState<string>('103.150.200.5');
  const [vpnKillSwitch, setVpnKillSwitch] = useState<boolean>(true);
  const [vpnClientSubnet, setVpnClientSubnet] = useState<string>('');

  // Remote Access state
  const [raWanInterface, setRaWanInterface] = useState<string>('ether1-ISP1');
  const [raWanGateway, setRaWanGateway] = useState<string>('192.168.1.1');
  const [raAllowedIps, setRaAllowedIps] = useState<string>('');
  const [raWinbox, setRaWinbox] = useState<boolean>(true);
  const [raWinboxPort, setRaWinboxPort] = useState<string>('8291');
  const [raWebfig, setRaWebfig] = useState<boolean>(true);
  const [raWebfigPort, setRaWebfigPort] = useState<string>('80,443');
  const [raSSH, setRaSSH] = useState<boolean>(false);
  const [raSSHPort, setRaSSHPort] = useState<string>('22');
  const [raApi, setRaApi] = useState<boolean>(false);
  const [raApiPort, setRaApiPort] = useState<string>('8728');
  const [raMangleReply, setRaMangleReply] = useState<boolean>(true);

  // VPN Games state
  const [vpnGamesInterface, setVpnGamesInterface] = useState<string>('ovpn-gaming');
  const [vpnGamesRoutingMark, setVpnGamesRoutingMark] = useState<string>('VPN_GAMES_TRAFFIC');
  const [vpnGamesSelected, setVpnGamesSelected] = useState<string[]>(['mlbb', 'ff', 'valorant']);
  const [vpnGameCustomIps, setVpnGameCustomIps] = useState<string>('103.28.54.0/24, 103.28.55.0/24');

  // VPN Remote Client state
  const [vrcType, setVrcType] = useState<VPNRemoteClientConfig['vpnType']>('sstp');
  const [vrcServer, setVrcServer] = useState<string>('id1.tunnel.my.id');
  const [vrcPort, setVrcPort] = useState<string>('443');
  const [vrcUser, setVrcUser] = useState<string>('mikrotik_client');
  const [vrcPass, setVrcPass] = useState<string>('rahasia123');
  const [vrcProfile, setVrcProfile] = useState<string>('default-encryption');
  const [vrcInterface, setVrcInterface] = useState<string>('sstp-out1');
  const [vrcWgClientIp, setVrcWgClientIp] = useState<string>('10.200.0.2/24');
  const [vrcWgPrivKey, setVrcWgPrivKey] = useState<string>('');
  const [vrcWgServerPubKey, setVrcWgServerPubKey] = useState<string>('');

  // Social Media state
  const [smLanInterface, setSmLanInterface] = useState<string>('ether3-LAN');
  const [smTargetWan, setSmTargetWan] = useState<string>('WAN2');
  const [smTargetGateway, setSmTargetGateway] = useState<string>('192.168.2.1');
  const [smRoutingMark, setSmRoutingMark] = useState<string>('SOSMED_TRAFFIC');
  const [smSelected, setSmSelected] = useState<string[]>(['youtube', 'tiktok', 'facebook_meta', 'whatsapp']);
  const [smCustomDomains, setSmCustomDomains] = useState<string>('');

  // WAN lines helper functions
  const handleAddWan = () => {
    const nextIdx = wans.length + 1;
    const newWan: WanLine = {
      id: String(Date.now()),
      name: `WAN${nextIdx}`,
      interface: `ether${nextIdx}-ISP${nextIdx}`,
      gateway: `192.168.${nextIdx}.1`,
      distance: nextIdx,
      weight: 1,
      targetDns: nextIdx === 3 ? '208.67.222.222' : '9.9.9.9',
    };
    setWans([...wans, newWan]);
  };

  const handleRemoveWan = (id: string) => {
    if (wans.length <= 2) {
      addToast?.('error', 'Peringatan', 'Minimal harus ada 2 WAN lines untuk Load Balancing.');
      return;
    }
    setWans(wans.filter((w) => w.id !== id));
  };

  const handleUpdateWan = (id: string, field: keyof WanLine, val: string | number) => {
    setWans(
      wans.map((w) => {
        if (w.id === id) {
          return { ...w, [field]: val };
        }
        return w;
      })
    );
  };

  // Generate output script dynamically based on active tool
  const generatedScript = useMemo<string>(() => {
    switch (selectedToolId) {
      case 'lb-pcc':
        return generatePCCScript({
          rosVersion,
          lanInterface: pccLanInterface,
          lanSubnet: pccLanSubnet,
          pccClassifier,
          wans,
          addDefaultRoute: true,
          addNatMasquerade: true,
          addLocalAcceptRule: true,
        });

      case 'lb-nth':
        return generateNTHScript({
          rosVersion,
          lanInterface: nthLanInterface,
          lanSubnet: nthLanSubnet,
          wans,
          addDefaultRoute: true,
          addNatMasquerade: true,
        });

      case 'lb-ecmp':
        return generateECMPScript({
          rosVersion,
          wans,
          checkGateway: ecmpCheckGateway,
          addNatMasquerade: true,
        });

      case 'failover-recursive':
        return generateRecursiveFailoverScript({
          rosVersion,
          primaryWan: wans[0] || { id: '1', name: 'WAN1', interface: 'ether1-ISP1', gateway: '192.168.1.1', distance: 1 },
          secondaryWan: wans[1] || { id: '2', name: 'WAN2', interface: 'ether2-ISP2', gateway: '192.168.2.1', distance: 2 },
          primaryTargetDns: failoverPrimaryTarget,
          secondaryTargetDns: failoverSecondaryTarget,
          addNatMasquerade: true,
        });

      case 'games-raw':
        return generateGamesRoutingScript({
          rosVersion,
          lanInterface: gameLanInterface,
          targetWan: gameTargetWan,
          targetGateway: gameTargetGateway,
          routingMarkName: gameRoutingMark,
          method: 'raw',
          selectedGameIds: selectedGames,
          customPortsTcp: customGameTcp,
          customPortsUdp: customGameUdp,
        });

      case 'games-mangle':
        return generateGamesRoutingScript({
          rosVersion,
          lanInterface: gameLanInterface,
          targetWan: gameTargetWan,
          targetGateway: gameTargetGateway,
          routingMarkName: gameRoutingMark,
          method: 'mangle',
          selectedGameIds: selectedGames,
          customPortsTcp: customGameTcp,
          customPortsUdp: customGameUdp,
        });

      case 'website-routing': {
        const customArr = customWebDomains.split(',').map((s) => s.trim()).filter(Boolean);
        return generateWebsiteRoutingScript({
          rosVersion,
          lanInterface: webLanInterface,
          targetWan: webTargetWan,
          targetGateway: webTargetGateway,
          routingMarkName: webRoutingMark,
          selectedPresets: selectedWebsites,
          customDomains: customArr,
        });
      }

      case 'client-ip-routing':
        return generateClientIpRoutingScript({
          rosVersion,
          lanInterface: clientLanInterface,
          targetWan: clientTargetWan,
          targetGateway: clientTargetGateway,
          routingMarkName: clientRoutingMark,
          clientIpList,
          description: clientDesc,
        });

      case 'port-forwarding':
        return generatePortForwardingScript({
          rosVersion,
          wanInterface: pfWanInterface,
          publicIp: pfPublicIp,
          protocol: pfProtocol,
          externalPort: pfExternalPort,
          internalIp: pfInternalIp,
          internalPort: pfInternalPort,
          comment: pfComment,
          includeHairpinNat: pfHairpin,
          lanSubnet: pfLanSubnet,
        });

      case 'port-tcp-udp-routing':
        return generatePortTcpUdpRoutingScript({
          rosVersion,
          lanInterface: prLanInterface,
          targetWan: prTargetWan,
          targetGateway: prTargetGateway,
          routingMarkName: prRoutingMark,
          protocol: prProtocol,
          ports: prPorts,
          description: prDesc,
        });

      case 'vpn-all-traffic':
        return generateAllTrafficVPNScript({
          rosVersion,
          vpnInterface: vpnTunnelInterface,
          lanInterface: vpnLanInterface,
          vpnServerIp: vpnServerEndpoint,
          addNatMasquerade: true,
          enableKillSwitch: vpnKillSwitch,
          clientSubnet: vpnClientSubnet,
        });

      case 'remote-access-isp':
        return generateRemoteAccessScript({
          rosVersion,
          wanInterface: raWanInterface,
          wanGateway: raWanGateway,
          allowedSourceIps: raAllowedIps,
          enableWinbox: raWinbox,
          winboxPort: raWinboxPort,
          enableWebfig: raWebfig,
          webfigPort: raWebfigPort,
          enableSSH: raSSH,
          sshPort: raSSHPort,
          enableApi: raApi,
          apiPort: raApiPort,
          addMangleReplyRule: raMangleReply,
        });

      case 'vpn-port-games':
        return generateVPNGamesScript({
          rosVersion,
          vpnInterface: vpnGamesInterface,
          routingMarkName: vpnGamesRoutingMark,
          type: 'port',
          selectedGameIds: vpnGamesSelected,
          customPortsTcp: customGameTcp,
          customPortsUdp: customGameUdp,
          customIps: '',
        });

      case 'vpn-ip-games':
        return generateVPNGamesScript({
          rosVersion,
          vpnInterface: vpnGamesInterface,
          routingMarkName: vpnGamesRoutingMark,
          type: 'ip',
          selectedGameIds: [],
          customPortsTcp: '',
          customPortsUdp: '',
          customIps: vpnGameCustomIps,
        });

      case 'vpn-remote-client':
        return generateVPNRemoteClientScript({
          rosVersion,
          vpnType: vrcType,
          serverAddress: vrcServer,
          serverPort: vrcPort,
          username: vrcUser,
          password: vrcPass,
          profileName: vrcProfile,
          interfaceName: vrcInterface,
          addDefaultRoute: false,
          wireguardClientIp: vrcWgClientIp,
          wireguardPrivateKey: vrcWgPrivKey,
          wireguardServerPublicKey: vrcWgServerPubKey,
        });

      case 'social-media-routing': {
        const customArr = smCustomDomains.split(',').map((s) => s.trim()).filter(Boolean);
        return generateSocialMediaRoutingScript({
          rosVersion,
          lanInterface: smLanInterface,
          targetWan: smTargetWan,
          targetGateway: smTargetGateway,
          routingMarkName: smRoutingMark,
          selectedPlatforms: smSelected,
          customDomains: customArr,
        });
      }

      default:
        return '# Pilih salah satu fitur untuk men-generate skrip MikroTik.';
    }
  }, [
    selectedToolId,
    rosVersion,
    wans,
    pccLanInterface,
    pccLanSubnet,
    pccClassifier,
    nthLanInterface,
    nthLanSubnet,
    ecmpCheckGateway,
    failoverPrimaryTarget,
    failoverSecondaryTarget,
    gameLanInterface,
    gameTargetWan,
    gameTargetGateway,
    gameRoutingMark,
    selectedGames,
    customGameTcp,
    customGameUdp,
    webLanInterface,
    webTargetWan,
    webTargetGateway,
    webRoutingMark,
    selectedWebsites,
    customWebDomains,
    clientLanInterface,
    clientTargetWan,
    clientTargetGateway,
    clientRoutingMark,
    clientIpList,
    clientDesc,
    pfWanInterface,
    pfPublicIp,
    pfProtocol,
    pfExternalPort,
    pfInternalIp,
    pfInternalPort,
    pfComment,
    pfHairpin,
    pfLanSubnet,
    prLanInterface,
    prTargetWan,
    prTargetGateway,
    prRoutingMark,
    prProtocol,
    prPorts,
    prDesc,
    vpnTunnelInterface,
    vpnLanInterface,
    vpnServerEndpoint,
    vpnKillSwitch,
    vpnClientSubnet,
    raWanInterface,
    raWanGateway,
    raAllowedIps,
    raWinbox,
    raWinboxPort,
    raWebfig,
    raWebfigPort,
    raSSH,
    raSSHPort,
    raApi,
    raApiPort,
    raMangleReply,
    vpnGamesInterface,
    vpnGamesRoutingMark,
    vpnGamesSelected,
    vpnGameCustomIps,
    vrcType,
    vrcServer,
    vrcPort,
    vrcUser,
    vrcPass,
    vrcProfile,
    vrcInterface,
    vrcWgClientIp,
    vrcWgPrivKey,
    vrcWgServerPubKey,
    smLanInterface,
    smTargetWan,
    smTargetGateway,
    smRoutingMark,
    smSelected,
    smCustomDomains,
  ]);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    addToast?.('success', 'Berhasil Disalin', 'Skrip MikroTik berhasil disalin ke clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadRsc = () => {
    const filename = `mikrotik_${selectedToolId}_${rosVersion}.rsc`;
    const blob = new Blob([generatedScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast?.('success', 'Berhasil Mengunduh', `File ${filename} berhasil diunduh!`);
  };

  const filteredTools = useMemo(() => {
    if (categoryFilter === 'all') return TOOLS_LIST;
    return TOOLS_LIST.filter((t) => t.category === categoryFilter);
  }, [categoryFilter]);

  const activeTool = TOOLS_LIST.find((t) => t.id === selectedToolId) || TOOLS_LIST[0];

  return (
    <div className="space-y-6">
      {/* Top Banner / Introduction Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-orange-50/60 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
                  MikroTik Script Generator Suite
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                  16 Network Tools
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  ROUTE // MANGLE // NAT // VPN
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Koleksi generator skrip RouterOS lengkap berbasis web: Load Balancing PCC/NTH/ECMP, Failover Recursive, Traffic Steering Game/Sosmed, DST-NAT, dan VPN Tunneling.
              </p>
            </div>
          </div>

          {/* RouterOS Version Switcher */}
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200 shrink-0">
            <span className="text-xs font-semibold text-slate-600 pl-2">Target RouterOS:</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setRosVersion('v7')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  rosVersion === 'v7'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                v7 (v7.x Terbaru)
              </button>
              <button
                type="button"
                onClick={() => setRosVersion('v6')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  rosVersion === 'v6'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                v6 (Legacy)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Category Filter & Tool Selection Grid (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Category Tabs */}
          <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === 'all'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semua (16)
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('load-balancing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === 'load-balancing'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Load Balancing (4)
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('traffic-steering')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === 'traffic-steering'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Traffic Steering (5)
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('nat-firewall')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === 'nat-firewall'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              NAT & Sec (2)
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('vpn-tunnel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === 'vpn-tunnel'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              VPN & Tunnel (5)
            </button>
          </div>

          {/* Tools List Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
            {filteredTools.map((tool) => {
              const isSelected = tool.id === selectedToolId;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setSelectedToolId(tool.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 my-0.5 ${
                    isSelected
                      ? 'bg-orange-50 border border-orange-200/80 shadow-sm'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'bg-orange-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tool.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold truncate ${isSelected ? 'text-orange-950' : 'text-slate-800'}`}>
                        {tool.name}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-orange-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{tool.shortDesc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Winbox Terminal Guide Tip */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Petunjuk Eksekusi di Router MikroTik:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-slate-600">
              <li>Sesuaikan parameter antarmuka (WAN / LAN / Gateway) pada formulir.</li>
              <li>Klik tombol <b>Salin Skrip CLI</b> atau <b>Download File .rsc</b>.</li>
              <li>Buka aplikasi <b>Winbox</b> &rarr; Menu <b>New Terminal</b>.</li>
              <li>Klik kanan &rarr; <b>Paste</b>, lalu tekan <b>Enter</b> hingga selesai.</li>
            </ol>
          </div>
        </div>

        {/* Right Column: Form Inputs & Script Viewer (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Tool Form Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-orange-100 text-orange-700">
                  {activeTool.icon}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">{activeTool.name}</h2>
                  <p className="text-xs text-slate-500">{activeTool.shortDesc}</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-md font-mono font-medium bg-slate-100 text-slate-700">
                ROS {rosVersion.toUpperCase()}
              </span>
            </div>

            {/* Dynamic Form per Tool */}

            {/* 1. PCC & 2. NTH & 3. ECMP WAN Table */}
            {(selectedToolId === 'lb-pcc' || selectedToolId === 'lb-nth' || selectedToolId === 'lb-ecmp') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Daftar WAN Lines (Koneksi ISP):</label>
                  <button
                    type="button"
                    onClick={handleAddWan}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah WAN
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-12 gap-2 bg-slate-50 px-3 py-2 font-semibold text-slate-600">
                    <div className="col-span-2">Name</div>
                    <div className="col-span-4">Interface</div>
                    <div className="col-span-4">Gateway IP</div>
                    <div className="col-span-2 text-center">Aksi</div>
                  </div>
                  {wans.map((w) => (
                    <div key={w.id} className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center bg-white hover:bg-slate-50/60">
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={w.name}
                          onChange={(e) => handleUpdateWan(w.id, 'name', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md font-mono"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={w.interface}
                          onChange={(e) => handleUpdateWan(w.id, 'interface', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md font-mono"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={w.gateway}
                          onChange={(e) => handleUpdateWan(w.id, 'gateway', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md font-mono"
                        />
                      </div>
                      <div className="col-span-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveWan(w.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Hapus baris WAN"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Specific configs for PCC */}
                {selectedToolId === 'lb-pcc' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">LAN Interface</label>
                      <input
                        type="text"
                        value={pccLanInterface}
                        onChange={(e) => setPccLanInterface(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                        placeholder="ether3-LAN atau bridge-LAN"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">LAN Subnet (RFC1918)</label>
                      <input
                        type="text"
                        value={pccLanSubnet}
                        onChange={(e) => setPccLanSubnet(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                        placeholder="192.168.88.0/24"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">PCC Match Mode</label>
                      <select
                        value={pccClassifier}
                        onChange={(e) => setPccClassifier(e.target.value as any)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="both-addresses-and-ports">both-addresses-and-ports</option>
                        <option value="both-addresses">both-addresses</option>
                        <option value="src-address">src-address</option>
                        <option value="src-address-and-port">src-address-and-port</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Specific configs for NTH */}
                {selectedToolId === 'lb-nth' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">LAN Interface</label>
                      <input
                        type="text"
                        value={nthLanInterface}
                        onChange={(e) => setNthLanInterface(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                        placeholder="ether3-LAN"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">LAN Subnet</label>
                      <input
                        type="text"
                        value={nthLanSubnet}
                        onChange={(e) => setNthLanSubnet(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                        placeholder="192.168.88.0/24"
                      />
                    </div>
                  </div>
                )}

                {/* Specific configs for ECMP */}
                {selectedToolId === 'lb-ecmp' && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Check Gateway Protocol</label>
                    <select
                      value={ecmpCheckGateway}
                      onChange={(e) => setEcmpCheckGateway(e.target.value as any)}
                      className="w-full max-w-xs px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="ping">ping (Disarankan)</option>
                      <option value="arp">arp</option>
                      <option value="none">none (Tanpa health-check)</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* 4. Failover Recursive */}
            {selectedToolId === 'failover-recursive' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-slate-800">ISP 1 (Jalur Utama)</span>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Interface & Gateway</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={wans[0]?.interface || 'ether1-ISP1'}
                          onChange={(e) => handleUpdateWan(wans[0]?.id || '1', 'interface', e.target.value)}
                          className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                          placeholder="ether1"
                        />
                        <input
                          type="text"
                          value={wans[0]?.gateway || '192.168.1.1'}
                          onChange={(e) => handleUpdateWan(wans[0]?.id || '1', 'gateway', e.target.value)}
                          className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                          placeholder="192.168.1.1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">DNS Check Target (Scope 10)</label>
                      <input
                        type="text"
                        value={failoverPrimaryTarget}
                        onChange={(e) => setFailoverPrimaryTarget(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                        placeholder="8.8.8.8"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-slate-800">ISP 2 (Jalur Cadangan)</span>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Interface & Gateway</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={wans[1]?.interface || 'ether2-ISP2'}
                          onChange={(e) => handleUpdateWan(wans[1]?.id || '2', 'interface', e.target.value)}
                          className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                          placeholder="ether2"
                        />
                        <input
                          type="text"
                          value={wans[1]?.gateway || '192.168.2.1'}
                          onChange={(e) => handleUpdateWan(wans[1]?.id || '2', 'gateway', e.target.value)}
                          className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                          placeholder="192.168.2.1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">DNS Check Target (Scope 10)</label>
                      <input
                        type="text"
                        value={failoverSecondaryTarget}
                        onChange={(e) => setFailoverSecondaryTarget(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                        placeholder="1.1.1.1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5 & 6. Games Routing (Raw & Mangle) */}
            {(selectedToolId === 'games-raw' || selectedToolId === 'games-mangle') && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">LAN Interface</label>
                    <input
                      type="text"
                      value={gameLanInterface}
                      onChange={(e) => setGameLanInterface(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="ether3-LAN"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target WAN</label>
                    <input
                      type="text"
                      value={gameTargetWan}
                      onChange={(e) => setGameTargetWan(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="WAN1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Gateway</label>
                    <input
                      type="text"
                      value={gameTargetGateway}
                      onChange={(e) => setGameTargetGateway(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="192.168.1.1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Routing Mark Name</label>
                    <input
                      type="text"
                      value={gameRoutingMark}
                      onChange={(e) => setGameRoutingMark(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="GAMES_TRAFFIC"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Preset Game Online Populer:</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {GAME_PRESETS.map((p) => {
                      const isChecked = selectedGames.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-purple-50 border-purple-300 text-purple-900 font-medium'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedGames([...selectedGames, p.id]);
                              else setSelectedGames(selectedGames.filter((id) => id !== p.id));
                            }}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span className="truncate">{p.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Custom Port TCP Tambahan (koma pisah)</label>
                    <input
                      type="text"
                      value={customGameTcp}
                      onChange={(e) => setCustomGameTcp(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="contoh: 8088,9090-9095"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Custom Port UDP Tambahan (koma pisah)</label>
                    <input
                      type="text"
                      value={customGameUdp}
                      onChange={(e) => setCustomGameUdp(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="contoh: 20001-20010"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 7. Website Static Routing */}
            {selectedToolId === 'website-routing' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">LAN Interface</label>
                    <input
                      type="text"
                      value={webLanInterface}
                      onChange={(e) => setWebLanInterface(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="ether3-LAN"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target WAN</label>
                    <input
                      type="text"
                      value={webTargetWan}
                      onChange={(e) => setWebTargetWan(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="WAN1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Gateway</label>
                    <input
                      type="text"
                      value={webTargetGateway}
                      onChange={(e) => setWebTargetGateway(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="192.168.1.1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Routing Mark Name</label>
                    <input
                      type="text"
                      value={webRoutingMark}
                      onChange={(e) => setWebRoutingMark(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="WEBSITES_TRAFFIC"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Preset Website / Layanan Penting:</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {WEBSITE_PRESETS.map((p) => {
                      const isChecked = selectedWebsites.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-teal-50 border-teal-300 text-teal-900 font-medium'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedWebsites([...selectedWebsites, p.id]);
                              else setSelectedWebsites(selectedWebsites.filter((id) => id !== p.id));
                            }}
                            className="rounded text-teal-600 focus:ring-teal-500"
                          />
                          <span className="truncate">{p.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Domain Tambahan (koma pisahkan):</label>
                  <input
                    type="text"
                    value={customWebDomains}
                    onChange={(e) => setCustomWebDomains(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                    placeholder="contoh: klikbca.com, pajak.go.id, website-perusahaan.co.id"
                  />
                </div>
              </div>
            )}

            {/* 8. Local Client IP Routing */}
            {selectedToolId === 'client-ip-routing' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">LAN Interface</label>
                    <input
                      type="text"
                      value={clientLanInterface}
                      onChange={(e) => setClientLanInterface(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="ether3-LAN"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target WAN</label>
                    <input
                      type="text"
                      value={clientTargetWan}
                      onChange={(e) => setClientTargetWan(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="WAN2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ISP Gateway</label>
                    <input
                      type="text"
                      value={clientTargetGateway}
                      onChange={(e) => setClientTargetGateway(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="192.168.2.1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Routing Mark</label>
                    <input
                      type="text"
                      value={clientRoutingMark}
                      onChange={(e) => setClientRoutingMark(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="VIP_CLIENTS_ROUTE"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Daftar IP Client / Rentang IP (koma pisah):</label>
                  <textarea
                    rows={2}
                    value={clientIpList}
                    onChange={(e) => setClientIpList(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                    placeholder="contoh: 192.168.88.50, 192.168.88.100-192.168.88.120, 192.168.88.200/29"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Label Client:</label>
                  <input
                    type="text"
                    value={clientDesc}
                    onChange={(e) => setClientDesc(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    placeholder="contoh: Ruang Pimpinan, Server Database, POS Kasir"
                  />
                </div>
              </div>
            )}

            {/* 9. Port Forwarding NAT */}
            {selectedToolId === 'port-forwarding' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">WAN Interface</label>
                    <input
                      type="text"
                      value={pfWanInterface}
                      onChange={(e) => setPfWanInterface(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="ether1-ISP1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">IP Publik Statis (Opsional)</label>
                    <input
                      type="text"
                      value={pfPublicIp}
                      onChange={(e) => setPfPublicIp(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="Kosongkan jika dinamis"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Protokol</label>
                    <select
                      value={pfProtocol}
                      onChange={(e) => setPfProtocol(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="tcp">TCP</option>
                      <option value="udp">UDP</option>
                      <option value="both">TCP & UDP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Komentar</label>
                    <input
                      type="text"
                      value={pfComment}
                      onChange={(e) => setPfComment(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                      placeholder="Web Server / CCTV"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Port Eksternal</label>
                    <input
                      type="text"
                      value={pfExternalPort}
                      onChange={(e) => setPfExternalPort(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="8080"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">IP Target Internal (LAN)</label>
                    <input
                      type="text"
                      value={pfInternalIp}
                      onChange={(e) => setPfInternalIp(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="192.168.88.50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Port Internal</label>
                    <input
                      type="text"
                      value={pfInternalPort}
                      onChange={(e) => setPfInternalPort(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="80"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={pfHairpin}
                      onChange={(e) => setPfHairpin(e.target.checked)}
                      className="rounded text-green-600 focus:ring-green-500"
                    />
                    <span>Sertakan Rule Hairpin NAT (Bisa buka via IP Publik / DDNS dari jaringan lokal)</span>
                  </label>
                  {pfHairpin && (
                    <div className="pt-1">
                      <label className="block text-[11px] text-slate-500 mb-1">Subnet LAN Lokal:</label>
                      <input
                        type="text"
                        value={pfLanSubnet}
                        onChange={(e) => setPfLanSubnet(e.target.value)}
                        className="w-full max-w-xs px-2.5 py-1 text-xs border border-slate-200 rounded-md font-mono"
                        placeholder="192.168.88.0/24"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 10. Port TCP/UDP Static Routing */}
            {selectedToolId === 'port-tcp-udp-routing' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">LAN Interface</label>
                    <input
                      type="text"
                      value={prLanInterface}
                      onChange={(e) => setPrLanInterface(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="ether3-LAN"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target WAN</label>
                    <input
                      type="text"
                      value={prTargetWan}
                      onChange={(e) => setPrTargetWan(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="WAN1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Gateway</label>
                    <input
                      type="text"
                      value={prTargetGateway}
                      onChange={(e) => setPrTargetGateway(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="192.168.1.1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Routing Mark Name</label>
                    <input
                      type="text"
                      value={prRoutingMark}
                      onChange={(e) => setPrRoutingMark(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="PORTS_TRAFFIC"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Protokol</label>
                    <select
                      value={prProtocol}
                      onChange={(e) => setPrProtocol(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="tcp">TCP</option>
                      <option value="udp">UDP</option>
                      <option value="both">TCP & UDP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Port:</label>
                    <input
                      type="text"
                      value={prPorts}
                      onChange={(e) => setPrPorts(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="contoh: 80,443,8080 atau 5000-5100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan Rule:</label>
                    <input
                      type="text"
                      value={prDesc}
                      onChange={(e) => setPrDesc(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                      placeholder="Browsing Web Ports"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 11. All Traffic to VPN Tunnel */}
            {selectedToolId === 'vpn-all-traffic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Interface VPN Tunnel</label>
                    <input
                      type="text"
                      value={vpnTunnelInterface}
                      onChange={(e) => setVpnTunnelInterface(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="wireguard1, ovpn-out1, l2tp-out1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">LAN Interface</label>
                    <input
                      type="text"
                      value={vpnLanInterface}
                      onChange={(e) => setVpnLanInterface(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="ether3-LAN"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">IP Server VPN (Cegah Loop)</label>
                    <input
                      type="text"
                      value={vpnServerEndpoint}
                      onChange={(e) => setVpnServerEndpoint(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="103.150.200.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subnet Khusus yang diarahkan ke VPN (Opsional):</label>
                  <input
                    type="text"
                    value={vpnClientSubnet}
                    onChange={(e) => setVpnClientSubnet(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                    placeholder="Kosongkan jika ingin mengarahkan seluruh LAN interface"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={vpnKillSwitch}
                      onChange={(e) => setVpnKillSwitch(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Aktifkan Kill-Switch Protection (Blokir bocor internet bila VPN putus)</span>
                  </label>
                </div>
              </div>
            )}

            {/* 12. Remote Access ISP Public IP */}
            {selectedToolId === 'remote-access-isp' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">WAN Interface</label>
                    <input
                      type="text"
                      value={raWanInterface}
                      onChange={(e) => setRaWanInterface(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="ether1-ISP1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">WAN Gateway (untuk Reply Rule)</label>
                    <input
                      type="text"
                      value={raWanGateway}
                      onChange={(e) => setRaWanGateway(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="192.168.1.1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Whitelist IP Source Admin (Opsional):</label>
                  <input
                    type="text"
                    value={raAllowedIps}
                    onChange={(e) => setRaAllowedIps(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                    placeholder="Kosongkan untuk mengizinkan semua IP (0.0.0.0/0)"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  <div className="p-2 border rounded-lg bg-slate-50 space-y-1">
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={raWinbox}
                        onChange={(e) => setRaWinbox(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Winbox</span>
                    </label>
                    <input
                      type="text"
                      value={raWinboxPort}
                      onChange={(e) => setRaWinboxPort(e.target.value)}
                      className="w-full px-2 py-0.5 text-xs border border-slate-200 rounded font-mono"
                      placeholder="8291"
                    />
                  </div>

                  <div className="p-2 border rounded-lg bg-slate-50 space-y-1">
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={raWebfig}
                        onChange={(e) => setRaWebfig(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>WebFig</span>
                    </label>
                    <input
                      type="text"
                      value={raWebfigPort}
                      onChange={(e) => setRaWebfigPort(e.target.value)}
                      className="w-full px-2 py-0.5 text-xs border border-slate-200 rounded font-mono"
                      placeholder="80,443"
                    />
                  </div>

                  <div className="p-2 border rounded-lg bg-slate-50 space-y-1">
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={raSSH}
                        onChange={(e) => setRaSSH(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>SSH</span>
                    </label>
                    <input
                      type="text"
                      value={raSSHPort}
                      onChange={(e) => setRaSSHPort(e.target.value)}
                      className="w-full px-2 py-0.5 text-xs border border-slate-200 rounded font-mono"
                      placeholder="22"
                    />
                  </div>

                  <div className="p-2 border rounded-lg bg-slate-50 space-y-1">
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={raApi}
                        onChange={(e) => setRaApi(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>API</span>
                    </label>
                    <input
                      type="text"
                      value={raApiPort}
                      onChange={(e) => setRaApiPort(e.target.value)}
                      className="w-full px-2 py-0.5 text-xs border border-slate-200 rounded font-mono"
                      placeholder="8728"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={raMangleReply}
                      onChange={(e) => setRaMangleReply(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Sertakan Mangle Reply Rule (Jaminan balasan trafik remote keluar lewat ISP yang sama pada Multi-WAN)</span>
                  </label>
                </div>
              </div>
            )}

            {/* 13 & 14. VPN Games */}
            {(selectedToolId === 'vpn-port-games' || selectedToolId === 'vpn-ip-games') && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Interface Gaming VPN</label>
                    <input
                      type="text"
                      value={vpnGamesInterface}
                      onChange={(e) => setVpnGamesInterface(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="ovpn-gaming atau wg-gaming"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Routing Mark</label>
                    <input
                      type="text"
                      value={vpnGamesRoutingMark}
                      onChange={(e) => setVpnGamesRoutingMark(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="VPN_GAMES_TRAFFIC"
                    />
                  </div>
                </div>

                {selectedToolId === 'vpn-port-games' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Preset Game Port untuk VPN:</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {GAME_PRESETS.map((p) => {
                        const isChecked = vpnGamesSelected.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                              isChecked ? 'bg-violet-50 border-violet-300 text-violet-900 font-medium' : 'bg-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) setVpnGamesSelected([...vpnGamesSelected, p.id]);
                                else setVpnGamesSelected(vpnGamesSelected.filter((id) => id !== p.id));
                              }}
                              className="rounded text-violet-600"
                            />
                            <span className="truncate">{p.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Daftar Subnet IP Server Game:</label>
                    <textarea
                      rows={2}
                      value={vpnGameCustomIps}
                      onChange={(e) => setVpnGameCustomIps(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="103.28.54.0/24, 103.28.55.0/24"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 15. VPN Remote Client */}
            {selectedToolId === 'vpn-remote-client' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Protokol VPN</label>
                    <select
                      value={vrcType}
                      onChange={(e) => setVrcType(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="sstp">SSTP (Port 443 - Rekomendasi)</option>
                      <option value="l2tp">L2TP / IPsec</option>
                      <option value="pptp">PPTP (Legacy)</option>
                      <option value="ovpn">OpenVPN (TCP/UDP)</option>
                      <option value="wireguard">WireGuard (RouterOS v7)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Server Host / DDNS</label>
                    <input
                      type="text"
                      value={vrcServer}
                      onChange={(e) => setVrcServer(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="id1.tunnel.id"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Server Port</label>
                    <input
                      type="text"
                      value={vrcPort}
                      onChange={(e) => setVrcPort(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="443"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Username Akun</label>
                    <input
                      type="text"
                      value={vrcUser}
                      onChange={(e) => setVrcUser(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="username"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                    <input
                      type="text"
                      value={vrcPass}
                      onChange={(e) => setVrcPass(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="password"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Profile Name</label>
                    <input
                      type="text"
                      value={vrcProfile}
                      onChange={(e) => setVrcProfile(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="default-encryption"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Interface Name</label>
                    <input
                      type="text"
                      value={vrcInterface}
                      onChange={(e) => setVrcInterface(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="sstp-out1"
                    />
                  </div>
                </div>

                {vrcType === 'wireguard' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <span className="text-xs font-bold text-slate-800">Pengaturan Khusus WireGuard:</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-1">IP Client WireGuard:</label>
                        <input
                          type="text"
                          value={vrcWgClientIp}
                          onChange={(e) => setVrcWgClientIp(e.target.value)}
                          className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded font-mono"
                          placeholder="10.200.0.2/24"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-1">Client Private Key:</label>
                        <input
                          type="text"
                          value={vrcWgPrivKey}
                          onChange={(e) => setVrcWgPrivKey(e.target.value)}
                          className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded font-mono"
                          placeholder="<PRIVATE_KEY>"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-1">Server Public Key:</label>
                        <input
                          type="text"
                          value={vrcWgServerPubKey}
                          onChange={(e) => setVrcWgServerPubKey(e.target.value)}
                          className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded font-mono"
                          placeholder="<SERVER_PUBLIC_KEY>"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 16. Social Media & Streaming */}
            {selectedToolId === 'social-media-routing' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">LAN Interface</label>
                    <input
                      type="text"
                      value={smLanInterface}
                      onChange={(e) => setSmLanInterface(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="ether3-LAN"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target WAN</label>
                    <input
                      type="text"
                      value={smTargetWan}
                      onChange={(e) => setSmTargetWan(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="WAN2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target ISP Gateway</label>
                    <input
                      type="text"
                      value={smTargetGateway}
                      onChange={(e) => setSmTargetGateway(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="192.168.2.1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Routing Mark</label>
                    <input
                      type="text"
                      value={smRoutingMark}
                      onChange={(e) => setSmRoutingMark(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      placeholder="SOSMED_TRAFFIC"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Platform Media Sosial & Video Streaming:</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {SOCIAL_PRESETS.map((p) => {
                      const isChecked = smSelected.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                            isChecked ? 'bg-rose-50 border-rose-300 text-rose-900 font-medium' : 'bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) setSmSelected([...smSelected, p.id]);
                              else setSmSelected(smSelected.filter((id) => id !== p.id));
                            }}
                            className="rounded text-rose-600"
                          />
                          <span className="truncate">{p.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Domain Tambahan (koma pisah):</label>
                  <input
                    type="text"
                    value={smCustomDomains}
                    onChange={(e) => setSmCustomDomains(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                    placeholder="threads.net, snackvideo.com"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Terminal CLI Output Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-bold text-slate-700">Skrip CLI MikroTik RouterOS</span>
                <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-white border border-slate-200 text-slate-600">
                  {selectedToolId}.rsc
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTerminalTheme(terminalTheme === 'light' ? 'dark' : 'light')}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                  title="Ganti Tema Terminal"
                >
                  {terminalTheme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-sm shadow-orange-500/20 transition-all active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Skrip CLI'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadRsc}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-all"
                  title="Unduh file .rsc untuk import di MikroTik"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .rsc</span>
                </button>
              </div>
            </div>

            {/* Terminal Body */}
            <div
              className={`p-4 font-mono text-xs overflow-x-auto max-h-[460px] leading-relaxed transition-colors select-text ${
                terminalTheme === 'light'
                  ? 'bg-slate-50/80 text-slate-800 border-t border-slate-100'
                  : 'bg-slate-900 text-emerald-400'
              }`}
            >
              <pre className="whitespace-pre">{generatedScript}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MikroTikToolsPage;
