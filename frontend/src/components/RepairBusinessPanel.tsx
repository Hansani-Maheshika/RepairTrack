import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/authContextValue";
import { useApiQuery } from "../hooks/useApiQuery";
import { api, getApiErrorMessage } from "../lib/api";
import type { ApiResponse } from "../types/auth";
import type {
  Attachment,
  PartRequest,
  Quotation,
  SparePart,
} from "../types/business";
import type { RepairStatus } from "../types/domain";
import { Card, buttonClass, inputClass } from "./ui";

export function RepairBusinessPanel({
  repairId,
  repairStatus,
}: {
  repairId: string;
  repairStatus: RepairStatus;
}) {
  const { user } = useAuth();
  const quotes = useApiQuery(async () => {
    if (user?.role !== "RECEPTIONIST") return [];
    const { data } = await api.get<ApiResponse<{ quotations: Quotation[] }>>(
      `/repairs/${repairId}/quotations`,
    );
    return data.data.quotations;
  }, [repairId, user?.role]);
  const files = useApiQuery(async () => {
    const { data } = await api.get<ApiResponse<{ attachments: Attachment[] }>>(
      `/repairs/${repairId}/attachments`,
    );
    return data.data.attachments;
  }, [repairId]);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [uploading, setUploading] = useState(false);
  async function createQuote(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post(`/repairs/${repairId}/quotations`, {
        items: [{ description, quantity: 1, unitPrice: Number(price) }],
        tax: 0,
      });
      setDescription("");
      setPrice("");
      toast.success("Quotation created");
      await quotes.reload();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }
  async function send(id: string) {
    try {
      const { data } = await api.post<
        ApiResponse<{ developmentLink?: string }>
      >(`/quotations/${id}/send`);
      toast.success(
        data.data.developmentLink
          ? `Local link: ${data.data.developmentLink}`
          : "Quotation sent",
      );
      await quotes.reload();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }
  async function invoice(id: string) {
    try {
      const { data } = await api.post<
        ApiResponse<{ developmentLink?: string }>
      >(`/quotations/${id}/invoice`);
      toast.success(
        data.data.developmentLink
          ? `Invoice: ${data.data.developmentLink}`
          : "Invoice created",
      );
      await quotes.reload();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }
  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const target = e.currentTarget;
    const input = target.elements.namedItem("file") as HTMLInputElement;
    const selected = input.files?.[0];
    if (!selected) return;
    setUploading(true);
    try {
      const file = await prepareUploadImage(selected);
      const form = new FormData();
      form.append("file", file, file.name);
      await api.post(`/repairs/${repairId}/attachments`, form);
      toast.success("File uploaded");
      target.reset();
      await files.reload();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setUploading(false);
    }
  }
  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      {user?.role === "RECEPTIONIST" && (
        <Card>
          <h2 className="font-semibold">Quotations and approval</h2>
          {repairStatus === "WAITING_FOR_CUSTOMER_APPROVAL" ? (
            <form
              className="mt-4 grid gap-3 sm:grid-cols-3"
              onSubmit={createQuote}
            >
              <input
                required
                className={`${inputClass} sm:col-span-2`}
                placeholder="Work or part description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <input
                required
                min="0"
                type="number"
                className={inputClass}
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <button className={buttonClass}>Create quotation</button>
            </form>
          ) : (
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              Quotation becomes available after the technician completes
              inspection and selects Waiting for Customer Approval.
            </p>
          )}
          <div className="mt-5 space-y-3">
            {quotes.data?.map((q) => (
              <div key={q.id} className="rounded-xl border p-3">
                <div className="flex justify-between">
                  <strong>{q.quotationNumber}</strong>
                  <span>{q.status}</span>
                </div>
                <p>Total LKR {q.total}</p>
                <div className="mt-2 flex gap-2">
                  {q.status === "DRAFT" && (
                    <button
                      className="text-cyan-700"
                      onClick={() => void send(q.id)}
                    >
                      Send to customer
                    </button>
                  )}
                  {q.status === "APPROVED" && repairStatus === "COMPLETED" && (
                    <button
                      className="text-cyan-700"
                      onClick={() => void invoice(q.id)}
                    >
                      Create invoice
                    </button>
                  )}
                  {q.status === "APPROVED" && repairStatus !== "COMPLETED" && (
                    <span className="text-sm text-slate-500">
                      Approved — invoice available after the technician marks
                      the repair completed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card>
        <h2 className="font-semibold">Files and images</h2>
        {user?.role === "TECHNICIAN" && (
          <form className="mt-4 flex gap-2" onSubmit={upload}>
            <input
              required
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className={inputClass}
            />
            <button className={buttonClass} disabled={uploading}>
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </form>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {files.data?.map((f) =>
            f.mimeType.startsWith("image/") ? (
              <figure
                key={f.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
              >
                <a href={f.url} target="_blank" rel="noreferrer">
                  <img
                    src={f.url}
                    alt={f.fileName}
                    className="h-56 w-full object-contain"
                    loading="lazy"
                  />
                </a>
                <figcaption className="border-t border-slate-200 bg-white px-3 py-2 text-sm font-medium">
                  {f.fileName}
                </figcaption>
              </figure>
            ) : (
              <a
                className="rounded-xl border border-slate-200 p-3 text-cyan-700 hover:underline"
                href={f.url}
                target="_blank"
                rel="noreferrer"
                key={f.id}
              >
                {f.fileName}
              </a>
            ),
          )}
          {files.data?.length === 0 && (
            <p className="text-sm text-slate-500">No images uploaded yet.</p>
          )}
        </div>
      </Card>
      {user?.role === "TECHNICIAN" && <PartUsage repairId={repairId} />}
    </div>
  );
}

async function prepareUploadImage(file: File): Promise<File> {
  const maxBytes = 3.5 * 1024 * 1024;
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 2048 / Math.max(image.width, image.height));
  if (scale === 1 && file.size <= maxBytes) {
    image.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    image.close();
    throw new Error("This browser could not prepare the image");
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.82),
  );
  if (!blob || blob.size > maxBytes)
    throw new Error("Please choose a smaller image");
  const name = file.name.replace(/\.[^.]+$/, "") || "repair-photo";
  return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
}
function PartUsage({ repairId }: { repairId: string }) {
  const parts = useApiQuery(async () => {
    const { data } =
      await api.get<ApiResponse<{ parts: SparePart[] }>>("/inventory");
    return data.data.parts;
  }, []);
  const requests = useApiQuery(async () => {
    const { data } =
      await api.get<ApiResponse<{ requests: PartRequest[] }>>("/part-requests");
    return data.data.requests.filter(
      (request) => request.repairJobId === repairId,
    );
  }, [repairId]);
  const [part, setPart] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [requestPart, setRequestPart] = useState("");
  const [customPartName, setCustomPartName] = useState("");
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestNote, setRequestNote] = useState("");
  async function use() {
    try {
      await api.post(`/repairs/${repairId}/parts`, {
        sparePartId: part,
        quantity,
      });
      toast.success("Part usage recorded");
      await parts.reload();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }
  async function requestPartFromAdmin(event: FormEvent) {
    event.preventDefault();
    try {
      await api.post(`/repairs/${repairId}/part-requests`, {
        sparePartId: requestPart || null,
        partName: requestPart ? undefined : customPartName,
        quantity: requestQuantity,
        note: requestNote || null,
      });
      setRequestPart("");
      setCustomPartName("");
      setRequestQuantity(1);
      setRequestNote("");
      toast.success("Spare-part request sent to admin");
      await requests.reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }
  return (
    <Card>
      <h2 className="font-semibold">Use spare part</h2>
      <div className="mt-4 flex gap-2">
        <select
          className={inputClass}
          value={part}
          onChange={(e) => setPart(e.target.value)}
        >
          <option value="">Select part</option>
          {parts.data?.map((p) => (
            <option value={p.id} key={p.id}>
              {p.name} ({p.quantity})
            </option>
          ))}
        </select>
        <input
          className={`${inputClass} w-24`}
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
        <button
          disabled={!part}
          className={buttonClass}
          onClick={() => void use()}
        >
          Use
        </button>
      </div>
      <div className="mt-6 border-t border-slate-200 pt-5">
        <h3 className="font-semibold">Request a needed part</h3>
        <p className="mt-1 text-sm text-slate-500">
          The admin receives a notification and can replenish inventory.
        </p>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={requestPartFromAdmin}
        >
          <select
            className={inputClass}
            value={requestPart}
            onChange={(e) => setRequestPart(e.target.value)}
          >
            <option value="">Part is not listed</option>
            {parts.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.quantity} available
              </option>
            ))}
          </select>
          {!requestPart && (
            <input
              required
              className={inputClass}
              placeholder="Required part name"
              value={customPartName}
              onChange={(e) => setCustomPartName(e.target.value)}
            />
          )}
          <input
            required
            type="number"
            min="1"
            className={inputClass}
            value={requestQuantity}
            onChange={(e) => setRequestQuantity(Number(e.target.value))}
          />
          <input
            className={inputClass}
            placeholder="Reason or specification"
            value={requestNote}
            onChange={(e) => setRequestNote(e.target.value)}
          />
          <button className={buttonClass}>Send request to admin</button>
        </form>
        {requests.data && requests.data.length > 0 && (
          <div className="mt-4 space-y-2">
            {requests.data.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm"
              >
                <span>
                  {request.quantity} × {request.partName}
                </span>
                <span className="font-semibold">{request.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
