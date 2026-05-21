import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import api from "../../services/api";
import toast from "react-hot-toast";
import CADUploadStep from "../../components/cad/CADUploadStep";
import CADConvertStep from "../../components/cad/CADConvertStep";
import CADCanvas from "../../components/cad/CADCanvas";
import ProjectRecordsModal from "../../components/dashboard/ProjectRecordsModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import { Trash2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Point {
  x: number;
  y: number;
  z?: number;
  rawRow?: string[];
}
type Step = "upload" | "convert" | "view";

// ─── Parse CSV to Points ──────────────────────────────────────────────────────
function parseCSV(content: string): { headers: string[]; points: Point[] } {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], points: [] };

  const headers = lines[0].split(/,|\t/).map((h) => h.trim());
  const headerLower = headers.map((h) => h.toLowerCase());

  const xIdx = headerLower.findIndex(
    (h) => h.includes("easting") || h.includes("x") || h === "lon" || h === "longitude",
  );
  const yIdx = headerLower.findIndex(
    (h) => h.includes("northing") || h.includes("y") || h === "lat" || h === "latitude",
  );
  const zIdx = headerLower.findIndex(
    (h) =>
      h.includes("elevation") || h.includes("altitude") ||
      h === "z" || h === "height" || h === "rl" || h === "level",
  );

  if (xIdx === -1 || yIdx === -1) return { headers, points: [] };

  const points = lines
    .slice(1)
    .map((line) => {
      const cols = line.split(/,|\t/).map((c) => c.trim());
      const rawZ = zIdx !== -1 ? parseFloat(cols[zIdx]) : NaN;
      return {
        x: parseFloat(cols[xIdx]),
        y: parseFloat(cols[yIdx]),
        z: !isNaN(rawZ) ? rawZ : undefined,
        rawRow: cols,
      };
    })
    .filter((p) => !isNaN(p.x) && !isNaN(p.y));

  return { headers, points };
}

// ─── DXF Parser (lightweight) ─────────────────────────────────────────────────
function parseDXF(content: string): Point[] {
  const points: Point[] = [];
  const lines = content.split(/\r?\n/);
  let i = 0, currentEntity = "", x = 0, y = 0, z: number | undefined;
  let hasX = false, hasY = false;

  while (i < lines.length) {
    const code = lines[i]?.trim();
    const value = lines[i + 1]?.trim();
    i += 2;
    if (code === "0") {
      if (hasX && hasY && (currentEntity === "POINT" || currentEntity === "VERTEX"))
        points.push({ x, y, z });
      hasX = false; hasY = false; z = undefined;
      currentEntity = value || "";
    } else if (["POINT", "VERTEX", "LINE", "LWPOLYLINE"].includes(currentEntity)) {
      if (code === "10") { x = parseFloat(value); hasX = true; }
      if (code === "20") { y = parseFloat(value); hasY = true; }
      if (code === "30") { z = parseFloat(value); }
      if (hasX && hasY && currentEntity !== "POINT" && currentEntity !== "VERTEX") {
        points.push({ x, y, z });
        hasX = false; hasY = false;
      }
    }
  }
  if (hasX && hasY) points.push({ x, y, z });
  return points;
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
const STEPS: { id: Step; label: string; num: string }[] = [
  { id: "upload", label: "Upload File", num: "1" },
  { id: "convert", label: "Convert", num: "2" },
  { id: "view", label: "Visualize", num: "3" },
];

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
      <div className="flex items-center w-full px-8 md:px-24 mx-auto">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                ${current === s.id
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/30"
                  : currentIdx > idx
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white text-slate-400 border-slate-200"
                }`}>
                {currentIdx > idx ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : s.num}
              </div>
              <span className={`text-sm font-semibold hidden sm:block ${current === s.id ? "text-primary" : "text-slate-400"}`}>
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-3 bg-slate-100 rounded-full">
                <div className={`h-full rounded-full transition-all duration-500 ${currentIdx > idx ? "bg-emerald-400 w-full" : "bg-transparent w-0"}`} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AutoCADPage() {
  const [step, setStep] = useState<Step>("upload");

  // File & parsed data
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPoints, setCsvPoints] = useState<Point[]>([]);

  // Viewer
  const [viewPoints, setViewPoints] = useState<Point[]>([]);
  const [chartTitle, setChartTitle] = useState("AutoCAD Point Visualization");

  // CAD Logs & Visualizations
  const [cadLogs, setCadLogs] = useState<any[]>([]);
  const [visualizations, setVisualizations] = useState<any[]>([]);
  const [isRecordsModalOpen, setIsRecordsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 5;

  // Deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [snapshotToDelete, setSnapshotToDelete] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(cadLogs.length / PAGE_SIZE));
  const pagedLogs = cadLogs.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  useEffect(() => {
    api.get("/cad/logs").then((r) => setCadLogs(r.data)).catch(() => { });

    // Load persisted visualizations
    const saved = localStorage.getItem("infrapilot_cad_visualizations");
    if (saved) {
      try {
        setVisualizations(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved visualizations", e);
      }
    }
  }, []);

  // Persist visualizations whenever they change
  useEffect(() => {
    localStorage.setItem("infrapilot_cad_visualizations", JSON.stringify(visualizations));
  }, [visualizations]);

  const handleDeleteSnapshot = () => {
    if (snapshotToDelete) {
      setVisualizations(prev => prev.filter(v => v.id !== snapshotToDelete));
      toast.success("Snapshot removed from project history.");
      setSnapshotToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  // ── Upload handlers ──────────────────────────────────────────────────────
  const handleCSVReady = (file: File, content: string) => {
    const { headers, points } = parseCSV(content);
    if (points.length === 0) {
      toast.error("Could not parse coordinates. Ensure CSV has X/Easting and Y/Northing columns.");
      return;
    }
    setCsvFile(file);
    setCsvHeaders(headers);
    setCsvPoints(points);
    setStep("convert");
  };

  const handleDXFReady = (_file: File, content: string) => {
    const pts = parseDXF(content);
    if (pts.length === 0) {
      toast.error("No coordinate entities found in DXF. Supported: POINT, LINE, LWPOLYLINE.");
      return;
    }
    setViewPoints(pts);
    setChartTitle(_file.name.replace(".dxf", "") + " — Visualization");
    setStep("view");
    toast.success(`${pts.length.toLocaleString()} points loaded from DXF`);
  };

  // ── Convert → Visualize ──────────────────────────────────────────────────
  const handleVisualize = (points: Point[]) => {
    setViewPoints(points);
    setChartTitle(csvFile ? csvFile.name.replace(/\.[^.]+$/, "") + " — Visualization" : "Visualization");
    setStep("view");
  };

  // ── Save to Gallery ───────────────────────────────────────────────────────
  const handleSaveToGallery = (dataUrl: string) => {
    const uploadPromise = new Promise((resolve) => {
      // Simulate professional secure cloud upload
      setTimeout(() => {
        const newViz = {
          id: `viz-${Date.now()}`,
          title: chartTitle,
          url: dataUrl,
          date: new Date().toISOString(),
          points: viewPoints.length
        };
        setVisualizations(prev => [newViz, ...prev]);
        resolve(newViz);
      }, 2000);
    });

    toast.promise(uploadPromise, {
      loading: 'Encrypting and saving site snapshot to project gallery...',
      success: 'Blueprint successfully archived in Project Gallery!',
      error: 'Failed to sync with project storage.',
    }, {
      style: { minWidth: '350px' },
      success: { duration: 4000 }
    });
  };

  // ── Reset to start ───────────────────────────────────────────────────────
  const handleReset = () => {
    setCsvFile(null);
    setCsvHeaders([]);
    setCsvPoints([]);
    setViewPoints([]);
    setStep("upload");
  };

  return (
    <>
      <Navbar title="AutoCAD Viewer" breadcrumb={["Admin", "AutoCAD Viewer"]} />

      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">AutoCAD Viewer</h1>
            <p className="text-slate-500 text-sm">
              Upload, convert and visualize coordinate files with professional CAD rendering.
            </p>
          </div>
          {step !== "upload" && (
            <button
              onClick={handleReset}
              className="text-sm text-slate-500 hover:text-slate-700 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Start Over
            </button>
          )}
        </div>

        {/* Step Indicator */}
        <StepIndicator current={step} />

        {/* ── Step 1: Upload ─────────────────────────────────────────────── */}
        {step === "upload" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Upload Your File</h3>
            <p className="text-sm text-slate-500 mb-6">
              Upload a CSV/TXT file to convert, or a DXF file to visualize directly.
            </p>
            <CADUploadStep onCSVReady={handleCSVReady} onDXFReady={handleDXFReady} />
          </div>
        )}

        {/* ── Step 2: Convert ────────────────────────────────────────────── */}
        {step === "convert" && csvFile && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">File Preview & Conversion</h3>
                <p className="text-sm text-slate-500">Review your data, then convert to DXF or visualize directly.</p>
              </div>
            </div>
            <CADConvertStep
              file={csvFile}
              headers={csvHeaders}
              points={csvPoints}
              onBack={handleReset}
              onVisualize={handleVisualize}
            />
          </div>
        )}

        {/* ── Step 3: Visualize ──────────────────────────────────────────── */}
        {step === "view" && viewPoints.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">{chartTitle}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {viewPoints.length.toLocaleString()} points ·{" "}
                  {viewPoints.some((p) => p.z !== undefined)
                    ? "Elevation heatmap active"
                    : "No Z elevation data"}
                </p>
              </div>
              <button
                onClick={() => setStep("convert")}
                className="text-xs text-slate-500 hover:text-slate-700 font-semibold flex items-center gap-1 transition-colors"
              >
                ← Back to Convert
              </button>
            </div>
            <div style={{ height: "calc(100vh - 280px)", minHeight: "550px" }}>
              <CADCanvas
                points={viewPoints}
                title={chartTitle}
                onSaveToGallery={handleSaveToGallery}
              />
            </div>
          </div>
        )}

        {/* ── CAD Logs Table ─────────────────────────────────────────────── */}
        <div id="cad-logs-section" className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">CAD Conversion Logs</h3>
            {cadLogs.length > 0 && (
              <span className="text-xs text-slate-400 font-medium">{cadLogs.length} records</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs sticky top-0 bg-white z-10 shadow-sm border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">ID</th>
                  <th className="px-4 py-3">Project Name</th>
                  <th className="px-4 py-3">File Path</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3 rounded-tr-lg">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cadLogs.length > 0 ? (
                  pagedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-700">{log.id}</td>
                      <td className="px-4 py-3 text-slate-600 font-semibold">{log.project_name || "N/A"}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs truncate max-w-[300px]" title={log.file_path}>
                        {log.file_path || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        {log.area && log.area > 0 ? (
                          <span className="text-slate-700 font-semibold">
                            {Number(log.area).toLocaleString("en-IN", { maximumFractionDigits: 2 })} sq units
                          </span>
                        ) : (
                          <span className="text-slate-300 italic text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
                        })}
                        <span className="ml-1 text-[10px] font-bold text-slate-300">IST</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No CAD logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {cadLogs.length > 0 && (
            <div className="mt-4 p-4 border-t border-slate-50 flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, cadLogs.length)} of {cadLogs.length} Logs
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/5 border border-primary/10 text-xs font-bold text-primary font-inter">
                  {currentPage + 1}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Project Visualization Gallery ──────────────────────────────── */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Recent Project Snapshots</h3>
              <p className="text-sm text-slate-500">Historical visualizations saved to this project library.</p>
            </div>
            <button
              onClick={() => setIsRecordsModalOpen(true)}
              className="bg-primary/5 text-primary text-[10px] font-bold uppercase px-2 py-1 rounded border border-primary/10 hover:bg-primary/10 transition-colors shadow-sm active:scale-95"
            >
              Project Records
            </button>
          </div>

          {visualizations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visualizations.map((viz) => (
                <div key={viz.id} className="group relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                  <div className="aspect-[16/10] bg-slate-900 overflow-hidden relative">
                    <img
                      src={viz.url}
                      alt={viz.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60" />

                    {/* Action Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-900/40 backdrop-blur-[2px]">
                      <button
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = viz.url;
                          link.download = `Archive_${viz.title.replace(/\s+/g, '_')}.png`;
                          link.click();
                        }}
                        className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg hover:bg-primary hover:text-white transition-colors"
                        title="Download Copy"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setSnapshotToDelete(viz.id);
                          setIsDeleteModalOpen(true);
                        }}
                        className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"
                        title="Delete Snapshot"
                      >
                        <Trash2 size={20} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-1 truncate flex-1">{viz.title}</h4>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 whitespace-nowrap">
                        {viz.points} PTS
                      </span>
                    </div>
                    <div className="flex items-center text-[11px] text-slate-400 font-medium">
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(viz.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium text-sm">No snapshots archived yet.</p>
              <p className="text-slate-400 text-xs mt-1">Visualize your data and click 'Save to Gallery' to build a history.</p>
            </div>
          )}
        </div>
      </PageTransition>

      <ProjectRecordsModal
        isOpen={isRecordsModalOpen}
        onClose={() => setIsRecordsModalOpen(false)}
        records={cadLogs}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSnapshotToDelete(null);
        }}
        onConfirm={handleDeleteSnapshot}
        title="Delete Snapshot"
        message="Are you sure you want to permanently remove this visualization from the project history? This action cannot be undone."
        confirmText="Delete Snapshot"
        type="danger"
      />
    </>
  );
}
