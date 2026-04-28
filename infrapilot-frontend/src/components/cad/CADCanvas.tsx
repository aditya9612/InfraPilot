import { useRef, useEffect, useCallback, useState } from "react";

interface Point {
  x: number;
  y: number;
  z?: number;
}

interface CADCanvasProps {
  points: Point[];
  title: string;
  onDownloadRef?: (fn: () => void) => void;
}

// ─── Color by elevation ────────────────────────────────────────────────────────
function elevationColor(z: number, minZ: number, maxZ: number): string {
  const t = maxZ === minZ ? 0.5 : (z - minZ) / (maxZ - minZ);
  const stops = [
    [41, 128, 185],
    [39, 174, 96],
    [241, 196, 15],
    [231, 76, 60],
  ];
  const seg = t * (stops.length - 1);
  const i = Math.min(Math.floor(seg), stops.length - 2);
  const f = seg - i;
  const [r1, g1, b1] = stops[i];
  const [r2, g2, b2] = stops[i + 1];
  return `rgb(${Math.round(r1+(r2-r1)*f)},${Math.round(g1+(g2-g1)*f)},${Math.round(b1+(b2-b1)*f)})`;
}

export default function CADCanvas({ points, title, onDownloadRef }: CADCanvasProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef   = useRef<HTMLDivElement>(null);

  const transform  = useRef({ x: 0, y: 0, scale: 1 });
  const isPanning  = useRef(false);
  const lastMouse  = useRef({ x: 0, y: 0 });
  const bounds     = useRef({ minX: 0, maxX: 1, minY: 0, maxY: 1, minZ: 0, maxZ: 1 });

  const hasZ = points.some((p) => p.z !== undefined);

  const [coords, setCoords]       = useState({ x: 0, y: 0, z: undefined as number | undefined });
  const [zoom, setZoom]           = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Compute bounds ────────────────────────────────────────────────────────
  useEffect(() => {
    if (points.length === 0) return;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const zs = points.filter((p) => p.z !== undefined).map((p) => p.z!);
    bounds.current = {
      minX: Math.min(...xs), maxX: Math.max(...xs),
      minY: Math.min(...ys), maxY: Math.max(...ys),
      minZ: zs.length ? Math.min(...zs) : 0,
      maxZ: zs.length ? Math.max(...zs) : 1,
    };
  }, [points]);

  // ── Render ────────────────────────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x: ox, y: oy, scale } = transform.current;
    const { minX, maxX, minY, maxY, minZ, maxZ } = bounds.current;
    const W = canvas.width, H = canvas.height;
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    const toCanvasX = (wx: number) => ox + ((wx - minX) / rangeX) * W * scale;
    const toCanvasY = (wy: number) => oy + H - ((wy - minY) / rangeY) * H * scale;

    // Background
    ctx.fillStyle = "#0f1117";
    ctx.fillRect(0, 0, W, H);

    // Grid
    const gs = 80;
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let gx = ox % gs; gx < W; gx += gs) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke(); }
    for (let gy = oy % gs; gy < H; gy += gs) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke(); }

    // Axes
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(0, toCanvasY(minY)); ctx.lineTo(W, toCanvasY(minY)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(toCanvasX(minX), 0); ctx.lineTo(toCanvasX(minX), H); ctx.stroke();
    ctx.setLineDash([]);

    // Points
    const r = Math.max(2, Math.min(6, 6000 / points.length));
    for (const p of points) {
      const cx = toCanvasX(p.x);
      const cy = toCanvasY(p.y);
      if (cx < -r || cx > W + r || cy < -r || cy > H + r) continue;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = hasZ && p.z !== undefined ? elevationColor(p.z, minZ, maxZ) : "#38bdf8";
      ctx.fill();
    }

    // Z Legend
    if (hasZ) {
      const lx = W - 24, ly = 60, lh = Math.min(200, H - 100);
      const grad = ctx.createLinearGradient(0, ly, 0, ly + lh);
      grad.addColorStop(0, "rgb(231,76,60)");
      grad.addColorStop(0.33, "rgb(241,196,15)");
      grad.addColorStop(0.66, "rgb(39,174,96)");
      grad.addColorStop(1, "rgb(41,128,185)");
      ctx.fillStyle = grad;
      ctx.fillRect(lx, ly, 10, lh);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.strokeRect(lx, ly, 10, lh);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${maxZ.toFixed(1)}m`, lx - 4, ly + 10);
      ctx.fillText(`${minZ.toFixed(1)}m`, lx - 4, ly + lh);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "9px monospace";
      ctx.fillText("Elev.", lx - 4, ly - 4);
    }

    // Title
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(title, 16, 24);

    // Count
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${points.length.toLocaleString()} pts`, W - 16, H - 12);
  }, [points, title, hasZ]);

  // ── Fit extents ───────────────────────────────────────────────────────────
  const fitExtents = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;
    const W = canvas.width, H = canvas.height;
    const { minX, maxX, minY, maxY } = bounds.current;
    const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1;
    const pad = 0.1;
    const s = Math.min(W / (rangeX * (1 + pad)), H / (rangeY * (1 + pad)));
    transform.current = { x: (W - rangeX * s) / 2, y: (H - rangeY * s) / 2, scale: s };
    setZoom(Math.round(s * 100));
    render();
  }, [points, render]);

  useEffect(() => { if (points.length > 0) setTimeout(fitExtents, 50); }, [points, fitExtents]);

  // ── Pixel helper: display px → canvas px ──────────────────────────────────
  const toCanvasPx = (clientX: number, clientY: number, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width  / rect.width),
      y: (clientY - rect.top)  * (canvas.height / rect.height),
    };
  };

  // ── Find nearest point's Z (within 25px canvas radius) ───────────────────
  const nearestZ = useCallback((mx: number, my: number): number | undefined => {
    if (!hasZ) return undefined;
    const { x: ox, y: oy, scale } = transform.current;
    const { minX, maxX, minY, maxY } = bounds.current;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const W = canvas.width, H = canvas.height;
    const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1;
    const toCanvasX = (wx: number) => ox + ((wx - minX) / rangeX) * W * scale;
    const toCanvasY = (wy: number) => oy + H - ((wy - minY) / rangeY) * H * scale;

    let best: number | undefined;
    let bestDist = 25 * 25; // 25px threshold squared
    // Sample up to 2000 points for performance
    const step = Math.max(1, Math.floor(points.length / 2000));
    for (let i = 0; i < points.length; i += step) {
      const p = points[i];
      if (p.z === undefined) continue;
      const dx = toCanvasX(p.x) - mx;
      const dy = toCanvasY(p.y) - my;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDist) { bestDist = d2; best = p.z; }
    }
    return best;
  }, [points, hasZ]);

  // ── Wheel zoom ────────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x: mx, y: my } = toCanvasPx(e.clientX, e.clientY, canvas);
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    transform.current.x = mx + (transform.current.x - mx) * factor;
    transform.current.y = my + (transform.current.y - my) * factor;
    transform.current.scale *= factor;
    setZoom(Math.round(transform.current.scale * 100));
    render();
  }, [render]);

  // ── Pan ───────────────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1 || e.button === 2) {
      isPanning.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x: mx, y: my } = toCanvasPx(e.clientX, e.clientY, canvas);

    const { x: ox, y: oy, scale } = transform.current;
    const { minX, maxX, minY, maxY } = bounds.current;
    const W = canvas.width, H = canvas.height;
    const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1;
    const wx = minX + ((mx - ox) / (W * scale)) * rangeX;
    const wy = minY + ((H - (my - oy)) / (H * scale)) * rangeY;
    const z  = nearestZ(mx, my);
    setCoords({ x: +wx.toFixed(3), y: +wy.toFixed(3), z });

    if (isPanning.current) {
      const rect = canvas.getBoundingClientRect();
      const sx = canvas.width  / rect.width;
      const sy = canvas.height / rect.height;
      transform.current.x += (e.clientX - lastMouse.current.x) * sx;
      transform.current.y += (e.clientY - lastMouse.current.y) * sy;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      render();
    }
  }, [render, nearestZ]);

  const handleMouseUp   = () => { isPanning.current = false; };

  // ── Zoom buttons ──────────────────────────────────────────────────────────
  const zoomStep = useCallback((factor: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    transform.current.x     = cx + (transform.current.x - cx) * factor;
    transform.current.y     = cy + (transform.current.y - cy) * factor;
    transform.current.scale *= factor;
    setZoom(Math.round(transform.current.scale * 100));
    render();
  }, [render]);

  const zoomIn  = () => zoomStep(1.25);
  const zoomOut = () => zoomStep(0.80);

  // ── Fullscreen toggle ─────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Re-render after fullscreen change
  useEffect(() => { setTimeout(() => { fitExtents(); }, 100); }, [isFullscreen, fitExtents]);

  // ── Wheel listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `cad_view_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  useEffect(() => { if (onDownloadRef) onDownloadRef(handleDownload); }, [handleDownload, onDownloadRef]);

  return (
    <div ref={wrapperRef} className="flex flex-col h-full bg-[#0f1117]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] border-b border-white/10 shrink-0">
        <button onClick={fitExtents}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          title="Zoom to Extents">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          Extents
        </button>

        {/* Zoom controls */}
        <div className="flex items-center bg-white/5 rounded-lg overflow-hidden border border-white/10">
          <button onClick={zoomOut} className="px-3 py-1.5 text-slate-300 hover:text-white hover:bg-white/10 transition-all text-base font-bold leading-none">−</button>
          <span className="px-3 text-xs font-mono text-slate-400 border-x border-white/10 min-w-[60px] text-center">{zoom}%</span>
          <button onClick={zoomIn}  className="px-3 py-1.5 text-slate-300 hover:text-white hover:bg-white/10 transition-all text-base font-bold leading-none">+</button>
        </div>

        <div className="flex-1" />
        <span className="text-[10px] text-slate-500 font-medium hidden lg:block">
          🖱 Scroll to zoom · Left-drag to pan
        </span>

        {/* Export PNG */}
        <button onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all border border-white/10">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export PNG
        </button>

        {/* Fullscreen toggle */}
        <button onClick={toggleFullscreen}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all border border-white/10"
          title={isFullscreen ? "Exit Fullscreen" : "Maximize"}>
          {isFullscreen ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
          {isFullscreen ? "Exit" : "Maximize"}
        </button>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 relative bg-[#0f1117] overflow-hidden min-h-0">
        <canvas
          ref={canvasRef}
          width={1400}
          height={800}
          style={{ width: "100%", height: "100%", cursor: isPanning.current ? "grabbing" : "crosshair", display: "block" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onContextMenu={handleContextMenu}
        />
      </div>

      {/* Coordinate Bar */}
      <div className="flex items-center gap-6 px-5 py-2 bg-[#1a1a2e] border-t border-white/10 text-[11px] font-mono shrink-0">
        <span className="text-slate-500">
          X: <strong className="text-slate-300">{coords.x.toLocaleString("en-IN", { maximumFractionDigits: 3 })}</strong>
        </span>
        <span className="text-slate-500">
          Y: <strong className="text-slate-300">{coords.y.toLocaleString("en-IN", { maximumFractionDigits: 3 })}</strong>
        </span>
        {hasZ && (
          <span className="text-slate-500">
            Z (Elev):{" "}
            <strong className={coords.z !== undefined ? "text-amber-400" : "text-slate-600"}>
              {coords.z !== undefined ? `${coords.z.toFixed(3)} m` : "—"}
            </strong>
          </span>
        )}
        <span className="ml-auto text-slate-500">
          Points: <strong className="text-slate-300">{points.length.toLocaleString()}</strong>
        </span>
        <span className="text-slate-500">
          Zoom: <strong className="text-slate-300">{zoom}%</strong>
        </span>
      </div>
    </div>
  );
}
