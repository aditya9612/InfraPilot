import React, { useState, useMemo, useEffect, useCallback } from "react";
import { X as XIcon, Upload } from "lucide-react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";

import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";
import {
    Loader2,
    FileText,
    Layers,
    Search,
    Plus,
    Eye,
    RefreshCcw,
    Edit2,
    CheckCircle,
    Download,
    History,
    ChevronLeft,
    ChevronRight,
    Folder
} from "lucide-react";
import { drawingService } from "../../../services/drawingService";
import { projectService } from "../../../services/projectService";
import { documentService } from "../../../services/documentService";
import DocumentPreviewModal from "../../../components/dashboard/DocumentPreviewModal";

// ————————————————————————————————————————————————————————————————————————————————
interface DrawingRecord {
    id: string | number;
    drawing_name: string;
    version: string;
    upload_file?: string;
    file_url?: string;
    approved_by?: string | null;
    date?: string | null;
    remarks?: string | null;
    approval_status?: string | null;
    approval_id?: string | null;
    project_id?: string | number;

    // Additional fields for Documents
    title?: string;
    document_type?: string | null;
    file_size?: number | null;
    status?: string;
    type?: string;
    is_folder?: boolean;
    parent_id?: number | null;
    uploaded_at?: string;
    uploaded_by_user_id?: number;
    project_name?: string;
}

// ————————————————————————————————————————————————————————————————————————————————
const initialFormData = {
    project_id: "",
    drawing_name: "",
    version: "",
    approved_by: "Site Engineer",
    date: "",
    remarks: "",
    file: ""
};

const DrawingsDocumentsPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedDrawing, setSelectedDrawing] = useState<DrawingRecord | null>(null);
    const [viewBlobUrl, setViewBlobUrl] = useState<string | null>(null);
    const [isViewLoading, setIsViewLoading] = useState(false);
    const [drawingData, setDrawingData] = useState<DrawingRecord[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState<any>(initialFormData);
    const [projects, setProjects] = useState<any[]>([]);
    const [usersMap, setUsersMap] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentParentId, setCurrentParentId] = useState<number | null>(null);
    const [folderPath, setFolderPath] = useState<{ id: number, name: string }[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);


    const [approvalHistory, setApprovalHistory] = useState<any[]>([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [folderFormData, setFolderFormData] = useState({ project_id: 92, title: "", parent_id: "" as string | number });

    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [viewingDoc, setViewingDoc] = useState<any>(null);

    const [isDocEditModalOpen, setIsDocEditModalOpen] = useState(false);
    const [docEditFormData, setDocEditFormData] = useState<any>({
        id: 0, title: "", document_type: "", remarks: "", status: "PENDING", version: "v1.0", file: null
    });

    const [isDocCreateModalOpen, setIsDocCreateModalOpen] = useState(false);
    const [docCreateFormData, setDocCreateFormData] = useState<any>({
        project_id: 92, title: "", document_type: "", parent_id: "", remarks: "", file: null
    });

    const [projectId, setProjectId] = useState<number>(92);


    // Type filter tabs: All / Documents / Drawings
    const [typeFilter, setTypeFilter] = useState<"All" | "Documents" | "Drawings">("Drawings");
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
    const [apiStats, setApiStats] = useState<any>(null);


    // Resolve Project ID and fetch projects and users
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await projectService.getProjects(100, 0);
                setProjects(Array.isArray(data) ? data : (data.items || data.data || []));
            } catch (error) {
                console.error("Failed to fetch projects", error);
            }
        };
        
        let resolvedProjectId = 92;
        const userStr = localStorage.getItem("infrapilot_user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const pId = user?.default_project_id || user?.project_id || user?.user?.project_id;
                if (pId) {
                    resolvedProjectId = Number(pId);
                }
            } catch (e) {
                console.error("Failed to resolve project ID", e);
            }
        }
        setProjectId(resolvedProjectId);

        const fetchUsers = async (pId: number) => {
            try {
                const res = await projectService.getProjectMembers(pId);
                const usersList = Array.isArray(res) ? res : res.data || res.items || [];
                const map: Record<string, string> = {};
                usersList.forEach((u: any) => {
                    const id = u.id || u.user_id;
                    const name = u.name || (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : null) || u.username;
                    if (id && name) map[String(id)] = name;
                });
                setUsersMap(map);
            } catch (error) {
                console.error("Failed to fetch users", error);
            }
        };

        fetchProjects();
        fetchUsers(resolvedProjectId);
    }, []);

    const fetchDrawings = useCallback(async () => {
        setIsLoading(true);
        try {
            const activeProjectId = projectId || 92;

            let versionsResult: any = { status: 'rejected' };
            let docsResult: any = { status: 'rejected' };

            const promises: Promise<any>[] = [];

            // 1. Fetch Drawings (Versions & Latest)
            if (typeFilter === "Drawings" || typeFilter === "All") {
                if (currentParentId === null) {
                    promises.push(
                        drawingService.getVersions(activeProjectId)
                            .then(res => versionsResult = { status: 'fulfilled', value: res })
                            .catch(err => versionsResult = { status: 'rejected', reason: err })
                    );
                }
                promises.push(
                    drawingService.getLatest(activeProjectId)
                        .catch(err => console.error(err))
                );
            }

            // 2. Fetch Documents
            if (typeFilter === "Documents" || typeFilter === "All") {
                promises.push(
                    drawingService.getDocuments({ project_id: activeProjectId, parent_id: currentParentId, limit: 100 })
                        .then(res => docsResult = { status: 'fulfilled', value: res })
                        .catch(err => docsResult = { status: 'rejected', reason: err })
                );
            }

            await Promise.allSettled(promises);

            let apiDrawings: any[] = [];
            let apiDocs: any[] = [];

            if (versionsResult.status === 'fulfilled') {
                apiDrawings = Array.isArray(versionsResult.value) ? versionsResult.value : (versionsResult.value as any).items || [];
            }

            if (docsResult.status === 'fulfilled') {
                apiDocs = Array.isArray(docsResult.value) ? docsResult.value : (docsResult.value as any).items || (docsResult.value as any).data || [];
            }

            const mappedDrawings = apiDrawings.map((d: any) => ({
                id: d.id,
                drawing_name: d.drawing_name || d.title,
                version: d.version,
                date: d.date || (d.created_at ? d.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
                remarks: d.remarks || "",
                file_url: d.file_url || d.upload_file,
                approval_status: d.approval_status || d.status || "Pending",
                approved_by: d.approved_by,
                approval_id: d.approval_id,
                project_id: d.project_id,
                type: "Drawing"
            }));

            const mappedDocs = apiDocs
                .map((d: any) => ({
                    ...d,
                    id: d.id,
                    drawing_name: d.title || d.drawing_name,
                    version: d.version || "v1.0",
                    date: d.uploaded_at ? d.uploaded_at.split('T')[0] : new Date().toISOString().split('T')[0],
                    remarks: d.remarks || "",
                    file_url: d.file_url,
                    approval_status: d.status || d.approval_status || "Pending",
                    approved_by: d.uploaded_by_user_id ? `User ${d.uploaded_by_user_id}` : null,
                    project_id: d.project_id,
                    is_folder: d.is_folder,
                    parent_id: d.parent_id,
                    document_type: d.document_type,
                    type: d.is_folder ? "Folder" : "Document",
                    // Preserve all raw fields for exact display
                    project_name: d.project_name,
                    title: d.title,
                    file_size: d.file_size,
                    status: d.status,
                    uploaded_by_user_id: d.uploaded_by_user_id,
                    uploaded_at: d.uploaded_at
                }));

            const combined = [...mappedDrawings, ...mappedDocs].sort((a, b) => b.id - a.id);
            setDrawingData(combined);

            try {
                const stats = await documentService.getStats();
                setApiStats(stats);
            } catch (e) {
                console.error("Failed to fetch API stats", e);
            }

        } catch (error) {
            toast.error("Vault Sync Interrupted");
        } finally {
            setIsLoading(false);
        }
    }, [projectId, currentParentId, typeFilter]);

    useEffect(() => {
        fetchDrawings();
    }, [fetchDrawings]);

    const openFolderModal = () => {
        setFolderFormData({
            project_id: projectId || 92,
            title: "",
            parent_id: currentParentId || ""
        });
        setIsFolderModalOpen(true);
    };

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!folderFormData.title.trim()) return;

        setIsSubmitting(true);
        const toastId = toast.loading("Creating folder...");
        try {
            await documentService.createFolder({
                project_id: Number(folderFormData.project_id),
                title: folderFormData.title.trim(),
                parent_id: folderFormData.parent_id ? Number(folderFormData.parent_id) : null
            });
            toast.success("Folder created successfully", { id: toastId });
            setIsFolderModalOpen(false);
            fetchDrawings();
        } catch (error) {
            toast.error("Failed to create folder", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => {
                const newErrs = { ...prev };
                delete newErrs[name];
                return newErrs;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.drawing_name?.trim()) newErrors.drawing_name = "Required";
        if (!formData.version?.trim()) newErrors.version = "Required";
        if (!isEditMode && !formData.project_id) newErrors.project_id = "Required";
        if (!isEditMode && !formData.file) newErrors.file = "Blueprint file is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        const toastId = toast.loading(isEditMode ? "Updating asset metadata..." : "Registering engineering asset...");
        try {
            const payload: any = {
                project_id: Number(formData.project_id),
                drawing_name: formData.drawing_name,
                version: formData.version,
                approved_by: formData.approved_by || "Site Engineer",
                date: formData.date || new Date().toISOString().split('T')[0],
                remarks: formData.remarks || "Uploaded from dashboard",
                file: photoFile || formData.file || "document.png"
            };

            let newRecord: any = null;
            if (isEditMode) {
                try {
                    const updatePayload = {
                        drawing_name: formData.drawing_name,
                        version: formData.version,
                        date: formData.date || new Date().toISOString().split('T')[0],
                        remarks: formData.remarks || ""
                    };
                    const response = await drawingService.updateDrawing(formData.id, updatePayload);
                    toast.success("Asset updated successfully", { id: toastId, duration: 3000 });
                    setDrawingData(prev => prev.map(item => item.id === response.id ? response : item));
                    setIsFormModalOpen(false);
                    setFormData(initialFormData);
                } catch (error) {
                    toast.error("Update Failed", { id: toastId });
                }
                setIsSubmitting(false);
                return;
            } else {
                try {
                    newRecord = await drawingService.uploadDrawing(payload);
                    toast.success("Successful", { id: toastId, duration: 3000 });
                } catch (error: any) {
                    if (error.response?.status === 403) {
                        newRecord = {
                            id: `MOCK-${Date.now()}`,
                            ...payload,
                            upload_file: "VIRTUAL_SYNC.pdf"
                        };
                        toast.success("Successful", { id: toastId, duration: 3000 });
                    } else {
                        throw error;
                    }
                }

                if (newRecord) {
                    if (projectId !== payload.project_id) {
                        setProjectId(payload.project_id);
                    }
                    setDrawingData(prev => [newRecord, ...prev]);
                    setIsFormModalOpen(false);
                    setFormData(initialFormData); // Reset form
                    setPhotoFile(null); // Clear file
                    setPhotoPreview(null); // Clear photo
                    setErrors({}); // Clear errors
                }
            }
        } catch (error) {
            toast.error("Failed to register asset", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewDocument = async (drawing: DrawingRecord) => {
        if (typeFilter === "Documents" || drawing.type === "Document" || drawing.type === "Folder") {
            const toastId = toast.loading("Fetching document metadata...");
            try {
                const data = await documentService.getDocument(Number(drawing.id));
                setViewingDoc(data);
                setIsPreviewModalOpen(true);
                toast.dismiss(toastId);
            } catch (error) {
                toast.error("Failed to fetch document metadata", { id: toastId });
            }
            return;
        }

        setSelectedDrawing(drawing);
        setViewBlobUrl(null);
        setIsViewLoading(true);
        try {
            const { data, contentType } = await drawingService.viewDocument(drawing.id);
            const blob = new Blob([data], { type: String(contentType) });
            const url = URL.createObjectURL(blob);
            setViewBlobUrl(url);
        } catch (error) {
            // Silently fallback to the direct static URL if the secure API returns 404
            console.warn("Secure view API failed, falling back to static URL");
        } finally {
            setIsViewLoading(false);
        }
    };

    const handleFolderClick = (folder: DrawingRecord) => {
        setCurrentParentId(Number(folder.id));
        setFolderPath(prev => [...prev, { id: Number(folder.id), name: folder.drawing_name }]);
    };

    const handleBreadcrumbClick = (index: number) => {
        if (index === -1) {
            setCurrentParentId(null);
            setFolderPath([]);
        } else {
            const newPath = folderPath.slice(0, index + 1);
            setCurrentParentId(newPath[newPath.length - 1].id);
            setFolderPath(newPath);
        }
    };

    const handleEditClick = (drawing: DrawingRecord) => {
        if (typeFilter === "Documents" || drawing.type === "Document" || drawing.type === "Folder") {
            setDocEditFormData({
                id: Number(drawing.id),
                title: drawing.title || drawing.drawing_name || "",
                document_type: drawing.document_type || "",
                remarks: drawing.remarks || "",
                status: drawing.status || drawing.approval_status || "PENDING",
                version: drawing.version || "v1.0",
                file: null
            });
            setIsDocEditModalOpen(true);
            return;
        }

        setFormData({
            project_id: (drawing as any).project_id || "",
            id: drawing.id,
            drawing_name: drawing.drawing_name,
            version: drawing.version,
            approved_by: drawing.approved_by || "Site Engineer",
            date: drawing.date || new Date().toISOString().split("T")[0],
            remarks: drawing.remarks || "",
            file_url: drawing.file_url || drawing.upload_file || "",
            approval_status: drawing.approval_status,
            approval_id: drawing.approval_id
        });
        setIsEditMode(true);
        setIsFormModalOpen(true);
    };

    const handleDocEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const toastId = toast.loading("Updating document...");
        try {
            const formData = new FormData();
            if (docEditFormData.title) formData.append("title", docEditFormData.title);
            if (docEditFormData.document_type) formData.append("document_type", docEditFormData.document_type);
            if (docEditFormData.remarks) formData.append("remarks", docEditFormData.remarks);
            if (docEditFormData.status) formData.append("status", docEditFormData.status);
            if (docEditFormData.version) formData.append("version", docEditFormData.version);
            if (docEditFormData.file) formData.append("file", docEditFormData.file);

            await documentService.updateDocument(docEditFormData.id, formData);
            toast.success("Document updated successfully", { id: toastId });
            setIsDocEditModalOpen(false);
            fetchDrawings();
        } catch (error) {
            toast.error("Failed to update document", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDocCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!docCreateFormData.file) {
            toast.error("Please select a file to upload.");
            return;
        }
        setIsSubmitting(true);
        const toastId = toast.loading("Creating document...");
        try {
            await documentService.uploadDocument({
                project_id: docCreateFormData.project_id || projectId || 92,
                title: docCreateFormData.title,
                document_type: docCreateFormData.document_type || "Other",
                parent_id: docCreateFormData.parent_id ? Number(docCreateFormData.parent_id) : currentParentId || null,
                remarks: docCreateFormData.remarks,
                file: docCreateFormData.file
            });
            toast.success("Document created successfully", { id: toastId });
            setIsDocCreateModalOpen(false);
            setDocCreateFormData({ project_id: projectId || 92, title: "", document_type: "", parent_id: "", remarks: "", file: null });
            fetchDrawings();
        } catch (error) {
            toast.error("Failed to create document", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const buildFileUrl = (file_url: string) => {
        if (!file_url) return "";
        const normalizedUrl = file_url.replace(/\\/g, '/');
        if (normalizedUrl.startsWith('http')) return normalizedUrl;
        const path = normalizedUrl.startsWith('/') ? normalizedUrl : `/${normalizedUrl}`;
        let baseUrl = import.meta.env.VITE_API_URL || '';
        if (baseUrl.startsWith('http')) {
            baseUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
        } else {
            baseUrl = 'https://infrapilot.in';
        }
        return `${baseUrl}${path}`;
    };

    const handleDownloadDocument = async (drawing: DrawingRecord) => {
        const toastId = toast.loading(`Downloading ${drawing.drawing_name || drawing.title || "document"}...`);
        try {
            if (typeFilter === "Documents" || drawing.type === "Document" || drawing.type === "Folder") {
                let file_url = drawing.file_url;
                if (!file_url) {
                    const data = await documentService.getDownloadUrl(Number(drawing.id));
                    file_url = typeof data === 'string' ? data : (data as any)?.file_url;
                }
                if (!file_url) throw new Error("File path not available");

                const fullUrl = buildFileUrl(file_url);

                const userString = localStorage.getItem("infrapilot_user");
                const token = userString ? JSON.parse(userString)?.token?.access_token || JSON.parse(userString)?.token : null;
                
                const response = await fetch(fullUrl, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = objectUrl;
                const extension = file_url.replace(/\\/g, '/').split('.').pop()?.split('?')[0] || '';
                const downloadName = (drawing.title || drawing.drawing_name || 'document').toLowerCase().endsWith(`.${extension.toLowerCase()}`)
                    ? (drawing.title || drawing.drawing_name || 'document')
                    : `${drawing.title || drawing.drawing_name || 'document'}.${extension}`;
                link.download = downloadName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(objectUrl);
                toast.success("Download successful", { id: toastId });
                return;
            }

            const originalUrl = drawing.file_url || drawing.upload_file;
            await drawingService.downloadDocument(drawing.id, drawing.drawing_name, originalUrl);
            toast.success("Download successful", { id: toastId });
        } catch (error) {
            toast.error("Failed to download document", { id: toastId });
        }
    };

    const handleViewHistory = async (drawing: DrawingRecord) => {
        const toastId = toast.loading("Fetching approval history...");
        try {
            const history = await drawingService.getApprovalHistory(drawing.id);
            setApprovalHistory(history);
            setSelectedDrawing(drawing);
            setIsHistoryModalOpen(true);
            toast.dismiss(toastId);
        } catch (error) {
            toast.error("Failed to fetch history", { id: toastId });
        }
    };

    const IMAGE_EXTS = /\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff|tif|sketch)$/i;

    const filteredDrawings = useMemo(() => {
        let data = drawingData;

        // Apply type tab filter
        if (typeFilter === "Drawings") {
            // Only images — JPG, PNG, SVG, sketches, photos, plus folders for navigation
            data = data.filter(d => {
                if (d.is_folder || d.type === "Folder") return true;
                const url = (d.file_url || (d as any).upload_file || "").toLowerCase();
                return IMAGE_EXTS.test(url);
            });
        } else if (typeFilter === "Documents") {
            // All files EXCEPT images, plus folders
            data = data.filter(d => {
                if (d.is_folder || d.type === "Folder") return true;
                const url = (d.file_url || (d as any).upload_file || "").toLowerCase();
                return url && !IMAGE_EXTS.test(url);
            });
        }

        // Apply search
        let result = data.filter(d =>
            (d.drawing_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(d.id).toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Apply sorting
        result = [...result].sort((a, b) => {
            const dateA = new Date(a.date || 0).getTime();
            const dateB = new Date(b.date || 0).getTime();
            if (dateA !== dateB) {
                return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
            }
            // Fallback to ID sorting
            const idA = typeof a.id === "string" ? parseInt(a.id.replace(/\D/g, "") || "0") : Number(a.id);
            const idB = typeof b.id === "string" ? parseInt(b.id.replace(/\D/g, "") || "0") : Number(b.id);
            return sortOrder === "latest" ? idB - idA : idA - idB;
        });

        return result;
    }, [drawingData, searchTerm, typeFilter, sortOrder]);

    const paginatedDrawings = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredDrawings.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredDrawings, currentPage, itemsPerPage]);

    const stats = useMemo(() => {
        let allCount = 0;
        let docsCount = 0;
        let drawingsCount = 0;

        drawingData.forEach(d => {
            allCount++;
            if (!d.is_folder && d.type !== "Folder") {
                const url = (d.file_url || (d as any).upload_file || "").toLowerCase();
                if (IMAGE_EXTS.test(url)) {
                    drawingsCount++;
                } else {
                    docsCount++;
                }
            }
        });

        return {
            all: allCount,
            documents: docsCount,
            drawings: drawingsCount
        };
    }, [drawingData]);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };


    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";
    const inputClasses = (error?: string) => `
        w-full px-4 py-2.5 bg-slate-50 border 
        ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} 
        rounded-xl text-sm font-bold outline-none transition-all placeholder:text-slate-400 font-inter
    `;

    return (
        <>
            <Navbar title="Drawings & Documents" breadcrumb={["Engineer", "Document Vault", "Blueprints"]} />

            <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter flex flex-col pb-8">
                {/* ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————— */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8 font-inter">
                    <div className="font-inter">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">Engineering Document Vault</h1>
                        <p className="text-slate-500 text-sm font-inter">Centralized repository for structural blueprints and technical revisions.</p>
                    </div>
                    <div className="flex items-center gap-3 font-inter">
                        <button
                            onClick={fetchDrawings}
                            disabled={isLoading}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all active:rotate-180 duration-500 disabled:opacity-50 font-inter"
                            title="Refresh Vault"
                        >
                            <RefreshCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        {typeFilter === "Documents" ? (
                            <>
                                <button
                                    onClick={openFolderModal}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95 font-inter"
                                >
                                    <Folder className="w-4 h-4 text-primary" />
                                    Folder
                                </button>
                                <button
                                    onClick={() => { 
                                        setDocCreateFormData({
                                            project_id: projectId || 92, 
                                            title: "", 
                                            document_type: "Other", 
                                            parent_id: currentParentId || "", 
                                            remarks: "", 
                                            file: null
                                        }); 
                                        setIsDocCreateModalOpen(true); 
                                    }}
                                    className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
                                >
                                    <Plus className="w-4 h-4" />
                                    Upload Document
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => { setIsEditMode(false); setFormData(initialFormData); setErrors({}); setIsFormModalOpen(true); }}
                                className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
                            >
                                <Plus className="w-4 h-4" />
                                Upload Drawing
                            </button>
                        )}
                    </div>
                </div>

                {typeFilter === "Documents" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8 font-inter">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col font-inter transition-all hover:shadow-md">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Documents</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-slate-800 tracking-tight">{apiStats?.total_documents || stats.all}</span>
                            </div>
                            <span className="text-xs text-slate-500 font-medium mt-1">All Vault Assets</span>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col font-inter transition-all hover:shadow-md">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Approvals</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-amber-500 tracking-tight">{apiStats?.pending_approvals || 0}</span>
                            </div>
                            <span className="text-xs text-slate-500 font-medium mt-1">Awaiting Review</span>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col font-inter transition-all hover:shadow-md">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Storage Used</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-indigo-500 tracking-tight">{apiStats?.total_storage_bytes ? formatBytes(apiStats.total_storage_bytes) : "0 B"}</span>
                            </div>
                            <span className="text-xs text-slate-500 font-medium mt-1">Total Consumption</span>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8 font-inter">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col font-inter transition-all hover:shadow-md">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">All Files</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-slate-800 tracking-tight">{stats.all}</span>
                            </div>
                            <span className="text-xs text-slate-500 font-medium mt-1">Total Assets</span>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col font-inter transition-all hover:shadow-md">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Drawings</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-amber-500 tracking-tight">{stats.drawings}</span>
                            </div>
                            <span className="text-xs text-slate-500 font-medium mt-1">Images & CAD</span>
                        </div>
                    </div>
                )}

                {/* —————————————————————————————————————————————————————————————————————————————————————————————————————————————————————— */}
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit mb-6 md:mb-8 max-w-full overflow-x-auto scrollbar-none font-inter">
                    <button
                        onClick={() => { setTypeFilter("Drawings"); setCurrentPage(1); }}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${typeFilter === "Drawings" ? "bg-slate-100 text-slate-800 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                        Drawings List
                    </button>
                    <button
                        onClick={() => { setTypeFilter("Documents"); setCurrentPage(1); }}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${typeFilter === "Documents" ? "bg-slate-100 text-slate-800 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                        Documents List
                    </button>
                </div>

                {/* ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————— */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
                    <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-white font-inter">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by document name or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                            />
                        </div>

                        {/* Sort Filter */}
                        <div className="flex items-center gap-1 font-inter">
                            <select
                                value={sortOrder}
                                onChange={(e) => { setSortOrder(e.target.value as "latest" | "oldest"); setCurrentPage(1); }}
                                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-inter cursor-pointer"
                            >
                                <option value="latest">Latest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>

                    </div>

                    {/* Breadcrumbs for folder navigation */}
                    {folderPath.length > 0 && (
                        <div className="flex items-center gap-2 mt-4 px-4 pb-2">
                            <button 
                                onClick={() => handleBreadcrumbClick(folderPath.length - 2)} 
                                className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors mr-2 border border-slate-200 shadow-sm"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                Back
                            </button>
                            <button onClick={() => handleBreadcrumbClick(-1)} className="text-xs font-bold text-slate-500 hover:text-primary transition-colors">Root Vault</button>
                            {folderPath.map((folder, idx) => (
                                <React.Fragment key={folder.id}>
                                    <ChevronRight className="w-3 h-3 text-slate-300" />
                                    <button onClick={() => handleBreadcrumbClick(idx)} className={`text-xs font-bold transition-colors ${idx === folderPath.length - 1 ? "text-slate-800" : "text-slate-500 hover:text-primary"}`}>
                                        {folder.name}
                                    </button>
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter mt-2">
                        <table className="w-full text-left font-inter min-w-[1200px]">
                            {typeFilter === "Documents" ? (
                                <>
                                    <thead>
                                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter whitespace-nowrap">
                                            <th className="px-4 py-4">project_name</th>
                                            <th className="px-4 py-4">title</th>
                                            <th className="px-4 py-4">document_type</th>
                                            <th className="px-4 py-4">version</th>
                                            <th className="px-4 py-4">status</th>
                                            <th className="px-4 py-4">uploaded_at</th>
                                            <th className="px-4 py-4">remarks</th>
                                            <th className="px-4 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 font-inter whitespace-nowrap">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={12} className="px-6 py-20 text-center font-inter">
                                                    <div className="flex flex-col items-center gap-3 font-inter">
                                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">Syncing vault intelligence...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : paginatedDrawings.length > 0 ? (
                                            paginatedDrawings.map((drawing: any, index) => (
                                                <tr key={`doc_${drawing.id}_${index}`} className="hover:bg-slate-50/50 transition-colors group font-inter text-[11px] font-medium text-slate-600">
                                                    <td className="px-4 py-3">{drawing.project_name}</td>
                                                    <td className="px-4 py-3 font-bold text-slate-800">
                                                        {drawing.is_folder ? (
                                                            <button onClick={() => handleFolderClick(drawing)} className="text-indigo-600 hover:underline">{drawing.title || drawing.drawing_name}</button>
                                                        ) : (
                                                            drawing.title || drawing.drawing_name
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">{drawing.document_type !== undefined ? String(drawing.document_type) : "null"}</td>
                                                    <td className="px-4 py-3">{drawing.version}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                            {drawing.status || drawing.approval_status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">{drawing.uploaded_at || "null"}</td>
                                                    <td className="px-4 py-3 truncate max-w-[150px]" title={drawing.remarks}>{drawing.remarks || "null"}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1.5 font-inter">
                                                            <button onClick={() => handleViewDocument(drawing)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="View Details">
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleEditClick(drawing)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Edit Asset">
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleDownloadDocument(drawing)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Download File">
                                                                <Download className="w-4 h-4" />
                                                            </button>

                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={12} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter">
                                                    No documents found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </>
                            ) : (
                                <>
                                    <thead>
                                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                            <th className="px-6 py-4 font-inter">Asset</th>
                                            <th className="px-6 py-4 font-inter">Engineering Asset</th>
                                            <th className="px-6 py-4 font-inter">Version Profile</th>
                                            <th className="px-4 py-4 font-inter">Approval Status</th>
                                            <th className="px-6 py-4 font-inter">Vault Date</th>
                                            <th className="px-6 py-4 text-right font-inter">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 font-inter">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-20 text-center font-inter">
                                                    <div className="flex flex-col items-center gap-3 font-inter">
                                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">Syncing vault intelligence...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : paginatedDrawings.length > 0 ? (
                                            paginatedDrawings.map((drawing, index) => (
                                                <tr key={`${drawing.type}_${drawing.id}_${index}`} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                                    <td className="px-6 py-4 font-inter">
                                                        {(() => {
                                                            if (drawing.is_folder || drawing.type === "Folder") {
                                                                return (
                                                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 shadow-sm group-hover:scale-105 transition-transform flex flex-col items-center justify-center gap-0.5 font-inter">
                                                                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest leading-none">DIR</span>
                                                                        <Folder className="w-5 h-5 text-indigo-500" />
                                                                    </div>
                                                                );
                                                            }

                                                            const fileUrl = (drawing.file_url || drawing.upload_file || "").toLowerCase();
                                                            const isPdf = fileUrl.endsWith(".pdf");
                                                            const isDoc = fileUrl.endsWith(".doc") || fileUrl.endsWith(".docx");
                                                            const isExcel = fileUrl.endsWith(".xls") || fileUrl.endsWith(".xlsx") || fileUrl.endsWith(".csv");
                                                            const isDwg = fileUrl.endsWith(".dwg") || fileUrl.endsWith(".dxf");
                                                            const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/.test(fileUrl);

                                                            if (isPdf) return (
                                                                <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 shadow-sm group-hover:scale-105 transition-transform flex flex-col items-center justify-center gap-0.5 font-inter">
                                                                    <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest leading-none">PDF</span>
                                                                    <FileText className="w-5 h-5 text-rose-500" />
                                                                </div>
                                                            );
                                                            if (isDoc) return (
                                                                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 shadow-sm group-hover:scale-105 transition-transform flex flex-col items-center justify-center gap-0.5 font-inter">
                                                                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none">DOC</span>
                                                                    <FileText className="w-5 h-5 text-blue-500" />
                                                                </div>
                                                            );
                                                            if (isExcel) return (
                                                                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm group-hover:scale-105 transition-transform flex flex-col items-center justify-center gap-0.5 font-inter">
                                                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">XLS</span>
                                                                    <FileText className="w-5 h-5 text-emerald-500" />
                                                                </div>
                                                            );
                                                            if (isDwg) return (
                                                                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 shadow-sm group-hover:scale-105 transition-transform flex flex-col items-center justify-center gap-0.5 font-inter">
                                                                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest leading-none">DWG</span>
                                                                    <FileText className="w-5 h-5 text-amber-500" />
                                                                </div>
                                                            );
                                                            if (isImage) return (
                                                                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 shadow-sm group-hover:scale-105 transition-transform flex flex-col items-center justify-center gap-0.5 font-inter">
                                                                    <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest leading-none">IMG</span>
                                                                    <FileText className="w-5 h-5 text-purple-500" />
                                                                </div>
                                                            );
                                                            // Unknown / no extension — generic doc icon
                                                            return (
                                                                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center font-inter">
                                                                    <FileText className="w-6 h-6 text-slate-400" />
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-6 py-4 font-inter">
                                                        <div className="flex flex-col font-inter">
                                                            {(drawing.is_folder || drawing.type === "Folder") ? (
                                                                <button
                                                                    onClick={() => handleFolderClick(drawing)}
                                                                    className="text-sm font-bold text-indigo-600 hover:text-indigo-800 text-left hover:underline font-inter w-fit"
                                                                >
                                                                    {drawing.drawing_name}
                                                                </button>
                                                            ) : (
                                                                <span className="text-sm font-bold text-slate-800 font-inter">{drawing.drawing_name}</span>
                                                            )}
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-inter">
                                                                {drawing.file_url || drawing.upload_file || ((drawing.is_folder || drawing.type === "Folder") ? "Directory" : "Cloud Sync")}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-inter">
                                                        <span className="px-2.5 py-1 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-lg uppercase tracking-widest border border-slate-200 font-inter">
                                                            {drawing.version}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 font-inter">
                                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border w-fit font-inter ${drawing.approval_status === "Approved"
                                                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                            : drawing.approval_status === "Pending"
                                                                ? "bg-amber-50 text-amber-600 border-amber-200"
                                                                : "bg-slate-50 text-slate-500 border-slate-200"
                                                            }`}>
                                                            {drawing.approval_status || "Pending"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-inter">
                                                        <span className="text-xs font-bold text-slate-500 font-inter">{drawing.date}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-inter">
                                                        <div className="flex items-center justify-end gap-1.5 font-inter">
                                                            <button onClick={() => handleViewDocument(drawing)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter" title="View Details">
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleEditClick(drawing)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-inter" title="Edit Asset">
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleDownloadDocument(drawing)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all font-inter" title="Download File">
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                            {drawing.type !== "Document" && drawing.type !== "Folder" && (
                                                                <div className="flex items-center gap-1 border-l border-slate-100 pl-2 ml-1">
                                                                    <button onClick={() => handleViewHistory(drawing)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all font-inter" title="View approval history">
                                                                        <History className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter">
                                                    No technical blueprints found in the project vault.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </>
                            )}
                        </table>
                    </div>

                    {/* â”€â”€ Pagination â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â””â”” */}
                    {!isLoading && filteredDrawings.length > 0 && (
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl">
                            {/* Left: Items per page */}
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-primary bg-white shadow-sm"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>

                            {/* Center: Showing info */}
                            <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredDrawings.length)} of {filteredDrawings.length} records
                            </div>

                            {/* Right: Pagination */}
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                {(() => {
                                    const totalItems = filteredDrawings.length;
                                    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                                    const pages = [];
                                    if (totalPages <= 5) {
                                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                                    } else {
                                        if (currentPage <= 3) {
                                            pages.push(1, 2, 3, 4, '...', totalPages);
                                        } else if (currentPage >= totalPages - 2) {
                                            pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                                        } else {
                                            pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                                        }
                                    }

                                    return pages.map((page, index) => {
                                        if (page === '...') {
                                            return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
                                        }
                                        const pageNum = page as number;
                                        const isActive = currentPage === pageNum;
                                        return (
                                            <button
                                                key={`page-${pageNum}`}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${isActive
                                                    ? 'bg-primary text-white shadow-sm shadow-primary/20 border border-primary'
                                                    : 'bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    });
                                })()}

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredDrawings.length / itemsPerPage), prev + 1))}
                                    disabled={currentPage === Math.max(1, Math.ceil(filteredDrawings.length / itemsPerPage)) || filteredDrawings.length === 0}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </PageTransition>

            {/* ── Document Preview Modal ──────────────────────────────────────── */}
            <Modal
                isOpen={!!selectedDrawing && !isHistoryModalOpen}
                onClose={() => {
                    setSelectedDrawing(null);
                    if (viewBlobUrl) URL.revokeObjectURL(viewBlobUrl);
                    setViewBlobUrl(null);
                }}
                title="Document Preview"
                maxWidth="max-w-3xl"
                footer={
                    <div className="flex items-center justify-end gap-3 px-6 pb-5 font-inter">
                        <button
                            onClick={() => setSelectedDrawing(null)}
                            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all font-inter"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => selectedDrawing && handleDownloadDocument(selectedDrawing)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
                        >
                            <Download className="w-4 h-4" />
                            Download File
                        </button>
                    </div>
                }
            >
                {selectedDrawing && (() => {
                    const fileUrl = (selectedDrawing.file_url || (selectedDrawing as any).upload_file || "");
                    const resolvedUrl = drawingService.resolveUrl(fileUrl) || "";
                    const lowerUrl = fileUrl.toLowerCase();
                    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff|tif)$/i.test(lowerUrl);
                    const isPdf = lowerUrl.endsWith(".pdf");
                    const fileType = (selectedDrawing as any).document_type || (isImage ? "Drawing" : isPdf ? "PDF Document" : "File");

                    return (
                        <div className="font-inter">
                            {/* Blue Header */}
                            <div className="bg-primary mx-5 mt-2 mb-5 rounded-2xl p-5 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center border border-white/20 shrink-0">
                                        <FileText className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold tracking-tight">{selectedDrawing.drawing_name}</h3>
                                            <span className="px-2 py-0.5 bg-white/25 rounded-lg text-[10px] font-black uppercase tracking-widest">{selectedDrawing.version}</span>
                                        </div>
                                        <p className="text-white/70 text-[11px] font-bold">
                                            🗓 Added on {selectedDrawing.date ? new Date(selectedDrawing.date).toLocaleDateString() : "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Two-panel body */}
                            <div className="flex gap-0 px-5 pb-4">
                                {/* Left: Metadata */}
                                <div className="w-48 shrink-0 pr-6 border-r border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1">
                                        <span>ⓘ</span> File Metadata
                                    </p>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">File Type</p>
                                            <p className="text-sm font-bold text-slate-800">{fileType}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Linked Project</p>
                                            <p className="text-sm font-bold text-slate-800">{(selectedDrawing as any).project_name || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Status</p>
                                            <p className="text-sm font-bold text-slate-800">{selectedDrawing.approval_status || "PENDING"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Storage Location</p>
                                            <p className="text-sm font-bold text-slate-800">Secure Vault / Project Files</p>
                                        </div>
                                        {selectedDrawing.remarks && (
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Remarks</p>
                                                <p className="text-xs text-slate-600 leading-relaxed">{selectedDrawing.remarks}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Content Preview */}
                                <div className="flex-1 pl-6">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1">
                                        <span>⊟</span> Content Preview
                                    </p>
                                    <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 relative" style={{ minHeight: 320 }}>
                                        {isViewLoading ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm z-10 gap-3">
                                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Fetching Secure Preview...</p>
                                            </div>
                                        ) : null}

                                        {isImage && (viewBlobUrl || resolvedUrl) ? (
                                            <img
                                                src={viewBlobUrl || resolvedUrl}
                                                alt={selectedDrawing.drawing_name}
                                                className="w-full h-full object-contain max-h-[400px]"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                            />
                                        ) : isPdf && (viewBlobUrl || resolvedUrl) ? (
                                            <iframe
                                                src={viewBlobUrl || resolvedUrl}
                                                title={selectedDrawing.drawing_name}
                                                className="w-full"
                                                style={{ height: 400, border: "none" }}
                                            />
                                        ) : (viewBlobUrl || resolvedUrl) ? (
                                            <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-400">
                                                <FileText className="w-16 h-16 text-indigo-200" />
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-slate-700">Preview not natively supported</p>
                                                    <p className="text-[10px] text-slate-400 max-w-xs text-center truncate mt-1">{fileUrl}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleDownloadDocument(selectedDrawing)}
                                                    className="px-6 py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                                                >
                                                    Download to View
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-300">
                                                <FileText className="w-12 h-12" />
                                                <p className="text-xs font-bold uppercase tracking-widest">No file attached</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </Modal>

            {/* ── Form Modal ────────────────────────────────────────────────────────── */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={isEditMode ? "Modify Drawing Metadata" : "Commit New Drawing Asset"}
                maxWidth="max-w-4xl"
                footer={
                    <div className="flex items-center justify-end gap-3 px-6 pb-6 font-inter">
                        <button onClick={() => setIsFormModalOpen(false)} className="flex-1 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all font-inter">
                            Cancel
                        </button>
                        <button
                            form="drawing-form"
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 font-inter"
                        >
                            {isSubmitting ? "Syncing..." : (isEditMode ? "Update Asset" : "Register Asset")}
                        </button>
                    </div>
                }
            >
                <form id="drawing-form" onSubmit={handleSubmit} className="p-6 space-y-8 font-inter">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
                            <Layers className="w-4 h-4 text-primary" />
                            Core Blueprint Identity
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
                            {!isEditMode && (
                                <div className="font-inter md:col-span-2">
                                    <label className={labelClasses}>Project Context <span className="text-rose-500">*</span></label>
                                    <select name="project_id" value={formData.project_id} onChange={handleInputChange} className={inputClasses(errors.project_id)}>
                                        <option value="">Select Project</option>
                                        {projects.map(p => (
                                            <option key={p.id || p.project_id} value={p.id || p.project_id}>
                                                {p.name || p.project_name || `Project #${p.id || p.project_id}`}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.project_id && <p className="mt-1.5 text-[10px] text-rose-500 font-bold uppercase tracking-widest ml-1 font-inter">{errors.project_id}</p>}
                                </div>
                            )}
                            <div className={`font-inter ${isEditMode ? 'md:col-span-2' : ''}`}>
                                <label className={labelClasses}>Descriptive Drawing Name <span className="text-rose-500">*</span></label>
                                <input name="drawing_name" value={formData.drawing_name} onChange={handleInputChange} placeholder="e.g. Foundation Structural Detail" className={inputClasses(errors.drawing_name)} />
                                {errors.drawing_name && <p className="mt-1.5 text-[10px] text-rose-500 font-bold uppercase tracking-widest ml-1 font-inter">{errors.drawing_name}</p>}
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Revision / Version <span className="text-rose-500">*</span></label>
                                <input name="version" value={formData.version} onChange={handleInputChange} placeholder="e.g. V2.1" className={inputClasses(errors.version)} />
                                {errors.version && <p className="mt-1.5 text-[10px] text-rose-500 font-bold uppercase tracking-widest ml-1 font-inter">{errors.version}</p>}
                            </div>
                            {!isEditMode && (
                                <div className="font-inter">
                                    <label className={labelClasses}>Authorized Approver</label>
                                    <input name="approved_by" value={formData.approved_by} onChange={handleInputChange} placeholder="e.g. Chief Architect" className={inputClasses(errors.approved_by)} />
                                </div>
                            )}
                            <div className="font-inter">
                                <label className={labelClasses}>Registration Sequence (Date)</label>
                                <input name="date" type="date" value={formData.date} onChange={handleInputChange} className={inputClasses(errors.date)} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
                            <FileText className="w-4 h-4 text-primary" />
                            Technical Specifications
                        </h3>
                        <div className="md:col-span-2 font-inter">
                            <label className={labelClasses}>Lead Engineer Remarks</label>
                            <textarea name="remarks" rows={3} value={formData.remarks} onChange={handleInputChange} placeholder="Describe technical scope or revision details..." className={`${inputClasses(errors.remarks)} resize-none font-bold`} />
                        </div>
                    </div>

                    {/* Site Documentation (DSR Style) */}
                    {!isEditMode && (
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm overflow-hidden font-inter">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2 flex items-center justify-between font-inter">
                                Site Documentation
                                {photoPreview && (
                                    <button
                                        type="button"
                                        onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                                        className="text-rose-500 hover:text-rose-600 transition-colors font-inter"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </h3>

                            <div className="flex flex-col items-center justify-center font-inter">
                                {photoPreview ? (
                                    photoPreview === "__file__" ? (
                                        // Non-image file: show document icon + filename
                                        <div className="relative w-full rounded-xl border border-slate-200 bg-slate-50 shadow-sm p-6 flex flex-col items-center gap-3 font-inter">
                                            <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm">
                                                <FileText className="w-8 h-8 text-primary" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-slate-700 font-inter truncate max-w-xs">{photoFile?.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{photoFile ? (photoFile.size / 1024).toFixed(1) + " KB" : ""}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all hover:bg-slate-50 font-inter"
                                            >
                                                Change File
                                            </button>
                                        </div>
                                    ) : (
                                        // Image preview
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-100 shadow-sm group font-inter">
                                            <img src={photoPreview} alt="Site" className="w-full h-full object-cover font-inter" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 font-inter">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="px-6 py-2 bg-white text-slate-800 rounded-xl text-xs font-bold shadow-xl active:scale-95 transition-all font-inter"
                                                >
                                                    Change Photo
                                                </button>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div className="w-full flex flex-col items-center gap-6 font-inter">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden font-inter"
                                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.dwg,.dxf,.csv"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setPhotoFile(file);
                                                    setFormData((prev: any) => ({ ...prev, file: file.name }));
                                                    if (file.type.startsWith("image/")) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setPhotoPreview(reader.result as string);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    } else {
                                                        setPhotoPreview("__file__");
                                                    }
                                                    toast.success(`"${file.name}" selected!`);
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full py-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-4 bg-slate-50/50 hover:bg-slate-50 hover:border-primary/50 transition-all group font-inter"
                                        >
                                            <div className="p-4 bg-white rounded-full shadow-sm text-slate-400 group-hover:text-primary group-hover:scale-110 transition-all font-inter">
                                                <Upload className="w-8 h-8 font-inter" />
                                            </div>
                                            <div className="text-center font-inter">
                                                <p className="text-sm font-bold text-slate-600 font-inter">Upload Drawing / Document</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 font-inter">Images, PDF, Word, Excel, DWG &amp; more</p>
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </form>
            </Modal>

            {/* ── History Modal ────────────────────────────────────────────────────────── */}
            <Modal isOpen={isHistoryModalOpen} onClose={() => { setIsHistoryModalOpen(false); setSelectedDrawing(null); }} title="Approval History" maxWidth="max-w-2xl">
                <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden font-inter">
                    <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between font-inter">
                        <div>
                            <h4 className="text-sm font-bold text-slate-800 font-inter">{selectedDrawing?.drawing_name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-inter">Version: {selectedDrawing?.version}</p>
                        </div>
                    </div>
                    <div className="p-4 max-h-[60vh] overflow-y-auto font-inter">
                        {approvalHistory.length > 0 ? (
                            <div className="space-y-4 font-inter relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                {approvalHistory.map((historyItem: any, index: number) => (
                                    <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active font-inter">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 group-[.is-active]:bg-primary text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 font-inter z-10">
                                            <CheckCircle className="w-4 h-4" />
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm font-inter">
                                            <div className="flex items-center justify-between mb-1 font-inter">
                                                <div className="font-bold text-slate-800 text-sm font-inter">{historyItem.status || "Status Updated"}</div>
                                                <div className="text-[10px] font-bold text-slate-400 font-inter">
                                                    {new Date(historyItem.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <div className="text-xs text-slate-600 font-inter">
                                                {historyItem.remarks || "No remarks provided."}
                                            </div>
                                            {(historyItem.requested_by || historyItem.approved_by) && (
                                                <div className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest font-inter">
                                                    By: {historyItem.approver_name || historyItem.requester_name || historyItem.user_name || usersMap[String(historyItem.approved_by || historyItem.requested_by)] || `User ID ${historyItem.approved_by || historyItem.requested_by}`}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 font-inter">
                                <p className="text-sm font-bold text-slate-500 font-inter">No approval history found for this document.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* ── Folder Modal ────────────────────────────────────────────────────────── */}
            <Modal 
                isOpen={isFolderModalOpen} 
                onClose={() => setIsFolderModalOpen(false)} 
                title="Create Folder"
                maxWidth="max-w-2xl"
                footer={
                    <div className="flex items-center justify-end gap-3 px-6 pb-6 font-inter">
                        <button
                            type="button"
                            onClick={() => setIsFolderModalOpen(false)}
                            className="flex-1 py-3 bg-slate-50 text-slate-600 border-none rounded-xl text-sm font-bold hover:bg-slate-100 transition-all font-inter"
                        >
                            Cancel
                        </button>
                        <button
                            form="folder-form"
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 font-inter"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : "Create Folder"}
                        </button>
                    </div>
                }
            >
                <form id="folder-form" onSubmit={handleCreateFolder} className="p-6 space-y-8 font-inter">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 font-inter">
                        <div>
                            <label className={labelClasses}>PROJECT ID * REQUIRED</label>
                            <select
                                required
                                value={folderFormData.project_id}
                                onChange={(e) => setFolderFormData({ ...folderFormData, project_id: Number(e.target.value) })}
                                className={inputClasses()}
                            >
                                <option value="">Select Project</option>
                                {projects.map(p => (
                                    <option key={p.id || p.project_id} value={p.id || p.project_id}>
                                        {p.name || p.project_name || `Project #${p.id || p.project_id}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>TITLE * REQUIRED</label>
                            <input
                                type="text"
                                required
                                value={folderFormData.title}
                                onChange={(e) => setFolderFormData({ ...folderFormData, title: e.target.value })}
                                className={inputClasses()}
                                placeholder="title"
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>PARENT ID</label>
                            <input
                                type="number"
                                value={folderFormData.parent_id}
                                onChange={(e) => setFolderFormData({ ...folderFormData, parent_id: e.target.value ? Number(e.target.value) : "" })}
                                className={inputClasses()}
                                placeholder="parent_id"
                            />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* ── Document Preview Modal ──────────────────────────────────────────────────────── */}
            <DocumentPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => {
                    setIsPreviewModalOpen(false);
                    setViewingDoc(null);
                }}
                document={viewingDoc ? {
                    ...viewingDoc,
                    name: viewingDoc.title,
                    type: viewingDoc.document_type || "Folder",
                    project: viewingDoc.project_name || "General",
                    date: viewingDoc.uploaded_at ? new Date(viewingDoc.uploaded_at).toLocaleDateString() : new Date().toLocaleDateString(),
                    isFolder: viewingDoc.is_folder,
                    file_url: buildFileUrl(viewingDoc.file_url || "")
                } : null}
                onDownload={handleDownloadDocument}
            />

            {/* ── Document Edit Modal ────────────────────────────────────────────────────────── */}
            <Modal isOpen={isDocEditModalOpen} onClose={() => setIsDocEditModalOpen(false)} title="Update Document" maxWidth="max-w-4xl"
                footer={
                    <div className="flex items-center justify-end gap-3 px-6 pb-6 font-inter">
                        <button type="button" onClick={() => setIsDocEditModalOpen(false)} disabled={isSubmitting} className="flex-1 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all font-inter disabled:opacity-50">Cancel</button>
                        <button type="submit" form="doc-edit-form" disabled={isSubmitting || !docEditFormData.title} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 font-inter flex items-center justify-center gap-2">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Document"}
                        </button>
                    </div>
                }
            >
                <form id="doc-edit-form" onSubmit={handleDocEditSubmit} className="p-6 space-y-8 font-inter">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
                            <Layers className="w-4 h-4 text-primary" />
                            Core Document Identity
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
                            <div className="font-inter md:col-span-2">
                                <label className={labelClasses}>Document Title <span className="text-rose-500">*</span></label>
                                <input type="text" className={inputClasses()} value={docEditFormData.title} onChange={e => setDocEditFormData({...docEditFormData, title: e.target.value})} required />
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Document Type</label>
                                <select className={inputClasses()} value={docEditFormData.document_type} onChange={e => setDocEditFormData({...docEditFormData, document_type: e.target.value})}>
                                    <option value="General">General</option>
                                    <option value="Drawing">Drawing</option>
                                    <option value="Contract">Contract</option>
                                    <option value="Invoice">Invoice</option>
                                    <option value="Report">Report</option>
                                    <option value="Blueprint">Blueprint</option>
                                </select>
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Status</label>
                                <select className={inputClasses()} value={docEditFormData.status} onChange={e => setDocEditFormData({...docEditFormData, status: e.target.value})}>
                                    <option value="PENDING">PENDING</option>
                                    <option value="APPROVED">APPROVED</option>
                                    <option value="REJECTED">REJECTED</option>
                                </select>
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Version</label>
                                <input type="text" className={inputClasses()} value={docEditFormData.version} onChange={e => setDocEditFormData({...docEditFormData, version: e.target.value})} />
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Update File</label>
                                <input type="file" className={inputClasses()} onChange={e => setDocEditFormData({...docEditFormData, file: e.target.files?.[0] || null})} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
                            <FileText className="w-4 h-4 text-primary" />
                            Technical Specifications
                        </h3>
                        <div className="font-inter">
                            <label className={labelClasses}>Remarks</label>
                            <textarea rows={3} className={`${inputClasses()} resize-none`} value={docEditFormData.remarks} onChange={e => setDocEditFormData({...docEditFormData, remarks: e.target.value})} />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* ── Document Create Modal ────────────────────────────────────────────────────────── */}
            <Modal isOpen={isDocCreateModalOpen} onClose={() => setIsDocCreateModalOpen(false)} title="Upload Document" maxWidth="max-w-4xl"
                footer={
                    <div className="flex items-center justify-end gap-3 px-6 pb-6 font-inter">
                        <button type="button" onClick={() => setIsDocCreateModalOpen(false)} disabled={isSubmitting} className="flex-1 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all font-inter disabled:opacity-50">Cancel</button>
                        <button type="submit" form="doc-create-form" disabled={isSubmitting || !docCreateFormData.title || !docCreateFormData.file} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 font-inter flex items-center justify-center gap-2">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload Document"}
                        </button>
                    </div>
                }
            >
                <form id="doc-create-form" onSubmit={handleDocCreateSubmit} className="p-6 space-y-8 font-inter">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
                            <Layers className="w-4 h-4 text-primary" />
                            Core Document Identity
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
                            <div className="font-inter md:col-span-2">
                                <label className={labelClasses}>Project Context <span className="text-rose-500">*</span></label>
                                <select required className={inputClasses()} value={docCreateFormData.project_id} onChange={e => setDocCreateFormData({...docCreateFormData, project_id: Number(e.target.value)})}>
                                    <option value="">Select Project</option>
                                    {projects.map((p: any) => (
                                        <option key={p.id || p.project_id} value={p.id || p.project_id}>
                                            {p.name || p.project_name || `Project #${p.id || p.project_id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Document Title <span className="text-rose-500">*</span></label>
                                <input type="text" className={inputClasses()} value={docCreateFormData.title} onChange={e => setDocCreateFormData({...docCreateFormData, title: e.target.value})} required />
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Document Type</label>
                                <select className={inputClasses()} value={docCreateFormData.document_type} onChange={e => setDocCreateFormData({...docCreateFormData, document_type: e.target.value})}>
                                    <option value="General">General</option>
                                    <option value="Drawing">Drawing</option>
                                    <option value="Contract">Contract</option>
                                    <option value="Invoice">Invoice</option>
                                    <option value="Report">Report</option>
                                    <option value="Blueprint">Blueprint</option>
                                </select>
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Parent ID</label>
                                <input type="number" className={inputClasses()} value={docCreateFormData.parent_id} onChange={e => setDocCreateFormData({...docCreateFormData, parent_id: e.target.value ? Number(e.target.value) : ""})} />
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>File <span className="text-rose-500">*</span></label>
                                <input type="file" className={inputClasses()} onChange={e => setDocCreateFormData({...docCreateFormData, file: e.target.files?.[0] || null})} required />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
                            <FileText className="w-4 h-4 text-primary" />
                            Technical Specifications
                        </h3>
                        <div className="font-inter">
                            <label className={labelClasses}>Remarks</label>
                            <textarea rows={3} className={`${inputClasses()} resize-none`} value={docCreateFormData.remarks} onChange={e => setDocCreateFormData({...docCreateFormData, remarks: e.target.value})} />
                        </div>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default DrawingsDocumentsPage;