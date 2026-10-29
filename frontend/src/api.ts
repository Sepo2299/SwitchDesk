/** One place for all communication with the FastAPI backend. */
export type Role = 'employee' | 'technician' | 'admin';
export type Status = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type Category = 'Hardware' | 'Software' | 'Network' | 'Access' | 'Other';
export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}
export interface Ticket {
  id: number;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  created_at: string;
  updated_at: string;
  created_by: number;
  creator_name: string;
  assigned_to: number | null;
  assignee_name: string | null;
}
export interface Comment {
  id: number;
  body: string;
  author_name: string;
  created_at: string;
}
export interface Analytics {
  total: number;
  statuses: Record<Status, number>;
  priorities: Record<Priority, number>;
  categories: Record<Category, number>;
  resolution_rate: number;
  unassigned: number;
  activity: {
    date: string;
    day: string;
    created: number;
    resolved: number;
  }[];
}
export interface TicketEvent {
  id: number;
  actor_name: string;
  description: string;
  created_at: string;
}
export type NewTicket = Pick<Ticket, 'title' | 'description' | 'category' | 'priority'>;
// Vite forwards local /api requests to FastAPI, keeping browser requests on
// the same origin whether the site is opened via localhost or 127.0.0.1.
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const getToken = () => sessionStorage.getItem('switchdesk_token');
export const setToken = (token: string) => sessionStorage.setItem('switchdesk_token', token);
export const clearToken = () => sessionStorage.removeItem('switchdesk_token');
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? {
          Authorization: `Bearer ${getToken()}`
        } : {}),
        ...options.headers
      }
    });
  } catch {
    throw new Error('Cannot reach the support server. Check your connection and that the backend is running.');
  }
  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/login' && path !== '/auth/register') window.dispatchEvent(new Event('switchdesk:unauthorized'));
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      message = typeof data.detail === 'string' ? data.detail : Array.isArray(data.detail) ? data.detail.map((e: {
        loc?: string[];
        msg: string;
      }) => (e.loc || []).slice(1).join('.') + ': ' + e.msg).join('; ') : message;
    } catch {/* non-JSON error */}
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}
export const api = {
  login: (email: string, password: string) => request<{
    access_token: string;
    user: User;
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password
    })
  }),
  register: (name: string, email: string, password: string) => request<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      password
    })
  }),
  me: () => request<User>('/me'),
  tickets: () => request<Ticket[]>('/tickets'),
  createTicket: (ticket: NewTicket) => request<Ticket>('/tickets', {
    method: 'POST',
    body: JSON.stringify(ticket)
  }),
  updateTicket: (id: number, changes: Partial<Pick<Ticket, 'status' | 'priority' | 'assigned_to'>>) => request<Ticket>(`/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes)
  }),
  events: (id: number) => request<TicketEvent[]>('/tickets/' + id + '/events'),
  comments: (id: number) => request<Comment[]>(`/tickets/${id}/comments`),
  addComment: (id: number, body: string) => request<Comment>(`/tickets/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({
      body
    })
  }),
  users: () => request<User[]>('/users'),
  analytics: () => request<Analytics>('/analytics')
};
