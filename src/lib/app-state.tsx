// @ts-nocheck
import { createContext, useContext, useState, type ReactNode } from "react";

export type Network = "ethereum" | "bnb" | "tron";

export type Escrow = {
  id: string;
  buyer: string;
  seller: string;
  amount: string;
  network: Network;
  status: "created" | "funded" | "awaiting" | "completed";
  createdAt: string;
};

type AppState = {
  wallet: string | null;
  signer: any;
  network: Network;
  currentEscrow: Escrow | null;
  connect: (addr: string, s?: any) => void;
  disconnect: () => void;
  setNetwork: (n: Network) => void;
  setCurrentEscrow: (e: Escrow | null) => void;
};

const Ctx = createContext<AppState | null>(null);
const MOCK_ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

export const shortAddr = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

export function AppProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<string | null>(null);
  const [signer, setSigner] = useState<any>(null);
  const [network, setNetwork] = useState<Network>("ethereum");
  const [currentEscrow, setCurrentEscrow] = useState<Escrow | null>(null);

  const connect = (addr: string, s?: any) => {
    setWallet(addr);
    if (s) setSigner(s);
  };
  const disconnect = () => { setWallet(null); setSigner(null); };

  return (
    <Ctx.Provider value={{ wallet, signer, network, currentEscrow, connect, disconnect, setNetwork, setCurrentEscrow }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be used within AppProvider");
  return c;
}

export const MOCK_WALLET = MOCK_ADDRESS;

export const NETWORKS: { id: Network; label: string; symbol: string }[] = [
  { id: "ethereum", label: "Ethereum", symbol: "ETH" },
  { id: "bnb", label: "BNB Chain", symbol: "BNB" },
  { id: "tron", label: "Tron", symbol: "TRX" },
];