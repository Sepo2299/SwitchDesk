import { useState } from "react";
import { ArrowDownToLine, ArrowUpRight, Filter, LayoutGrid, List, Plus, Search, X } from "lucide-react";
import { type Ticket } from "../api";
import { statuses, priorities, initials, id } from "../utils";
import { Badge, TicketTable } from "../components/ui";
export function exportCSV(tickets: Ticket[]) {
  const rows = [['Ticket', 'Title', 'Category', 'Priority', 'Status', 'Assignee', 'Created'], ...tickets.map(t => [id(t.id), t.title, t.category, t.priority, t.status, t.assignee_name || 'Unassigned', t.created_at])];
  const escape = (v: string) => '"' + (/^[=+@\-\t\r]/.test(v) ? "'" : '') + v.replaceAll('"', '""') + '"';
  const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(r => r.map(escape).join(',')).join('\r\n')], {
    type: 'text/csv;charset=utf-8;'
  }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'switchdesk-tickets.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Tickets({
  tickets,
  onSelect,
  onNew,
  query,
  setQuery
}: {
  tickets: Ticket[];
  onSelect: (t: Ticket) => void;
  onNew: () => void;
  query: string;
  setQuery: (s: string) => void;
}) {
  const [status, setStatus] = useState('All tickets'),
    [priority, setPriority] = useState('All priorities'),
    [board, setBoard] = useState(false);
  const filtered = tickets.filter(t => (t.title + ' ' + t.description + ' ' + id(t.id) + ' ' + t.creator_name + ' ' + (t.assignee_name || '')).toLowerCase().includes(query.toLowerCase()) && (status === 'All tickets' || t.status === status) && (priority === 'All priorities' || t.priority === priority));
  return <>
    <div className="page-heading">
      <div>
        <span className="eyebrow">FROM FIRST REPORT TO FINAL FIX</span>
        <h1>Every request. In the right place<span>.</span></h1>
        <p>A little structure makes a big difference.</p>
      </div>
      <div className="actions">
        <button className="btn secondary" onClick={() => exportCSV(filtered)}><ArrowDownToLine size={16} /> Export</button>
        <button className="btn primary" onClick={onNew}><Plus size={17} /> New ticket</button>
      </div>
    </div>
    <section className="panel ticket-panel">
      <div className="ticket-tabs" role="group" aria-label="Filter by status">
        {['All tickets', ...statuses].map(s => <button key={s} className={status === s ? 'selected' : ''} onClick={() => setStatus(s)}>
          {s}
          <span>
            {s === 'All tickets' ? tickets.length : tickets.filter(t => t.status === s).length}
          </span>
        </button>)}
      </div>
      <div className="toolbar">
        <label className="search">
          <Search size={17} />
          <input aria-label="Search tickets" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search subject, ticket ID, or person…" />
          {query && <button onClick={() => setQuery('')} aria-label="Clear search">
            <X size={14} />
          </button>}
        </label>
        <div>
          <label className="select-label">
            <Filter size={14} />
            <span className="sr-only">Filter priority</span>
            <select value={priority} onChange={e => setPriority(e.target.value)}>
              <option>All priorities</option>
              {priorities.map(p => <option key={p}>
                {p}
              </option>)}
            </select>
          </label>
          <div className="view-toggle">
            <button aria-label="List view" aria-pressed={!board} className={!board ? 'selected' : ''} onClick={() => setBoard(false)}>
              <List size={16} />
            </button>
            <button aria-label="Board view" aria-pressed={board} className={board ? 'selected' : ''} onClick={() => setBoard(true)}>
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>
      {board ? <div className="board">
        {statuses.map(s => <section key={s}>
          <h3>
            <Badge value={s} />
            <span>
              {filtered.filter(t => t.status === s).length}
            </span>
          </h3>
          {filtered.filter(t => t.status === s).map(t => <button className="board-card" key={t.id} onClick={() => onSelect(t)}>
            <span className="mini-label">
              {id(t.id)}
              <ArrowUpRight size={14} />
            </span>
            <h4>
              {t.title}
            </h4>
            <span className="board-category">
              {t.category}
            </span>
            <footer>
              <Badge value={t.priority} />
              <span className="avatar tiny" title={t.assignee_name || 'Unassigned'}>
                {t.assignee_name ? initials(t.assignee_name) : '—'}
              </span>
            </footer>
          </button>)}
          {!filtered.some(t => t.status === s) && <p className="board-empty">No tickets here</p>}
        </section>)}
      </div> : <TicketTable tickets={filtered} onSelect={onSelect} />}
      <div className="table-footer">Showing {filtered.length} of {tickets.length} requests <span>Newest first · Export follows your filters</span></div>
    </section>
  </>;
}
