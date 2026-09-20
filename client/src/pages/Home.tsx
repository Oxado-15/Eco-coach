import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ClipboardCheck,
  CircleHelp,
  Clock3,
  Gauge,
  Info,
  Leaf,
  Lightbulb,
  LockKeyhole,
  Menu,
  Sparkles,
  X,
  AlertCircle,
  Footprints
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type AiAssessment = {
  carbon_kg_weekly: number;
  carbon_kg_annual: number;
  efficiency_score: number;
  recommendation: string;
  analysis: string;
};

const sampleText =
  "I rode my bike to college, used the AC for 6 hours, ate a vegetarian lunch, and threw away half my dinner.";

// Fallback dummy assessment for display purposes while backend is missing
const dummyAssessment: AiAssessment = {
  carbon_kg_weekly: 14.5,
  carbon_kg_annual: 754,
  efficiency_score: 72,
  recommendation: "Try a slightly higher AC set point and switch it off while the room is empty to reduce energy use.",
  analysis: "Your bike commute was a genuinely low-impact choice. Your vegetarian lunch also helps keep emissions down. However, the AC usage over 6 hours and the food waste carry the most impact today.",
};

export default function Home() {
  const [text, setText] = useState(sampleText);
  const [assessment, setAssessment] = useState<AiAssessment | null>(dummyAssessment);
  const [isAssessing, setIsAssessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logs, setLogs] = useState(0);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  const handleAssess = async () => {
    if (!text.trim()) {
      toast.error("Add a few details from your day first.");
      return;
    }
    setIsAssessing(true);
    setShowWhy(false);
    setError(null);
    setAssessment(null);
    
    try {
      const response = await fetch('/api/calculate-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity: text,
          details: {} // AI prompt asks for details, passing empty object as placeholder
        })
      });

      let result;
      try {
        result = await response.json();
      } catch (e) {
        throw new Error("Server returned an invalid response. Is the backend implemented and running?");
      }
      
      if (!response.ok) {
        throw new Error(result?.error || "Failed to calculate impact.");
      }

      setAssessment(result.data);
      setLogs((current) => current + 1);
      
      window.setTimeout(() => document.getElementById("readout")?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      // For demo purposes, since we know backend isn't there, we can optionally load the dummy data so the UI doesn't break totally
      // setAssessment(dummyAssessment);
    } finally {
      setIsAssessing(false);
    }
  };

  const loadExample = (example: string) => {
    setText(example);
    document.getElementById("log")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const copySummary = async () => {
    if (!assessment) return;
    const summary = `Efficiency Score: ${assessment.efficiency_score}/100. ${assessment.analysis} One small step: ${assessment.recommendation}`;
    try {
      await navigator.clipboard.writeText(summary);
      toast.success("Readout copied to your clipboard.");
    } catch {
      toast.message("Your readout is ready to copy from the page.");
    }
  };

  return (
    <div className="ec-page">
      <div className="ec-orb ec-orb-one" />
      <div className="ec-orb ec-orb-two" />
      <header className="ec-header">
        <div className="ec-shell ec-nav-inner">
          <button className="ec-brand" onClick={() => scrollTo("top")} aria-label="EcoCoach home">
            <span className="ec-brand-mark"><Leaf size={17} strokeWidth={2.5} /></span>
            <span>Eco<span>Coach</span></span>
          </button>
          <nav className={`ec-nav-links ${mobileOpen ? "is-open" : ""}`} aria-label="Primary navigation">
            <button onClick={() => scrollTo("log")}>Daily check-in</button>
            <button onClick={() => scrollTo("readout")}>Your readout</button>
            <button onClick={() => scrollTo("how-it-works")}>How it works</button>
          </nav>
          <div className="ec-nav-actions">
            <span className="ec-session-pill"><span className="ec-pulse" /> Session only</span>
            <button className="ec-mobile-toggle" onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle navigation">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Button className="ec-nav-cta" onClick={() => scrollTo("log")}>Start a check-in <ArrowRight size={15} /></Button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="ec-hero ec-shell">
          <div className="ec-hero-copy">
            <div className="ec-eyebrow"><Sparkles size={14} /> A calmer way to take climate action</div>
            <h1>Small signals.<br /><em>Better habits.</em></h1>
            <p className="ec-hero-lede">Describe your day in a sentence. Get one clear, realistic next step — without the guilt, guesswork, or carbon-accounting spreadsheet.</p>
            <div className="ec-hero-actions">
              <Button className="ec-primary-button" onClick={() => scrollTo("log")}>Log today <ArrowRight size={17} /></Button>
              <button className="ec-text-link" onClick={() => scrollTo("how-it-works")}>See how it works <ChevronDown size={16} /></button>
            </div>
            <div className="ec-trust-row"><LockKeyhole size={14} /> No account required <span>·</span> Your notes stay in this session</div>
          </div>
        </section>

        <section className="ec-shell ec-workspace" id="log">
          <div className="ec-section-heading">
            <div><span className="ec-kicker">01 / DAILY CHECK-IN</span><h2>What did today look like?</h2></div>
            <p>Share the parts you remember. A couple of details is plenty.</p>
          </div>
          <div className="ec-main-grid">
            <div className="ec-log-card ec-card">
              <div className="ec-card-topline"><span className="ec-card-index">A</span><span className="ec-card-label">Your daily note</span><span className="ec-char-count">{text.length}/500</span></div>
              <label htmlFor="daily-log" className="sr-only">Describe your day</label>
              <textarea id="daily-log" value={text} maxLength={500} onChange={(event) => setText(event.target.value)} placeholder="e.g. I walked to class, used the fan, ate dal and rice, and separated paper waste." />
              <div className="ec-input-footer"><span><Info size={14} /> Avoid addresses, phone numbers, or other private details.</span><span className="ec-input-status"><span className="ec-status-dot" /> Ready when you are</span></div>
              <div className="ec-example-row"><span className="ec-example-label">Try an example</span><button onClick={() => loadExample("I took the campus shuttle, used the fan, ate dal and rice, and separated paper waste.")}>Shared + low-impact</button><button onClick={() => loadExample("I walked to class, left the lights on, ate chicken, and mixed all my waste together.")}>A mixed day</button></div>
              <Button className="ec-submit-button" onClick={handleAssess} disabled={isAssessing}>{isAssessing ? <><span className="ec-spinner" /> Reading your day…</> : <>Get my readout <ArrowRight size={17} /></>}</Button>
              
              {error && (
                <div className="mt-4 p-4 rounded-md bg-red-50 text-red-700 flex items-start gap-3 text-sm border border-red-100">
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
                  <div>
                    <p className="font-medium text-red-800">API Connection Failed</p>
                    <p className="mt-1">{error}</p>
                    <p className="mt-2 text-xs opacity-80">This is expected if the backend AI integration is not yet implemented.</p>
                  </div>
                </div>
              )}
            </div>

            <aside className="ec-progress-card">
              <div className="ec-progress-top"><span className="ec-kicker">YOUR PRACTICE</span><Gauge size={18} /></div>
              <div className="ec-progress-number">{logs}<span> check-in{logs === 1 ? "" : "s"}</span></div>
              <p>{logs ? "A useful rhythm starts with noticing. Keep it gentle." : "No streak to maintain here. Just a place to begin."}</p>
              <div className="ec-progress-line"><span style={{ width: `${Math.min(100, Math.max(18, logs * 22))}%` }} /></div>
              <div className="ec-progress-foot"><span>Build the habit, not perfection</span><span>{logs}/5</span></div>
              <div className="ec-mini-stats"><div><Clock3 size={15} /><strong>2 min</strong><span>per check-in</span></div><div><Sparkles size={15} /><strong>1 tip</strong><span>to try next</span></div></div>
              <div className="ec-progress-note"><span className="ec-note-icon"><LockKeyhole size={14} /></span><span>Session-only by default. We do not need your identity to help you reflect.</span></div>
            </aside>
          </div>
        </section>

        {assessment && !error && (
          <section className="ec-shell ec-readout-section" id="readout">
            <div className="ec-section-heading readout-heading"><div><span className="ec-kicker">02 / YOUR READOUT</span><h2>A little clarity for tomorrow.</h2></div><div className="ec-readout-actions"><button onClick={copySummary}><ClipboardCheck size={15} /> Copy readout</button><span className="ec-approx-pill"><span /> AI Generated</span></div></div>
            <div className="ec-readout-grid">
              <div className="ec-assessment-card ec-card">
                <div className="ec-assessment-header"><div><span className="ec-card-label">Impact Analysis</span><h3>Your daily eco footprint</h3></div><span className="ec-live-badge"><span /> Calculated</span></div>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-muted/30 p-4 rounded-lg flex flex-col justify-center items-center text-center">
                    <div className="text-3xl font-light tracking-tight text-foreground">{assessment.efficiency_score}<span className="text-sm font-medium text-muted-foreground ml-1">/100</span></div>
                    <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mt-2">Efficiency</div>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg flex flex-col justify-center items-center text-center">
                    <div className="text-3xl font-light tracking-tight text-foreground">{assessment.carbon_kg_weekly}</div>
                    <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mt-2">Weekly kg CO₂</div>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg flex flex-col justify-center items-center text-center">
                    <div className="text-3xl font-light tracking-tight text-foreground">{assessment.carbon_kg_annual}</div>
                    <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mt-2">Annual kg CO₂</div>
                  </div>
                </div>

                <div className="ec-strength"><div className="ec-strength-icon"><Check size={17} /></div><div><span className="ec-overline">AI ANALYSIS</span><p>{assessment.analysis}</p></div></div>
                <button className="ec-why-trigger" onClick={() => setShowWhy((visible) => !visible)} aria-expanded={showWhy}><CircleHelp size={15} /> How does this work? <ChevronDown className={showWhy ? "rotate-180" : ""} size={15} /></button>
                {showWhy && <div className="ec-why-panel"><Info size={16} /><p>This calculation is generated by an AI model evaluating the typical environmental footprint of the activities you described. It provides estimates based on average emissions data rather than precise personal tracking.</p></div>}
              </div>
              <div className="ec-tip-card">
                <div className="ec-tip-spark"><Lightbulb size={21} /></div><span className="ec-kicker">ONE SMALL STEP</span><h3>Recommendation</h3><p>{assessment.recommendation}</p><div className="ec-tip-footer"><span><Check size={14} /> Practical change</span><span>For tomorrow</span></div>
              </div>
            </div>
            <div className="ec-summary-strip"><div className="ec-summary-quote"><span className="ec-quote-mark">“</span><p>Small sustainable choices accumulate into massive environmental impacts over time.</p></div><div className="ec-summary-note"><Leaf size={17} /><span>EcoCoach provides AI-driven reflection, not certified carbon accounting.</span></div></div>
          </section>
        )}

        <section className="ec-how-section" id="how-it-works">
          <div className="ec-shell"><div className="ec-how-header"><span className="ec-kicker">03 / HOW IT WORKS</span><h2>Make the next choice<br /><em>feel possible.</em></h2><p>EcoCoach uses AI to analyze your daily habits, keeping the loop short, grounded, and human. No leaderboards. No shame. Just enough context to make tomorrow a little easier.</p></div><div className="ec-how-grid"><div className="ec-how-step"><span>01</span><div className="ec-how-icon"><Footprints size={20} /></div><h3>Notice</h3><p>Write your day the way you would text a friend. We look for transport, energy, food, and waste.</p></div><div className="ec-how-connector" /><div className="ec-how-step"><span>02</span><div className="ec-how-icon"><Sparkles size={20} /></div><h3>Understand</h3><p>Our AI processes your input to give you an efficiency score and estimated footprint.</p></div><div className="ec-how-connector" /><div className="ec-how-step"><span>03</span><div className="ec-how-icon"><Leaf size={20} /></div><h3>Try one thing</h3><p>Leave with a single AI-tailored recommendation that respects your actual context.</p></div></div></div>
        </section>
      </main>

      <footer className="ec-footer"><div className="ec-shell ec-footer-inner"><div className="ec-brand"><span className="ec-brand-mark"><Leaf size={17} /></span><span>Eco<span>Coach</span></span></div><span>Built for everyday climate action · SDG 13</span><div className="ec-footer-links"><button onClick={() => toast.message("The full methodology is coming soon.")}>Methodology</button><button onClick={() => toast.message("Privacy is session-only in this MVP.")}>Privacy</button></div></div></footer>
    </div>
  );
}
