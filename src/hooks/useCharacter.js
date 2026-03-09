import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useCallback, useRef } from "react";

export function useCharacter(characterId) {
  const character = useQuery(
    api.characters.get,
    characterId ? { characterId } : "skip"
  );
  const updateMutation = useMutation(api.characters.update);

  const [localData, setLocalData] = useState(null);
  const pendingUpdates = useRef({});
  const saveTimer = useRef(null);
  const inFlight = useRef(false);

  // Sync from Convex → local when server data arrives and no pending save
  useEffect(() => {
    if (character && !saveTimer.current && !inFlight.current) {
      setLocalData(character);
    }
  }, [character]);

  // Debounced save to Convex
  const saveToConvex = useCallback((fields) => {
    pendingUpdates.current = { ...pendingUpdates.current, ...fields };

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const updates = { ...pendingUpdates.current };
      pendingUpdates.current = {};
      saveTimer.current = null;
      if (characterId && Object.keys(updates).length > 0) {
        try {
          inFlight.current = true;
          await updateMutation({ characterId, fields: updates });
          inFlight.current = false;
        } catch (e) {
          inFlight.current = false;
          console.error("Failed to save to Convex:", e);
        }
      }
    }, 400);
  }, [characterId, updateMutation]);

  // Flush pending saves immediately (for beforeunload)
  const flush = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const updates = { ...pendingUpdates.current };
    pendingUpdates.current = {};
    if (characterId && Object.keys(updates).length > 0) {
      updateMutation({ characterId, fields: updates });
    }
  }, [characterId, updateMutation]);

  // Flush on page unload
  useEffect(() => {
    const handleUnload = () => flush();
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      flush();
    };
  }, [flush]);

  // Update a field locally + queue save
  const updateField = useCallback((field, value) => {
    setLocalData((prev) => prev ? { ...prev, [field]: value } : prev);
    saveToConvex({ [field]: value });
  }, [saveToConvex]);

  return {
    data: localData,
    isLoading: character === undefined,
    updateField,
  };
}
