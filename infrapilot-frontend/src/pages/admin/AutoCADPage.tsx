import { useState, useRef, useCallback, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Point { 
  x: number; 
  y: number; 
  rawRow?: string[]; 
}
type Step = "convert" | "upload" | "view";

// ─── DXF Parser (lightweight, no external dep needed for basic parsing) ───────
function parseDXF(content: string): Point[] {
  const points: Point[] = [];
  const lines = content.split(/\r?\n/);
  let i = 0;
  let currentEntity = "";
  let x = 0, y = 0;
  let hasX = false, hasY = false;

  while (i < lines.length) {
    const code = lines[i]?.trim();
    const value = lines[i + 1]?.trim();
    i += 2;

    if (code === "0") {
      // Flush previous entity
      if (hasX && hasY && (currentEntity === "POINT" || currentEntity === "VERTEX")) {
        points.push({ x, y });
        hasX = false; hasY = false;
      }
      currentEntity = value || "";
    } else if (["POINT", "VERTEX", "LINE", "LWPOLYLINE"].includes(currentEntity)) {
      if (code === "10") { x = parseFloat(value); hasX = true; }
      if (code === "20") { y = parseFloat(value); hasY = true; }
      if (hasX && hasY && currentEntity !== "POINT" && currentEntity !== "VERTEX") {
        points.push({ x, y });
        hasX = false; hasY = false;
      }
    }
  }
  // flush last
  if (hasX && hasY) points.push({ x, y });

  return points;
}

// ─── Parse CSV to Points (Enhanced for all columns) ──────────────────────────
function parseCSV(content: string): { headers: string[]; points: Point[] } {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], points: [] };

  const headers = lines[0].split(/,|\t/).map((h) => h.trim());
  const headerLower = headers.map((h) => h.toLowerCase());

  const xIdx = headerLower.findIndex((h) => h.includes("easting") || h.includes("x") || h === "lon" || h === "longitude");
  const yIdx = headerLower.findIndex((h) => h.includes("northing") || h.includes("y") || h === "lat" || h === "latitude");

  if (xIdx === -1 || yIdx === -1) return { headers, points: [] };

  const points = lines.slice(1).map((line) => {
    const cols = line.split(/,|\t/).map((c) => c.trim());
    return {
      x: parseFloat(cols[xIdx]),
      y: parseFloat(cols[yIdx]),
      rawRow: cols
    };
  }).filter((p) => !isNaN(p.x) && !isNaN(p.y));

  return { headers, points };
}

// ─── Stats Helper ─────────────────────────────────────────────────────────────
function getPointsStats(points: Point[]) {
  if (points.length === 0) return null;
  return points.reduce((acc, p) => ({
    minX: Math.min(acc.minX, p.x),
    maxX: Math.max(acc.maxX, p.x),
    minY: Math.min(acc.minY, p.y),
    maxY: Math.max(acc.maxY, p.y),
  }), { minX: points[0].x, maxX: points[0].x, minY: points[0].y, maxY: points[0].y });
}

// ─── Canvas Renderer ──────────────────────────────────────────────────────────
function renderToCanvas(canvas: HTMLCanvasElement, points: Point[], title: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx || points.length === 0) return;

  const W = canvas.width, H = canvas.height;
  const MARGIN = { top: 50, right: 30, bottom: 60, left: 80 };
  const plotW = W - MARGIN.left - MARGIN.right;
  const plotH = H - MARGIN.top - MARGIN.bottom;

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Compute bounds
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1;

  const toCanvasX = (x: number) => MARGIN.left + ((x - minX) / rangeX) * plotW;
  const toCanvasY = (y: number) => MARGIN.top + plotH - ((y - minY) / rangeY) * plotH;

  // Grid
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 0.8;
  const gridLines = 6;
  for (let g = 0; g <= gridLines; g++) {
    const gx = MARGIN.left + (g / gridLines) * plotW;
    const gy = MARGIN.top + (g / gridLines) * plotH;
    ctx.beginPath(); ctx.moveTo(gx, MARGIN.top); ctx.lineTo(gx, MARGIN.top + plotH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(MARGIN.left, gy); ctx.lineTo(MARGIN.left + plotW, gy); ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(MARGIN.left, MARGIN.top);
  ctx.lineTo(MARGIN.left, MARGIN.top + plotH);
  ctx.lineTo(MARGIN.left + plotW, MARGIN.top + plotH);
  ctx.stroke();

  // X axis labels
  ctx.fillStyle = "#64748b";
  ctx.font = "11px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  for (let g = 0; g <= gridLines; g++) {
    const val = minX + (g / gridLines) * rangeX;
    const gx = MARGIN.left + (g / gridLines) * plotW;
    ctx.fillText(val.toFixed(0), gx, MARGIN.top + plotH + 18);
  }

  // Y axis labels
  ctx.textAlign = "right";
  for (let g = 0; g <= gridLines; g++) {
    const val = minY + (g / gridLines) * rangeY;
    const gy = MARGIN.top + plotH - (g / gridLines) * plotH;
    ctx.fillText(val.toFixed(0), MARGIN.left - 8, gy + 4);
  }

  // Axis titles
  ctx.fillStyle = "#475569";
  ctx.font = "bold 12px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Easting (X)", MARGIN.left + plotW / 2, H - 10);

  ctx.save();
  ctx.translate(16, MARGIN.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Northing (Y)", 0, 0);
  ctx.restore();

  // Chart Title
  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 14px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, W / 2, 30);

  // Points
  ctx.fillStyle = "#3b82f6";
  const COL = "#3b82f6";
  const r = Math.max(2, Math.min(5, 8000 / points.length));
  for (const p of points) {
    ctx.beginPath();
    ctx.arc(toCanvasX(p.x), toCanvasY(p.y), r, 0, Math.PI * 2);
    ctx.fillStyle = COL;
    ctx.fill();
  }

  // Point count watermark
  ctx.fillStyle = "#94a3b8";
  ctx.font = "10px Inter, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${points.length.toLocaleString()} points`, W - 10, H - 8);
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AutoCADPage() {
  const [step, setStep] = useState<Step>("convert");
  const [convertedPoints, setConvertedPoints] = useState<Point[]>([]);
  const [convertedFileName, setConvertedFileName] = useState("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [dxfFileName, setDxfFileName] = useState("");
  const [parsedPoints, setParsedPoints] = useState<Point[]>([]);
  const [chartTitle, setChartTitle] = useState("AutoCAD Point Visualization (Top View)");
  const [isRendered, setIsRendered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dxfInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Re-render canvas when parsedPoints change
  useEffect(() => {
    if (parsedPoints.length > 0 && canvasRef.current) {
      setIsLoading(true);
      setIsRendered(false);
      // Defer rendering so the loader has time to paint
      const timer = setTimeout(() => {
        if (canvasRef.current) {
          renderToCanvas(canvasRef.current, parsedPoints, chartTitle);
        }
        setIsRendered(true);
        setIsLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [parsedPoints, chartTitle]);

  // ── Step 1: Convert CSV/TXT to points ──────────────────────────────────────
  const handleConvertFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        const { headers, points } = parseCSV(content);
        if (points.length === 0) {
          setError("Could not parse coordinate data. Ensure your CSV has 'Easting'/'X' and 'Northing'/'Y' columns.");
          return;
        }
        setConvertedPoints(points);
        setCsvHeaders(headers);
        setConvertedFileName(file.name);
      } catch {
        setError("Failed to read the file. Please check the format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  // ── Step 2: Upload DXF ─────────────────────────────────────────────────────
  const handleDXFUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".dxf")) {
      setError("Please upload a valid .dxf file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        const pts = parseDXF(content);
        if (pts.length === 0) {
          setError("No coordinate entities found in the DXF file. Supported: POINT, LINE, LWPOLYLINE.");
          return;
        }
        setParsedPoints(pts);
        setDxfFileName(file.name);
        setChartTitle(`${file.name.replace(".dxf", "")} - Point Visualization (Top View)`);
        setStep("view");
      } catch {
        setError("Failed to parse DXF file. Ensure it is a valid ASCII DXF.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  // Use converted CSV points directly
  const useConvertedPoints = () => {
    setParsedPoints(convertedPoints);
    setChartTitle(`${convertedFileName.replace(/\..+$/, "")} - Point Visualization (Top View)`);
    setStep("view");
  };

  // ── Download Canvas ────────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `autocad_visualization_${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const steps = [
    { id: "convert", label: "Convert File", num: "1" },
    { id: "upload", label: "Upload DXF", num: "2" },
    { id: "view", label: "Visualize", num: "3" },
  ];

  const csvStats = getPointsStats(convertedPoints);

  return (
    <>
      <Navbar title="AutoCAD Viewer" breadcrumb={["Admin", "AutoCAD Viewer"]} />

      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">AutoCAD Viewer</h1>
            <p className="text-slate-500 text-sm">Convert, upload and visualize AutoCAD DXF drawings as scatter plots.</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
          <div className="flex items-center gap-0">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center flex-1">
                <button
                  onClick={() => (s.id === "view" && parsedPoints.length === 0) ? null : setStep(s.id as Step)}
                  className="flex items-center gap-3 group"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    step === s.id
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/30"
                      : (steps.indexOf(steps.find((x) => x.id === step)!) > idx)
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-white text-slate-400 border-slate-200"
                  }`}>
                    {steps.indexOf(steps.find((x) => x.id === step)!) > idx ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    ) : s.num}
                  </div>
                  <span className={`text-sm font-semibold hidden sm:block ${step === s.id ? "text-primary" : "text-slate-400"}`}>{s.label}</span>
                </button>
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-3 bg-slate-100 rounded-full">
                    <div className={`h-full rounded-full transition-all duration-500 ${
                      steps.indexOf(steps.find((x) => x.id === step)!) > idx ? "bg-emerald-400 w-full" : "bg-transparent w-0"
                    }`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Step 1: Convert File ──────────────────────────────────────────── */}
        {step === "convert" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload CSV Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Import Coordinate File</h3>
              <p className="text-sm text-slate-500 mb-5">Upload a CSV or TXT file containing coordinate data (Easting/X and Northing/Y columns).</p>

              <input ref={csvInputRef} type="file" accept=".csv,.txt" onChange={handleConvertFile} className="hidden" />

              <div
                onClick={() => csvInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-primary/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50 hover:bg-primary/5 group"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                </div>
                <p className="font-semibold text-slate-700 text-sm">Click to select CSV / TXT file</p>
                <p className="text-xs text-slate-400 mt-1">Must have Easting/X and Northing/Y columns</p>
              </div>

              {/* Expected Format */}
              <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-xs font-bold text-slate-600 mb-2">Expected column format:</p>
                <code className="text-xs text-slate-500 font-mono block leading-relaxed">
                  Easting,Northing<br />
                  367650.12,200.45<br />
                  367660.33,225.78<br />
                  367670.89,197.11
                </code>
              </div>
            </div>

            {/* Conversion Result Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Conversion Result</h3>
              <p className="text-sm text-slate-500 mb-5">Preview and proceed to visualization.</p>

              {convertedPoints.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                  <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <p className="text-sm">No data yet. Upload a file to convert.</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <p className="font-bold text-emerald-800 text-sm">{convertedFileName}</p>
                      <p className="text-emerald-600 text-xs">{convertedPoints.length.toLocaleString()} coordinate points extracted</p>
                    </div>
                  </div>

                  {/* Stats Overview */}
                  {csvStats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Min X", val: csvStats.minX },
                        { label: "Max X", val: csvStats.maxX },
                        { label: "Min Y", val: csvStats.minY },
                        { label: "Max Y", val: csvStats.maxY },
                      ].map((s) => (
                        <div key={s.label} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">{s.label}</p>
                          <p className="text-sm font-mono font-bold text-slate-700 leading-none">{s.val.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden flex flex-col max-h-[320px]">
                    <div className="overflow-y-auto overflow-x-auto flex-1">
                      <table className="w-full text-xs min-w-full">
                        <thead className="bg-slate-100 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-2.5 text-left bg-slate-100">#</th>
                            {csvHeaders.map((h, i) => (
                              <th key={i} className="px-4 py-2.5 text-left whitespace-nowrap bg-slate-100">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {convertedPoints.slice(0, 100).map((p, i) => (
                            <tr key={i} className="text-slate-600 hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-2 text-slate-400 font-mono border-r border-slate-100/50">{i + 1}</td>
                              {p.rawRow?.map((val, idx) => (
                                <td key={idx} className="px-4 py-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]" title={val}>
                                  {val}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {convertedPoints.length > 100 && (
                      <div className="px-4 py-2 bg-slate-100/50 border-t border-slate-100 text-center">
                        <p className="text-[10px] text-slate-400 font-medium italic">Showing first 100 of {convertedPoints.length.toLocaleString()} points</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-auto">
                    <button
                      onClick={() => setStep("upload")}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 text-sm transition-all"
                    >
                      Upload DXF Instead
                    </button>
                    <button
                      onClick={useConvertedPoints}
                      className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-blue-600 text-sm transition-all"
                    >
                      Visualize →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Upload DXF ────────────────────────────────────────────── */}
        {step === "upload" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Upload DXF File</h3>
            <p className="text-sm text-slate-500 mb-6">
              Upload an ASCII DXF file exported from AutoCAD. The system will extract all POINT, LINE and POLYLINE entities.
            </p>

            <input ref={dxfInputRef} type="file" accept=".dxf" onChange={handleDXFUpload} className="hidden" />

            <div
              onClick={() => dxfInputRef.current?.click()}
              className="border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all bg-primary/5 hover:bg-primary/10 group mb-6"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <p className="font-bold text-slate-700">Click to upload .dxf file</p>
              <p className="text-xs text-slate-400 mt-1">ASCII DXF format only. No size limit.</p>
            </div>

            {dxfFileName && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 mb-4">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                <p className="text-sm font-semibold text-emerald-700">{dxfFileName} loaded with {parsedPoints.length.toLocaleString()} points</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep("convert")} className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 text-sm transition-all">← Back: Convert File</button>
              {parsedPoints.length > 0 && (
                <button onClick={() => setStep("view")} className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-blue-600 text-sm transition-all">View Visualization →</button>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Visualize ─────────────────────────────────────────────── */}
        {step === "view" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Toolbar */}
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{chartTitle}</h3>
                <p className="text-sm text-slate-400">{parsedPoints.length.toLocaleString()} coordinate points rendered</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep("upload")}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 text-sm transition-all"
                >
                  ← Upload New DXF
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!isRendered}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-blue-600 text-sm transition-all disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Download PNG
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div className="p-6 bg-slate-50 flex items-center justify-center relative min-h-[400px]">
              {/* Loading Overlay */}
              {isLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-sm rounded-b-2xl">
                  <div className="relative flex items-center justify-center mb-5">
                    {/* Outer ring */}
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    {/* Inner ring */}
                    <div className="absolute w-10 h-10 rounded-full border-4 border-blue-300/30 border-b-blue-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.6s' }} />
                    {/* Center dot */}
                    <div className="absolute w-3 h-3 rounded-full bg-primary" />
                  </div>
                  <p className="text-sm font-bold text-slate-700 mb-1">Rendering Visualization…</p>
                  <p className="text-xs text-slate-400">{parsedPoints.length.toLocaleString()} points being plotted</p>
                  {/* Progress bar */}
                  <div className="mt-4 w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '70%' }} />
                  </div>
                </div>
              )}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 inline-block">
                <canvas
                  ref={canvasRef}
                  width={900}
                  height={600}
                  className={`block max-w-full transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                  style={{ maxWidth: "100%", height: "auto" }}
                />
              </div>
            </div>

            {/* Stats bar */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-6 text-xs font-medium text-slate-500">
              <span>Points: <strong className="text-slate-700">{parsedPoints.length.toLocaleString()}</strong></span>
              <span>Min X: <strong className="text-slate-700">{Math.min(...parsedPoints.map((p) => p.x)).toFixed(2)}</strong></span>
              <span>Max X: <strong className="text-slate-700">{Math.max(...parsedPoints.map((p) => p.x)).toFixed(2)}</strong></span>
              <span>Min Y: <strong className="text-slate-700">{Math.min(...parsedPoints.map((p) => p.y)).toFixed(2)}</strong></span>
              <span>Max Y: <strong className="text-slate-700">{Math.max(...parsedPoints.map((p) => p.y)).toFixed(2)}</strong></span>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-sm text-rose-700">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <p className="font-bold text-rose-800">Error</p>
              <p>{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
      </PageTransition>
    </>
  );
}
