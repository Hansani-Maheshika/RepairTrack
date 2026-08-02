import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import {
  Card,
  ErrorBox,
  Loading,
  buttonClass,
  inputClass,
} from "../../components/ui";
import { useApiQuery } from "../../hooks/useApiQuery";
import { api, getApiErrorMessage } from "../../lib/api";
import type { ApiResponse } from "../../types/auth";
import type { Invoice, Quotation } from "../../types/business";

export function PublicQuotationPage() {
  const { token } = useParams();
  const q = useApiQuery(async () => {
    const { data } = await api.get<ApiResponse<{ quotation: Quotation }>>(
      `/public/quotations/${token}`,
    );
    return data.data.quotation;
  }, [token]);
  const [note, setNote] = useState("");
  async function respond(decision: "APPROVED" | "REJECTED") {
    try {
      await api.post(`/public/quotations/${token}/respond`, { decision, note });
      toast.success(`Quotation ${decision.toLowerCase()}`);
      await q.reload();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }
  if (q.loading)
    return (
      <PublicShell>
        <Loading />
      </PublicShell>
    );
  if (q.error || !q.data)
    return (
      <PublicShell>
        <ErrorBox message={q.error || "Quotation unavailable"} />
      </PublicShell>
    );
  return (
    <PublicShell>
      <Card>
        <p className="font-mono text-sm">{q.data.quotationNumber}</p>
        <h1 className="mt-2 text-3xl font-bold">Repair quotation</h1>
        <div className="mt-6 space-y-3">
          {q.data.items.map((x, i) => (
            <div key={x.id ?? i} className="flex justify-between border-b pb-3">
              <span>
                {x.description} × {x.quantity}
              </span>
              <span>LKR {x.lineTotal}</span>
            </div>
          ))}
        </div>
        <p className="mt-5 text-right text-2xl font-bold">
          Total LKR {q.data.total}
        </p>
        {q.data.status === "SENT" ? (
          <>
            <textarea
              className={`${inputClass} mt-6`}
              placeholder="Optional response note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="mt-4 flex gap-3">
              <button
                className={buttonClass}
                onClick={() => void respond("APPROVED")}
              >
                Approve quotation
              </button>
              <button
                className="rounded-xl border border-red-300 px-4 py-2 text-red-700"
                onClick={() => void respond("REJECTED")}
              >
                Reject
              </button>
            </div>
          </>
        ) : (
          <p className="mt-5 font-semibold">Response: {q.data.status}</p>
        )}
      </Card>
    </PublicShell>
  );
}

export function PublicInvoicePage() {
  const { token } = useParams();
  const q = useApiQuery(async () => {
    const { data } = await api.get<ApiResponse<{ invoice: Invoice }>>(
      `/public/invoices/${token}`,
    );
    return data.data.invoice;
  }, [token]);
  if (q.loading)
    return (
      <PublicShell>
        <Loading />
      </PublicShell>
    );
  if (q.error || !q.data)
    return (
      <PublicShell>
        <ErrorBox message={q.error || "Invoice unavailable"} />
      </PublicShell>
    );
  const i = q.data;
  return (
    <PublicShell>
      <Card>
        <p className="font-mono">{i.invoiceNumber}</p>
        <h1 className="mt-2 text-3xl font-bold">Invoice</h1>
        <p className="mt-4">Customer: {i.customer?.name}</p>
        <p>Repair: {i.repairJob?.repairNumber}</p>
        <div className="mt-6 border-y py-5">
          <p>Total: LKR {i.total}</p>
          <p>Paid: LKR {i.paidAmount}</p>
          <p className="text-xl font-bold">Balance: LKR {i.balance}</p>
        </div>
        {i.status !== "PAID" && (
          <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
            <p className="font-bold">Please come and collect your device</p>
            <p className="mt-1 text-sm text-slate-600">
              Pay the remaining balance at the repair shop. Reception will
              record your payment and hand over the device.
            </p>
          </div>
        )}
        {i.status === "PAID" && (
          <button
            className="mt-5 rounded-xl border px-4 py-2.5"
            onClick={() => window.print()}
          >
            Print paid invoice
          </button>
        )}
      </Card>
    </PublicShell>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  async function requestCode(e: FormEvent) {
    e.preventDefault();
    try {
      const { data } = await api.post<
        ApiResponse<{ developmentCode?: string }>
      >("/auth/forgot-password", { email });
      setSent(true);
      if (data.data.developmentCode) {
        setCode(data.data.developmentCode);
        toast.success(
          `Development verification code: ${data.data.developmentCode}`,
        );
      } else toast.success("Verification code sent");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }
  async function resetPassword(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword)
      return toast.error("Passwords do not match");
    try {
      await api.post("/auth/reset-password", { email, code, password });
      setDone(true);
      toast.success("Password changed successfully");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }
  return (
    <PublicShell>
      <Card>
        <h1 className="text-2xl font-bold">Forgot password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Receive a six-digit verification code and choose a new password. No
          reset link is required.
        </p>
        {done ? (
          <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-800">
            <p className="font-semibold">Your password has been changed.</p>
            <Link className="mt-3 inline-block text-cyan-700" to="/login">
              Go to staff login
            </Link>
          </div>
        ) : sent ? (
          <form className="mt-5 space-y-4" onSubmit={resetPassword}>
            <input
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              className={inputClass}
              placeholder="Six-digit verification code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
            <input
              required
              minLength={8}
              type="password"
              className={inputClass}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              required
              minLength={8}
              type="password"
              className={inputClass}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button className={buttonClass}>Change password</button>
            <button
              type="button"
              className="ml-3 rounded-xl border px-4 py-2.5"
              onClick={() => setSent(false)}
            >
              Use another email
            </button>
          </form>
        ) : (
          <form className="mt-5" onSubmit={requestCode}>
            <input
              required
              type="email"
              className={inputClass}
              placeholder="Staff email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className={`${buttonClass} mt-4`}>
              Send verification code
            </button>
          </form>
        )}
        <Link className="mt-6 block text-sm font-semibold text-cyan-700" to="/">
          ← Return to home page
        </Link>
      </Card>
    </PublicShell>
  );
}
function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-2xl">
        <Link className="mb-8 block text-xl font-bold" to="/">
          RepairTrack
        </Link>
        {children}
      </div>
    </main>
  );
}
