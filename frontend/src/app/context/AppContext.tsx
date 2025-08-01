// AppContext.tsx

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { Document } from "@/types/documents";
import { ChatMessage } from "@/types/chat";
import { Namespace } from "@/types/namespaces";

// Update AppState to use namespaces instead of collections
interface AppState {
  namespaces: Namespace[];
  selectedNamespaces: string[];
  documents: Document[];
  chatMessages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

export interface IngestionTask {
  id: string;
  namespace_name: string;
  state: "PENDING" | "FINISHED" | "FAILED" | "UNKNOWN";
  created_at: string;
  documents?: string[];
  result?: any;
}

// Update AppContextType to use namespaces instead of collections
interface AppContextType extends AppState {
  setNamespaces: (namespaces: Namespace[]) => void;
  setSelectedNamespaces: React.Dispatch<React.SetStateAction<string[]>>;
  setDocuments: (documents: Document[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  pendingTasks: IngestionTask[];
  addPendingTask: (task: IngestionTask) => void;
  updateTaskStatus: (
    taskId: string,
    state: IngestionTask["state"],
    result?: any
  ) => void;
  removePendingTask: (taskId: string) => void;
  onDocumentsUpdated: (namespaceName: string, callback: () => void) => () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Update AppProvider to use namespaces instead of collections
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [selectedNamespaces, setSelectedNamespaces] = useState<string[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingTasks, setPendingTasks] = useState<IngestionTask[]>([]);

  const documentUpdateCallbacksRef = useRef<{
    [namespaceName: string]: Array<() => void>;
  }>({});

  const addChatMessage = (message: ChatMessage) => {
    setChatMessages((prev) => [...prev, message]);
  };

  const clearChatMessages = () => setChatMessages([]);

  const addPendingTask = (task: IngestionTask) =>
    setPendingTasks((prev) => [...prev, task]);

  const updateTaskStatus = (
    taskId: string,
    state: IngestionTask["state"],
    result?: any
  ) => {
    setPendingTasks((prev) => {
      const updatedTasks = prev.map((task) =>
        task.id === taskId
          ? { ...task, state, result: result || task.result }
          : task
      );

      const updatedTask = updatedTasks.find((task) => task.id === taskId);
      if (
        updatedTask &&
        (state === "FINISHED" || state === "FAILED") &&
        updatedTask.namespace_name
      ) {
        const cbs = documentUpdateCallbacksRef.current[updatedTask.namespace_name];
        if (cbs) {
          setTimeout(() => {
            cbs.forEach((cb) => {
              try {
                cb();
              } catch (e) {
                console.error("Error executing document update callback:", e);
              }
            });
          }, 0);
        }
      }

      return updatedTasks;
    });
  };

  const removePendingTask = (taskId: string) =>
    setPendingTasks((prev) => prev.filter((task) => task.id !== taskId));

  const onDocumentsUpdated = (namespaceName: string, callback: () => void) => {
    if (!documentUpdateCallbacksRef.current[namespaceName]) {
      documentUpdateCallbacksRef.current[namespaceName] = [];
    }
    documentUpdateCallbacksRef.current[namespaceName].push(callback);
    return () => {
      documentUpdateCallbacksRef.current[namespaceName] = documentUpdateCallbacksRef
        .current[namespaceName]
        .filter((cb) => cb !== callback);
    };
  };

  useEffect(() => {
    if (pendingTasks.length === 0) return;

    const intervalId = setInterval(async () => {
      const active = pendingTasks.filter((t) => t.state === "PENDING");
      if (active.length === 0) return;

      for (const task of active) {
        try {
          const res = await fetch(`/api/task-status?task_id=${task.id}`);
          if (!res.ok) continue;

          const data = await res.json();
          if (task.state !== data.state) {
            updateTaskStatus(task.id, data.state, data.result);

            if (["FINISHED", "FAILED"].includes(data.state)) {
              const resp = await fetch("/api/namespaces");
              if (resp.ok) {
                const { namespaces: updated } = await resp.json();
                const formatted = updated.map((n: any) => ({
                  namespace_name: n.namespace_name,
                  document_count: n.num_entities,
                  index_count: n.num_entities,
                  metadata_schema: n.metadata_schema ?? [],
                }));

                if (data.result.failed_documents?.length > 0) {
                  localStorage.setItem(
                    `failedDocs:${task.namespace_name}`,
                    JSON.stringify(data.result.failed_documents)
                  );
                }

                const changed =
                  JSON.stringify(formatted) !== JSON.stringify(namespaces);
                if (changed) setNamespaces(formatted);
              }
            }
          }
        } catch (err) {
          console.error(`Polling error for ${task.id}:`, err);
        }
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [pendingTasks, namespaces]);

  return (
    <AppContext.Provider
      value={{
        namespaces,
        selectedNamespaces,
        setNamespaces,
        setSelectedNamespaces,
        documents,
        setDocuments,
        chatMessages,
        addChatMessage,
        clearChatMessages,
        loading,
        setLoading,
        error,
        setError,
        pendingTasks,
        addPendingTask,
        updateTaskStatus,
        removePendingTask,
        onDocumentsUpdated,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};
