import { useState, useEffect, useCallback, useRef } from "react";
import { getAdviceRequest } from "../api/adviceRequests.js";
import { apiToEngine, engineToApi } from "../api/dataMapper.js";
import apiClient from "../api/apiClient.js";

/**
 * Hook for loading an advice request from the API and returning engine-compatible data.
 *
 * @param {string|null} adviceRequestId - The ID of the advice request to load
 * @returns {{ factFindData, strategies, isLoading, error, refetch, save, saveStatus }}
 */
export function useAdviceRequest(adviceRequestId) {
  const [factFindData, setFactFindData] = useState(null);
  const [strategies, setStrategies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle"); // "idle" | "saving" | "saved" | "error"

  const saveTimerRef = useRef(null);
  const lastSavedRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!adviceRequestId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAdviceRequest(adviceRequestId);
      const engineData = apiToEngine(response);
      setFactFindData(engineData);
      setStrategies(response.adviceRequest?.strategy?.strategies || response.strategies || []);
      lastSavedRef.current = JSON.stringify(engineData);
    } catch (err) {
      setError(err.message || "Failed to load advice request");
    } finally {
      setIsLoading(false);
    }
  }, [adviceRequestId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save function — calls engineToApi and PUTs to the API
  const save = useCallback(
    async (currentFactFind, currentStrategies) => {
      if (!adviceRequestId) return;
      const data = currentFactFind || factFindData;
      const strats = currentStrategies || strategies;
      if (!data) return;

      const serialized = JSON.stringify(data);
      if (serialized === lastSavedRef.current) return; // No changes

      setSaveStatus("saving");
      try {
        const payload = engineToApi(data, strats);
        await apiClient.put(`/advice-requests/${adviceRequestId}`, payload);
        lastSavedRef.current = serialized;
        setSaveStatus("saved");
        // Reset to idle after 2 seconds
        setTimeout(() => setSaveStatus((prev) => (prev === "saved" ? "idle" : prev)), 2000);
      } catch (err) {
        console.error("[useAdviceRequest] Save failed:", err);
        setSaveStatus("error");
      }
    },
    [adviceRequestId, factFindData, strategies]
  );

  // Debounced auto-save (2 second debounce)
  const debouncedSave = useCallback(
    (currentFactFind, currentStrategies) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        save(currentFactFind, currentStrategies);
      }, 2000);
    },
    [save]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return {
    factFindData,
    strategies,
    isLoading,
    error,
    refetch: fetchData,
    save,
    debouncedSave,
    saveStatus,
  };
}
