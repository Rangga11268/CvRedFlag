import { useState, useRef, useEffect, useCallback } from "react";

export function useUndoRedo(
  cvText: string,
  activeTab: string,
  showToast: (msg: string, type?: "error" | "success" | "info") => void
) {
  const [editableCV, setEditableCV] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const undoRef = useRef<{ timer: NodeJS.Timeout | null; lastPushedText: string }>({
    timer: null,
    lastPushedText: "",
  });

  // Initialize history when CV text is first available
  useEffect(() => {
    const startText = editableCV || cvText;
    if (startText && history.length === 0) {
      setHistory([startText]);
      setHistoryIndex(0);
      undoRef.current.lastPushedText = startText;
    }
  }, [cvText, editableCV, history.length]);

  // Check for saved draft in localStorage on CV load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const draft = localStorage.getItem("cv_editor_draft");
      if (draft && draft.trim() !== "") {
        const currentText = editableCV || cvText;
        if (currentText && draft.trim() !== currentText.trim()) {
          setHasDraft(true);
        }
      }
    }
  }, [cvText]);

  const pushToHistory = useCallback(
    (newText: string, immediate: boolean = false) => {
      if (undoRef.current.timer) {
        clearTimeout(undoRef.current.timer);
        undoRef.current.timer = null;
      }

      const doPush = (val: string) => {
        if (val === undoRef.current.lastPushedText) return;
        setHistory((prev) => {
          const nextHist = prev.slice(0, historyIndex + 1);
          if (nextHist.length >= 100) {
            nextHist.shift();
          }
          const updated = [...nextHist, val];
          setHistoryIndex(updated.length - 1);
          return updated;
        });
        undoRef.current.lastPushedText = val;
      };

      if (immediate) {
        doPush(newText);
      } else {
        undoRef.current.timer = setTimeout(() => {
          doPush(newText);
        }, 500);
      }
    },
    [historyIndex]
  );

  const updateCV = useCallback(
    (newText: string, immediate: boolean = false) => {
      setEditableCV(newText);
      pushToHistory(newText, immediate);
      if (typeof window !== "undefined") {
        localStorage.setItem("cv_editor_draft", newText);
      }
    },
    [pushToHistory]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const val = history[newIndex];
      setEditableCV(val);
      undoRef.current.lastPushedText = val;
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const val = history[newIndex];
      setEditableCV(val);
      undoRef.current.lastPushedText = val;
    }
  }, [historyIndex, history]);

  const handleRestoreDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      const draft = localStorage.getItem("cv_editor_draft");
      if (draft) {
        updateCV(draft, true);
        setHasDraft(false);
        showToast("Draf pengeditan berhasil dipulihkan!", "success");
      }
    }
  }, [updateCV, showToast]);

  const handleClearDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("cv_editor_draft");
      setHasDraft(false);
      showToast("Draf diabaikan.", "info");
    }
  }, [showToast]);

  // Keyboard shortcut: Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== "raw") return;
      const isMac =
        typeof window !== "undefined" &&
        navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (cmdOrCtrl && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [history, historyIndex, activeTab, handleUndo, handleRedo]);

  return {
    editableCV,
    setEditableCV,
    history,
    historyIndex,
    hasDraft,
    updateCV,
    handleUndo,
    handleRedo,
    handleRestoreDraft,
    handleClearDraft,
  };
}
