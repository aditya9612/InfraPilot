import React from "react";
import Modal from "../common/Modal";
import { FileText, Download, Info, Calendar, HardDrive } from "lucide-react";
import ExcelPreview from "./ExcelPreview";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: any | null;
  onDownload: (doc: any) => void;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document,
  onDownload,
}) => {
  const [localUrl, setLocalUrl] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isValidPdf, setIsValidPdf] = React.useState<boolean>(true);

  React.useEffect(() => {
    let isMounted = true;
    if (isOpen && document && !document.isFolder) {
      setIsLoading(true);
      // Fetch as a blob securely passing the authenticated interceptors
      import("../../services/api").then(({ default: api }) => {
        api.get(`/documents/${document.id}/download`, { responseType: 'blob' })
          .then(res => {
            if (!isMounted) return;

            // Force proper MIME type to prevent the browser from auto-downloading the iframe content
            let contentType = res.headers['content-type'] || res.data.type || '';
            const docName = (document.file_url || document.name || '').toLowerCase();

            if (!contentType || contentType.includes('application/octet-stream') || contentType.includes('application/json')) {
              if (docName.includes('.pdf') || document.type?.toLowerCase() === 'pdf') {
                contentType = 'application/pdf';
              } else if (docName.match(/\.(jpg|jpeg)$/)) {
                contentType = 'image/jpeg';
              } else if (docName.includes('.png')) {
                contentType = 'image/png';
              } else if (docName.includes('.webp')) {
                contentType = 'image/webp';
              } else {
                contentType = 'application/pdf'; // Safest fallback
              }
            }

            const blob = new Blob([res.data], { type: contentType });
            setLocalUrl(window.URL.createObjectURL(blob));
            setIsValidPdf(true);
            setIsLoading(false);
          })
          .catch(() => {
            if (isMounted) {
              setIsValidPdf(false);
              setIsLoading(false);
            }
          });
      });
    } else {
      setLocalUrl("");
      setIsValidPdf(true);
    }

    return () => {
      isMounted = false;
      if (localUrl) window.URL.revokeObjectURL(localUrl);
    };
  }, [isOpen, document?.id]);

  if (!document) return null;

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
          onClick={() => {
            onDownload(document);
          }}
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
      title={document.isFolder ? "Folder Details" : "Document Preview"}
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
                <h3 className="text-2xl font-black tracking-tight">{document.name}</h3>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {document.version}
                </span>
              </div>
              <p className="text-white/80 font-medium mt-1 flex items-center gap-2 justify-center md:justify-start">
                <Calendar size={14} />
                Added on {document.date}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2">
          {/* Metadata Section */}
          <div className="md:col-span-1 space-y-6">
            <Section icon={<Info size={16} />} title="File Metadata">
              <InfoItem label="File Type" value={document.type} />
              <InfoItem label="Linked Project" value={document.project} />
              <InfoItem label="Status" value={document.status} />
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
              ) : (
                <>
                  {((document.type?.toLowerCase() === 'pdf' || document.file_url?.toLowerCase().includes('.pdf') || document.name?.toLowerCase().endsWith('.pdf')) && isValidPdf && localUrl) ? (
                    <iframe
                      src={`${localUrl}#toolbar=0`}
                      className="w-full h-full border-none rounded-2xl"
                      title="PDF Preview"
                    />
                  ) : ((document.file_url?.match(/\.(jpg|jpeg|png|gif|webp)([?#].*)?$/i) || document.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) && localUrl) ? (
                    <img
                      src={localUrl}
                      alt={document.name}
                      className="w-full h-full object-contain"
                    />
                  ) : ((document.file_url?.match(/\.(xls|xlsx|csv)([?#].*)?$/i) || document.name?.match(/\.(xls|xlsx|csv)$/i)) && document.file_url) ? (
                    <ExcelPreview url={document.file_url} />
                  ) : ((document.file_url?.match(/\.(doc|docx|ppt|pptx)([?#].*)?$/i) || document.name?.match(/\.(doc|docx|ppt|pptx)$/i)) && document.file_url) ? (
                    <iframe
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(document.file_url)}&embedded=true`}
                      className="w-full h-full border-none rounded-2xl"
                      title="Office Document Preview"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <FileText size={48} className="text-slate-300 mb-4 opacity-50" />
                      <p className="font-bold text-slate-500">
                        {!isValidPdf ? "Document file could not be found on the server." : "Preview not available for this file type."}
                      </p>
                      <p className="text-sm mt-2">
                        {!isValidPdf ? "It might have been removed or uploaded using placeholder data." : "Please download the file to view its full contents securely on your local device."}
                      </p>
                    </div>
                  )}
                </>
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
