import { useState, useRef, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Detection {
  label: string;
  confidence: number;
  bbox: [number, number, number, number];
}

interface EdgeEvent {
  id: string;
  device: string;
  material: string;
  confidence: string;
  ts: string;
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  accent: string;
}

interface BBoxCanvasProps {
  detections: Detection[];
  width: number;
  height: number;
}

interface EdgeFeedProps {
  events: EdgeEvent[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MATERIAL_COLORS: Record<string, string> = {
  Plastic:   "#00e5ff",
  Metal:     "#ff6b35",
  Glass:     "#a8ff3e",
  Cardboard: "#ffd166",
  Organic:   "#06d6a0",
  Unknown:   "#9d4edd",
};

const MOCK_CLASSIFICATIONS: Detection[] = [
  { label: "Plastic",   confidence: 0.94, bbox: [60,  80,  210, 220] },
  { label: "Metal",     confidence: 0.88, bbox: [250, 50,  390, 230] },
  { label: "Glass",     confidence: 0.76, bbox: [100, 260, 230, 390] },
  { label: "Cardboard", confidence: 0.91, bbox: [270, 250, 420, 400] },
];

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=480&q=80",
  "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=480&q=80",
  "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=480&q=80",
];

const TOTAL_COUNTS: Record<string, number> = {
  Plastic: 1247, Metal: 893, Glass: 534, Cardboard: 1102, Organic: 321,
};

// ─── Data generators ──────────────────────────────────────────────────────────
const generateDailyData = () =>
  ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day => ({
    day,
    Plastic:   Math.floor(Math.random() * 80) + 40,
    Metal:     Math.floor(Math.random() * 60) + 20,
    Glass:     Math.floor(Math.random() * 50) + 15,
    Cardboard: Math.floor(Math.random() * 70) + 30,
    Organic:   Math.floor(Math.random() * 40) + 10,
  }));

const generateThroughput = () =>
  Array.from({ length: 12 }, (_, i) => ({
    hour: `${i * 2}:00`,
    items: Math.floor(Math.random() * 120) + 20,
    errors: Math.floor(Math.random() * 8),
  }));

const generateEdgeEvent = (): EdgeEvent => {
  const labels = Object.keys(MATERIAL_COLORS);
  return {
    id: Math.random().toString(36).slice(2, 8).toUpperCase(),
    device: `EDGE-${Math.floor(Math.random() * 4) + 1}`,
    material: labels[Math.floor(Math.random() * labels.length)],
    confidence: (Math.random() * 0.25 + 0.72).toFixed(2),
    ts: new Date().toLocaleTimeString(),
  };
};

// ─── BBoxCanvas ───────────────────────────────────────────────────────────────
function BBoxCanvas({ detections, width, height }: BBoxCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !detections.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    detections.forEach(({ label, confidence, bbox }) => {
      const [x1, y1, x2, y2] = bbox;
      const color = MATERIAL_COLORS[label] || "#fff";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      ctx.shadowBlur = 0;
      ctx.fillStyle = color + "cc";
      ctx.font = "bold 12px 'Space Mono', monospace";
      const txt = `${label} ${(confidence * 100).toFixed(0)}%`;
      const tw = ctx.measureText(txt).width;
      ctx.fillRect(x1, y1 - 20, tw + 10, 20);
      ctx.fillStyle = "#000";
      ctx.fillText(txt, x1 + 5, y1 - 5);
    });
  }, [detections, width, height]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    />
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: `1px solid ${accent}44`,
      borderRadius: 12,
      padding: "18px 22px",
      display: "flex", flexDirection: "column", gap: 4,
      boxShadow: `0 0 18px ${accent}18`,
    }}>
      <span style={{ fontSize: 11, letterSpacing: "0.12em", color: accent, textTransform: "uppercase", fontFamily: "'Space Mono', monospace" }}>{label}</span>
      <span style={{ fontSize: 32, fontWeight: 800, color: "#f0f4ff", fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 12, color: "#8899bb" }}>{sub}</span>
    </div>
  );
}

// ─── EdgeFeed ─────────────────────────────────────────────────────────────────
function EdgeFeed({ events }: EdgeFeedProps) {
  return (
    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }}>
      {events.slice(0, 15).map((e, i) => (
        <div key={i} style={{
          display: "grid",
          gridTemplateColumns: "70px 80px 100px 1fr auto",
          gap: 8,
          padding: "4px 8px",
          borderRadius: 4,
          background: i === 0 ? "rgba(255,255,255,0.06)" : "transparent",
          color: "#8899bb",
          transition: "background 0.3s",
        }}>
          <span style={{ color: "#5566aa" }}>{e.ts}</span>
          <span style={{ color: "#aabbdd" }}>{e.device}</span>
          <span style={{ color: MATERIAL_COLORS[e.material] }}>{e.material}</span>
          <div style={{ background: "#1a2240", borderRadius: 3, overflow: "hidden", height: 14, alignSelf: "center" }}>
            <div style={{ width: `${parseFloat(e.confidence) * 100}%`, height: "100%", background: MATERIAL_COLORS[e.material] + "99" }} />
          </div>
          <span style={{ color: "#667799" }}>{(parseFloat(e.confidence) * 100).toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function RecyclingDashboard() {
  const [imgSrc, setImgSrc] = useState(SAMPLE_IMAGES[0]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [dailyData]  = useState(generateDailyData);
  const [throughput] = useState(generateThroughput);
  const [edgeEvents, setEdgeEvents] = useState<EdgeEvent[]>(() =>
    Array.from({ length: 8 }, generateEdgeEvent)
  );
  const [activeTab, setActiveTab] = useState<"vision" | "analytics" | "edge-feed">("vision");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setEdgeEvents(prev => [generateEdgeEvent(), ...prev.slice(0, 30)]);
    }, 2200);
    return () => clearInterval(t);
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    setDetections([]);
    setAnalyzed(false);
  };

  const handleAnalyze = useCallback(() => {
    setAnalyzing(true);
    setDetections([]);
    setTimeout(() => {
      setDetections(MOCK_CLASSIFICATIONS);
      setAnalyzing(false);
      setAnalyzed(true);
    }, 1600);
  }, []);

  const pieData = Object.entries(TOTAL_COUNTS).map(([name, value]) => ({ name, value }));
  const totalItems = Object.values(TOTAL_COUNTS).reduce((a, b) => a + b, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#070d1f", color: "#d0dcf8", fontFamily: "'Syne', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; background: #0d1530; }
        ::-webkit-scrollbar-thumb { background: #1e3060; border-radius: 4px; }
        @keyframes pulse-ring { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
        @keyframes scan-line { 0%{top:0%} 100%{top:100%} }
        @keyframes fade-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .card-glow { animation: fade-in 0.4s ease both; }
        .tab-btn {
          background: none; border: none; cursor: pointer;
          padding: 10px 20px; font-family: 'Space Mono', monospace;
          font-size: 12px; letter-spacing: .1em; text-transform: uppercase;
          border-radius: 8px; transition: all .2s; color: #556688;
        }
        .tab-btn.active { background: rgba(0,229,255,.12); color: #00e5ff; }
        .tab-btn:hover:not(.active) { color: #8899cc; }
        .analyze-btn {
          border: none; cursor: pointer; padding: 10px 24px; border-radius: 8px;
          font-family: 'Space Mono', monospace; font-size: 12px;
          letter-spacing: .1em; text-transform: uppercase;
          transition: all .2s; font-weight: 700;
        }
        .analyze-btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.15); }
        .analyze-btn:disabled { cursor: not-allowed; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "16px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(10px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg,#00e5ff22,#06d6a022)",
            border: "1px solid #00e5ff44",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>♻️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: "0.03em", color: "#e8f0ff" }}>VALI-Sort Vision</div>
            <div style={{ fontSize: 10, color: "#4466aa", fontFamily: "'Space Mono',monospace", letterSpacing: "0.12em" }}>SMART RECYCLING ANALYTICS</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontFamily: "'Space Mono',monospace", color: "#06d6a0" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#06d6a0", animation: "pulse-ring 2s ease-in-out infinite" }} />
            LIVE — 4 EDGE DEVICES
          </div>
          <div style={{ fontSize: 11, color: "#445577", fontFamily: "'Space Mono',monospace" }}>
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ padding: "16px 32px 0", display: "flex", gap: 4 }}>
        {(["vision","analytics","edge-feed"] as const).map(t => (
          <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
            {t === "vision" ? "🔍 Vision" : t === "analytics" ? "📊 Analytics" : "📡 Edge Feed"}
          </button>
        ))}
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 1400 }}>

        {/* ══ VISION TAB ══ */}
        {activeTab === "vision" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>

            {/* Image panel */}
            <div className="card-glow" style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16, overflow: "hidden",
            }}>
              {/* Toolbar */}
              <div style={{
                padding: "14px 18px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <button
                  className="analyze-btn"
                  style={{
                    background: analyzing ? "#1a3060" : "linear-gradient(135deg,#00e5ff,#0080ff)",
                    color: analyzing ? "#5577bb" : "#000",
                  }}
                  onClick={handleAnalyze}
                  disabled={analyzing}
                >
                  {analyzing ? "⟳ Analyzing..." : "▶ Analyze Image"}
                </button>
                <button
                  className="analyze-btn"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#8899cc", border: "1px solid rgba(255,255,255,0.1)" }}
                  onClick={() => fileRef.current?.click()}
                >
                  ⬆ Upload
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
                <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                  {SAMPLE_IMAGES.map((s, i) => (
                    <div key={i}
                      onClick={() => { setImgSrc(s); setDetections([]); setAnalyzed(false); }}
                      style={{
                        width: 36, height: 36, borderRadius: 6, overflow: "hidden", cursor: "pointer",
                        border: imgSrc === s ? "2px solid #00e5ff" : "2px solid transparent",
                        opacity: imgSrc === s ? 1 : 0.5, transition: "all .2s",
                      }}
                    >
                      <img src={s} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Image + overlay */}
              <div style={{ position: "relative", width: "100%", background: "#040914" }}>
                <img src={imgSrc} alt="input" style={{ width: "100%", maxHeight: 440, objectFit: "contain", display: "block" }} />
                {analyzing && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,229,255,0.04) 2px,rgba(0,229,255,0.04) 4px)",
                  }}>
                    <div style={{
                      position: "absolute", left: 0, right: 0, height: 2,
                      background: "linear-gradient(90deg,transparent,#00e5ff,transparent)",
                      animation: "scan-line 1.2s linear infinite",
                      boxShadow: "0 0 12px #00e5ff",
                    }} />
                  </div>
                )}
                {analyzed && <BBoxCanvas detections={detections} width={480} height={440} />}
              </div>

              {/* Status bar */}
              <div style={{
                padding: "10px 18px",
                background: "rgba(0,0,0,0.3)",
                display: "flex", gap: 20,
                fontSize: 11, fontFamily: "'Space Mono',monospace", color: "#4466aa",
              }}>
                <span>MODEL: YOLOv8-recycling-v2</span>
                <span>BACKEND: FastAPI + OpenCV</span>
                <span style={{ marginLeft: "auto", color: analyzed ? "#06d6a0" : "#556688" }}>
                  {analyzed ? `✓ ${detections.length} OBJECTS DETECTED` : analyzing ? "⟳ PROCESSING..." : "READY"}
                </span>
              </div>
            </div>

            {/* Detection results + stat cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card-glow" style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16, padding: 18,
              }}>
                <div style={{ fontSize: 11, fontFamily: "'Space Mono',monospace", color: "#4466aa", letterSpacing: "0.12em", marginBottom: 14 }}>
                  DETECTION RESULTS
                </div>
                {!analyzed ? (
                  <div style={{ color: "#33446699", fontFamily: "'Space Mono',monospace", fontSize: 12, textAlign: "center", padding: "30px 0" }}>
                    Click "Analyze Image" to run<br />computer vision classification
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {detections.map((d, i) => (
                      <div key={i} style={{
                        padding: "12px 14px", borderRadius: 10,
                        background: `${MATERIAL_COLORS[d.label]}10`,
                        border: `1px solid ${MATERIAL_COLORS[d.label]}33`,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, color: MATERIAL_COLORS[d.label], fontSize: 14 }}>{d.label}</span>
                          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, color: "#8899bb" }}>{(d.confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div style={{ background: "#0d1530", borderRadius: 4, height: 6, overflow: "hidden" }}>
                          <div style={{ width: `${d.confidence * 100}%`, height: "100%", background: MATERIAL_COLORS[d.label], borderRadius: 4, transition: "width 0.8s ease" }} />
                        </div>
                        <div style={{ fontSize: 10, color: "#445577", marginTop: 5, fontFamily: "'Space Mono',monospace" }}>
                          bbox [{d.bbox.join(", ")}]
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <StatCard label="Today's Items" value="2,847" sub="+12.4% vs yesterday" accent="#00e5ff" />
              <StatCard label="Error Rate"    value="2.4%"  sub="Below 5% threshold ✓" accent="#06d6a0" />
              <StatCard label="Accuracy"      value="93.7%" sub="Model confidence avg"  accent="#a8ff3e" />
            </div>
          </div>
        )}

        {/* ══ ANALYTICS TAB ══ */}
        {activeTab === "analytics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
              <StatCard label="Total Classified" value={totalItems.toLocaleString()} sub="All materials"   accent="#00e5ff" />
              <StatCard label="Plastic"          value={TOTAL_COUNTS.Plastic.toLocaleString()} sub="Most common" accent={MATERIAL_COLORS.Plastic} />
              <StatCard label="Metal"            value={TOTAL_COUNTS.Metal.toLocaleString()}   sub="High value"  accent={MATERIAL_COLORS.Metal} />
              <StatCard label="Error Rate"       value="2.4%"                                  sub="Weekly avg"  accent="#ff6b6b" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
              {/* Bar chart */}
              <div className="card-glow" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 22 }}>
                <div style={{ fontSize: 11, fontFamily: "'Space Mono',monospace", color: "#4466aa", letterSpacing: "0.12em", marginBottom: 18 }}>DAILY MATERIAL BREAKDOWN</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={dailyData} barSize={9} barGap={2}>
                    <XAxis dataKey="day" tick={{ fill: "#445577", fontSize: 11, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#445577", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0d1530", border: "1px solid #1a2e60", borderRadius: 8, fontFamily: "Space Mono", fontSize: 11 }} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    {Object.keys(MATERIAL_COLORS).filter(k => k !== "Unknown").map(mat => (
                      <Bar key={mat} dataKey={mat} fill={MATERIAL_COLORS[mat]} radius={[3, 3, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie chart */}
              <div className="card-glow" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 22 }}>
                <div style={{ fontSize: 11, fontFamily: "'Space Mono',monospace", color: "#4466aa", letterSpacing: "0.12em", marginBottom: 10 }}>MATERIAL DISTRIBUTION</div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={MATERIAL_COLORS[entry.name]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0d1530", border: "1px solid #1a2e60", borderRadius: 8, fontFamily: "Space Mono", fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {pieData.map(({ name, value }) => (
                    <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontFamily: "'Space Mono',monospace" }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: MATERIAL_COLORS[name] }} />
                      <span style={{ color: "#8899cc", flex: 1 }}>{name}</span>
                      <span style={{ color: "#4466aa" }}>{((value / totalItems) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Area chart */}
            <div className="card-glow" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 22 }}>
              <div style={{ fontSize: 11, fontFamily: "'Space Mono',monospace", color: "#4466aa", letterSpacing: "0.12em", marginBottom: 18 }}>HOURLY THROUGHPUT & ERRORS</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={throughput}>
                  <defs>
                    <linearGradient id="itemsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00e5ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ff6b35" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ff6b35" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" tick={{ fill: "#445577", fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#445577", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0d1530", border: "1px solid #1a2e60", borderRadius: 8, fontFamily: "Space Mono", fontSize: 11 }} cursor={{ stroke: "rgba(255,255,255,0.08)" }} />
                  <Area type="monotone" dataKey="items"  stroke="#00e5ff" strokeWidth={2} fill="url(#itemsGrad)" />
                  <Area type="monotone" dataKey="errors" stroke="#ff6b35" strokeWidth={2} fill="url(#errGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ══ EDGE FEED TAB ══ */}
        {activeTab === "edge-feed" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
            <div className="card-glow" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontFamily: "'Space Mono',monospace", color: "#4466aa", letterSpacing: "0.12em" }}>LIVE EDGE DEVICE STREAM</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "'Space Mono',monospace", color: "#06d6a0" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#06d6a0", animation: "pulse-ring 1.5s ease-in-out infinite" }} />
                  STREAMING
                </div>
              </div>
              <div style={{ fontSize: 11, fontFamily: "'Space Mono',monospace", color: "#334466", marginBottom: 10, display: "grid", gridTemplateColumns: "70px 80px 100px 1fr auto", gap: 8, padding: "0 8px" }}>
                <span>TIME</span><span>DEVICE</span><span>MATERIAL</span><span>CONFIDENCE</span><span>%</span>
              </div>
              <EdgeFeed events={edgeEvents} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card-glow" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 11, fontFamily: "'Space Mono',monospace", color: "#4466aa", letterSpacing: "0.12em", marginBottom: 14 }}>DEVICE STATUS</div>
                {["EDGE-1","EDGE-2","EDGE-3","EDGE-4"].map((d, i) => (
                  <div key={d} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, color: "#8899cc" }}>{d}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: i < 3 ? "#06d6a0" : "#ff6b35" }} />
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: i < 3 ? "#06d6a0" : "#ff6b35" }}>
                        {i < 3 ? "ONLINE" : "OFFLINE"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <StatCard label="Events / min" value="27"     sub="Live throughput"  accent="#00e5ff" />
              <StatCard label="Uptime"       value="99.2%"  sub="Last 30 days"     accent="#06d6a0" />
              <StatCard label="Data Sent"    value="4.7 GB" sub="To AWS S3 today"  accent="#ffd166" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}