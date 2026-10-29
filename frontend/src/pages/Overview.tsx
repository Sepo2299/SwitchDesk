import { ActivityChart } from "../components/ActivityChart";
import { ArrowRight, ArrowUpRight, CheckCircle2, Clock3, Headphones, Plus, Ticket as TicketIcon, Zap } from "lucide-react";
import { type Analytics, type Status, type Ticket, type User } from "../api";
import { priorities, active, id } from "../utils";
import { Badge, Empty, TicketTable, Metric } from "../components/ui";
export function Overview({
  tickets,
  analytics,
  user,
  onSelect,
  onNew,
  onAll
}: {
  tickets: Ticket[];
  analytics: Analytics | null;
  user: User;
  onSelect: (t: Ticket) => void;
  onNew: () => void;
  onAll: () => void;
}) {
  const queue = [...tickets].filter(active).sort((a, b) => priorities.indexOf(b.priority) - priorities.indexOf(a.priority) || a.id - b.id).slice(0, 3);
  const count = (s: Status) => analytics?.statuses[s] ?? 0;
  return <>
    <div className="page-heading">
      <div>
        <span className="eyebrow">THE BIG PICTURE</span>
        <h1>Good things start with support<span>.</span></h1>
        <p>Welcome back, {user.name.split(' ')[0]}. Hereâ€™s your workspace at a glance.</p>
      </div>
      <button className="btn primary" onClick={onNew}><Plus size={17} /> New ticket</button>
    </div>
    <div className="workspace-banner">
      <span className="banner-icon">
        <Headphones size={22} />
      </span>
      <div>
        <strong>A clearer queue. A calmer day.</strong>
        <p>
          {queue.length ? tickets.filter(active).length + ' active requests need attention. Letâ€™s keep things moving.' : 'Your queue is clear. Youâ€™re ready for whatever comes next.'}
        </p>
      </div>
      <button onClick={onAll}>View queue <ArrowRight size={16} /></button>
    </div>
    <div className="metrics">
      <Metric label="Total requests" value={analytics?.total ?? 0} note="Across your visible workspace" icon={TicketIcon} tone="neutral" />
      <Metric label="Open tickets" value={count('Open')} note="Ready for a helping hand" icon={Clock3} tone="amber" />
      <Metric label="In progress" value={count('In Progress')} note="Good work is happening" icon={Zap} tone="blue" />
      <Metric label="Resolved & closed" value={count('Resolved') + count('Closed')} note={(analytics?.resolution_rate ?? 0) + '% of all requests'} icon={CheckCircle2} tone="green" />
    </div>
    <div className="overview-grid">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Support in motion</h3>
            <p>Requests created and resolved, from stored activity</p>
          </div>
          <span className="period">Last 7 days</span>
        </div>
        <div className="chart-key">
          <span><i /> Created</span>
          <span><i /> Resolved</span>
          <small>UTC</small>
        </div>
        <ActivityChart analytics={analytics} />
      </section>
      <section className="panel priority-panel">
        <div className="panel-heading">
          <div>
            <h3>Up next</h3>
            <p>Your highest-priority active requests</p>
          </div>
          <span className="small-icon">
            <Zap size={16} />
          </span>
        </div>
        <div className="priority-list">
          {queue.length ? queue.map((t, i) => <button key={t.id} onClick={() => onSelect(t)}>
            <span className="queue-num">0{i + 1}</span>
            <div>
              <span className="mini-label">
                {id(t.id)}
                <Badge value={t.priority} />
              </span>
              <strong>
                {t.title}
              </strong>
              <small>
                {t.assignee_name || 'Waiting for an assignee'}
              </small>
            </div>
            <ArrowUpRight size={16} />
          </button>) : <Empty title="All caught up">No active requests need attention.</Empty>}
        </div>
        <button className="panel-footer" onClick={onAll}>Go to all tickets <ArrowRight size={15} /></button>
      </section>
    </div>
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h3>Latest requests <span className="count">
              {tickets.length}
            </span></h3>
          <p>The latest conversations in your workspace</p>
        </div>
        <button className="text-btn" onClick={onAll}>View all tickets <ArrowRight size={15} /></button>
      </div>
      <TicketTable tickets={tickets.slice(0, 5)} onSelect={onSelect} />
    </section>
  </>;
}
