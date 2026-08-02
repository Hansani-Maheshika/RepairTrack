import {
  ArrowRight,
  ClipboardCheck,
  Clock3,
  PackageCheck,
  Plus,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Card,
  Empty,
  ErrorBox,
  Loading,
  StatusBadge,
  buttonClass,
} from "../../components/ui";
import { useAuth } from "../../context/authContextValue";
import { useApiQuery } from "../../hooks/useApiQuery";
import { api } from "../../lib/api";
import type { ApiResponse } from "../../types/auth";
import type { Pagination, Repair, RepairStatus } from "../../types/domain";

const finished: RepairStatus[] = ["COLLECTED", "CANCELLED"];

function nextAction(repair: Repair, technician: boolean) {
  if (technician) {
    if (repair.status === "DEVICE_RECEIVED") return "Start inspection";
    if (repair.status === "UNDER_INSPECTION")
      return "Record findings and request approval";
    if (repair.status === "REPAIR_APPROVED") return "Start repair";
    if (repair.status === "WAITING_FOR_SPARE_PARTS")
      return "Check required parts";
    if (repair.status === "REPAIR_IN_PROGRESS")
      return "Finish repair and begin testing";
    if (repair.status === "TESTING") return "Complete testing";
    return "Review repair";
  }
  if (repair.status === "WAITING_FOR_CUSTOMER_APPROVAL")
    return "Follow up on quotation";
  if (repair.status === "READY_FOR_COLLECTION")
    return "Contact customer and hand over device";
  if (repair.status === "COMPLETED") return "Mark device collected";
  if (repair.status === "DEVICE_RECEIVED")
    return "Waiting for admin assignment";
  return "Review customer update";
}

export function RoleDashboard() {
  const { user } = useAuth();
  const technician = user?.role === "TECHNICIAN";
  const q = useApiQuery(async () => {
    const { data } = await api.get<
      ApiResponse<{ repairs: Repair[]; pagination: Pagination }>
    >("/repairs", { params: { limit: 100 } });
    return data.data.repairs;
  }, []);
  if (q.loading) return <Loading />;
  if (q.error || !q.data)
    return <ErrorBox message={q.error || "Dashboard unavailable"} />;
  const active = q.data.filter((repair) => !finished.includes(repair.status));
  const urgent = active.filter(
    (repair) => repair.priority === "URGENT" || repair.priority === "HIGH",
  );
  const attention = technician
    ? active.filter((repair) =>
        [
          "DEVICE_RECEIVED",
          "UNDER_INSPECTION",
          "REPAIR_APPROVED",
          "REPAIR_IN_PROGRESS",
          "TESTING",
        ].includes(repair.status),
      )
    : active.filter((repair) =>
        [
          "WAITING_FOR_CUSTOMER_APPROVAL",
          "READY_FOR_COLLECTION",
          "COMPLETED",
        ].includes(repair.status),
      );

  return (
    <>
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-7 text-white shadow-xl sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
          {technician ? "Technician workspace" : "Reception desk"}
        </p>
        <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">
              Good day, {user?.fullName}
            </h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              {technician
                ? "Inspect assigned devices, record parts and move repairs through testing."
                : "Manage customer intake, quotations, payments and device collection."}
            </p>
          </div>
          {!technician && (
            <Link
              className={`${buttonClass} bg-cyan-400 text-slate-950 hover:bg-cyan-300`}
              to="/repairs/new"
            >
              <Plus className="mr-2" size={18} />
              Register new repair
            </Link>
          )}
        </div>
      </section>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Metric
          icon={Wrench}
          label={technician ? "Assigned repairs" : "Active repairs"}
          value={active.length}
        />
        <Metric
          icon={Clock3}
          label="Needs attention"
          value={attention.length}
          tone="amber"
        />
        <Metric
          icon={ClipboardCheck}
          label="High priority"
          value={urgent.length}
          tone="red"
        />
      </div>
      <div className="mt-6">
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-bold">Your next actions</h2>
            <p className="mt-1 text-sm text-slate-500">
              Open a repair to complete the next required step.
            </p>
          </div>
          {attention.length ? (
            <div className="divide-y divide-slate-100">
              {attention.slice(0, 8).map((repair) => (
                <Link
                  to={`/repairs/${repair.id}`}
                  key={repair.id}
                  className="group flex items-center gap-4 px-6 py-4 hover:bg-slate-50"
                >
                  <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700">
                    {repair.status === "READY_FOR_COLLECTION" ? (
                      <PackageCheck size={20} />
                    ) : (
                      <Wrench size={20} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="font-mono text-sm">
                        {repair.repairNumber}
                      </strong>
                      <StatusBadge status={repair.status} />
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {repair.customer?.name} · {repair.device?.brand}{" "}
                      {repair.device?.model}
                    </p>
                    <p className="mt-1 text-sm font-medium text-cyan-700">
                      {nextAction(repair, technician)}
                    </p>
                  </div>
                  <ArrowRight
                    className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-cyan-600"
                    size={20}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <Empty message="No work needs your attention right now." />
          )}
        </Card>
      </div>
    </>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone = "cyan",
}: {
  icon: typeof Wrench;
  label: string;
  value: number;
  tone?: "cyan" | "amber" | "red";
}) {
  const colours = {
    cyan: "bg-cyan-50 text-cyan-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <Card className="flex items-center gap-4">
      <span className={`rounded-2xl p-3 ${colours[tone]}`}>
        <Icon size={23} />
      </span>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-3xl font-bold text-slate-950">{value}</p>
      </div>
    </Card>
  );
}
