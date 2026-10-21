export type RouterOSVersion = 'v6' | 'v7';

export type MikroTikToolId =
  | 'lb-pcc'
  | 'lb-nth'
  | 'lb-ecmp'
  | 'failover-recursive'
  | 'games-raw'
  | 'games-mangle'
  | 'website-routing'
  | 'client-ip-routing'
  | 'port-forwarding'
  | 'port-tcp-udp-routing'
  | 'vpn-all-traffic'
  | 'remote-access-isp'
  | 'vpn-port-games'
  | 'vpn-ip-games'
  | 'vpn-remote-client'
  | 'social-media-routing';

export type ToolCategory =
  | 'load-balancing'
  | 'traffic-steering'
  | 'nat-firewall'
  | 'vpn-tunnel';

export interface ToolDefinition {
  id: MikroTikToolId;
  name: string;
  category: ToolCategory;
  shortDesc: string;
  badge?: string;
  icon: string;
}

export interface WanLine {
  id: string;
  name: string; // e.g. WAN1, WAN2
  interface: string; // e.g. ether1-ISP1
  gateway: string; // e.g. 192.168.1.1
  distance: number;
  weight?: number; // for PCC / ECMP ratio
  targetDns?: string; // for recursive failover, e.g. 8.8.8.8
}

// 1. PCC Config
export interface PCCConfig {
  rosVersion: RouterOSVersion;
  lanInterface: string;
  lanSubnet: string;
  pccClassifier: 'both-addresses-and-ports' | 'both-addresses' | 'src-address' | 'src-address-and-port';
  wans: WanLine[];
  addDefaultRoute: boolean;
  addNatMasquerade: boolean;
  addLocalAcceptRule: boolean;
}

// 2. NTH Config
export interface NTHConfig {
  rosVersion: RouterOSVersion;
  lanInterface: string;
  lanSubnet: string;
  wans: WanLine[];
  addDefaultRoute: boolean;
  addNatMasquerade: boolean;
}

// 3. ECMP Config
export interface ECMPConfig {
  rosVersion: RouterOSVersion;
  wans: WanLine[];
  checkGateway: 'ping' | 'arp' | 'none';
  addNatMasquerade: boolean;
}

// 4. Failover Recursive Gateway Config
export interface RecursiveFailoverConfig {
  rosVersion: RouterOSVersion;
  primaryWan: WanLine;
  secondaryWan: WanLine;
  primaryTargetDns: string; // e.g. 8.8.8.8
  secondaryTargetDns: string; // e.g. 1.1.1.1
  addNatMasquerade: boolean;
}

// 5 & 6. Games Routing (Raw & Mangle) Config
export interface GamesRoutingConfig {
  rosVersion: RouterOSVersion;
  lanInterface: string;
  targetWan: string; // Interface or Routing Mark (e.g. WAN1 or ISP-GAMES)
  targetGateway: string;
  routingMarkName: string;
  method: 'raw' | 'mangle';
  selectedGameIds: string[];
  customPortsTcp: string;
  customPortsUdp: string;
}

// 7. Website Static Routing Config
export interface WebsiteRoutingConfig {
  rosVersion: RouterOSVersion;
  lanInterface: string;
  targetWan: string;
  targetGateway: string;
  routingMarkName: string;
  selectedPresets: string[];
  customDomains: string[]; // e.g. klikbca.com, pajak.go.id
}

// 8. Local Client IP Static Routing Config
export interface ClientIpRoutingConfig {
  rosVersion: RouterOSVersion;
  lanInterface: string;
  targetWan: string;
  targetGateway: string;
  routingMarkName: string;
  clientIpList: string; // e.g. "192.168.88.50, 192.168.88.100-192.168.88.150, 192.168.88.200/29"
  description: string;
}

// 9. Port Forwarding NAT (dst-nat) Config
export interface PortForwardingConfig {
  rosVersion: RouterOSVersion;
  wanInterface: string;
  publicIp: string; // optional (if empty, uses in-interface)
  protocol: 'tcp' | 'udp' | 'both';
  externalPort: string; // e.g. "8080" or "8000-8010"
  internalIp: string; // e.g. "192.168.88.20"
  internalPort: string; // e.g. "80"
  comment: string;
  includeHairpinNat: boolean;
  lanSubnet: string;
}

// 10. Port TCP/UDP Static Routing Config
export interface PortRoutingConfig {
  rosVersion: RouterOSVersion;
  lanInterface: string;
  targetWan: string;
  targetGateway: string;
  routingMarkName: string;
  protocol: 'tcp' | 'udp' | 'both';
  ports: string; // e.g. "80,443,8080"
  description: string;
}

// 11. All Traffic to VPN Tunnel Config
export interface AllTrafficVPNConfig {
  rosVersion: RouterOSVersion;
  vpnInterface: string; // e.g. "wireguard1" or "ovpn-out1" or "l2tp-out1"
  lanInterface: string;
  vpnServerIp: string; // Real IP of VPN server to exclude from tunnel
  addNatMasquerade: boolean;
  enableKillSwitch: boolean;
  clientSubnet: string; // empty for all LAN
}

// 12. Remote Access ISP "Public IP Static" Config
export interface RemoteAccessConfig {
  rosVersion: RouterOSVersion;
  wanInterface: string;
  wanGateway: string;
  allowedSourceIps: string; // empty for anywhere (0.0.0.0/0) or specific admin IP/subnet
  enableWinbox: boolean;
  winboxPort: string;
  enableWebfig: boolean;
  webfigPort: string;
  enableSSH: boolean;
  sshPort: string;
  enableApi: boolean;
  apiPort: string;
  addMangleReplyRule: boolean; // multi-wan reply guarantee
}

// 13 & 14. VPN Routing for Games (Port & IP) Config
export interface VPNGamesConfig {
  rosVersion: RouterOSVersion;
  vpnInterface: string;
  routingMarkName: string;
  type: 'port' | 'ip';
  selectedGameIds: string[];
  customPortsTcp: string;
  customPortsUdp: string;
  customIps: string; // for IP-based
}

// 15. VPN Remote Client Config
export interface VPNRemoteClientConfig {
  rosVersion: RouterOSVersion;
  vpnType: 'sstp' | 'l2tp' | 'pptp' | 'ovpn' | 'wireguard';
  serverAddress: string; // e.g. id1.tunnel.id or remote.ip.addr
  serverPort: string; // e.g. 443 / 1194 / 1701 / 51820
  username: string;
  password: string;
  profileName: string;
  interfaceName: string;
  addDefaultRoute: boolean;
  wireguardPrivateKey?: string;
  wireguardClientIp?: string;
  wireguardServerPublicKey?: string;
}

// 16. Social Media & Streaming Static Routing Config
export interface SocialMediaRoutingConfig {
  rosVersion: RouterOSVersion;
  lanInterface: string;
  targetWan: string;
  targetGateway: string;
  routingMarkName: string;
  selectedPlatforms: string[]; // ['youtube', 'tiktok', 'facebook_meta', 'whatsapp', 'netflix']
  customDomains: string[];
}
