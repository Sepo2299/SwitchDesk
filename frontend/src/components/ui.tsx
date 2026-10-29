import { useEffect, useRef, type ReactNode } from "react";
import { ArrowUpRight, CheckCircle2, Ticket as TicketIcon, X, Zap } from "lucide-react";
import { type Ticket } from "../api";
import { initials, id, stamp } from "../utils";
export function Brand() {
  return <div className="brand"><span className="brand-mark">
      <Zap size={21} fill="currentColor" />
    </span>switchdesk<span className="brand-dot">.</span></div>;
}
export function Badge({
  value
}: {
  value: string;
}) {
  return <span className={'badge ' + value.toLowerCase().replaceAll(' ', '-')}>
    <i />
    {value}
  </span>;
}
export function Empty({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return <div className="empty">
    <CheckCircle2 size={28} />
    <h3>
      {title}
    </h3>
    <p>
      {children}
    </p>
  </div>;
}
export function Dialog({
  title,
  children,
  onClose,
  wide = false
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const els = ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,textarea,a[href]');
        if (!els?.length) return;
        const first = els[0],
          last = els[els.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={e => {
    if (e.target === e.currentTarget) onClose();
  }}>
    <div ref={ref} tabIndex={-1} className={'dialog ' + (wide ? 'wide' : '')} role="dialog" aria-modal="true" aria-label={title}>
      <header>
        <div>
          <span className="eyebrow">SWITCHDESK WORKSPACE</span>
          <h2>
            {title}
          </h2>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
          <X size={20} />
        </button>
      </header>
      {children}
    </div>
  </div>;
}
export function TicketTable({
  tickets,
  onSelect
}: {
  tickets: Ticket[];
  onSelect: (t: Ticket) => void;
}) {
  return tickets.length ? <div className="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Ticket / subject</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Assignee</th>
          <th>Created</th>
          <th>
            <span className="sr-only">Open</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {tickets.map(t => <tr key={t.id}>
          <td>
            <button className="ticket-link" onClick={() => onSelect(t)}>
              <span>
                {id(t.id)}
                <em>
                  {t.category}
                </em>
              </span>
              <strong>
                {t.title}
              </strong>
            </button>
          </td>
          <td>
            <Badge value={t.status} />
          </td>
          <td>
            <Badge value={t.priority} />
          </td>
          <td>
            {t.assignee_name ? <span className="person">
              <b className="avatar tiny">
                {initials(t.assignee_name)}
              </b>
              {t.assignee_name}
            </span> : <span className="muted">Unassigned</span>}
          </td>
          <td className="date-cell">
            {stamp(t.created_at)}
          </td>
          <td>
            <button className="icon-btn" aria-label={'Open ' + id(t.id)} onClick={() => onSelect(t)}>
              <ArrowUpRight size={16} />
            </button>
          </td>
        </tr>)}
      </tbody>
    </table>
  </div> : <Empty title="Nothing in this view">Try another search or create your first support request.</Empty>;
}
export function Metric({
  label,
  value,
  note,
  icon: Icon,
  tone
}: {
  label: string;
  value: number | string;
  note: string;
  icon: typeof TicketIcon;
  tone: string;
}) {
  return <article className={'metric ' + tone}>
    <div>
      <span>
        {label}
      </span>
      <Icon size={18} />
    </div>
    <strong>
      {value}
    </strong>
    <small>
      {note}
    </small>
  </article>;
}
