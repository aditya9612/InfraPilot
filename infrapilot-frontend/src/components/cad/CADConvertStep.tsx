import api from "../../services/api";
import toast from "react-hot-toast";
import { useState } from "react";

interface ParsedPoint {
  x: number;
  y: number;
  z?: number;
  rawRow?: string[];  // optional — matches the Point type in AutoCADPage
}

interface CADConvertStepProps {
  file: File;
  headers: string[];
  points: ParsedPoint[];
  onBack: () => void;
  onVisualize: (points: ParsedPoint[]) => void;
}

export default function CADConvertStep({
  file,
  headers,
  points,
  onBack,
  onVisualize,
}: CADConvertStepProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [hasConverted, setHasConverted] = useState(false);

  // Compute stats
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const zs = points.filter((p) => p.z !== undefined).map((p) => p.z!);
  const hasZ = zs.length > 0;

  const stats = {
    minX: Math.min(...xs).toFixed(3),
    maxX: Math.max(...xs).toFixed(3),
    minY: Math.min(...ys).toFixed(3),
    maxY: Math.max(...ys).toFixed(3),
    minZ: hasZ ? Math.min(...zs).toFixed(3) : null,
    maxZ: hasZ ? Math.max(...zs).toFixed(3) : null,
    avgZ: hasZ ? (zs.reduce((a, b) => a + b, 0) / zs.length).toFixed(3) : null,
  };

  const handleConvert = async () => {
    setIsConverting(true);
    const toastId = toast.loading("Converting CSV → DXF...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/cad/csv-to-dxf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.name.replace(/\.[^/.]+$/, "") + ".dxf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setHasConverted(true);
      toast.success("DXF downloaded successfully!", { id: toastId });
    } catch {
      toast.error("Conversion failed. Please check the file format.", { id: toastId });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left: Data Preview */}
      <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Data Preview</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {points.length.toLocaleString()} points detected from{" "}
              <span className="font-semibold italic">{file.name}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {hasZ && (
              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-lg border border-purple-100 uppercase tracking-wider">
                Z Elevation ✓
              </span>
            )}
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100 uppercase tracking-wider">
              {points.length.toLocaleString()} Points
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-100 overflow-hidden max-h-[320px] overflow-y-auto">
          <table className="w-full text-xs min-w-full">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2.5 text-left text-slate-400">#</th>
                {headers.map((h, i) => (
                  <th key={i} className="px-3 py-2.5 text-left whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {points.slice(0, 50).map((p, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2 text-slate-300 font-mono">{i + 1}</td>
                  {(p.rawRow ?? [p.x.toString(), p.y.toString(), ...(p.z !== undefined ? [p.z.toString()] : [])]).map((val, j) => (
                    <td
                      key={j}
                      className="px-3 py-2 font-mono text-slate-600 whitespace-nowrap max-w-[160px] overflow-hidden text-ellipsis"
                      title={val}
                    >
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {points.length > 50 && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 italic">
              Showing 50 of {points.length.toLocaleString()} points
            </div>
          )}
        </div>
      </div>

      {/* Right: Stats + Actions */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        {/* Bounding Box Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h4 className="text-sm font-bold text-slate-700 mb-3">Bounding Box</h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Min X", value: stats.minX, color: "text-slate-700" },
              { label: "Max X", value: stats.maxX, color: "text-slate-700" },
              { label: "Min Y", value: stats.minY, color: "text-slate-700" },
              { label: "Max Y", value: stats.maxY, color: "text-slate-700" },
            ].map((s) => (
              <div key={s.label} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{s.label}</p>
                <p className={`text-xs font-mono font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {hasZ && (
            <>
              <h4 className="text-sm font-bold text-slate-700 mt-4 mb-3">Elevation (Z)</h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Min Z", value: `${stats.minZ} m`, color: "bg-blue-50 border-blue-100 text-blue-700" },
                  { label: "Max Z", value: `${stats.maxZ} m`, color: "bg-red-50 border-red-100 text-red-700" },
                  { label: "Avg Z", value: `${stats.avgZ} m`, color: "bg-amber-50 border-amber-100 text-amber-700" },
                ].map((s) => (
                  <div key={s.label} className={`p-2.5 rounded-xl border ${s.color}`}>
                    <p className="text-[10px] uppercase font-bold opacity-60 mb-1">{s.label}</p>
                    <p className="text-xs font-mono font-bold">{s.value}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3">
          <h4 className="text-sm font-bold text-slate-700">Actions</h4>

          {/* Convert to DXF */}
          <button
            onClick={handleConvert}
            disabled={isConverting}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isConverting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {hasConverted ? "Re-convert to DXF" : "Convert to DXF"}
              </>
            )}
          </button>

          {hasConverted && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              DXF downloaded successfully
            </div>
          )}

          {/* Visualize directly */}
          <button
            onClick={() => onVisualize(points)}
            className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Visualize Points →
          </button>

          <button
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium"
          >
            ← Upload Different File
          </button>
        </div>
      </div>
    </div>
  );
}
