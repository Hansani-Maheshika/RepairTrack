import { ArrowLeft, Search, Wrench } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  ErrorBox,
  StatusBadge,
  buttonClass,
  inputClass,
} from "../../components/ui";
import { api, getApiErrorMessage } from "../../lib/api";
import type { ApiResponse } from "../../types/auth";
import { label, type Repair } from "../../types/domain";

export function TrackRepairPage() {
  const [number, setNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<Repair | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [responseBusy, setResponseBusy] = useState(false);
  const [responseNote, setResponseNote] = useState("");
  async function loadRepair() {
    const { data } = await api.post<ApiResponse<{ repair: Repair }>>(
      "/public/repairs/track",
      { repairNumber: number, phone },
    );
    setResult(data.data.repair);
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      await loadRepair();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function respondToQuotation(decision: "APPROVED" | "REJECTED") {
    const quotation = result?.quotations?.[0];
    if (!quotation) return;
    setResponseBusy(true);
    setError("");
    try {
      await api.post("/public/quotations/respond-by-repair", {
        repairNumber: number,
        phone,
        quotationId: quotation.id,
        decision,
        note: responseNote || undefined,
      });
      setResponseNote("");
      await loadRepair();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setResponseBusy(false);
    }
  }
  async function downloadPaidInvoice() {
    const invoice = result?.invoice;
    if (!invoice || invoice.status !== "PAID") return;
    const { jsPDF } = await import("jspdf");
    const quotation = result.quotations?.[0];
    const pdf = new jsPDF();
    let y = 22;
    pdf.setFontSize(20);
    pdf.text("RepairTrack", 20, y);
    y += 10;
    pdf.setFontSize(16);
    pdf.text("Paid Invoice", 20, y);
    y += 12;
    pdf.setFontSize(10);
    pdf.text(`Invoice: ${invoice.invoiceNumber}`, 20, y);
    pdf.text(`Repair: ${result.repairNumber}`, 115, y);
    y += 7;
    pdf.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 20, y);
    pdf.text("Status: PAID", 115, y);
    y += 12;
    pdf.setFontSize(12);
    pdf.text("Description", 20, y);
    pdf.text("Qty", 125, y);
    pdf.text("Amount (LKR)", 150, y);
    y += 3;
    pdf.line(20, y, 190, y);
    y += 7;
    pdf.setFontSize(10);
    quotation?.items.forEach((item) => {
      const description = pdf.splitTextToSize(item.description, 95);
      pdf.text(description, 20, y);
      pdf.text(String(item.quantity), 128, y);
      pdf.text(Number(item.lineTotal).toFixed(2), 188, y, { align: "right" });
      y += Math.max(7, description.length * 5);
    });
    y += 3;
    pdf.line(110, y, 190, y);
    y += 7;
    pdf.text(`Subtotal: LKR ${Number(invoice.subtotal).toFixed(2)}`, 188, y, {
      align: "right",
    });
    y += 6;
    pdf.text(`Tax: LKR ${Number(invoice.tax).toFixed(2)}`, 188, y, {
      align: "right",
    });
    y += 6;
    pdf.setFontSize(12);
    pdf.text(`Total paid: LKR ${Number(invoice.paidAmount).toFixed(2)}`, 188, y, {
      align: "right",
    });
    y += 14;
    pdf.setFontSize(10);
    pdf.text("Payment history", 20, y);
    y += 7;
    invoice.payments.forEach((payment) => {
      pdf.text(
        `${payment.method} - LKR ${Number(payment.amount).toFixed(2)} - ${
          payment.paidAt
            ? new Date(payment.paidAt).toLocaleDateString()
            : "Completed"
        }`,
        20,
        y,
      );
      y += 6;
    });
    y += 8;
    pdf.text("Thank you for choosing RepairTrack.", 20, y);
    pdf.save(`${invoice.invoiceNumber}.pdf`);
  }
  return (
    <main className="min-h-screen bg-slate-100">
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link className="flex items-center gap-2 text-xl font-bold" to="/">
            <span className="rounded-xl bg-cyan-400 p-2">
              <Wrench size={20} />
            </span>
            RepairTrack
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft size={17} /> Return to home
          </Link>
        </div>
      </nav>
      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">
            Repair progress
          </p>
          <h1 className="mt-3 text-4xl font-bold">Track your device</h1>
          <p className="mt-3 text-slate-600">
            Use the details printed on your repair receipt. You do not need an
            account.
          </p>
        </div>
        <Card className="mt-8 p-6 shadow-lg sm:p-8">
          <form className="grid gap-5 sm:grid-cols-2" onSubmit={submit}>
            <label>
              <span className="mb-2 block text-sm font-semibold">
                Repair number
              </span>
              <input
                required
                placeholder="REP-2026-0001"
                className={inputClass}
                value={number}
                onChange={(e) => setNumber(e.target.value.toUpperCase())}
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">
                Registered phone number
              </span>
              <input
                required
                placeholder="0771234567"
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <button className={`${buttonClass} sm:col-span-2`} disabled={busy}>
              <Search className="mr-2" size={18} />
              {busy ? "Searching…" : "Show repair progress"}
            </button>
          </form>
        </Card>
        {error && (
          <div className="mt-5">
            <ErrorBox message={error} />
          </div>
        )}
        {result && (
          <Card className="mt-6 p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="font-mono text-sm text-slate-500">
                  {result.repairNumber}
                </p>
                <h2 className="mt-1 text-2xl font-bold">
                  {result.device?.brand} {result.device?.model}
                </h2>
              </div>
              <StatusBadge status={result.status} />
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 text-sm">
              <div>
                <dt className="text-slate-500">Priority</dt>
                <dd className="mt-1 font-semibold">{label(result.priority)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Received</dt>
                <dd className="mt-1 font-semibold">
                  {new Date(result.receivedAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
            {result.quotations?.map((quotation) => (
              <section
                key={quotation.id}
                className="mt-7 rounded-2xl border border-cyan-200 bg-cyan-50 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-cyan-700">
                    {quotation.status === "SENT"
                      ? "Your approval is required"
                      : "Quotation"}
                  </p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      quotation.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : quotation.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {label(quotation.status)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold">Repair quotation</h3>
                    <p className="text-sm text-slate-600">
                      {quotation.quotationNumber}
                    </p>
                  </div>
                  <p className="text-2xl font-bold">
                    LKR {Number(quotation.total).toFixed(2)}
                  </p>
                </div>
                <div className="mt-4 overflow-hidden rounded-xl border border-cyan-100 bg-white">
                  {quotation.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-0"
                    >
                      <div>
                        <p className="font-semibold">{item.description}</p>
                        <p className="text-xs text-slate-500">
                          {item.quantity} × LKR {Number(item.unitPrice).toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold">
                        LKR {Number(item.lineTotal).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                {quotation.notes && (
                  <p className="mt-3 text-sm text-slate-600">
                    Note: {quotation.notes}
                  </p>
                )}
                {quotation.status === "SENT" && (
                  <>
                    <textarea
                      className={`${inputClass} mt-4`}
                      rows={2}
                      maxLength={1000}
                      placeholder="Optional message to the repair centre"
                      value={responseNote}
                      onChange={(e) => setResponseNote(e.target.value)}
                    />
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        className={buttonClass}
                        disabled={responseBusy}
                        onClick={() => respondToQuotation("APPROVED")}
                      >
                        Approve quotation
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-red-300 bg-white px-4 py-2.5 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        disabled={responseBusy}
                        onClick={() => respondToQuotation("REJECTED")}
                      >
                        Reject quotation
                      </button>
                    </div>
                  </>
                )}
              </section>
            ))}
            {result.invoice && (
              <section className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      Final invoice
                    </p>
                    <h3 className="mt-1 text-xl font-bold">
                      {result.invoice.invoiceNumber}
                    </h3>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
                    {label(result.invoice.status)}
                  </span>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-white p-4 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-slate-500">Subtotal</dt>
                    <dd className="font-semibold">LKR {Number(result.invoice.subtotal).toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Tax</dt>
                    <dd className="font-semibold">LKR {Number(result.invoice.tax).toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Paid</dt>
                    <dd className="font-semibold">LKR {Number(result.invoice.paidAmount).toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Balance</dt>
                    <dd className="font-bold">LKR {Number(result.invoice.balance).toFixed(2)}</dd>
                  </div>
                </dl>
                {result.invoice.status !== "PAID" && (
                  <div className="mt-5 rounded-xl border border-emerald-200 bg-white p-4">
                    <p className="font-bold text-emerald-900">
                      Your device is ready for collection
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Please come to the repair shop, pay the remaining balance
                      and collect your device. The receptionist will record the
                      payment.
                    </p>
                  </div>
                )}
                {result.invoice.status === "PAID" && (
                  <p className="mt-4 rounded-xl bg-emerald-100 p-3 font-semibold text-emerald-800">
                    This invoice has been paid in full.
                  </p>
                )}
                {result.invoice.status === "PAID" && (
                  <button
                    type="button"
                    className={`${buttonClass} mt-4`}
                    onClick={() => void downloadPaidInvoice()}
                  >
                    Download paid invoice PDF
                  </button>
                )}
              </section>
            )}
            <h3 className="mt-7 font-bold">Progress timeline</h3>
            <div className="mt-5 space-y-5">
              {result.statusHistory?.map((h, i) => (
                <div
                  key={i}
                  className="relative border-l-2 border-cyan-300 pb-1 pl-5"
                >
                  <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-cyan-500 ring-4 ring-cyan-50" />
                  <StatusBadge status={h.status} />
                  <p className="mt-2 text-sm text-slate-700">
                    {h.publicNote || "Status updated"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(h.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            {result.attachments && result.attachments.length > 0 && (
              <div className="mt-8 border-t border-slate-200 pt-7">
                <h3 className="font-bold">Device photos</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Photos uploaded by the technician during inspection and
                  repair.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {result.attachments.map((photo) => (
                    <a
                      href={photo.url}
                      target="_blank"
                      rel="noreferrer"
                      key={photo.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                    >
                      <img
                        src={photo.url}
                        alt={photo.fileName}
                        className="h-52 w-full object-cover"
                      />
                      <div className="p-3">
                        <p className="truncate text-sm font-semibold">
                          {photo.fileName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(photo.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </section>
    </main>
  );
}
