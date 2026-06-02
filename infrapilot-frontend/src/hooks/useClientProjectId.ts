import { useState, useEffect, useCallback } from "react";

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
      setLoading(true);
      
      // 1. Try dedicated selection key first (Independent of server defaults)
      const selectedId = localStorage.getItem("client_selected_project_id");
      if (selectedId && selectedId !== "null") {
        const pid = Number(selectedId);
        console.debug("useClientProjectId: Resolved from dedicated key:", pid);
        setProjectId(pid);
        setLoading(false);
        return;
      }

      // 2. Try settings fallback if selection key is missing
      const localSettings = localStorage.getItem("mock_settings");
      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        if (parsed?.default_project_id) {
          const pid = Number(parsed.default_project_id);
          console.debug("useClientProjectId: Resolved from settings fallback:", pid);
          setProjectId(pid);
          setLoading(false);
          return;
        }
      }

      // 3. NO automatic fallback to project 1/92. Keep them on equal level.
      console.debug("useClientProjectId: No project selected or found in settings.");
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

    // Listen for changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "mock_settings") {
        console.debug("useClientProjectId: Storage update detected, re-resolving...");
        resolve();
      }
    };

    // Re-check when window regains focus (user might have switched back from settings tab)
    window.addEventListener("focus", resolve);
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("focus", resolve);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [resolve]);

  return { projectId, loading };
}
