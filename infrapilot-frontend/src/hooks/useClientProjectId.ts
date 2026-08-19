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
    // 1. Check explicit client manual selection FIRST — highest priority!
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

    // 2. Check logged-in user project_id only as initial fallback
    const userStr = localStorage.getItem("infrapilot_user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u?.project_id && Number(u.project_id) > 0) {
          return Number(u.project_id);
        }
      } catch (e) {}
    }

    return null;
  });

  const [loading, setLoading] = useState(!projectId);

  const resolve = useCallback(async () => {
    try {
      // 1. Check explicit client manual selection FIRST — highest priority!
      const clientSaved = localStorage.getItem("client_selected_project_id");
      if (clientSaved && clientSaved !== "null" && clientSaved !== "undefined") {
        const pid = Number(clientSaved);
        if (pid > 0) {
          setProjectId(pid);
          setLoading(false);
          return;
        }
      }

      const infraSaved = localStorage.getItem("infrapilot_selected_project_id");
      if (infraSaved && infraSaved !== "null" && infraSaved !== "undefined") {
        const pid = Number(infraSaved);
        if (pid > 0) {
          setProjectId(pid);
          setLoading(false);
          return;
        }
      }

      // 2. Check settings fallback
      const localSettings = localStorage.getItem("mock_settings");
      if (localSettings) {
        try {
          const parsed = JSON.parse(localSettings);
          if (parsed?.default_project_id) {
            const pid = Number(parsed.default_project_id);
            if (pid > 0) {
              setProjectId(pid);
              setLoading(false);
              return;
            }
          }
        } catch (e) {}
      }

      // 3. Check user profile project_id fallback
      const userStr = localStorage.getItem("infrapilot_user");
      if (userStr) {
        try {
          const currentUser = JSON.parse(userStr);
          if (currentUser?.project_id && Number(currentUser.project_id) > 0) {
            const pid = Number(currentUser.project_id);
            setProjectId(pid);
            setLoading(false);
            return;
          }
        } catch (e) {}
      }

      // 4. Initial fetch from API only if NO project was ever selected
      try {
        const response = await projectService.getProjects(100, 0);
        const items = Array.isArray(response) ? response : (response?.items || response?.data || []);
        if (items.length > 0) {
          // Double check if client_selected_project_id was set in the meantime
          const currentSaved = localStorage.getItem("client_selected_project_id");
          if (currentSaved && currentSaved !== "null" && currentSaved !== "undefined") {
            const pid = Number(currentSaved);
            if (pid > 0) {
              setProjectId(pid);
              setLoading(false);
              return;
            }
          }

          const firstProjId = Number(items[0].id || items[0].project_id);
          if (firstProjId > 0) {
            localStorage.setItem("client_selected_project_id", String(firstProjId));
            setProjectId(firstProjId);
            setLoading(false);
            return;
          }
        }
      } catch (apiErr) {
        console.warn("useClientProjectId: API project fetch fallback warning:", apiErr);
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

