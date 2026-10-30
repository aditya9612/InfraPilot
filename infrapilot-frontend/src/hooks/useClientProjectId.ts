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

      const userStr = localStorage.getItem("infrapilot_user");
      let currentUser: any = null;
      if (userStr) {
        try { currentUser = JSON.parse(userStr); } catch { }
      }

      // If user is marked deleted in infrapilot_deleted_clients, reject immediately
      if (currentUser) {
        try {
          const deletedList = JSON.parse(localStorage.getItem("infrapilot_deleted_clients") || "[]");
          const uid = Number(currentUser.id || currentUser.user_id);
          const cleanMob = (currentUser.mobile || "").replace(/\D/g, "").slice(-10);
          const isDeleted = deletedList.some((d: any) =>
            (d.id && Number(d.id) === uid) ||
            (cleanMob && d.mobile && d.mobile.replace(/\D/g, "").slice(-10) === cleanMob)
          );
          if (isDeleted) {
            localStorage.removeItem("client_selected_project_id");
            setProjectId(null);
            setLoading(false);
            return;
          }
        } catch { }
      }

      const isClientRole = currentUser?.role?.toLowerCase() === "client" ||
        window.location.pathname.startsWith("/client");

      let clientAuthorizedProjects = items;
      if (isClientRole && currentUser) {
        const uid = Number(currentUser.id || currentUser.user_id);
        const uName = (currentUser.name || currentUser.full_name || "").toLowerCase().trim();
        const uEmail = (currentUser.email || "").toLowerCase().trim();

        clientAuthorizedProjects = items.filter((p: any) => {
          const pClientId = p.client_id != null && Number(p.client_id) > 0 ? Number(p.client_id) : null;
          const pClientName = (p.client_name || "").toLowerCase().trim();
          const pClientEmail = (p.client_email || "").toLowerCase().trim();
          const pId = Number(p.id || p.project_id);

          // 1. If project is explicitly assigned to ANOTHER client ID, reject
          if (pClientId != null && uid > 0 && pClientId !== uid) {
            return false;
          }
          // 2. If project is explicitly assigned to ANOTHER client name, reject
          if (pClientName && uName && pClientName !== uName && !pClientName.includes(uName) && !uName.includes(pClientName)) {
            return false;
          }

          // 3. Positive match by client_id
          if (pClientId != null && uid > 0 && pClientId === uid) return true;
          // 4. Positive match by client_name
          if (pClientName && uName && (pClientName === uName || pClientName.includes(uName) || uName.includes(pClientName))) return true;
          // 5. Positive match by client_email
          if (pClientEmail && uEmail && pClientEmail === uEmail) return true;
          // 6. Direct user profile project_id
          if (currentUser.project_id && Number(currentUser.project_id) === pId) return true;

          return false;
        });
      }

      const validProjectIds = clientAuthorizedProjects
        .map((p: any) => Number(p.id || p.project_id))
        .filter((id: number) => id > 0);

      // If client role and no authorized projects found, do NOT fall back to other clients' projects
      if (isClientRole && validProjectIds.length === 0) {
        localStorage.removeItem("client_selected_project_id");
        setProjectId(null);
        setLoading(false);
        return;
      }

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
        } catch (e) { }
      }

      // 4. Check user profile project_id fallback
      if (userStr) {
        try {
          const uProfile = JSON.parse(userStr);
          if (uProfile?.project_id && Number(uProfile.project_id) > 0) {
            const pid = Number(uProfile.project_id);
            if (validProjectIds.length === 0 || validProjectIds.includes(pid)) {
              setProjectId(pid);
              setLoading(false);
              return;
            }
          }
        } catch (e) { }
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

