import { ActivityChart } from "../components/ActivityChart";
import { CheckCircle2, Ticket as TicketIcon, Users } from "lucide-react";
import { type Analytics } from "../api";
import { Metric } from "../components/ui";
export function Insights({
  analytics
}: {
  analytics: Analytics | null;
}) {
  return <>
    <div className="page-heading">
      <div>
        <span className="eyebrow">CLARITY YOU CAN ACT ON</span>
        <h1>See the work behind the numbers<span>.</span></h1>
        <p>Calculated from the requests you have permission to see.</p>
      </div>
      <span className="period">All time, unless indicated</span>
    </div>
    <div className="metrics three">
      <Metric label="Total requests" value={analytics?.total ?? 0} note="Stored support tickets" icon={TicketIcon} tone="neutral" />
      <Metric label="Resolution rate" value={(analytics?.resolution_rate ?? 0) + '%'} note="Resolved or closed / all requests" icon={CheckCircle2} tone="green" />
      <Metric label="Unassigned & active" value={analytics?.unassigned ?? 0} note="Ready for an owner" icon={Users} tone="amber" />
    </div>
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h3>Seven days of support</h3>
          <p>Created requests and resolution events by UTC day</p>
        </div>
        <span className="period">Last 7 days</span>
      </div>
      <ActivityChart analytics={analytics} />
    </section>
    <div className="insights-grid">
      {[{
        title: 'Requests by category',
        values: analytics?.categories
      }, {
        title: 'Priority distribution',
        values: analytics?.priorities
      }, {
        title: 'Current status',
        values: analytics?.statuses
      }].map(({
        title,
        values
      }) => <section className="panel" key={title}>
        <div className="panel-heading">
          <h3>
            {title}
          </h3>
        </div>
        <div className="bars">
          {Object.entries(values || {}).map(([name, n]) => <div key={name}>
            <div>
              <span>
                {name}
              </span>
              <strong>
                {n}
              </strong>
            </div>
            <div className="bar">
              <i style={{
                width: (analytics?.total ? Number(n) / analytics.total * 100 : 0) + '%'
              }} />
            </div>
          </div>)}
        </div>
      </section>)}
    </div>
  </>;
}
