import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { LockKeyhole, Wrench } from "lucide-react";
import { api, getApiErrorMessage } from "../../lib/api";
import { useAuth } from "../../context/authContextValue";
import { buttonClass, inputClass } from "../../components/ui";

export function ChangeInitialPasswordPage() {
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setBusy(true);
    try {
      await api.patch("/auth/password", { currentPassword, newPassword });
      await logout();
      toast.success("Password changed. Sign in with your new password.");
      window.location.assign("/login");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="flex items-center gap-3 text-xl font-bold">
          <span className="rounded-xl bg-cyan-400 p-2 text-slate-950">
            <Wrench size={20} />
          </span>
          RepairTrack
        </div>
        <LockKeyhole className="mt-8 text-cyan-600" size={34} />
        <h1 className="mt-4 text-3xl font-bold">Create your password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Change the temporary password before accessing the staff system.
        </p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <input
            required
            minLength={8}
            type="password"
            autoComplete="current-password"
            className={inputClass}
            placeholder="Temporary password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <input
            required
            minLength={8}
            type="password"
            autoComplete="new-password"
            className={inputClass}
            placeholder="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <input
            required
            minLength={8}
            type="password"
            autoComplete="new-password"
            className={inputClass}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          <button className={`${buttonClass} w-full`} disabled={busy}>
            {busy ? "Changing password…" : "Change password"}
          </button>
        </form>
      </section>
    </main>
  );
}
