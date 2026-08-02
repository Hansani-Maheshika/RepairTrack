import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { ChangeInitialPasswordPage } from "./pages/auth/ChangeInitialPasswordPage";
import {
  CustomerDetailsPage,
  CustomersPage,
  EditCustomerPage,
  NewCustomerPage,
} from "./pages/customers/CustomerPages";
import { AdminDashboard } from "./pages/dashboard/AdminDashboard";
import { RoleDashboard } from "./pages/dashboard/RoleDashboard";
import {
  DeviceDetailsPage,
  DevicesPage,
  EditDevicePage,
  NewDevicePage,
} from "./pages/devices/DevicePages";
import { HomePage } from "./pages/public/HomePage";
import { TrackRepairPage } from "./pages/public/TrackRepairPage";
import {
  NewRepairPage,
  RepairDetailsPage,
  RepairsPage,
} from "./pages/repairs/RepairPages";
import { MessagePage } from "./pages/shared/MessagePage";
import { StaffPage } from "./pages/staff/StaffPages";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { InventoryPage, InvoicesPage } from "./pages/business/BusinessPages";
import {
  PublicInvoicePage,
  PublicQuotationPage,
} from "./pages/public/CustomerBusinessPages";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/track" element={<TrackRepairPage />} />
      <Route path="/quotation/:token" element={<PublicQuotationPage />} />
      <Route path="/invoice/:token" element={<PublicInvoicePage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangeInitialPasswordPage />} />
      </Route>
      <Route
        path="/unauthorized"
        element={
          <MessagePage
            title="Access denied"
            message="Your account is not allowed to open that page."
          />
        }
      />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/staff" element={<StaffPage />} />
          </Route>
          <Route
            element={
              <ProtectedRoute roles={["ADMIN", "RECEPTIONIST", "TECHNICIAN"]} />
            }
          >
            <Route path="/inventory" element={<InventoryPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={["ADMIN", "RECEPTIONIST"]} />}>
            <Route path="/invoices" element={<InvoicesPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={["RECEPTIONIST"]} />}>
            <Route path="/receptionist/dashboard" element={<RoleDashboard />} />
          </Route>
          <Route element={<ProtectedRoute roles={["TECHNICIAN"]} />}>
            <Route path="/technician/dashboard" element={<RoleDashboard />} />
          </Route>
          <Route element={<ProtectedRoute roles={["ADMIN", "RECEPTIONIST"]} />}>
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:id" element={<CustomerDetailsPage />} />
            <Route path="/devices" element={<DevicesPage />} />
            <Route path="/devices/:id" element={<DeviceDetailsPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={["RECEPTIONIST"]} />}>
            <Route path="/customers/new" element={<NewCustomerPage />} />
            <Route path="/customers/:id/edit" element={<EditCustomerPage />} />
            <Route path="/devices/new" element={<NewDevicePage />} />
            <Route path="/devices/:id/edit" element={<EditDevicePage />} />
            <Route path="/repairs/new" element={<NewRepairPage />} />
          </Route>
          <Route path="/repairs" element={<RepairsPage />} />
          <Route path="/repairs/:id" element={<RepairDetailsPage />} />
        </Route>
      </Route>
      <Route path="/dashboard" element={<Navigate to="/login" replace />} />
      <Route
        path="*"
        element={
          <MessagePage
            title="Page not found"
            message="The requested page does not exist."
          />
        }
      />
    </Routes>
  );
}
