import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";

interface ExcelPreviewProps {
  url: string;
}

const ExcelPreview: React.FC<ExcelPreviewProps> = ({ url }) => {
  const [data, setData] = useState<any[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.arrayBuffer();
      })
      .then(buffer => {
        if (!isMounted) return;
        try {
          const workbook = XLSX.read(buffer, { type: "array" });
          setSheetNames(workbook.SheetNames);
          
          if (workbook.SheetNames.length > 0) {
            const firstSheet = workbook.SheetNames[0];
            setActiveSheet(firstSheet);
            const worksheet = workbook.Sheets[firstSheet];
            const json = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
            setData(json);
          }
          setLoading(false);
        } catch (err) {
          throw err;
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, [url]);

  const loadSheet = (sheetName: string) => {
    setActiveSheet(sheetName);
    setLoading(true);
    fetch(url)
      .then(res => res.arrayBuffer())
      .then(buffer => {
        const workbook = XLSX.read(buffer, { type: "array" });
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        setData(json);
        setLoading(false);
      });
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-slate-500 font-medium">Failed to load Excel preview.</div>;
  }

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200">
      {sheetNames.length > 1 && (
        <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50">
          {sheetNames.map(name => (
            <button
              key={name}
              onClick={() => loadSheet(name)}
              className={`px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
                activeSheet === name 
                  ? "bg-white text-primary border-b-2 border-primary" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-auto relative p-0">
        {loading && (
           <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex justify-center items-center z-10">
             <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
           </div>
        )}
        <table className="w-full text-left text-xs border-collapse">
          <tbody>
            {data.slice(0, 100).map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-slate-100 hover:bg-slate-50">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className={`p-2 border-r border-slate-100 min-w-[50px] max-w-[200px] truncate ${rowIndex === 0 ? "bg-slate-50 font-bold" : ""}`} title={String(cell || "")}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 100 && (
          <div className="p-2 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
            Showing first 100 rows. Download to view full file.
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelPreview;
