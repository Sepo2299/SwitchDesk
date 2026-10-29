import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, Check, ChevronRight, Command, LayoutDashboard, LayoutGrid, Loader2, LogOut, PanelLeftClose, PanelLeftOpen, Search, Settings, ShieldCheck, Ticket as TicketIcon, Users, X, Zap } from "lucide-react";
import { api, clearToken, getToken, type Analytics, type NewTicket, type Ticket, type User } from "./api";
import { staff, active, initials, id } from "./utils";
import { Brand, Badge } from "./components/ui";
import { Auth } from "./pages/Auth";
import { NewTicketDialog, Detail } from "./components/TicketDialogs";
const Overview = lazy(() => import("./pages/Overview").then(module => ({ default: module.Overview })));
const Tickets = lazy(() => import("./pages/Tickets").then(module => ({ default: module.Tickets })));
const Knowledge = lazy(() => import("./pages/Knowledge").then(module => ({ default: module.Knowledge })));
const Insights = lazy(() => import("./pages/Insights").then(module => ({ default: module.Insights })));

type Page = 'overview' | 'tickets' | 'knowledge' | 'insights' | 'team' | 'settings';
const nav: [Page, string, typeof LayoutDashboard][] = [['overview', 'Overview', LayoutDashboard], ['tickets', 'Tickets', TicketIcon], ['knowledge', 'Knowledge base', BookOpen], ['insights', 'Insights', LayoutGrid], ['team', 'Team members', Users]];
export default function App() {
  const [user, setUser] = useState<User | null>(null),
    [boot, setBoot] = useState(true),
    [loading, setLoading] = useState(false),
    [page, setPage] = useState<Page>('overview'),
    [tickets, setTickets] = useState<Ticket[]>([]),
    [analytics, setAnalytics] = useState<Analytics | null>(null),
    [users, setUsers] = useState<User[]>([]),
    [selected, setSelected] = useState<Ticket | null>(null),
    [newOpen, setNewOpen] = useState(false),
    [menu, setMenu] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [query, setQuery] = useState(''),
    [globalQuery, setGlobalQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width:960px)').matches);
  const sidebarToggleRef = useRef<HTMLButtonElement>(null);
  const sidebarCloseRef = useRef<HTMLButtonElement>(null);
  const sidebarVisible = isMobile ? menu : !sidebarCollapsed;
  const searchRef = useRef<HTMLInputElement>(null);
  const closeSidebar = useCallback(() => {
    if (isMobile) setMenu(false);
    else setSidebarCollapsed(true);
    requestAnimationFrame(() => sidebarToggleRef.current?.focus());
  }, [isMobile]);
  useEffect(() => {
    const viewport = window.matchMedia('(max-width:960px)');
    const resize = () => {
      setIsMobile(viewport.matches);
      setMenu(false);
    };
    viewport.addEventListener('change', resize);
    return () => viewport.removeEventListener('change', resize);
  }, []);
  useEffect(() => {
    if (!isMobile || !menu) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sidebarCloseRef.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSidebar();
    };
    window.addEventListener('keydown', escape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', escape);
    };
  }, [isMobile, menu, closeSidebar]);
  const sessionGeneration = useRef(0);
  const logout = useCallback(() => {
    sessionGeneration.current += 1;
    clearToken();
    setUser(null);
    setTickets([]);
    setAnalytics(null);
    setUsers([]);
    setSelected(null);
    setNewOpen(false);
    setMenu(false);
    setPage('overview');
    setError('');
    setQuery('');
    setGlobalQuery('');
    setLoading(false);
  }, []);
  useEffect(() => {
    if (!getToken()) {
      setBoot(false);
      return;
    }
    api.me().then(setUser).catch(() => clearToken()).finally(() => setBoot(false));
  }, []);
  useEffect(() => {
    const expired = () => {
      logout();
      setNotice('Your session ended. Sign in to continue.');
    };
    window.addEventListener('switchdesk:unauthorized', expired);
    return () => window.removeEventListener('switchdesk:unauthorized', expired);
  }, [logout]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const refresh = useCallback(async () => {
    if (!user) return;
    const generation = sessionGeneration.current;
    setLoading(true);
    try {
      const [t, a, u] = await Promise.all([api.tickets(), api.analytics(), staff(user) ? api.users() : Promise.resolve([])]);
      if (generation !== sessionGeneration.current) return;
      setTickets(t);
      setAnalytics(a);
      setUsers(u);
      setError('');
    } catch (e) {
      if (generation === sessionGeneration.current) setError((e as Error).message);
    } finally {
      if (generation === sessionGeneration.current) setLoading(false);
    }
  }, [user]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  const closeNew = useCallback(() => setNewOpen(false), []),
    closeDetail = useCallback(() => setSelected(null), []);
  const go = (p: Page) => {
    setPage(p);
    if (isMobile && menu) closeSidebar();
    else setMenu(false);
  };
  const matches = globalQuery.trim() ? tickets.filter(t => (t.title + id(t.id) + t.description).toLowerCase().includes(globalQuery.toLowerCase())).slice(0, 5) : [];
  async function create(d: NewTicket) {
    const t = await api.createTicket(d);
    setNotice(id(t.id) + ' created. Your request is in good hands.');
    await refresh();
    setPage('tickets');
  }
  async function update(n: number, d: Partial<Pick<Ticket, 'status' | 'priority' | 'assigned_to'>>) {
    const t = await api.updateTicket(n, d);
    setSelected(t);
    setNotice('Ticket updated. History recorded.');
    await refresh();
  }
  if (boot) return <div className="boot">
    <Brand />
    <Loader2 className="spin" />
    <p>Getting your workspace readyâ€¦</p>
  </div>;
  if (!user) return <>
    {notice && <div className="toast" role="status">
      {notice}
    </div>}
    <Auth onLogin={u => {
      setUser(u);
      setError('');
    }} />
  </>;
  const title = nav.find(n => n[0] === page)?.[1] || 'Account settings';
  return <div className={'app-shell' + (!isMobile && sidebarCollapsed ? ' sidebar-collapsed' : '')}>
    <a className="skip-link" href="#main">Skip to content</a>
    {isMobile && menu && <button className="nav-shade" aria-label="Close navigation" onClick={closeSidebar} />}
    <aside id="workspace-sidebar" className={'sidebar ' + (isMobile && menu ? 'open' : '')} aria-label="Workspace navigation" aria-hidden={!sidebarVisible} inert={!sidebarVisible}>
      <div className="sidebar-header">
        <Brand />
        <button ref={sidebarCloseRef} className="icon-btn sidebar-close" onClick={closeSidebar} aria-label="Close sidebar" title="Close sidebar">
          <X size={19} />
        </button>
      </div>
      <div className="workspace-switch">
        <span className="workspace-avatar">S</span>
        <div>
          <strong>Support workspace</strong>
          <small>SwitchDesk Enterprise</small>
        </div>
        <ShieldCheck size={15} />
      </div>
      <span className="nav-label">WORKSPACE</span>
      <nav>
        {nav.filter(([p]) => p !== 'team' || staff(user)).map(([p, label, Icon]) => <button key={p} className={page === p ? 'active' : ''} aria-current={page === p ? 'page' : undefined} onClick={() => go(p)}>
          <Icon size={18} />
          <span>
            {label}
          </span>
          {p === 'tickets' && <b>
            {tickets.filter(active).length}
          </b>}
        </button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-help">
          <span className="small-icon">
            <BookOpen size={18} />
          </span>
          <strong>A good place to start.</strong>
          <p>Quick guides for everyday IT hiccups.</p>
          <button onClick={() => go('knowledge')}>Explore the knowledge base <ArrowUpRight size={14} /></button>
        </div>
        <button className={'settings-link ' + (page === 'settings' ? 'active' : '')} onClick={() => go('settings')}><Settings size={17} /> Account settings</button>
        <div className="sidebar-user">
          <span className="avatar">
            {initials(user.name)}
          </span>
          <div>
            <strong>
              {user.name}
            </strong>
            <small>
              {user.role}
            </small>
          </div>
          <button onClick={logout} aria-label="Sign out" title="Sign out">
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
    <div className="main-shell" inert={isMobile && menu}>
      <header className="topbar">
        <div>
          <button ref={sidebarToggleRef} className="icon-btn sidebar-toggle" aria-label={sidebarVisible ? 'Close sidebar' : 'Open sidebar'} title={sidebarVisible ? 'Close sidebar' : 'Open sidebar'} aria-controls="workspace-sidebar" aria-expanded={sidebarVisible} onClick={() => {
            if (isMobile) setMenu(value => !value);
            else setSidebarCollapsed(value => !value);
          }}>
            {sidebarVisible ? <PanelLeftClose size={21} /> : <PanelLeftOpen size={21} />}
          </button>
          <span className="breadcrumb">Workspace <ChevronRight size={13} /> <strong>
              {title}
            </strong></span>
        </div>
        <div className="topbar-actions">
          <div className="global-search">
            <label>
              <Search size={16} />
              <input ref={searchRef} aria-label="Search workspace" placeholder="Find a ticketâ€¦" value={globalQuery} onChange={e => setGlobalQuery(e.target.value)} onKeyDown={e => {
                if (e.key === 'Escape') setGlobalQuery('');
                if (e.key === 'Enter') {
                  setQuery(globalQuery);
                  setGlobalQuery('');
                  setPage('tickets');
                }
              }} />
              <kbd><Command size={10} /> K</kbd>
            </label>
            {globalQuery && <div className="search-results">
              {matches.length ? matches.map(t => <button key={t.id} onClick={() => {
                setSelected(t);
                setGlobalQuery('');
              }}>
                <span>
                  {id(t.id)}
                </span>
                {t.title}
                <ArrowUpRight size={14} />
              </button>) : <p>No matching tickets</p>}
              <button className="search-all" onClick={() => {
                setQuery(globalQuery);
                setGlobalQuery('');
                setPage('tickets');
              }}>Search all tickets <ArrowRight size={13} /></button>
            </div>}
          </div>
          <span className="topbar-line" />
          <span className="avatar small">
            {initials(user.name)}
          </span>
        </div>
      </header>
      <main id="main" className="content">
        <div className="workspace-meta">
          <span><i /> YOUR SUPPORT WORKSPACE</span>
          <span>
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </span>
        </div>
        {error && <div className="error workspace-error" role="alert">
          {error}
          <button onClick={() => void refresh()}>Try again <ArrowRight size={14} /></button>
        </div>}
        <Suspense fallback={<div className="skeleton" role="status"><Loader2 className="spin"/><p>Opening your workspaceâ€¦</p></div>}>
{loading && !tickets.length ? <div className="skeleton" role="status">
          <Loader2 className="spin" />
          <p>Loading your requestsâ€¦</p>
        </div> : page === 'overview' ? <Overview tickets={tickets} analytics={analytics} user={user} onSelect={setSelected} onNew={() => setNewOpen(true)} onAll={() => go('tickets')} /> : page === 'tickets' ? <Tickets tickets={tickets} onSelect={setSelected} onNew={() => setNewOpen(true)} query={query} setQuery={setQuery} /> : page === 'knowledge' ? <Knowledge onNew={() => setNewOpen(true)} /> : page === 'insights' ? <Insights analytics={analytics} /> : page === 'team' && staff(user) ? <>
          <div className="page-heading">
            <div>
              <span className="eyebrow">THE PEOPLE BEHIND THE SUPPORT</span>
              <h1>Better, together<span>.</span></h1>
              <p>Your workspace directory. {users.length} people making work happen.</p>
            </div>
          </div>
          <div className="team-grid">
            {users.map(u => <article className="panel team-card" key={u.id}>
              <span className="avatar large">
                {initials(u.name)}
              </span>
              <h3>
                {u.name}
              </h3>
              <p>
                {u.email}
              </p>
              <Badge value={u.role} />
              <small>
                {staff(u) ? tickets.filter(t => t.assigned_to === u.id && active(t)).length + ' active assignments' : 'Employee workspace access'}
              </small>
            </article>)}
          </div>
        </> : <>
          <div className="page-heading">
            <div>
              <span className="eyebrow">YOUR PLACE IN THE WORKSPACE</span>
              <h1>Account & access<span>.</span></h1>
              <p>A clear view of your profile and permissions.</p>
            </div>
          </div>
          <section className="panel profile">
            <span className="avatar large">
              {initials(user.name)}
            </span>
            <h2>
              {user.name}
            </h2>
            <Badge value={user.role} />
            <dl>
              <dt>Email address</dt>
              <dd>
                {user.email}
              </dd>
              <dt>Access</dt>
              <dd>
                {staff(user) ? 'All tickets, assignment, ticket updates, and team directory' : 'Create requests, view your tickets, and join their conversations'}
              </dd>
              <dt>Account management</dt>
              <dd>Contact your administrator to change your profile or role.</dd>
            </dl>
            <button className="btn secondary" onClick={logout}><LogOut size={16} /> Sign out</button>
          </section>
        </>}
        </Suspense>
<footer className="main-footer">
          <span><Zap size={12} /> A little less chaos. A lot more clarity.</span>
          <span>SwitchDesk Enterprise <i /> v2.0</span>
        </footer>
      </main>
    </div>
    {notice && <div className="toast" role="status">
      <Check size={17} />
      {notice}
    </div>}
    {newOpen && <NewTicketDialog onClose={closeNew} onSave={create} />}
    {selected && <Detail key={selected.id} ticket={selected} user={user} users={users} onClose={closeDetail} onUpdate={update} />}
  </div>;
}
