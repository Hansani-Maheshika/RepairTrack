import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
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
import { useAuth } from "../../context/authContextValue";
import {
  deviceTypes,
  label,
  type Customer,
  type Device,
  type DeviceType,
  type Pagination,
} from "../../types/domain";

export function DevicesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useApiQuery(async () => {
    const { data } = await api.get<
      ApiResponse<{ devices: Device[]; pagination: Pagination }>
    >("/devices", { params: { search, page } });
    return data.data;
  }, [search, page]);
  return (
    <>
      <PageHeader
        title="Devices"
        description="Registered customer devices."
        action={
          user?.role === "RECEPTIONIST" ? (
            <Link className={buttonClass} to="/devices/new">
              <Plus className="mr-2" size={18} />
              Register device
            </Link>
          ) : undefined
        }
      />
      <input
        className={`${inputClass} mb-5 max-w-md`}
        placeholder="Search code, brand, model or serial"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />
      {q.loading ? (
        <Loading />
      ) : q.error ? (
        <ErrorBox message={q.error} />
      ) : !q.data?.devices.length ? (
        <Empty message="No devices found." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-slate-500">
                <tr>
                  <th className="pb-3">Code</th>
                  <th>Device</th>
                  <th>Type</th>
                  <th>Customer</th>
                  <th>Repairs</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {q.data.devices.map((d) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="py-4 font-mono">{d.deviceCode}</td>
                    <td className="font-medium">
                      {d.brand} {d.model}
                    </td>
                    <td>{label(d.deviceType)}</td>
                    <td>{d.customer?.name}</td>
                    <td>{d._count?.repairJobs ?? 0}</td>
                    <td>
                      <DetailLink to={`/devices/${d.id}`}>View</DetailLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar pagination={q.data.pagination} onPage={setPage} />
        </Card>
      )}
    </>
  );
}

interface Values {
  customerId: string;
  deviceType: DeviceType;
  brand: string;
  model: string;
  serialNumber: string;
  colour: string;
  condition: string;
  accessories: string;
}
function DeviceForm({
  initial,
  editing,
  onSubmit,
}: {
  initial?: Partial<Values>;
  editing?: boolean;
  onSubmit: (v: Values) => Promise<void>;
}) {
  const [v, setV] = useState<Values>({
    customerId: initial?.customerId ?? "",
    deviceType: initial?.deviceType ?? "LAPTOP",
    brand: initial?.brand ?? "",
    model: initial?.model ?? "",
    serialNumber: initial?.serialNumber ?? "",
    colour: initial?.colour ?? "",
    condition: initial?.condition ?? "",
    accessories: initial?.accessories ?? "",
  });
  const [busy, setBusy] = useState(false);
  const customers = useApiQuery(async () => {
    const { data } = await api.get<ApiResponse<{ customers: Customer[] }>>(
      "/customers",
      { params: { limit: 100 } },
    );
    return data.data.customers;
  }, []);
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
    <Card className="max-w-3xl">
      <form className="grid gap-5 sm:grid-cols-2" onSubmit={submit}>
        {!editing && (
          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-medium">Customer *</span>
            <select
              required
              className={inputClass}
              value={v.customerId}
              onChange={(e) => setV({ ...v, customerId: e.target.value })}
            >
              <option value="">Select customer</option>
              {customers.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerCode} — {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          <span className="mb-2 block text-sm font-medium">Device type *</span>
          <select
            className={inputClass}
            value={v.deviceType}
            onChange={(e) =>
              setV({ ...v, deviceType: e.target.value as DeviceType })
            }
          >
            {deviceTypes.map((t) => (
              <option key={t} value={t}>
                {label(t)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium">Brand *</span>
          <input
            required
            className={inputClass}
            value={v.brand}
            onChange={(e) => setV({ ...v, brand: e.target.value })}
          />
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium">Model *</span>
          <input
            required
            className={inputClass}
            value={v.model}
            onChange={(e) => setV({ ...v, model: e.target.value })}
          />
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium">Serial number</span>
          <input
            className={inputClass}
            value={v.serialNumber}
            onChange={(e) => setV({ ...v, serialNumber: e.target.value })}
          />
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium">Colour</span>
          <input
            className={inputClass}
            value={v.colour}
            onChange={(e) => setV({ ...v, colour: e.target.value })}
          />
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium">
            Accessories (comma separated)
          </span>
          <input
            className={inputClass}
            value={v.accessories}
            onChange={(e) => setV({ ...v, accessories: e.target.value })}
          />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-2 block text-sm font-medium">Condition</span>
          <textarea
            rows={3}
            className={inputClass}
            value={v.condition}
            onChange={(e) => setV({ ...v, condition: e.target.value })}
          />
        </label>
        <div className="sm:col-span-2 flex gap-3">
          <button className={buttonClass} disabled={busy}>
            {busy ? "Saving…" : "Save device"}
          </button>
          <Link className="rounded-xl border px-4 py-2.5" to="/devices">
            Cancel
          </Link>
        </div>
      </form>
    </Card>
  );
}
const payload = (v: Values) => ({
  ...(v.customerId ? { customerId: v.customerId } : {}),
  deviceType: v.deviceType,
  brand: v.brand,
  model: v.model,
  serialNumber: v.serialNumber || null,
  colour: v.colour || null,
  condition: v.condition || null,
  accessories: v.accessories
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean),
});
export function NewDevicePage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  return (
    <>
      <PageHeader
        title="Register device"
        description="Attach a device to an existing customer."
      />
      <DeviceForm
        initial={{ customerId: params.get("customerId") ?? "" }}
        onSubmit={async (v) => {
          try {
            const { data } = await api.post<ApiResponse<{ device: Device }>>(
              "/devices",
              payload(v),
            );
            toast.success("Device registered");
            nav(`/devices/${data.data.device.id}`);
          } catch (e) {
            toast.error(getApiErrorMessage(e));
            throw e;
          }
        }}
      />
    </>
  );
}
export function DeviceDetailsPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const q = useApiQuery(async () => {
    const { data } = await api.get<ApiResponse<{ device: Device }>>(
      `/devices/${id}`,
    );
    return data.data.device;
  }, [id]);
  if (q.loading) return <Loading />;
  if (q.error || !q.data)
    return <ErrorBox message={q.error || "Device not found"} />;
  const d = q.data;
  return (
    <>
      <PageHeader
        title={`${d.brand} ${d.model}`}
        description={`${d.deviceCode} · ${label(d.deviceType)}`}
        action={
          user?.role === "RECEPTIONIST" ? (
            <div className="flex gap-2">
              <Link
                className="rounded-xl border px-4 py-2.5"
                to={`/devices/${d.id}/edit`}
              >
                Edit
              </Link>
              <Link
                className={buttonClass}
                to={`/repairs/new?customerId=${d.customerId}&deviceId=${d.id}`}
              >
                Create repair
              </Link>
            </div>
          ) : undefined
        }
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Device information</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">Serial</dt>
              <dd>{d.serialNumber || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Colour</dt>
              <dd>{d.colour || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Accessories</dt>
              <dd>{d.accessories?.join(", ") || "None"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Condition</dt>
              <dd>{d.condition || "—"}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <h2 className="font-semibold">Customer</h2>
          {d.customer && (
            <div className="mt-4">
              <p>{d.customer.name}</p>
              <p className="text-sm text-slate-500">{d.customer.phone}</p>
              <DetailLink to={`/customers/${d.customer.id}`}>
                View customer
              </DetailLink>
            </div>
          )}
        </Card>
      </div>
      <Card className="mt-5">
        <h2 className="font-semibold">Repair history</h2>
        <div className="mt-4 space-y-3">
          {d.repairJobs?.length ? (
            d.repairJobs.map((r) => (
              <div className="flex justify-between border-b pb-3" key={r.id}>
                <span>{r.reportedProblem}</span>
                <DetailLink to={`/repairs/${r.id}`}>
                  {r.repairNumber}
                </DetailLink>
              </div>
            ))
          ) : (
            <p className="text-slate-500">No repairs yet.</p>
          )}
        </div>
      </Card>
    </>
  );
}
export function EditDevicePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const q = useApiQuery(async () => {
    const { data } = await api.get<ApiResponse<{ device: Device }>>(
      `/devices/${id}`,
    );
    return data.data.device;
  }, [id]);
  if (q.loading) return <Loading />;
  if (q.error || !q.data)
    return <ErrorBox message={q.error || "Device not found"} />;
  const d = q.data;
  return (
    <>
      <PageHeader title="Edit device" description={d.deviceCode} />
      <DeviceForm
        editing
        initial={{
          deviceType: d.deviceType,
          brand: d.brand,
          model: d.model,
          serialNumber: d.serialNumber ?? "",
          colour: d.colour ?? "",
          condition: d.condition ?? "",
          accessories: d.accessories.join(", "),
        }}
        onSubmit={async (v) => {
          try {
            await api.patch(`/devices/${id}`, payload(v));
            toast.success("Device updated");
            nav(`/devices/${id}`);
          } catch (e) {
            toast.error(getApiErrorMessage(e));
            throw e;
          }
        }}
      />
    </>
  );
}
