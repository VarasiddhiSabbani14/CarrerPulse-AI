import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowUpRight, BriefcaseBusiness, CheckCircle2, FileText, Gauge, Lightbulb, LoaderCircle, Search, ShieldCheck, Sparkles, UploadCloud, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiOnline, setApiOnline] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch(API + "/api/health").then(r => setApiOnline(r.ok)).catch(() => setApiOnline(false));
    fetch(API + "/api/jobs").then(r => r.json()).then(setJobs).catch(() => setJobs([]));
  }, []);

  const matchedJobs = useMemo(() => {
    if (!result) return jobs;
    return jobs.map(job => ({ ...job, match: Math.round(job.skills.filter(s => result.skills.includes(s)).length / job.skills.length * 100) }))
      .sort((a, b) => b.match - a.match);
  }, [jobs, result]);

  function chooseFile(candidate) {
    if (!candidate) return;
    const extension = candidate.name.toLowerCase().split(".").pop();
    if (!["pdf", "docx", "txt"].includes(extension)) {
      setError("Please choose a PDF, DOCX, or TXT file.");
      setFile(null);
      return;
    }
    if (candidate.size > 5 * 1024 * 1024) {
      setError("File must be 5 MB or smaller.");
      setFile(null);
      return;
    }
    setFile(candidate);
    setError("");
    setResult(null);
  }

  async function analyze() {
    if (!file) return;
    setLoading(true); setError(""); setResult(null);
    const body = new FormData(); body.append("file", file);
    try {
      const response = await fetch(API + "/api/analyze", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not analyze this resume.");
      setResult(data);
    } catch (e) {
      setError(e.message || "Unable to reach the API. Start the backend and try again.");
    } finally { setLoading(false); }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Activity size={21}/></div><span>CareerPulse<span className="brand-ai"> AI</span></span></div>
      <div className="workspace-label">WORKSPACE</div>
      <a className="nav-item active"> <Gauge size={18}/> Overview</a>
      <a className="nav-item" href="#analysis"><FileText size={18}/> Resume analysis</a>
      <a className="nav-item" href="#jobs"><BriefcaseBusiness size={18}/> Job matches</a>
      <div className="sidebar-bottom"><div className="sidebar-icon"><ShieldCheck size={18}/></div><div><strong>Your career, in focus.</strong><p>Build a stronger next step.</p></div></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> Overview</div><div className="topbar-right"><span className={apiOnline ? "api-status online" : "api-status"}><i/> {apiOnline ? "API connected" : "API offline"}</span><div className="avatar">CP</div></div></header>
      <section className="hero">
        <div><div className="eyebrow"><Sparkles size={14}/> YOUR CAREER COMPANION</div><h1>Make your next move<br/><span>your best move.</span></h1><p>Get a clearer picture of your resume strengths and discover opportunities that fit your skills.</p></div>
        <div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="hero-core"><Activity size={42}/></div><div className="float-card"><span>CAREER PULSE</span><strong>ON TRACK</strong></div></div>
      </section>

      <section className="stats-grid">
        <Stat icon={<Gauge/>} label="Resume score" value={result ? result.score + "/100" : "—"} note={result ? "Based on your resume" : "Upload to get your score"}/>
        <Stat icon={<FileText/>} label="Words analyzed" value={result ? result.word_count : "—"} note="Resume content"/>
        <Stat icon={<BriefcaseBusiness/>} label="Job suggestions" value={jobs.length || "—"} note="Sample roles to explore"/>
      </section>

      <section className="content-grid" id="analysis">
        <div className="panel upload-panel">
          <div className="panel-heading"><div><div className="eyebrow">GET STARTED</div><h2>Resume analysis</h2></div><div className="panel-icon"><UploadCloud/></div></div>
          <p className="muted">Upload your latest resume and get a quick, practical review.</p>
          <label className={isDragging ? "dropzone dragging" : "dropzone"}
            onDragEnter={e => {e.preventDefault();setIsDragging(true);}}
            onDragOver={e => {e.preventDefault();setIsDragging(true);}}
            onDragLeave={e => {e.preventDefault();if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false);}}
            onDrop={e => {e.preventDefault();setIsDragging(false);chooseFile(e.dataTransfer.files?.[0]);}}>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={e => chooseFile(e.target.files?.[0])}/>
            <div className="upload-symbol"><UploadCloud size={25}/></div>
            <strong>{file ? file.name : "Drop your resume here"}</strong>
            <span>{file ? "Ready to analyze" : "or click to browse · PDF, DOCX, TXT · Max 5 MB"}</span>
          </label>
          {file && <button className="clear-file-button" type="button" onClick={() => { setFile(null); setResult(null); setError(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}><X size={14}/> Remove selected file</button>}
          {error && <div className="error-message" role="alert">{error}</div>}
          <button className="primary-button" onClick={analyze} disabled={!file || loading}>{loading ? <LoaderCircle className="spin" size={17}/> : <Sparkles size={17}/>} {loading ? "Analyzing..." : "Analyze my resume"} <ArrowUpRight size={16}/></button>
          <div className="privacy-note"><ShieldCheck size={15}/> Files are processed for this request and not stored by this demo.</div>
        </div>

        <div className="panel score-panel">
          <div className="panel-heading"><div><div className="eyebrow">YOUR SNAPSHOT</div><h2>Resume health</h2></div><div className="panel-icon"><Activity/></div></div>
          {result ? <><div className="score-wrap"><div className="score-ring" style={{"--score": result.score * 3.6 + "deg"}}><div><strong>{result.score}</strong><span>OUT OF 100</span></div></div><div className="score-copy"><strong>{result.score >= 80 ? "Strong foundation" : result.score >= 60 ? "Good starting point" : "Room to grow"}</strong><p>Use the suggestions below to strengthen your resume.</p></div></div><div className="section-checks">{Object.entries(result.sections).map(([key, value]) => <div key={key}><span>{key[0].toUpperCase()+key.slice(1)}</span>{value ? <CheckCircle2 className="check"/> : <span className="missing">Add</span>}</div>)}</div></> : <div className="empty-score"><div className="empty-ring"><Gauge size={30}/></div><strong>Your insights will appear here</strong><p>Upload a resume to see your score and section checklist.</p></div>}
        </div>
      </section>

      {result && <section className="panel insights-panel"><div className="panel-heading"><div><div className="eyebrow">NEXT BEST STEPS</div><h2>Personalized improvements</h2></div><Lightbulb className="insight-icon"/></div><div className="suggestion-list">{result.suggestions.map((s,i)=><div className="suggestion" key={i}><span>{String(i+1).padStart(2,"0")}</span>{s}</div>)}</div><p className="disclaimer">{result.disclaimer}</p></section>}

      <section className="panel jobs-panel" id="jobs"><div className="panel-heading"><div><div className="eyebrow">EXPLORE WHAT'S NEXT</div><h2>Suggested opportunities</h2></div><div className="jobs-search"><Search size={16}/><span>Based on your skills</span></div></div><div className="job-list">{matchedJobs.map(job=><div className="job-row" key={job.id}><div className="company-mark"><BriefcaseBusiness size={19}/></div><div className="job-info"><strong>{job.title}</strong><span>{job.company} · {job.location}</span><div className="skill-tags">{job.skills.map(s=><small key={s}>{s}</small>)}</div></div><div className="job-meta"><span>{job.type}</span>{result && <strong>{job.match}% match</strong>}</div><ArrowUpRight className="job-arrow" size={18}/></div>)}
      {jobs.length === 0 && <p className="muted">Start the backend to load sample opportunities.</p>}</div><p className="disclaimer">Sample opportunities for demonstration only. They are not live vacancies.</p></section>
      <footer>CareerPulse AI <span>·</span> A clearer path to your next opportunity.</footer>
    </main>
  </div>;
}

function Stat({icon,label,value,note}) { return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className="stat-icon">{icon}</div></div><strong>{value}</strong><small>{note}</small></div>; }
