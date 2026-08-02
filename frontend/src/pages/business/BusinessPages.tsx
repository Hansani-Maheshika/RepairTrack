import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import {
  Card,
  Empty,
  ErrorBox,
  Loading,
  PageHeader,
  buttonClass,
  inputClass,
} from "../../components/ui";
import { useApiQuery } from "../../hooks/useApiQuery";
import { api, getApiErrorMessage } from "../../lib/api";
import type { ApiResponse } from "../../types/auth";
import type { Invoice, PartRequest, SparePart } from "../../types/business";
import { useAuth } from "../../context/authContextValue";

export function InventoryPage() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const q = useApiQuery(async () => {
    const { data } =
      await api.get<ApiResponse<{ parts: SparePart[] }>>("/inventory");
    return data.data.parts;
  }, []);
  const requests = useApiQuery(async () => {
    if (user?.role !== "ADMIN") return [];
    const { data } =
      await api.get<ApiResponse<{ requests: PartRequest[] }>>("/part-requests");
    return data.data.requests;
  }, [user?.role]);
  return (
    <>
      <PageHeader
        title="Spare-parts inventory"
        description={
          user?.role === "ADMIN"
            ? "Manage stock and reorder levels."
            : "View available spare parts and stock levels."
        }
        action={
          user?.role === "ADMIN" ? (
            <button className={buttonClass} onClick={() => setShow(!show)}>
              Add spare part
            </button>
          ) : undefined
        }
      />
      {user?.role === "ADMIN" && show && (
        <PartForm
          done={async () => {
            setShow(false);
            await q.reload();
          }}
        />
      )}
      {user?.role === "ADMIN" && requests.data && (
        <PartRequestsPanel
          requests={requests.data}
          parts={q.data ?? []}
          reload={async () => {
            await Promise.all([requests.reload(), q.reload()]);
          }}
        />
      )}
      <div className="mt-5">
        {q.loading ? (
          <Loading />
        ) : q.error ? (
          <ErrorBox message={q.error} />
        ) : !q.data?.length ? (
          <Empty message="No spare parts." />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="pb-3">SKU</th>
                    <th>Part</th>
                    <th>Stock</th>
                    <th>Reorder</th>
                    <th>Selling price</th>
                    {user?.role === "ADMIN" && <th>Stock action</th>}
                  </tr>
                </thead>
                <tbody>
                  {q.data.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="py-4 font-mono">{p.sku}</td>
                      <td>{p.name}</td>
                      <td
                        className={
                          p.quantity <= p.reorderLevel
                            ? "font-bold text-red-600"
                            : ""
                        }
                      >
                        {p.quantity}
                      </td>
                      <td>{p.reorderLevel}</td>
                      <td>LKR {p.sellingPrice}</td>
                      {user?.role === "ADMIN" && (
                        <td>
                          <StockAdjustment part={p} reload={q.reload} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

function StockAdjustment({
  part,
  reload,
}: {
  part: SparePart;
  reload: () => Promise<void>;
}) {
  const [quantity, setQuantity] = useState(1);
  async function addStock() {
    try {
      await api.post(`/inventory/${part.id}/adjust`, {
        quantity,
        note: "Stock received for technician requests",
      });
      toast.success(`Added ${quantity} to ${part.name}`);
      await reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }
  return (
    <div className="flex min-w-44 gap-2">
      <input
        type="number"
        min="1"
        className={`${inputClass} w-20`}
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
      />
      <button
        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
        onClick={() => void addStock()}
      >
        Add stock
      </button>
    </div>
  );
}

function PartRequestsPanel({
  requests,
  parts,
  reload,
}: {
  requests: PartRequest[];
  parts: SparePart[];
  reload: () => Promise<void>;
}) {
  const pending = requests.filter((request) => request.status === "PENDING");
  if (!pending.length) return null;
  return (
    <Card className="mt-5 border-amber-200 bg-amber-50/40">
      <h2 className="text-lg font-bold">Technician part requests</h2>
      <p className="mt-1 text-sm text-slate-600">
        Add enough inventory, then mark the request fulfilled.
      </p>
      <div className="mt-4 space-y-3">
        {pending.map((request) => (
          <PartRequestRow
            key={request.id}
            request={request}
            parts={parts}
            reload={reload}
          />
        ))}
      </div>
    </Card>
  );
}

function PartRequestRow({
  request,
  parts,
  reload,
}: {
  request: PartRequest;
  parts: SparePart[];
  reload: () => Promise<void>;
}) {
  const [partId, setPartId] = useState(request.sparePartId ?? "");
  async function resolve(status: "FULFILLED" | "REJECTED") {
    try {
      await api.patch(`/part-requests/${request.id}`, {
        status,
        sparePartId: partId || null,
      });
      toast.success(`Request ${status.toLowerCase()}`);
      await reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }
  return (
    <div className="rounded-2xl border border-amber-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <p className="font-semibold">
            {request.quantity} × {request.partName}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {request.repairJob.repairNumber} · {request.requestedBy.fullName}
            {request.note ? ` · ${request.note}` : ""}
          </p>
        </div>
        <select
          className={`${inputClass} lg:w-64`}
          value={partId}
          onChange={(e) => setPartId(e.target.value)}
        >
          <option value="">Select inventory part</option>
          {parts.map((part) => (
            <option key={part.id} value={part.id}>
              {part.name} ({part.quantity})
            </option>
          ))}
        </select>
        <button
          className="rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white"
          onClick={() => void resolve("FULFILLED")}
        >
          Fulfilled
        </button>
        <button
          className="rounded-xl border border-red-200 px-4 py-2.5 font-semibold text-red-700"
          onClick={() => void resolve("REJECTED")}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
function PartForm({ done }: { done: () => Promise<void> }) {
  const [v, setV] = useState({
    sku: "",
    name: "",
    description: "",
    quantity: 0,
    reorderLevel: 2,
    unitCost: "",
    sellingPrice: "",
  });
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/inventory", {
        ...v,
        unitCost: Number(v.unitCost),
        sellingPrice: Number(v.sellingPrice),
      });
      toast.success("Spare part created");
      await done();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <form className="grid gap-3 md:grid-cols-3" onSubmit={submit}>
        <input
          required
          placeholder="SKU"
          className={inputClass}
          value={v.sku}
          onChange={(e) => setV({ ...v, sku: e.target.value.toUpperCase() })}
        />
        <input
          required
          placeholder="Part name"
          className={inputClass}
          value={v.name}
          onChange={(e) => setV({ ...v, name: e.target.value })}
        />
        <input
          placeholder="Description"
          className={inputClass}
          value={v.description}
          onChange={(e) => setV({ ...v, description: e.target.value })}
        />
        {(["quantity", "reorderLevel"] as const).map((k) => (
          <label key={k} className="text-sm">
            {k === "quantity" ? "Opening quantity" : "Reorder level"}
            <input
              required
              type="number"
              min="0"
              step="1"
              className={`${inputClass} mt-1`}
              value={v[k]}
              onChange={(e) => setV({ ...v, [k]: Number(e.target.value) })}
            />
          </label>
        ))}
        <label className="text-sm">
          Unit cost (LKR)
          <input
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="Example: 6500.00"
            className={`${inputClass} mt-1`}
            value={v.unitCost}
            onChange={(e) => setV({ ...v, unitCost: e.target.value })}
          />
        </label>
        <label className="text-sm">
          Selling price (LKR)
          <input
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="Example: 8500.00"
            className={`${inputClass} mt-1`}
            value={v.sellingPrice}
            onChange={(e) => setV({ ...v, sellingPrice: e.target.value })}
          />
        </label>
        <button disabled={busy} className={buttonClass}>
          {busy ? "Saving…" : "Save part"}
        </button>
      </form>
    </Card>
  );
}

export function InvoicesPage() {
  const { user } = useAuth();
  const q = useApiQuery(async () => {
    const { data } =
      await api.get<ApiResponse<{ invoices: Invoice[] }>>("/invoices");
    return data.data.invoices;
  }, []);
  return (
    <>
      <PageHeader
        title="Invoices and payments"
        description={
          user?.role === "RECEPTIONIST"
            ? "Create invoices from approved quotations and record counter payments."
            : "View customer invoices, payments and outstanding balances."
        }
      />
      {q.loading ? (
        <Loading />
      ) : q.error ? (
        <ErrorBox message={q.error} />
      ) : !q.data?.length ? (
        <Empty message="No invoices created." />
      ) : (
        <div className="space-y-4">
          {q.data.map((i) => (
            <InvoiceCard
              key={i.id}
              invoice={i}
              reload={q.reload}
              canRecordPayment={user?.role === "RECEPTIONIST"}
            />
          ))}
        </div>
      )}
    </>
  );
}
function InvoiceCard({
  invoice,
  reload,
  canRecordPayment,
}: {
  invoice: Invoice;
  reload: () => Promise<void>;
  canRecordPayment: boolean;
}) {
  const [amount, setAmount] = useState(invoice.balance);
  const [method, setMethod] = useState("CASH");
  async function pay() {
    try {
      await api.post(`/invoices/${invoice.id}/payments`, {
        amount: Number(amount),
        method,
      });
      toast.success("Payment recorded");
      await reload();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }
  return (
    <Card>
      <div className="flex flex-col justify-between gap-4 md:flex-row">
        <div>
          <p className="font-mono text-sm text-slate-500">
            {invoice.invoiceNumber}
          </p>
          <h2 className="font-semibold">
            {invoice.customer?.name} · {invoice.repairJob?.repairNumber}
          </h2>
          <p className="mt-2">
            Total LKR {invoice.total} · Paid {invoice.paidAmount} ·{" "}
            <strong>Balance {invoice.balance}</strong>
          </p>
        </div>
        {canRecordPayment && invoice.status !== "PAID" && (
          <div className="flex gap-2">
            <input
              className={`${inputClass} w-32`}
              type="number"
              min="0.01"
              max={invoice.balance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <select
              className={inputClass}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option>CASH</option>
              <option>CARD</option>
              <option>BANK_TRANSFER</option>
            </select>
            <button className={buttonClass} onClick={() => void pay()}>
              Record
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
