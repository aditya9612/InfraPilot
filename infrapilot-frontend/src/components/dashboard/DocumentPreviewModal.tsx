import React from "react";
import Modal from "../common/Modal";
import { FileText, Download, Info, Calendar, HardDrive } from "lucide-react";
import ExcelPreview from "./ExcelPreview";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: any | null;
  onDownload?: (doc: any) => void;
}

type FileCategory = "pdf" | "image" | "excel" | "office" | "other";

const resolveFileUrl = (path: string | null | undefined): string => {
  if (!path) return "";
  if (
    path.startsWith("blob:") ||
    path.startsWith("data:") ||
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const apiUrl = import.meta.env.VITE_API_URL || "";
  if (apiUrl.startsWith("http")) {
    const origin = apiUrl.replace(/\/api\/v1\/?$/, "");
    return `${origin}${cleanPath}`;
  }
  return cleanPath;
};

const detectMimeAndCategory = (
  buffer: ArrayBuffer,
  declaredContentType?: string,
  fileName?: string
): { mime: string; category: FileCategory } => {
  const bytes = new Uint8Array(buffer.slice(0, 32));
  const lowerName = (fileName || "").toLowerCase();

  // 1. Magic bytes detection
  // PDF: %PDF (0x25, 0x50, 0x44, 0x46)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return { mime: "application/pdf", category: "pdf" };
  }

  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return { mime: "image/png", category: "image" };
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", category: "image" };
  }

  // GIF: GIF87a / GIF89a (47 49 46 38)
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return { mime: "image/gif", category: "image" };
  }

  // WEBP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { mime: "image/webp", category: "image" };
  }

  // BMP: 0x42 0x4D
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return { mime: "image/bmp", category: "image" };
  }

  // ZIP / OpenDocument / MS Office (PK\x03\x04: 50 4B 03 04)
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls") || lowerName.endsWith(".csv")) {
      return { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", category: "excel" };
    }
    if (lowerName.endsWith(".docx") || lowerName.endsWith(".pptx") || lowerName.endsWith(".doc") || lowerName.endsWith(".ppt")) {
      return { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", category: "office" };
    }
    return { mime: "application/octet-stream", category: "office" };
  }

  // SVG / XML detection
  try {
    const textSnippet = new TextDecoder().decode(bytes).trim().toLowerCase();
    if (textSnippet.startsWith("<svg") || (textSnippet.startsWith("<?xml") && textSnippet.includes("<svg"))) {
      return { mime: "image/svg+xml", category: "image" };
    }
  } catch {}

  // 2. Server declared content-type
  if (declaredContentType) {
    const ct = declaredContentType.toLowerCase();
    if (ct.includes("application/pdf")) return { mime: "application/pdf", category: "pdf" };
    if (ct.startsWith("image/")) return { mime: ct, category: "image" };
    if (ct.includes("spreadsheet") || ct.includes("excel") || ct.includes("csv")) return { mime: ct, category: "excel" };
    if (ct.includes("word") || ct.includes("presentation") || ct.includes("officedocument") || ct.includes("msword")) return { mime: ct, category: "office" };
  }

  // 3. Filename extension fallback
  if (lowerName.endsWith(".pdf")) return { mime: "application/pdf", category: "pdf" };
  if (lowerName.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/)) return { mime: "image/jpeg", category: "image" };
  if (lowerName.match(/\.(xls|xlsx|csv)$/)) return { mime: "application/vnd.ms-excel", category: "excel" };
  if (lowerName.match(/\.(doc|docx|ppt|pptx)$/)) return { mime: "application/msword", category: "office" };

  // Safest default for documents is PDF
  return { mime: "application/pdf", category: "pdf" };
};

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document,
  onDownload,
}) => {
  const [localUrl, setLocalUrl] = React.useState<string>("");
  const [category, setCategory] = React.useState<FileCategory>("pdf");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isValidDoc, setIsValidDoc] = React.useState<boolean>(true);

  React.useEffect(() => {
    let isMounted = true;
    let createdBlobUrl = "";

    if (isOpen && document && !document.isFolder) {
      setIsLoading(true);
      setIsValidDoc(true);

      const loadContent = async () => {
        try {
          const userString = localStorage.getItem("infrapilot_user");
          const token = userString ? JSON.parse(userString)?.token?.access_token || JSON.parse(userString)?.token : null;
          const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

          let rawUrl = document.file_url || document.upload_file || document.previewUrl || "";
          let buffer: ArrayBuffer | null = null;
          let contentTypeHeader = document.contentType || document.content_type || "";

          // Case 1: file_url is already a blob: or data: URL
          if (rawUrl.startsWith("blob:") || rawUrl.startsWith("data:")) {
            try {
              const blobRes = await fetch(rawUrl);
              if (blobRes.ok) {
                buffer = await blobRes.arrayBuffer();
                contentTypeHeader = blobRes.headers.get("content-type") || contentTypeHeader;
              }
            } catch {}
            if (!buffer) {
              if (!isMounted) return;
              setLocalUrl(rawUrl);
              const fileName = document.name || document.title || document.drawing_name || "";
              setCategory(fileName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? "image" : "pdf");
              setIsLoading(false);
              return;
            }
          }

          // Case 2: We have a relative or absolute URL in rawUrl
          if (!buffer && rawUrl) {
            const resolved = resolveFileUrl(rawUrl);
            try {
              const res = await fetch(resolved, { headers: authHeaders });
              if (res.ok) {
                const ct = res.headers.get("content-type") || "";
                if (!ct.includes("application/json") || rawUrl.endsWith(".json")) {
                  buffer = await res.arrayBuffer();
                  contentTypeHeader = ct;
                } else {
                  // If JSON returned, check if it contains a nested file_url
                  const jsonData = await res.json();
                  const nestedUrl = jsonData?.file_url || jsonData?.url || jsonData?.download_url;
                  if (nestedUrl) {
                    const nestedResolved = resolveFileUrl(nestedUrl);
                    const nestedRes = await fetch(nestedResolved, { headers: authHeaders });
                    if (nestedRes.ok) {
                      buffer = await nestedRes.arrayBuffer();
                      contentTypeHeader = nestedRes.headers.get("content-type") || "";
                    }
                  }
                }
              }
            } catch (e) {
              console.warn("Direct file fetch failed, falling back to API endpoints", e);
            }
          }

          // Case 3: Fallback to API endpoints if buffer not yet obtained and document.id exists
          if (!buffer && document.id) {
            const { default: api } = await import("../../services/api");
            const endpoint = document.isDrawing
              ? `/drawings/documents/view/${document.id}`
              : `/documents/${document.id}/download`;

            try {
              const apiRes = await api.get(endpoint);
              const data = apiRes.data;
              const fetchedUrl = data?.file_url || data?.url || data?.download_url;
              if (fetchedUrl) {
                const resolved = resolveFileUrl(fetchedUrl);
                const fetchRes = await fetch(resolved, { headers: authHeaders });
                if (fetchRes.ok) {
                  buffer = await fetchRes.arrayBuffer();
                  contentTypeHeader = fetchRes.headers.get("content-type") || "";
                }
              } else if (data instanceof ArrayBuffer) {
                buffer = data;
              } else if (data instanceof Blob) {
                buffer = await data.arrayBuffer();
              }
            } catch {
              // Try raw blob download endpoint fallback
              try {
                const blobRes = await api.get(endpoint, { responseType: "blob" });
                if (blobRes.data && blobRes.data.size > 0) {
                  const ct = blobRes.headers["content-type"] || blobRes.data.type || "";
                  if (!ct.includes("application/json")) {
                    buffer = await blobRes.data.arrayBuffer();
                    contentTypeHeader = ct;
                  }
                }
              } catch {}
            }
          }

          if (!buffer || buffer.byteLength === 0) {
            throw new Error("File content could not be retrieved from server.");
          }

          const fileName = document.name || document.title || document.drawing_name || document.originalFileName || "";
          const detection = detectMimeAndCategory(buffer, contentTypeHeader, fileName);

          const finalBlob = new Blob([buffer], { type: detection.mime });
          createdBlobUrl = window.URL.createObjectURL(finalBlob);

          if (!isMounted) return;
          setLocalUrl(createdBlobUrl);
          setCategory(detection.category);
          setIsValidDoc(true);
          setIsLoading(false);
        } catch (err) {
          console.error("Document preview loading failed:", err);
          if (!isMounted) return;
          setIsValidDoc(false);
          setIsLoading(false);
        }
      };

      loadContent();
    } else {
      setLocalUrl("");
      setIsValidDoc(true);
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      if (createdBlobUrl) window.URL.revokeObjectURL(createdBlobUrl);
    };
  }, [isOpen, document?.id, document?.file_url]);

  if (!document) return null;

  const handleDownloadClick = () => {
    if (onDownload) {
      onDownload(document);
    } else if (localUrl) {
      const link = window.document.createElement("a");
      link.href = localUrl;
      const ext = category === "pdf" ? ".pdf" : category === "image" ? ".png" : "";
      const docName = document.name || document.title || document.drawing_name || "document";
      link.download = docName.includes(".") ? docName : `${docName}${ext}`;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  const resolvedUrlForOffice = resolveFileUrl(document.file_url || localUrl);

  const footer = (
    <div className="flex gap-3 w-full sm:w-auto">
      <button
        onClick={onClose}
        className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
      >
        Close
      </button>
      {!document.isFolder && (
        <button
          onClick={handleDownloadClick}
          className="flex-1 sm:flex-none px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
        >
          <Download size={16} strokeWidth={2.5} />
          Download File
        </button>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={document.isFolder ? "Folder Details" : (document.isDrawing ? "Preview Drawing" : "Document Preview")}
      footer={footer}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-8 pb-4">
        {/* Dynamic Header */}
        <div className={`relative overflow-hidden rounded-2xl p-8 shadow-xl transition-all ${document.isFolder ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white" :
          "bg-gradient-to-br from-primary to-blue-600 text-white"
          }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />

          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl">
              <FileText size={32} strokeWidth={2.5} />
            </div>

            <div className="text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <h3 className="text-2xl font-black tracking-tight">{document.name || document.title || document.drawing_name || "Document"}</h3>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {document.version || "v1.0"}
                </span>
              </div>
              <p className="text-white/80 font-medium mt-1 flex items-center gap-2 justify-center md:justify-start">
                <Calendar size={14} />
                Added on {document.date || "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2">
          {/* Metadata Section */}
          <div className="md:col-span-1 space-y-6">
            <Section icon={<Info size={16} />} title="File Metadata">
              <InfoItem label="File Type" value={document.type || document.document_type || (document.isDrawing ? "Drawing" : "Document")} />
              <InfoItem label="Linked Project" value={document.project || document.project_name || "General"} />
              <InfoItem label="Status" value={document.status || document.approval_status || "PENDING"} />
              <InfoItem label="Uploaded By" value={document.uploaded_by || "—"} />
              <InfoItem label="Folder Status" value={document.folder_status || (document.isFolder ? "Folder" : "File")} />
              <InfoItem label="Remarks" value={document.remarks || "—"} />
              <InfoItem label="Storage Location" value={document.isFolder ? "Root Directory" : "Secure Vault / Project Files"} />
            </Section>
          </div>

          {/* Preview Section */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-400">
              <HardDrive size={16} />
              <h4 className="text-xs font-black uppercase tracking-widest">
                Content Preview
              </h4>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl h-[450px] flex flex-col items-center justify-center text-slate-400 overflow-hidden relative">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                  <p className="font-bold text-slate-500">Loading Preview...</p>
                </div>
              ) : document.isFolder ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <FileText size={48} className="text-slate-300 mb-4 opacity-50" />
                  <p className="font-bold text-slate-500">This is a directory.</p>
                  <p className="text-sm">Open the folder to view its contents.</p>
                </div>
              ) : (category === "pdf" && isValidDoc && localUrl) ? (
                <iframe
                  src={`${localUrl}#toolbar=0`}
                  className="w-full h-full border-none rounded-2xl"
                  title="PDF Preview"
                />
              ) : (category === "image" && isValidDoc && localUrl) ? (
                <img
                  src={localUrl}
                  alt={document.name || "Document Preview"}
                  className="w-full h-full object-contain p-2"
                />
              ) : (category === "excel" && isValidDoc) ? (
                <ExcelPreview url={localUrl || resolveFileUrl(document.file_url)} />
              ) : (category === "office" && isValidDoc && resolvedUrlForOffice.startsWith("http")) ? (
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(resolvedUrlForOffice)}&embedded=true`}
                  className="w-full h-full border-none rounded-2xl"
                  title="Office Document Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <FileText size={48} className="text-slate-300 mb-4 opacity-50" />
                  <p className="font-bold text-slate-500">
                    {!isValidDoc ? "Document file could not be found on the server." : "Preview not available for this file type."}
                  </p>
                  <p className="text-sm mt-2">
                    {!isValidDoc
                      ? "It might have been removed or uploaded using placeholder data."
                      : "Please download the file to view its full contents securely on your local device."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({
  icon,
  title,
  children,
}) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-400">
      {icon}
      <h4 className="text-xs font-black uppercase tracking-widest">
        {title}
      </h4>
    </div>
    <div className="space-y-4 pt-1">{children}</div>
  </div>
);

const InfoItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="group">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">
      {label}
    </p>
    <p className="text-sm font-bold text-slate-800">
      {value || "NA"}
    </p>
  </div>
);

export default DocumentPreviewModal;

