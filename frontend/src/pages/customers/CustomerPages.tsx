import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Card,
  DetailLink,
  Empty,
  ErrorBox,
  Loading,
  PageHeader,
  PaginationBar,
  buttonClass,
  inputClass,
} from "../../components/ui";
import { useApiQuery } from "../../hooks/useApiQuery";
import { api, getApiErrorMessage } from "../../lib/api";
import type { ApiResponse } from "../../types/auth";
import type { Customer, Pagination } from "../../types/domain";
import { useAuth } from "../../context/authContextValue";

export function CustomersPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useApiQuery(async () => {
    const { data } = await api.get<
      ApiResponse<{ customers: Customer[]; pagination: Pagination }>
    >("/customers", { params: { search, page } });
    return data.data;
  }, [search, page]);
  return (
    <>
      <PageHeader
        title="Customers"
        description="Search and manage repair customers."
        action={
          user?.role === "RECEPTIONIST" ? (
            <Link className={buttonClass} to="/customers/new">
              <Plus size={18} className="mr-2" />
              New customer
            </Link>
          ) : undefined
        }
      />
      <input
        className={`${inputClass} mb-5 max-w-md`}
        placeholder="Search name, phone or customer code"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />
      {query.loading ? (
        <Loading />
      ) : query.error ? (
        <ErrorBox message={query.error} />
      ) : !query.data?.customers.length ? (
        <Empty message="No customers found." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-slate-500">
                <tr>
                  <th className="pb-3">Code</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Devices</th>
                  <th>Repairs</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {query.data.customers.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-4 font-mono">{c.customerCode}</td>
                    <td className="font-medium">{c.name}</td>
                    <td>{c.phone}</td>
                    <td>{c._count?.devices ?? 0}</td>
                    <td>{c._count?.repairJobs ?? 0}</td>
                    <td>
                      <DetailLink to={`/customers/${c.id}`}>View</DetailLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar pagination={query.data.pagination} onPage={setPage} />
        </Card>
      )}
    </>
  );
}

interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  privacyConsent: boolean;
}
function CustomerForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<CustomerFormData>;
  onSubmit: (v: CustomerFormData) => Promise<void>;
  submitLabel: string;
}) {
  const [v, setV] = useState<CustomerFormData>({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    address: initial?.address ?? "",
    privacyConsent: initial?.privacyConsent ?? false,
  });
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit(v);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="max-w-2xl">
      <form className="grid gap-5 sm:grid-cols-2" onSubmit={submit}>
        <label>
          <span className="mb-2 block text-sm font-medium">Full name *</span>
          <input
            required
            minLength={2}
            className={inputClass}
            value={v.name}
            onChange={(e) => setV({ ...v, name: e.target.value })}
          />
        </label>
        {!initial && (
          <label className="sm:col-span-2 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <input
              required
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={v.privacyConsent}
              onChange={(e) =>
                setV({ ...v, privacyConsent: e.target.checked })
              }
            />
            <span>
              The customer has agreed that their contact and repair information
              may be stored and used to provide repair updates, quotations and
              invoices.
            </span>
          </label>
        )}
        <label>
          <span className="mb-2 block text-sm font-medium">Phone *</span>
          <input
            required
            minLength={7}
            className={inputClass}
            value={v.phone}
            onChange={(e) => setV({ ...v, phone: e.target.value })}
          />
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium">Email</span>
          <input
            type="email"
            className={inputClass}
            value={v.email}
            onChange={(e) => setV({ ...v, email: e.target.value })}
          />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-2 block text-sm font-medium">Address</span>
          <textarea
            className={inputClass}
            rows={3}
            value={v.address}
            onChange={(e) => setV({ ...v, address: e.target.value })}
          />
        </label>
        <div className="sm:col-span-2 flex gap-3">
          <button disabled={busy} className={buttonClass}>
            {busy ? "Saving…" : submitLabel}
          </button>
          <Link className="rounded-xl border px-4 py-2.5" to="/customers">
            Cancel
          </Link>
        </div>
      </form>
    </Card>
  );
}

export function NewCustomerPage() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        title="New customer"
        description="Create a customer before registering a device."
      />
      <CustomerForm
        submitLabel="Create customer"
        onSubmit={async (v) => {
          try {
            const { data } = await api.post<
              ApiResponse<{ customer: Customer }>
            >("/customers", {
              ...v,
              email: v.email || null,
              address: v.address || null,
            });
            toast.success("Customer created");
            navigate(`/customers/${data.data.customer.id}`);
          } catch (e) {
            toast.error(getApiErrorMessage(e));
            throw e;
          }
        }}
      />
    </>
  );
}

export function CustomerDetailsPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const query = useApiQuery(async () => {
    const { data } = await api.get<ApiResponse<{ customer: Customer }>>(
      `/customers/${id}`,
    );
    return data.data.customer;
  }, [id]);
  if (query.loading) return <Loading />;
  if (query.error || !query.data)
    return <ErrorBox message={query.error || "Customer not found"} />;
  const c = query.data;
  return (
    <>
      <PageHeader
        title={c.name}
        description={`${c.customerCode} · ${c.phone}`}
        action={
          user?.role === "RECEPTIONIST" ? (
            <div className="flex gap-2">
              <Link
                className="rounded-xl border px-4 py-2.5"
                to={`/customers/${c.id}/edit`}
              >
                Edit
              </Link>
              <Link
                className={buttonClass}
                to={`/devices/new?customerId=${c.id}`}
              >
                Register device
              </Link>
            </div>
          ) : undefined
        }
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Contact details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd>{c.email || "Not provided"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Address</dt>
              <dd>{c.address || "Not provided"}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <h2 className="font-semibold">Devices</h2>
          <div className="mt-4 space-y-3">
            {c.devices?.length ? (
              c.devices.map((d) => (
                <div key={d.id} className="flex justify-between border-b pb-3">
                  <span>
                    {d.brand} {d.model}
                  </span>
                  <DetailLink to={`/devices/${d.id}`}>
                    {d.deviceCode}
                  </DetailLink>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No devices registered.</p>
            )}
          </div>
        </Card>
      </div>
      <Card className="mt-5">
        <h2 className="font-semibold">Repair history</h2>
        <div className="mt-4 space-y-3">
          {c.repairJobs?.length ? (
            c.repairJobs.map((r) => (
              <div key={r.id} className="flex justify-between border-b pb-3">
                <span>{r.reportedProblem}</span>
                <DetailLink to={`/repairs/${r.id}`}>
                  {r.repairNumber}
                </DetailLink>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No repair history.</p>
          )}
        </div>
      </Card>
    </>
  );
}

export function EditCustomerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const query = useApiQuery(async () => {
    const { data } = await api.get<ApiResponse<{ customer: Customer }>>(
      `/customers/${id}`,
    );
    return data.data.customer;
  }, [id]);
  if (query.loading) return <Loading />;
  if (query.error || !query.data)
    return <ErrorBox message={query.error || "Customer not found"} />;
  return (
    <>
      <PageHeader title="Edit customer" description={query.data.customerCode} />
      <CustomerForm
        initial={{
          name: query.data.name,
          phone: query.data.phone,
          email: query.data.email ?? "",
          address: query.data.address ?? "",
          privacyConsent: true,
        }}
        submitLabel="Save changes"
        onSubmit={async (v) => {
          try {
            await api.patch(`/customers/${id}`, {
              name: v.name,
              phone: v.phone,
              email: v.email || null,
              address: v.address || null,
            });
            toast.success("Customer updated");
            navigate(`/customers/${id}`);
          } catch (e) {
            toast.error(getApiErrorMessage(e));
            throw e;
          }
        }}
      />
    </>
  );
}
