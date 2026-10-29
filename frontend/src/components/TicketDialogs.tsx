import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Clock3, Loader2, MessageSquare, Plus, ShieldCheck } from "lucide-react";
import { api, type Category, type Comment, type NewTicket, type Priority, type Status, type Ticket, type User, type TicketEvent } from "../api";
import { statuses, priorities, categories, staff, initials, id, time } from "../utils";
import { Badge, Dialog } from "../components/ui";
export function NewTicketDialog({
  onClose,
  onSave
}: {
  onClose: () => void;
  onSave: (d: NewTicket) => Promise<void>;
}) {
  const [d, setD] = useState<NewTicket>({
      title: '',
      description: '',
      category: 'Hardware',
      priority: 'Medium'
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave(d);
      onClose();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return <Dialog title="Letâ€™s get this sorted." onClose={onClose}>
    <p className="muted">A few details now help us find the right fix faster.</p>
    <form onSubmit={submit} className="ticket-form">
      <label>What do you need help with?<input autoFocus required minLength={5} maxLength={150} value={d.title} onChange={e => setD({
          ...d,
          title: e.target.value
        })} placeholder="e.g. Unable to connect to the office Wi-Fi" /></label>
      <label>Tell us whatâ€™s happening<textarea required minLength={10} maxLength={5000} rows={5} value={d.description} onChange={e => setD({
          ...d,
          description: e.target.value
        })} placeholder="What happened? Who is affected? What have you already tried?" /><small>Keep passwords and private credentials out of your ticket.</small></label>
      <div className="form-grid">
        <label>Category<select value={d.category} onChange={e => setD({
            ...d,
            category: e.target.value as Category
          })}>
            {categories.map(c => <option key={c}>
              {c}
            </option>)}
          </select></label>
        <label>Priority<select value={d.priority} onChange={e => setD({
            ...d,
            priority: e.target.value as Priority
          })}>
            {priorities.map(p => <option key={p}>
              {p}
            </option>)}
          </select></label>
      </div>
      <div className="info">
        <ShieldCheck size={16} />
        <span>Critical: severe, widespread disruption. High: work is blocked. Medium: normal support. Low: a minor issue or request.</span>
      </div>
      {error && <div role="alert" className="error">
        {error}
      </div>}
      <div className="dialog-actions">
        <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={busy}>
          {busy ? <Loader2 className="spin" size={16} /> : <Plus size={16} />}
          {busy ? 'Creatingâ€¦' : 'Create ticket'}
        </button>
      </div>
    </form>
  </Dialog>;
}
export function Detail({
  ticket,
  user,
  users,
  onClose,
  onUpdate
}: {
  ticket: Ticket;
  user: User;
  users: User[];
  onClose: () => void;
  onUpdate: (id: number, d: Partial<Pick<Ticket, 'status' | 'priority' | 'assigned_to'>>) => Promise<void>;
}) {
  const [comments, setComments] = useState<Comment[]>([]),
    [events, setEvents] = useState<TicketEvent[]>([]),
    [body, setBody] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [tab, setTab] = useState('discussion');
  const load = useCallback(async () => {
    const [c, e] = await Promise.all([api.comments(ticket.id), api.events(ticket.id)]);
    setComments(c);
    setEvents(e);
  }, [ticket.id]);
  useEffect(() => {
    load().catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [load]);
  async function update(d: Partial<Pick<Ticket, 'status' | 'priority' | 'assigned_to'>>) {
    setBusy(true);
    setError('');
    try {
      await onUpdate(ticket.id, d);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function comment(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.addComment(ticket.id, body);
      setBody('');
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return <Dialog title={id(ticket.id)} onClose={onClose} wide>
    <div className="detail-title">
      <Badge value={ticket.status} />
      <Badge value={ticket.priority} />
      <h2>
        {ticket.title}
      </h2>
      <p>Reported by <strong>
          {ticket.creator_name}
        </strong> Â· {time(ticket.created_at)} Â· {ticket.category}</p>
    </div>
    <div className="detail-grid">
      <div>
        <h4 className="mini-label">THE REQUEST</h4>
        <p className="description">
          {ticket.description}
        </p>
        <div className="detail-tabs">
          <button className={tab === 'discussion' ? 'selected' : ''} onClick={() => setTab('discussion')}><MessageSquare size={15} /> Discussion <span>
              {comments.length}
            </span></button>
          <button className={tab === 'history' ? 'selected' : ''} onClick={() => setTab('history')}><Clock3 size={15} /> History</button>
        </div>
        {loading ? <p className="muted">Loading conversationâ€¦</p> : tab === 'discussion' ? <>
          <div className="comments">
            {comments.length ? comments.map(c => <article key={c.id}>
              <span className="avatar">
                {initials(c.author_name)}
              </span>
              <div>
                <strong>
                  {c.author_name}
                </strong>
                <small>
                  {time(c.created_at)}
                </small>
                <p>
                  {c.body}
                </p>
              </div>
            </article>) : <p className="discussion-empty">Every fix starts with a conversation. Add the first update.</p>}
          </div>
          <form onSubmit={comment}>
            <label>
              <span className="sr-only">Your comment</span>
              <textarea required minLength={1} maxLength={2000} rows={3} value={body} onChange={e => setBody(e.target.value)} placeholder="Share an update or ask a questionâ€¦" />
            </label>
            <button className="btn primary" disabled={busy || !body.trim()}>
              <MessageSquare size={15} />
              {busy ? 'Savingâ€¦' : 'Post update'}
            </button>
          </form>
        </> : <ol className="timeline">
          {events.map(e => <li key={e.id}>
            <span />
            <div>
              <strong>
                {e.actor_name}
              </strong>
              <p>
                {e.description}
              </p>
              <small>
                {time(e.created_at)}
              </small>
            </div>
          </li>)}
        </ol>}
      </div>
      <aside className="ticket-properties">
        <h4 className="mini-label">TICKET DETAILS</h4>
        {staff(user) ? <>
          <label>Status<select disabled={busy} value={ticket.status} onChange={e => void update({
              status: e.target.value as Status
            })}>
              {statuses.map(s => <option key={s}>
                {s}
              </option>)}
            </select></label>
          <label>Priority<select disabled={busy} value={ticket.priority} onChange={e => void update({
              priority: e.target.value as Priority
            })}>
              {priorities.map(p => <option key={p}>
                {p}
              </option>)}
            </select></label>
          <label>Assigned to<select disabled={busy} value={ticket.assigned_to ?? ''} onChange={e => void update({
              assigned_to: e.target.value ? Number(e.target.value) : null
            })}>
              <option value="">Unassigned</option>
              {users.filter(staff).map(u => <option value={u.id} key={u.id}>
                {u.name}
              </option>)}
            </select></label>
        </> : <dl>
          <dt>Assigned to</dt>
          <dd>
            {ticket.assignee_name || 'Unassigned'}
          </dd>
          <dt>Status</dt>
          <dd>
            {ticket.status}
          </dd>
          <dt>Priority</dt>
          <dd>
            {ticket.priority}
          </dd>
        </dl>}
        <div className="detail-note">
          <ShieldCheck size={18} />
          <p>
            {staff(user) ? 'Changes are saved immediately and recorded in ticket history.' : 'Your support team manages status, priority, and assignment. Add an update to keep them informed.'}
          </p>
        </div>
      </aside>
    </div>
    {error && <div role="alert" className="error">
      {error}
    </div>}
  </Dialog>;
}
