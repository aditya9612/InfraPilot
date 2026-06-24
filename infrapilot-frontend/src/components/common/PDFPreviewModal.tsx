import React from 'react';
import Modal from './Modal';
import { Download } from 'lucide-react';

interface PDFPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfUrl: string | null;
    title?: string;
    onDownload?: () => void;
}

const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
    isOpen,
    onClose,
    pdfUrl,
    title = "PDF Preview",
    onDownload
}) => {
    if (!pdfUrl) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-5xl">
            <div className="flex flex-col h-[80vh]">
                <div className="flex justify-end p-2 bg-slate-50 border-b border-slate-200 gap-3">
                    {onDownload && (
                        <button
                            onClick={onDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-sm text-xs"
                        >
                            <Download size={14} /> Download
                        </button>
                    )}
                </div>
                <div className="flex-1 bg-slate-100 p-2">
                    <iframe
                        src={pdfUrl}
                        className="w-full h-full rounded-xl border border-slate-200 shadow-inner bg-white"
                        title="PDF Preview"
                    />
                </div>
            </div>
        </Modal>
    );
};

export default PDFPreviewModal;
