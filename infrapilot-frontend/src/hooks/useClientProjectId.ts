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
  const [projectId, setProjectId] = useState<number | null>(() => {
    // Check currently logged in user first
    const userStr = localStorage.getItem("infrapilot_user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u?.project_id && Number(u.project_id) > 0) {
          return Number(u.project_id);
        }
      } catch (e) {}
    }

    // 1. Synchronous initial check if a project was selected
    const clientSaved = localStorage.getItem("client_selected_project_id");
    if (clientSaved && clientSaved !== "null" && clientSaved !== "undefined") {
      const pid = Number(clientSaved);
      if (pid > 0) return pid;
    }

    const infraSaved = localStorage.getItem("infrapilot_selected_project_id");
    if (infraSaved && infraSaved !== "null" && infraSaved !== "undefined") {
      const pid = Number(infraSaved);
      if (pid > 0) return pid;
    }

    const localSettings = localStorage.getItem("mock_settings");
    if (localSettings) {
      try {
        const parsed = JSON.parse(localSettings);
        if (parsed?.default_project_id) {
          const pid = Number(parsed.default_project_id);
          if (pid > 0) return pid;
        }
      } catch (e) {}
    }

    return null;
  });

  const [loading, setLoading] = useState(!projectId);

  const resolve = useCallback(async () => {
    try {
      // Check currently logged in user first
      const userStr = localStorage.getItem("infrapilot_user");
      let currentUser: any = null;
      if (userStr) {
        try {
          currentUser = JSON.parse(userStr);
          if (currentUser?.project_id && Number(currentUser.project_id) > 0) {
            const pid = Number(currentUser.project_id);
            setProjectId(pid);
            setLoading(false);
            return;
          }
        } catch (e) {}
      }

      // 1. Dynamic API Fallback: Automatically fetch the user's projects list from server
      try {
        const response = await projectService.getProjects(10, 0);
        const items = Array.isArray(response) ? response : (response?.items || response?.data || []);
        if (items.length > 0) {
          const selectedId = localStorage.getItem("client_selected_project_id") || localStorage.getItem("infrapilot_selected_project_id");
          const hasSavedMatch = selectedId && items.some((p: any) => String(p.id || p.project_id) === String(selectedId));

          if (hasSavedMatch) {
            setProjectId(Number(selectedId));
            setLoading(false);
            return;
          }

          const firstProjId = Number(items[0].id || items[0].project_id);
          if (firstProjId > 0) {
            console.debug("useClientProjectId: Auto-selecting user project from API:", firstProjId);
            localStorage.setItem("client_selected_project_id", String(firstProjId));
            localStorage.setItem("infrapilot_selected_project_id", String(firstProjId));
            setProjectId(firstProjId);
            setLoading(false);
            return;
          }
        }
      } catch (apiErr) {
        console.warn("useClientProjectId: API project fetch fallback warning:", apiErr);
      }

      // 2. Check dedicated selection keys
      const selectedId = localStorage.getItem("client_selected_project_id") || localStorage.getItem("infrapilot_selected_project_id");
      if (selectedId && selectedId !== "null" && selectedId !== "undefined") {
        const pid = Number(selectedId);
        if (pid > 0) {
          setProjectId(pid);
          setLoading(false);
          return;
        }
      }

      // 3. Check settings fallback
      const localSettings = localStorage.getItem("mock_settings");
      if (localSettings) {
        try {
          const parsed = JSON.parse(localSettings);
          if (parsed?.default_project_id) {
            const pid = Number(parsed.default_project_id);
            if (pid > 0) {
              localStorage.setItem("client_selected_project_id", String(pid));
              localStorage.setItem("infrapilot_selected_project_id", String(pid));
              setProjectId(pid);
              setLoading(false);
              return;
            }
          }
        } catch (e) {}
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

