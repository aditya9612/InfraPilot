import { useRef, useState, useCallback } from "react";

interface FileInfo {
  file: File;
  type: "csv" | "dxf" | "txt";
  sizeLabel: string;
}

interface CADUploadStepProps {
  onCSVReady: (file: File, content: string) => void;
  onDXFReady: (file: File, content: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CADUploadStep({ onCSVReady, onDXFReady }: CADUploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  const processFile = useCallback((file: File) => {
    setError(null);
    const name = file.name.toLowerCase();
    let type: FileInfo["type"] | null = null;

    if (name.endsWith(".csv") || name.endsWith(".txt")) type = name.endsWith(".csv") ? "csv" : "txt";
    else if (name.endsWith(".dxf")) type = "dxf";
    else {
      setError("Unsupported file type. Please upload a .csv, .txt, or .dxf file.");
      return;
    }

    setFileInfo({ file, type, sizeLabel: formatSize(file.size) });
    setIsReading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setIsReading(false);
      if (type === "dxf") {
        onDXFReady(file, content);
      } else {
        onCSVReady(file, content);
      }
    };
    reader.onerror = () => {
      setIsReading(false);
      setError("Failed to read file. Please try again.");
    };
    reader.readAsText(file);
  }, [onCSVReady, onDXFReady]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const typeColor: Record<string, string> = {
    csv: "bg-emerald-50 text-emerald-700 border-emerald-200",
    txt: "bg-blue-50 text-blue-700 border-blue-200",
    dxf: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const typeIcon: Record<string, string> = {
    csv: "📊",
    txt: "📄",
    dxf: "📐",
  };

  const typeRoute: Record<string, string> = {
    csv: "→ Will proceed to Convert step",
    txt: "→ Will proceed to Convert step",
    dxf: "→ Will jump directly to Visualize step",
  };

  return (
    <div className="max-w-2xl mx-auto">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.txt,.dxf"
        className="hidden"
        onChange={handleChange}
      />

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group
          ${isDragging
            ? "border-primary bg-primary/10 scale-[1.01]"
            : fileInfo
              ? "border-slate-200 bg-slate-50"
              : "border-slate-200 bg-white hover:border-primary/50 hover:bg-primary/5"
          }`}
      >
        {/* Animated upload icon */}
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300
          ${isDragging ? "bg-primary/20 scale-110" : "bg-slate-100 group-hover:bg-primary/10 group-hover:scale-105"}`}>
          {isReading ? (
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          ) : (
            <svg className={`w-10 h-10 transition-colors ${isDragging ? "text-primary" : "text-slate-400 group-hover:text-primary"}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}
        </div>

        <p className="text-base font-bold text-slate-700 mb-1">
          {isDragging ? "Drop your file here" : isReading ? "Reading file..." : "Drag & Drop or Click to Upload"}
        </p>
        <p className="text-sm text-slate-400">
          Supports <span className="font-semibold text-emerald-600">.csv</span>{" "}
          <span className="font-semibold text-blue-600">.txt</span>{" "}
          <span className="font-semibold text-purple-600">.dxf</span> files
        </p>

        {/* Accepted format badges */}
        <div className="flex gap-2 mt-5">
          {[
            { ext: ".CSV", desc: "Coordinate data", color: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
            { ext: ".TXT", desc: "Survey export", color: "bg-blue-50 text-blue-700 border border-blue-100" },
            { ext: ".DXF", desc: "AutoCAD drawing", color: "bg-purple-50 text-purple-700 border border-purple-100" },
          ].map((f) => (
            <div key={f.ext} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${f.color}`}>
              {f.ext}
              <span className="ml-1.5 font-normal opacity-70">{f.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-sm text-rose-700">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Selected file info */}
      {fileInfo && !isReading && (
        <div className={`mt-4 p-4 border rounded-xl flex items-center gap-4 ${typeColor[fileInfo.type]}`}>
          <span className="text-2xl">{typeIcon[fileInfo.type]}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{fileInfo.file.name}</p>
            <p className="text-xs opacity-70">{fileInfo.sizeLabel} · {typeRoute[fileInfo.type]}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setFileInfo(null); setError(null); }}
            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Format hint */}
      <div className="mt-5 p-4 bg-amber-50 border border-amber-100 rounded-xl">
        <p className="text-xs font-bold text-amber-700 mb-2">📋 Expected CSV/TXT Column Format:</p>
        <code className="text-xs text-amber-600 font-mono leading-relaxed block">
          Easting,Northing,Elevation<br />
          367650.12,200145.45,225.30<br />
          367660.33,200160.78,227.15
        </code>
      </div>
    </div>
  );
}
