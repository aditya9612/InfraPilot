import { useState, useEffect, useCallback } from "react";
import { projectService } from "../services/projectService";

/**
 * Shared hook for all Client module pages.
 * Resolves the active project ID from:
 *   1. settingsService.getSettings().default_project_id  (user's chosen project)
 *   2. First project returned by projectService.getProjects  (fallback)
 *
 * Also re-checks on window focus so that switching projects in Settings
 * is immediately reflected when the user navigates back.
 */
export function useClientProjectId() {
  const [projectId, setProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const resolve = useCallback(async () => {
    try {
      // 1. Try local cache first to avoid API call as requested
      const localSettings = localStorage.getItem("mock_settings");
      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        if (parsed?.default_project_id) {
          setProjectId(Number(parsed.default_project_id));
          setLoading(false);
          return;
        }
      }

      // 2. Fallback: first available project
      const projectsResult: any = await projectService.getProjects(1, 0);
      let pid: number | null = null;
      if (Array.isArray(projectsResult) && projectsResult.length > 0) {
        pid = projectsResult[0].id || projectsResult[0].project_id;
      } else if (projectsResult?.items?.length > 0) {
        pid = projectsResult.items[0].id || projectsResult.items[0].project_id;
      } else if (projectsResult?.data?.length > 0) {
        pid = projectsResult.data[0].id || projectsResult.data[0].project_id;
      }
      setProjectId(pid);
    } catch (err) {
      console.error("useClientProjectId: failed to resolve project:", err);
      setProjectId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    resolve();

    // Re-check when window regains focus or user navigates
    window.addEventListener("focus", resolve);
    return () => window.removeEventListener("focus", resolve);
  }, [resolve, window.location.pathname]);

  return { projectId, loading };
}
