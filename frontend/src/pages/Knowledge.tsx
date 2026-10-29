import { useCallback, useState } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, Search } from "lucide-react";
import { Empty, Dialog } from "../components/ui";
export const articles = [{
  category: 'Network',
  title: 'Get back online, faster',
  summary: 'A practical checklist for Wi-Fi and connectivity issues.',
  steps: ['Check whether other devices can connect to the same network.', 'Turn Wi-Fi off and on, then reconnect to your office network.', 'Restart your device. Avoid resetting shared office networking equipment.', 'Create a Network ticket with the error message and affected location if the issue persists.']
}, {
  category: 'Access',
  title: 'Request the access you need',
  summary: 'Make permission requests clear, specific, and easy to approve.',
  steps: ['Identify the exact system, shared folder, or resource you need.', 'Describe the business reason and level of access required.', 'Include your department and relevant manager’s name.', 'Create an Access ticket. Never include passwords or authentication codes.']
}, {
  category: 'Software',
  title: 'When an application stops working',
  summary: 'Capture the details that help your technician find the fix.',
  steps: ['Save your work if possible, then close and reopen the application.', 'Record the application name, version, and exact error message.', 'Check whether the issue affects one file or the whole application.', 'Create a Software ticket describing what happened and what you already tried.']
}, {
  category: 'Hardware',
  title: 'A printer that won’t cooperate',
  summary: 'Simple checks before raising a hardware request.',
  steps: ['Check that the printer is powered on and connected.', 'Confirm that the correct printer is selected and check the print queue.', 'Look for paper or toner warnings. Follow the manufacturer’s safe handling guidance.', 'Create a Hardware ticket with the printer location and displayed error.']
}, {
  category: 'Other',
  title: 'Write a ticket that gets results',
  summary: 'A good report is the first step toward a quick resolution.',
  steps: ['Use a short, specific title: “Outlook won’t sync new messages” beats “Help”.', 'Explain the impact: who is affected and what work is blocked.', 'Include when it started, any error text, and steps you already tried.', 'Choose a priority that reflects the impact. Critical is for severe, widespread disruption.']
}, {
  category: 'Access',
  title: 'Keep your account in safe hands',
  summary: 'Small habits that protect your workspace and your team.',
  steps: ['Use a unique password and never share it in a support ticket.', 'Sign out on shared devices and lock your screen when away.', 'Never share one-time codes or approve unexpected sign-in prompts.', 'Report suspicious activity through an Access ticket without copying sensitive credentials.']
}];
export function Knowledge({
  onNew
}: {
  onNew: () => void;
}) {
  const [q, setQ] = useState(''),
    [article, setArticle] = useState<typeof articles[number] | null>(null);
  const close = useCallback(() => setArticle(null), []);
  const found = articles.filter(a => (a.title + a.summary + a.category).toLowerCase().includes(q.toLowerCase()));
  return <>
    <div className="page-heading">
      <div>
        <span className="eyebrow">A LITTLE KNOW-HOW GOES A LONG WAY</span>
        <h1>Help yourself. Help your day<span>.</span></h1>
        <p>Practical answers to everyday IT questions.</p>
      </div>
      <button className="btn secondary" onClick={onNew}>Still need help? <ArrowRight size={16} /></button>
    </div>
    <div className="knowledge-hero">
      <BookOpen size={28} />
      <h2>The first place to find your fix.</h2>
      <p>Start with a quick guide. We’re here if you need more.</p>
      <label className="search">
        <Search size={18} />
        <input aria-label="Search help articles" value={q} onChange={e => setQ(e.target.value)} placeholder="Search Wi-Fi, access, software…" />
      </label>
    </div>
    <div className="article-grid">
      {found.map(a => <button className="article-card" key={a.title} onClick={() => setArticle(a)}>
        <span className="article-category">
          {a.category}
          <ArrowUpRight size={17} />
        </span>
        <h3>
          {a.title}
        </h3>
        <p>
          {a.summary}
        </p>
        <span className="read-guide">Read guide <ArrowRight size={15} /></span>
      </button>)}
    </div>
    {!found.length && <Empty title="No matching guides">Try a broader search, or create a ticket for personal support.</Empty>}
    {article && <Dialog title={article.title} onClose={close}>
      <p className="muted">
        {article.summary}
      </p>
      <ol className="guide-steps">
        {article.steps.map(s => <li key={s}>
          {s}
        </li>)}
      </ol>
      <button className="btn primary" onClick={() => {
        setArticle(null);
        onNew();
      }}>Create a support ticket <ArrowRight size={16} /></button>
    </Dialog>}
  </>;
}
