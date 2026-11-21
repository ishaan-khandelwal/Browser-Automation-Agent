'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Bot, Check, CircleHelp, Globe2, ShieldCheck } from 'lucide-react';

const EXAMPLES = [
  'Compare prices for noise-cancelling headphones',
  'Find three hotels near the city centre for next weekend',
  'Search for software internships and summarize the best matches',
];

export default function HeroSection({ onLaunch }) {
  const [instruction, setInstruction] = useState('');
  const submit = () => {
    const value = instruction.trim();
    if (!value) return;
    onLaunch(value);
    setInstruction('');
  };

  return (
    <section className="workspace-home">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .28 }}>
        <div className="workspace-heading">
          <div>
            <div className="eyebrow">Browser automation</div>
            <h1 className="section-title">What should I take care of?</h1>
            <p>Describe a task. BrowseAI will navigate the web and keep you informed as it works.</p>
          </div>
          <div className="ready-indicator"><span /> Agent ready</div>
        </div>

        <div className="task-composer">
          <label className="eyebrow" htmlFor="task-instruction">Task instruction</label>
          <textarea
            id="task-instruction"
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') submit(); }}
            placeholder="Example: Compare three flights from San Francisco to New York next Friday…"
            rows={4}
            maxLength={2000}
          />
          <div className="composer-footer">
            <span><CircleHelp size={14} /> You can review sensitive actions before they happen.</span>
            <div><span>{instruction.length}/2000</span><button type="button" onClick={submit} disabled={!instruction.trim()}><ArrowUpRight size={16} /> Run task</button></div>
          </div>
        </div>

        <div className="example-block">
          <span className="eyebrow">Try a task</span>
          <div className="example-list">
            {EXAMPLES.map((example) => <button key={example} onClick={() => setInstruction(example)}><span>{example}</span><ArrowUpRight size={14} /></button>)}
          </div>
        </div>

        <div className="workflow-strip" aria-label="How browser automation works">
          <div><span className="workflow-icon"><Bot size={17} /></span><span><strong>Plan and navigate</strong><small>Tasks run in a live browser session</small></span></div>
          <span className="workflow-divider" />
          <div><span className="workflow-icon"><ShieldCheck size={17} /></span><span><strong>Review important steps</strong><small>Approvals and questions come to you</small></span></div>
          <span className="workflow-divider" />
          <div><span className="workflow-icon"><Check size={17} /></span><span><strong>Verify the outcome</strong><small>Review results in your task history</small></span></div>
          <Globe2 className="workflow-watermark" size={70} />
        </div>
      </motion.div>
    </section>
  );
}
