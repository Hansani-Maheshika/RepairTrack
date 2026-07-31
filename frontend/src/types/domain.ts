export type RepairStatus = 'DEVICE_RECEIVED'|'UNDER_INSPECTION'|'WAITING_FOR_CUSTOMER_APPROVAL'|'REPAIR_APPROVED'|'REPAIR_REJECTED'|'WAITING_FOR_SPARE_PARTS'|'REPAIR_IN_PROGRESS'|'TESTING'|'READY_FOR_COLLECTION'|'COMPLETED'|'COLLECTED'|'CANCELLED'
export type RepairPriority = 'LOW'|'NORMAL'|'HIGH'|'URGENT'
export type DeviceType = 'LAPTOP'|'DESKTOP'|'MOBILE_PHONE'|'TABLET'|'PRINTER'|'OTHER'
export interface Pagination { page:number; limit:number; total:number; pages:number }
export interface Customer { id:string; customerCode:string; name:string; phone:string; email?:string|null; address?:string|null; createdAt:string; _count?:{devices:number;repairJobs:number}; devices?:Device[]; repairJobs?:Repair[] }
export interface Device { id:string; deviceCode:string; customerId:string; deviceType:DeviceType; brand:string; model:string; serialNumber?:string|null; colour?:string|null; condition?:string|null; accessories:string[]; customer?:Customer; _count?:{repairJobs:number}; repairJobs?:Repair[] }
export interface StaffSummary { id:string; staffCode:string; fullName:string; email?:string; role?:string; isActive?:boolean }
export interface StatusHistory { id?:string; status:RepairStatus; publicNote?:string|null; internalNote?:string|null; createdAt:string; updatedBy?:StaffSummary }
export interface Repair { id:string; repairNumber:string; customerId:string; deviceId:string; assignedTechnicianId?:string|null; reportedProblem:string; priority:RepairPriority; status:RepairStatus; inspectionFindings?:string|null; internalNotes?:string|null; estimatedCost?:string|null; estimatedCompletionDate?:string|null; receivedAt:string; completedAt?:string|null; collectedAt?:string|null; customer?:Customer; device?:Device; assignedTechnician?:StaffSummary|null; createdBy?:StaffSummary; statusHistory?:StatusHistory[] }
export interface DashboardData { totals:{customers:number;devices:number;repairs:number;repairsReceivedToday:number}; repairsByStatus:{status:RepairStatus;count:number}[]; technicianWorkload:{id:string;staffCode:string;fullName:string;activeRepairs:number}[]; recentRepairs:Repair[] }
export const repairStatuses: RepairStatus[] = ['DEVICE_RECEIVED','UNDER_INSPECTION','WAITING_FOR_CUSTOMER_APPROVAL','REPAIR_APPROVED','REPAIR_REJECTED','WAITING_FOR_SPARE_PARTS','REPAIR_IN_PROGRESS','TESTING','READY_FOR_COLLECTION','COMPLETED','COLLECTED','CANCELLED']
export const deviceTypes: DeviceType[] = ['LAPTOP','DESKTOP','MOBILE_PHONE','TABLET','PRINTER','OTHER']
export const priorities: RepairPriority[] = ['LOW','NORMAL','HIGH','URGENT']
export const label = (value:string) => value.toLowerCase().replaceAll('_',' ').replace(/\b\w/g,(c)=>c.toUpperCase())
