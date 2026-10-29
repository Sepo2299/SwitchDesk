import { useState, type FormEvent } from "react";
import { ArrowRight, ArrowUpRight, CheckCircle2, ChevronRight, Loader2, MessageSquare, ShieldCheck, Ticket as TicketIcon, Users } from "lucide-react";
import { api, setToken, type User } from "../api";
import { Brand } from "../components/ui";
export function Auth({
  onLogin
}: {
  onLogin: (u: User) => void;
}) {
  const [register, setRegister] = useState(false),
    [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (register) await api.register(name, email, password);
      const r = await api.login(email, password);
      setToken(r.access_token);
      onLogin(r.user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return <div className="auth">
    <section className="auth-story">
      <Brand />
      <div className="auth-copy">
        <span className="eyebrow">A LITTLE LESS CHAOS. A LOT MORE CLARITY.</span>
        <h1>Great support.<br />Better workdays<span>.</span></h1>
        <p>One calm place for every request, every conversation, and every resolution.</p>
        <div className="auth-ticket">
          <div>
            <span className="mini-label">FROM REQUEST TO RESOLUTION</span>
            <span className="signal"><i /> Connected</span>
          </div>
          <h3>The right help. Right on time.</h3>
          <div className="flow">
            <span><TicketIcon size={17} /> Report</span>
            <ChevronRight size={16} />
            <span><Users size={17} /> Assign</span>
            <ChevronRight size={16} />
            <span><CheckCircle2 size={17} /> Resolve</span>
          </div>
        </div>
        <div className="auth-proof">
          <span><ShieldCheck size={17} /> Role-based access</span>
          <span><MessageSquare size={17} /> Every conversation, together</span>
        </div>
      </div>
      <footer>BUILT FOR PEOPLE WHO KEEP THINGS RUNNING <span>SWITCHDESK / 2026</span></footer>
    </section>
    <section className="auth-form">
      <span className="edition">SERVICE DESK, THOUGHTFULLY BUILT</span>
      <div>
        <span className="eyebrow">YOUR WORKSPACE AWAITS</span>
        <h2>
          {register ? 'Make work flow.' : 'Welcome back.'}
        </h2>
        <p>
          {register ? 'Create your employee account to get support.' : 'Sign in and pick up where you left off.'}
        </p>
        <form onSubmit={submit}>
          {register && <label>Full name<input autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" /></label>}
          <label>Email address<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" /></label>
          <label>Password<input type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 8 : undefined} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} placeholder={register ? 'At least 8 characters' : 'Enter your password'} /></label>
          {error && <div role="alert" className="error">
            {error}
          </div>}
          <button className="btn primary full" disabled={busy}>
            {busy && <Loader2 className="spin" size={17} />}
            {busy ? 'Please wait' : register ? 'Create account' : 'Sign in to workspace'}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="auth-toggle">
          {register ? 'Already have an account?' : 'New to SwitchDesk?'}
          <button onClick={() => {
            setRegister(!register);
            setError('');
            setPassword('');
          }}>
            {register ? 'Sign in' : 'Create an account'}
          </button>
        </p>
        <details className="demo">
          <summary>Exploring the local demo?</summary>
          <p>Seed the local database first. Choose a role to fill its demo credentials.</p>
          <div>
            {['admin', 'tech', 'employee'].map((r, i) => <button key={r} onClick={() => {
              setRegister(false);
              setEmail(r + '@switchdesk.local');
              setPassword(['Admin123!', 'Tech12345!', 'Employee123!'][i]);
              setError('');
            }}>
              {['Administrator', 'Technician', 'Employee'][i]}
              <ArrowUpRight size={13} />
            </button>)}
          </div>
        </details>
      </div>
      <footer><ShieldCheck size={14} /> Your access follows your role. Your work stays organized.</footer>
    </section>
  </div>;
}
