import { useEffect } from "react";
<<<<<<< HEAD
=======
import { createPortal } from "react-dom";
>>>>>>> testing
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

const Modal = ({ isOpen, onClose, title, children, footer, maxWidth = "max-w-3xl" }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
<<<<<<< HEAD
    }
  }, [isOpen]);

  return (
=======
    };
  }, [isOpen]);

  const modalContent = (
>>>>>>> testing
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
<<<<<<< HEAD
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm sm:p-6"
=======
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm sm:p-6"
>>>>>>> testing
        >
          {/* Click outside to close */}
          <div className="absolute inset-0" onClick={onClose} />

<<<<<<< HEAD
=======
          {/* Modal Content */}
>>>>>>> testing
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
<<<<<<< HEAD
            className={`relative w-full ${maxWidth} max-h-full bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden`}
          >

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-none">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
=======
            className={`relative w-full ${maxWidth} max-h-[90vh] bg-white shadow-2xl rounded-3xl flex flex-col overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
>>>>>>> testing
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
<<<<<<< HEAD
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
=======
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
>>>>>>> testing
                </svg>
              </button>
            </div>

            {/* Body */}
<<<<<<< HEAD
            <div className="p-6 overflow-y-auto bg-white flex-1 custom-scrollbar">
=======
            <div className="p-8 overflow-y-auto bg-slate-50/30 flex-1 custom-scrollbar">
>>>>>>> testing
              {children}
            </div>

            {/* Footer */}
            {footer && (
<<<<<<< HEAD
              <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex items-center justify-end gap-3">
=======
              <div className="px-8 py-5 border-t border-slate-100 bg-white shrink-0 flex items-center justify-end gap-4">
>>>>>>> testing
                {footer}
              </div>
            )}
          </motion.div>

          <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #E2E8F0;
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #CBD5E1;
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
<<<<<<< HEAD
=======

  return createPortal(modalContent, document.body);
>>>>>>> testing
};

export default Modal;
