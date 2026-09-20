import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Bike,
  Bus,
  Check,
  ChevronDown,
  ClipboardCheck,
  CircleHelp,
  Clock3,
  Footprints,
  Gauge,
  Info,
  Leaf,
  Lightbulb,
  LockKeyhole,
  Menu,
  Recycle,
  Sparkles,
  Train,
  Utensils,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Level = "Low" | "Moderate" | "High" | "Insufficient data";
type Category = "transport" | "energy" | "food" | "waste";

type Activity = {
  category: Category;
  label: string;
  level: Level;
  basis: string;
  icon: typeof Bike;
};

type Assessment = {
  activities: Activity[];
  strength: string;
  summary: string;
  improvement: string;
  tip: string;
  why: string;
};

const categoryMeta: Record<Category, { label: string; icon: typeof Bike; tint: string }> = {
  transport: { label: "Transport", icon: Bike, tint: "sage" },
  energy: { label: "Energy", icon: Zap, tint: "gold" },
  food: { label: "Food", icon: Utensils, tint: "clay" },
  waste: { label: "Waste", icon: Recycle, tint: "blue" },
};

const sampleText =
  "I rode my bike to college, used the AC for 6 hours, ate a vegetarian lunch, and threw away half my dinner.";

const sampleAssessment: Assessment = {
  activities: [
    { category: "transport", label: "Bike to college", level: "Low", basis: "Active travel", icon: Bike },
    { category: "energy", label: "AC for 6 hours", level: "High", basis: "Long-duration cooling", icon: Zap },
    { category: "food", label: "Vegetarian lunch", level: "Low", basis: "Plant-forward meal", icon: Utensils },
    { category: "waste", label: "Food wasted", level: "High", basis: "Avoidable food waste", icon: Recycle },
  ],
  strength: "Biking to college was a genuinely low-impact choice — and it counts.",
  summary: "Roughly, your AC use and the food waste carried the most impact today.",
  improvement: "Start with the food you can keep, not the food you have to give up.",
  tip: "Serve a smaller portion first, then keep extra dinner for tomorrow if you are still hungry.",
  why: "EcoCoach matched your bike, AC duration, vegetarian meal, and food-waste mentions to a small qualitative reference table. The levels are relative signals, not a precise carbon calculation.",
};

function assess(text: string): Assessment {
  const value = text.toLowerCase();
  const activities: Activity[] = [];

  if (/bike|bicycle|cycle|walk|walked|foot|cycling/.test(value)) {
    activities.push({ category: "transport", label: /walk|foot/.test(value) ? "Walked to class" : "Bike or cycle travel", level: "Low", basis: "Active travel", icon: /walk|foot/.test(value) ? Footprints : Bike });
  } else if (/bus|metro|train|shuttle|public transport/.test(value)) {
    activities.push({ category: "transport", label: "Shared public transport", level: "Low", basis: "Shared travel", icon: /train|metro/.test(value) ? Train : Bus });
  } else if (/car|cab|uber|taxi/.test(value)) {
    activities.push({ category: "transport", label: "Solo car or cab travel", level: "High", basis: "Solo motor travel", icon: Bus });
  } else if (/scooter|motorbike|motorcycle|petrol bike|two-wheeler/.test(value)) {
    activities.push({ category: "transport", label: "Petrol two-wheeler", level: "Moderate", basis: "Motor travel", icon: Bike });
  }

  if (/ac|air conditioner|air-conditioning/.test(value)) {
    const longUse = /([5-9]|1[0-9])\s*(hour|hr|hrs|hours)/.test(value) || /all night|long time|most of the day/.test(value);
    activities.push({ category: "energy", label: longUse ? "AC for a long stretch" : "Air conditioning", level: longUse ? "High" : "Moderate", basis: longUse ? "Long-duration cooling" : "Cooling appliance", icon: Zap });
  } else if (/fan|natural light|window|sunlight|no ac/.test(value)) {
    activities.push({ category: "energy", label: /fan/.test(value) ? "Fan or natural cooling" : "Natural light / ventilation", level: "Low", basis: "Lower-energy routine", icon: Wind });
  }

  if (/meat|chicken|mutton|beef|pork|fish/.test(value)) {
    activities.push({ category: "food", label: "Meat-based meal", level: "Moderate", basis: "Meal composition", icon: Utensils });
  } else if (/vegetarian|plant-based|vegan|dal|lentil|beans/.test(value)) {
    activities.push({ category: "food", label: "Plant-forward meal", level: "Low", basis: "Meal composition", icon: Utensils });
  }

  if (/throw|threw|waste|wasted|leftover|left overs|food in the bin|discard/.test(value)) {
    activities.push({ category: "waste", label: "Avoidable food waste", level: "High", basis: "Food waste", icon: Recycle });
  } else if (/segregat|separate|recycl|compost/.test(value)) {
    activities.push({ category: "waste", label: "Separated waste", level: "Low", basis: "Waste segregation", icon: Recycle });
  } else if (/mixed waste|everything in one bin|unsegregated/.test(value)) {
    activities.push({ category: "waste", label: "Mixed waste", level: "Moderate", basis: "Waste segregation", icon: Recycle });
  }

  if (!activities.length) {
    return {
      activities: [],
      strength: "Thanks for checking in — a little context will make the readout more useful.",
      summary: "I could not confidently match this note to transport, energy, food, or waste yet.",
      improvement: "Add one ordinary detail from your day.",
      tip: "Try mentioning how you travelled, cooled your room, ate, or handled waste.",
      why: "The MVP stays cautious when a message does not contain a supported activity. It will not invent an impact level from missing information.",
    };
  }

  const high = activities.filter((item) => item.level === "High");
  const moderate = activities.filter((item) => item.level === "Moderate");
  const primary = high[0] ?? moderate[0] ?? activities[0];
  const positive = activities.find((item) => item.level === "Low") ?? activities[0];
  const constrained = /hostel|pg|shared|don't control|do not control|campus|no car|can't choose|cannot choose/.test(value);

  const tipByCategory: Record<Category, string> = {
    transport: constrained ? "If you have the option, keep using the shared route you already have rather than adding a separate trip." : "For your next short trip, keep the bike or walking option in the mix if it feels safe and practical.",
    energy: constrained ? "If the room setting is shared, focus on the part you control: close the door and use the fan or ventilation when comfortable." : "Try a slightly higher AC set point and switch it off while the room is empty.",
    food: "Build one plant-forward meal into tomorrow — something familiar and affordable is enough.",
    waste: "Serve a smaller portion first, then save any extra for tomorrow instead of binning it.",
  };

  return {
    activities,
    strength: `${positive.label} was a thoughtful low-impact move — keep that in your rhythm.`,
    summary: high.length ? `Roughly, ${high.map((item) => item.label.toLowerCase()).join(" and ")} carried the most impact today.` : `Roughly, ${primary.label.toLowerCase()} is the easiest place to make a small adjustment.`,
    improvement: high.length ? `Start with ${primary.label.toLowerCase()}, without trying to overhaul your whole day.` : "You have a strong baseline — focus on repeating what worked.",
    tip: tipByCategory[primary.category],
    why: `EcoCoach matched ${activities.map((item) => item.label.toLowerCase()).join(", ")} to a small qualitative reference table. These are relative signals, not a precise carbon calculation.${constrained ? " Advice was also softened because your note suggests some choices are shared or outside your control." : ""}`,
  };
}

function levelClass(level: Level) {
  return level.toLowerCase().replace(" ", "-");
}

export default function Home() {
  const [text, setText] = useState(sampleText);
  const [assessment, setAssessment] = useState<Assessment>(sampleAssessment);
  const [isAssessing, setIsAssessing] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logs, setLogs] = useState(0);

  const activeCategories = useMemo(() => new Set(assessment.activities.map((item) => item.category)), [assessment]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  const handleAssess = () => {
    if (!text.trim()) {
      toast.error("Add a few details from your day first.");
      return;
    }
    setIsAssessing(true);
    setShowWhy(false);
    window.setTimeout(() => {
      setAssessment(assess(text));
      setLogs((current) => current + 1);
      setIsAssessing(false);
      window.setTimeout(() => document.getElementById("readout")?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
    }, 520);
  };

  const loadExample = (example: string) => {
    setText(example);
    document.getElementById("log")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const copySummary = async () => {
    const summary = `${assessment.strength} ${assessment.summary} One small step: ${assessment.tip}`;
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
          <div className="ec-hero-art" aria-hidden="true">
            <div className="ec-art-sun"><span>13</span><small>SDG</small></div>
            <div className="ec-art-ring ec-ring-one" />
            <div className="ec-art-ring ec-ring-two" />
            <div className="ec-art-leaf leaf-a"><Leaf size={38} /></div>
            <div className="ec-art-leaf leaf-b"><Leaf size={24} /></div>
            <div className="ec-art-note note-a"><Bike size={15} /><span>bike commute</span><b>low</b></div>
            <div className="ec-art-note note-b"><Zap size={15} /><span>AC use</span><b>moderate</b></div>
            <div className="ec-art-caption"><span className="ec-caption-dot" /> One small step, every day</div>
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

        <section className="ec-shell ec-readout-section" id="readout">
          <div className="ec-section-heading readout-heading"><div><span className="ec-kicker">02 / YOUR READOUT</span><h2>A little clarity for tomorrow.</h2></div><div className="ec-readout-actions"><button onClick={copySummary}><ClipboardCheck size={15} /> Copy readout</button><span className="ec-approx-pill"><span /> Approximate by design</span></div></div>
          <div className="ec-readout-grid">
            <div className="ec-assessment-card ec-card">
              <div className="ec-assessment-header"><div><span className="ec-card-label">Today’s snapshot</span><h3>{assessment.activities.length ? "Your day, in four signals" : "Let’s add one more detail"}</h3></div><span className="ec-live-badge"><span /> Live preview</span></div>
              <div className="ec-activity-grid">
                {(["transport", "energy", "food", "waste"] as Category[]).map((category) => {
                  const item = assessment.activities.find((activity) => activity.category === category);
                  const meta = categoryMeta[category];
                  const Icon = item?.icon ?? meta.icon;
                  return <div className={`ec-activity ${item ? "is-filled" : "is-empty"}`} key={category}><div className={`ec-activity-icon ${meta.tint}`}><Icon size={18} /></div><div className="ec-activity-copy"><span>{meta.label}</span><strong>{item?.level ?? "Not noted"}</strong><small>{item?.label ?? "Add a detail next time"}</small></div>{item && <span className={`ec-level-dot ${levelClass(item.level)}`} />}</div>;
                })}
              </div>
              <div className="ec-strength"><div className="ec-strength-icon"><Check size={17} /></div><div><span className="ec-overline">YOU ALREADY DID WELL</span><p>{assessment.strength}</p></div></div>
              <button className="ec-why-trigger" onClick={() => setShowWhy((visible) => !visible)} aria-expanded={showWhy}><CircleHelp size={15} /> Why this estimate? <ChevronDown className={showWhy ? "rotate-180" : ""} size={15} /></button>
              {showWhy && <div className="ec-why-panel"><Info size={16} /><p>{assessment.why}</p></div>}
            </div>
            <div className="ec-tip-card">
              <div className="ec-tip-spark"><Lightbulb size={21} /></div><span className="ec-kicker">ONE SMALL STEP</span><h3>{assessment.improvement}</h3><p>{assessment.tip}</p><div className="ec-tip-footer"><span><Check size={14} /> No purchase needed</span><span>For tomorrow</span></div>
            </div>
          </div>
          <div className="ec-summary-strip"><div className="ec-summary-quote"><span className="ec-quote-mark">“</span><p>{assessment.summary}</p></div><div className="ec-summary-note"><Leaf size={17} /><span>EcoCoach is a reflection tool, not a certified carbon calculator.</span></div></div>
        </section>

        <section className="ec-how-section" id="how-it-works">
          <div className="ec-shell"><div className="ec-how-header"><span className="ec-kicker">03 / HOW IT WORKS</span><h2>Make the next choice<br /><em>feel possible.</em></h2><p>EcoCoach keeps the loop short, grounded, and human. No leaderboards. No shame. Just enough context to make tomorrow a little easier.</p></div><div className="ec-how-grid"><div className="ec-how-step"><span>01</span><div className="ec-how-icon"><Footprints size={20} /></div><h3>Notice</h3><p>Write your day the way you would text a friend. We look for transport, energy, food, and waste.</p></div><div className="ec-how-connector" /><div className="ec-how-step"><span>02</span><div className="ec-how-icon"><Sparkles size={20} /></div><h3>Understand</h3><p>See a rough, transparent signal of where your day had the most room to shift.</p></div><div className="ec-how-connector" /><div className="ec-how-step"><span>03</span><div className="ec-how-icon"><Leaf size={20} /></div><h3>Try one thing</h3><p>Leave with a single tip that respects your budget, access, and actual context.</p></div></div></div>
        </section>
      </main>

      <footer className="ec-footer"><div className="ec-shell ec-footer-inner"><div className="ec-brand"><span className="ec-brand-mark"><Leaf size={17} /></span><span>Eco<span>Coach</span></span></div><span>Built for everyday climate action · SDG 13</span><div className="ec-footer-links"><button onClick={() => toast.message("The full methodology is coming soon.")}>Methodology</button><button onClick={() => toast.message("Privacy is session-only in this MVP.")}>Privacy</button></div></div></footer>
    </div>
  );
}
