import { useState, useEffect, useCallback } from "react";
import { projectService } from "../services/projectService";

export interface LabourProjectState {
  projectId: number | null;
  projectName: string;
  loading: boolean;
  setProject: (id: number, name?: string) => void;
  refreshProject: () => Promise<void>;
}

/**
 * Shared hook for all Labour module pages.
 * Resolves and synchronizes the active project ID and Name across all Labour pages.
 * Priority:
 *   1. client_selected_project_id / infrapilot_selected_project_id in localStorage (set in Settings)
 *   2. User profile default project (user.project_id)
 *   3. Settings service default_project_id
 *   4. First available project from projectService.getProjects()
 */
export function useLabourProjectId(): LabourProjectState {
  const [projectId, setProjectId] = useState<number | null>(() => {
    const saved = localStorage.getItem("client_selected_project_id") || localStorage.getItem("infrapilot_selected_project_id");
    return saved && saved !== "null" && saved !== "undefined" ? Number(saved) : null;
  });
  const [projectName, setProjectName] = useState<string>(() => {
    return localStorage.getItem("client_selected_project_name") || localStorage.getItem("infrapilot_selected_project_name") || "";
  });
  const [loading, setLoading] = useState(true);

  const resolve = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch project list from API to validate and get accurate project name
      let items: any[] = [];
      try {
        const response = await projectService.getProjects(100, 0);
        items = Array.isArray(response) ? response : (response?.items || response?.data || []);
      } catch (apiErr) {
        console.warn("useLabourProjectId: API project fetch warning:", apiErr);
      }

      const validProjectIds = items
        .map((p: any) => Number(p.id || p.project_id))
        .filter((id: number) => id > 0);

      // Helper to update both state and localStorage consistently
      const applyProject = (pid: number, pname?: string) => {
        const found = items.find((p: any) => Number(p.id || p.project_id) === pid);
        const resolvedName = pname || (found ? (found.name || found.project_name || found.title) : "") || "";

        setProjectId(pid);
        if (resolvedName) {
          setProjectName(resolvedName);
        }

        const pidStr = String(pid);
        localStorage.setItem("client_selected_project_id", pidStr);
        localStorage.setItem("infrapilot_selected_project_id", pidStr);
        if (resolvedName) {
          localStorage.setItem("client_selected_project_name", resolvedName);
          localStorage.setItem("infrapilot_selected_project_name", resolvedName);
        }
      };

      // 2. Check explicit saved project in localStorage (selected from Settings)
      const saved = localStorage.getItem("client_selected_project_id") || localStorage.getItem("infrapilot_selected_project_id");
      const savedName = localStorage.getItem("client_selected_project_name") || localStorage.getItem("infrapilot_selected_project_name") || "";
      if (saved && saved !== "null" && saved !== "undefined") {
        const pid = Number(saved);
        if (pid > 0) {
          if (validProjectIds.length === 0 || validProjectIds.includes(pid)) {
            applyProject(pid, savedName);
            setLoading(false);
            return;
          } else {
            console.warn(`useLabourProjectId: Saved project ${pid} not in valid projects list, resetting.`);
            localStorage.removeItem("client_selected_project_id");
            localStorage.removeItem("infrapilot_selected_project_id");
          }
        }
      }

      // 3. Check user profile project_id
      const userStr = localStorage.getItem("infrapilot_user");
      if (userStr) {
        try {
          const currentUser = JSON.parse(userStr);
          if (currentUser?.project_id && Number(currentUser.project_id) > 0) {
            const pid = Number(currentUser.project_id);
            if (validProjectIds.length === 0 || validProjectIds.includes(pid)) {
              applyProject(pid, currentUser.project_name || "");
              setLoading(false);
              return;
            }
          }
        } catch (e) {}
      }

      // 4. Check settings fallback
      const localSettings = localStorage.getItem("mock_settings");
      if (localSettings) {
        try {
          const parsed = JSON.parse(localSettings);
          if (parsed?.default_project_id) {
            const pid = Number(parsed.default_project_id);
            if (pid > 0 && (validProjectIds.length === 0 || validProjectIds.includes(pid))) {
              applyProject(pid);
              setLoading(false);
              return;
            }
          }
        } catch (e) {}
      }

      // 5. Fallback to first available project from API
      if (validProjectIds.length > 0) {
        const firstProj = items[0];
        const firstId = Number(firstProj.id || firstProj.project_id);
        const firstName = firstProj.name || firstProj.project_name || firstProj.title || "";
        applyProject(firstId, firstName);
        setLoading(false);
        return;
      }

      setProjectId(null);
    } catch (err) {
      console.error("useLabourProjectId: failed to resolve project:", err);
      setProjectId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const setProject = useCallback((id: number, name?: string) => {
    const idStr = String(id);
    localStorage.setItem("client_selected_project_id", idStr);
    localStorage.setItem("infrapilot_selected_project_id", idStr);
    if (name) {
      localStorage.setItem("client_selected_project_name", name);
      localStorage.setItem("infrapilot_selected_project_name", name);
      setProjectName(name);
    }
    setProjectId(id);
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("project_changed", { detail: { id, name } }));
  }, []);

  useEffect(() => {
    resolve();

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "mock_settings" ||
        e.key === "client_selected_project_id" ||
        e.key === "infrapilot_selected_project_id" ||
        e.key === "client_selected_project_name" ||
        e.key === "infrapilot_selected_project_name"
      ) {
        resolve();
      }
    };

    const handleCustomProjectChange = (e: any) => {
      if (e?.detail?.id) {
        setProjectId(Number(e.detail.id));
        if (e.detail.name) setProjectName(e.detail.name);
      }
      resolve();
    };

    window.addEventListener("focus", resolve);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("project_changed", handleCustomProjectChange);

    return () => {
      window.removeEventListener("focus", resolve);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("project_changed", handleCustomProjectChange);
    };
  }, [resolve]);

  return { projectId, projectName, loading, setProject, refreshProject: resolve };
}
