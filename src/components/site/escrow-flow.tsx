import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  User,
  Wallet,
  Coins,
  Network as NetworkIcon,
  Check,
  Copy,
  ShieldCheck,
  FileSignature,
} from "lucide-react";
import { AppButton } from "@/components/site/app-button";
import { toast } from "sonner";

type NetId = "ethereum" | "bnb" | "tron";

const NETWORKS: { id: NetId; label: string; standard: string; symbol: string }[] = [
  { id: "ethereum", label: "Ethereum", standard: "ERC20", symbol: "ETH" },
  { id: "bnb", label: "BNB Chain", standard: "BEP20", symbol: "BNB" },
  { id: "tron", label: "Tron", standard: "TRC20", symbol: "TRX" },
];

const MOCK_CONTRACT = "0x7099427aC90d1eB94FE20fEb6b58f4A2bB6a79C8";
const MOCK_TX = "0x7a3b8f1e29c4a6d5b0e7f8a1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c9f2";

const short = (a: string, l = 6, r = 4) => (a.length > l + r ? `${a.slice(0, l)}...${a.slice(-r)}` : a);

export type EscrowFlowProps = {
  onDone?: () => void;
  onCancel?: () => void;
};

export function EscrowFlow({ onDone, onCancel }: EscrowFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [buyer, setBuyer] = useState("");
  const [seller, setSeller] = useState("");
  const [amount, setAmount] = useState("");
  const [network, setNetwork] = useState<NetId>("ethereum");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const netMeta = NETWORKS.find((n) => n.id === network)!;

  const validate = () => {
    const e: Record<string, string> = {};
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

  const handleFund = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
      toast.success("Escrow funded", { description: `${amount} USDT locked on ${netMeta.label}` });
    }, 2000);
  };

  const handleSign = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(4);
      toast.success("Contract authorized");
    }, 2000);
  };

  const copyTx = async () => {
    try {
      await navigator.clipboard.writeText(MOCK_TX);
      toast.success("Transaction ID copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="w-full">
      <StepIndicator step={step} />

      <div className="mt-8 rounded-2xl border border-gray-800 bg-gray-900/70 p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <Field
                icon={<User className="h-4 w-4" />}
                label="Buyer address"
                placeholder="0x..."
                value={buyer}
                onChange={setBuyer}
                error={errors.buyer}
              />
              <Field
                icon={<Wallet className="h-4 w-4" />}
                label="Seller address"
                placeholder="0x..."
                value={seller}
                onChange={setSeller}
                error={errors.seller}
              />
              <Field
                icon={<Coins className="h-4 w-4" />}
                label="Amount (USDT)"
                placeholder="0.00"
                type="number"
                value={amount}
                onChange={setAmount}
                error={errors.amount}
                suffix="USDT"
              />

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <NetworkIcon className="mr-1 inline h-3.5 w-3.5" /> Network
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {NETWORKS.map((n) => {
                    const active = n.id === network;
                    return (
                      <motion.button
                        key={n.id}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setNetwork(n.id)}
                        className={`rounded-xl border p-3 text-left transition ${
                          active
                            ? "border-blue-500/60 bg-blue-500/10 shadow-[0_0_30px_-8px_rgba(59,130,246,0.5)]"
                            : "border-gray-800 bg-gray-950/40 hover:border-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-gray-100">{n.label}</div>
                          {active && <Check className="h-4 w-4 text-blue-400" />}
                        </div>
                        <div className="mt-0.5 text-[10px] uppercase tracking-widest text-gray-500">
                          {n.standard}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-3">
                {onCancel && (
                  <AppButton variant="ghost" onClick={onCancel}>
                    Cancel
                  </AppButton>
                )}
                <AppButton
                  onClick={() => validate() && setStep(2)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Continue
                </AppButton>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="font-display text-lg font-bold text-gray-100">Review escrow</h3>
              <p className="mt-1 text-sm text-gray-400">Confirm the details before funding.</p>
              <div className="mt-5 divide-y divide-gray-800 rounded-xl border border-gray-800 bg-gray-950/40">
                <Row label="Buyer" value={short(buyer)} mono />
                <Row label="Seller" value={short(seller)} mono />
                <Row
                  label="Amount"
                  value={`${Number(amount).toLocaleString()} USDT`}
                  highlight
                />
                <Row label="Network" value={`${netMeta.label} (${netMeta.standard})`} />
                <Row
                  label="Status"
                  value={
                    <span className="rounded-full bg-yellow-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-yellow-400">
                      Not funded
                    </span>
                  }
                />
              </div>
              <div className="mt-6 flex flex-wrap justify-between gap-2">
                <AppButton
                  variant="ghost"
                  onClick={() => setStep(1)}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                  disabled={loading}
                >
                  Back
                </AppButton>
                <AppButton
                  onClick={handleFund}
                  loading={loading}
                  leftIcon={!loading && <Check className="h-4 w-4" />}
                >
                  {loading ? "Funding escrow…" : "Fund Escrow"}
                </AppButton>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="s3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-gray-100">
                  Authorize Escrow Contract
                </h3>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Sign the approval to allow the escrow contract to hold your USDT until release.
              </p>

              <div className="mt-5 rounded-xl border border-gray-800 bg-gray-950/40 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs uppercase tracking-widest text-gray-500">
                    Contract address
                  </span>
                  <span className="font-mono text-sm text-gray-200">{short(MOCK_CONTRACT)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4 border-t border-gray-800 pt-3">
                  <span className="text-xs uppercase tracking-widest text-gray-500">Network</span>
                  <span className="text-sm text-gray-200">
                    {netMeta.label} ({netMeta.standard})
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4 border-t border-gray-800 pt-3">
                  <span className="text-xs uppercase tracking-widest text-gray-500">Amount</span>
                  <span className="text-sm font-semibold text-gray-100">
                    {Number(amount).toLocaleString()} USDT
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-gray-400">
                No real signature will be requested. This is a UI demonstration.
              </div>

              <div className="mt-6 flex flex-wrap justify-between gap-2">
                <AppButton
                  variant="ghost"
                  onClick={() => setStep(2)}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                  disabled={loading}
                >
                  Back
                </AppButton>
                <AppButton
                  onClick={handleSign}
                  loading={loading}
                  leftIcon={!loading && <FileSignature className="h-4 w-4" />}
                >
                  {loading ? "Awaiting signature…" : "Sign Approval"}
                </AppButton>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="s4"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-4 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-4xl shadow-[0_0_40px_-8px_rgba(16,185,129,0.6)]"
              >
                ✅
              </motion.div>
              <h3 className="mt-5 font-display text-2xl font-bold text-gray-100">
                Escrow Created Successfully!
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                Your USDT is now locked in the escrow contract until both parties agree to release.
              </p>

              <div className="mx-auto mt-6 max-w-md rounded-xl border border-gray-800 bg-gray-950/40 p-4 text-left">
                <div className="text-xs uppercase tracking-widest text-gray-500">Transaction ID</div>
                <div className="mt-1.5 flex items-center justify-between gap-3">
                  <span className="truncate font-mono text-sm text-gray-200">{short(MOCK_TX)}</span>
                  <button
                    type="button"
                    onClick={copyTx}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900 px-2.5 py-1.5 text-xs text-gray-300 transition hover:border-gray-700 hover:text-white"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </button>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <AppButton onClick={onDone} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                  Back to Dashboard
                </AppButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: 1 | 2 | 3 | 4 }) {
  const steps = ["Details", "Review", "Approve", "Done"];
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {steps.map((s, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={s} className="flex items-center gap-2 sm:gap-3">
            <motion.div
              animate={{ scale: active ? 1.05 : 1 }}
              className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition ${
                done
                  ? "bg-emerald-500 text-black shadow-[0_0_20px_-4px_rgba(16,185,129,0.7)]"
                  : active
                    ? "bg-blue-500 text-white shadow-[0_0_20px_-4px_rgba(59,130,246,0.8)]"
                    : "bg-gray-800 text-gray-500"
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : n}
            </motion.div>
            <span
              className={`text-sm ${active || done ? "text-gray-100" : "text-gray-500"}`}
            >
              {s}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`h-px w-6 sm:w-12 ${done ? "bg-emerald-500/60" : "bg-gray-800"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({
  icon,
  label,
  placeholder,
  value,
  onChange,
  error,
  type = "text",
  suffix,
}: {
  icon?: React.ReactNode;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  suffix?: string;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </label>
      <div
        className={`group relative flex items-center gap-2 rounded-xl border bg-gray-950/40 px-3.5 py-3 transition ${
          error
            ? "border-red-500/60"
            : focus
              ? "border-blue-500/60 ring-2 ring-blue-500/20"
              : "border-gray-800"
        }`}
      >
        {icon && <span className="text-gray-500">{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm text-gray-100 outline-none placeholder:text-gray-600"
        />
        {suffix && <span className="shrink-0 text-xs text-gray-500">{suffix}</span>}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 text-xs text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-3.5 sm:p-4">
      <span className="text-xs uppercase tracking-widest text-gray-500">{label}</span>
      <span
        className={`text-right text-sm text-gray-100 ${mono ? "font-mono" : ""} ${
          highlight ? "font-display text-lg font-bold" : "font-medium"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default EscrowFlow;
