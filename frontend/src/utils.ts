import { type Category, type Priority, type Status, type Ticket, type User } from "./api";
export const statuses: Status[] = ['Open', 'In Progress', 'Resolved', 'Closed'];
export const priorities: Priority[] = ['Low', 'Medium', 'High', 'Critical'];
export const categories: Category[] = ['Hardware', 'Software', 'Network', 'Access', 'Other'];
export const staff = (u: User) => u.role === 'admin' || u.role === 'technician';
export const active = (t: Ticket) => t.status === 'Open' || t.status === 'In Progress';
export const initials = (s: string) => s.split(' ').map(x => x[0]).slice(0, 2).join('');
export const id = (n: number) => 'SD-' + String(n).padStart(4, '0');
export const parseDate = (s: string) => new Date(s.endsWith('Z') || /[+-]\d\d:\d\d$/.test(s) ? s : s + 'Z');
export const stamp = (s: string) => parseDate(s).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'short'
});
export const time = (s: string) => parseDate(s).toLocaleString('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit'
});
