import { useState, useEffect, useCallback } from "react";
import { projectService } from "../services/projectService";

/**
 * Shared hook for all Client module pages.
 * Resolves the active project ID from:
 *   1. client_selected_project_id / infrapilot_selected_project_id in localStorage
 *   2. settingsService default_project_id
 *   3. First available project returned by projectService.getProjects() (API fallback)
 */
export function useClientProjectId() {
  const [projectId, setProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const resolve = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch active projects from API to validate project ID exists
      let items: any[] = [];
      try {
        const response = await projectService.getProjects(100, 0);
        items = Array.isArray(response) ? response : (response?.items || response?.data || []);
      } catch (apiErr) {
        console.warn("useClientProjectId: API project fetch warning:", apiErr);
      }

      const validProjectIds = items
        .map((p: any) => Number(p.id || p.project_id))
        .filter((id: number) => id > 0);

      // 1. Check explicit client manual selection FIRST
      const clientSaved = localStorage.getItem("client_selected_project_id");
      if (clientSaved && clientSaved !== "null" && clientSaved !== "undefined") {
        const pid = Number(clientSaved);
        if (pid > 0) {
          if (validProjectIds.length === 0 || validProjectIds.includes(pid)) {
            setProjectId(pid);
            setLoading(false);
            return;
          } else {
            console.warn(`useClientProjectId: Saved project ${pid} not in valid projects list, resetting.`);
            localStorage.removeItem("client_selected_project_id");
          }
        }
      }

      // 2. Check general selected project ID
      const infraSaved = localStorage.getItem("infrapilot_selected_project_id");
      if (infraSaved && infraSaved !== "null" && infraSaved !== "undefined") {
        const pid = Number(infraSaved);
        if (pid > 0) {
          if (validProjectIds.length === 0 || validProjectIds.includes(pid)) {
            setProjectId(pid);
            setLoading(false);
            return;
          } else {
            localStorage.removeItem("infrapilot_selected_project_id");
          }
        }
      }

      // 3. Check settings fallback
      const localSettings = localStorage.getItem("mock_settings");
      if (localSettings) {
        try {
          const parsed = JSON.parse(localSettings);
          if (parsed?.default_project_id) {
            const pid = Number(parsed.default_project_id);
            if (pid > 0 && (validProjectIds.length === 0 || validProjectIds.includes(pid))) {
              setProjectId(pid);
              setLoading(false);
              return;
            }
          }
        } catch (e) {}
      }

      // 4. Check user profile project_id fallback
      const userStr = localStorage.getItem("infrapilot_user");
      if (userStr) {
        try {
          const currentUser = JSON.parse(userStr);
          if (currentUser?.project_id && Number(currentUser.project_id) > 0) {
            const pid = Number(currentUser.project_id);
            if (validProjectIds.length === 0 || validProjectIds.includes(pid)) {
              setProjectId(pid);
              setLoading(false);
              return;
            }
          }
        } catch (e) {}
      }

      // 5. Fallback to first available project from API
      if (validProjectIds.length > 0) {
        const firstProjId = validProjectIds[0];
        localStorage.setItem("client_selected_project_id", String(firstProjId));
        setProjectId(firstProjId);
        setLoading(false);
        return;
      }

      setProjectId(null);
    } catch (err) {
      console.error("useClientProjectId: failed to resolve project:", err);
      setProjectId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    resolve();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "mock_settings" || e.key === "client_selected_project_id" || e.key === "infrapilot_selected_project_id") {
        resolve();
      }
    };

    const handleCustomProjectChange = () => {
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

  return { projectId, loading };
}

