import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ---- Backup / Restore ----

const BACKUP_VERSION = 1;

interface SaveData {
  _version: number;
  _exportedAt: string;
  _app: string;
  state: Record<string, any>;
}

/**
 * Export the full Zustand persisted state to a downloadable JSON file.
 * Reads directly from localStorage to capture exactly what persist saves.
 */
export function exportSaveData(): void {
  try {
    const raw = localStorage.getItem("xfiles-game-storage");
    if (!raw) {
      alert("No hay datos guardados para exportar.");
      return;
    }

    const parsed = JSON.parse(raw);
    const saveData: SaveData = {
      _version: BACKUP_VERSION,
      _exportedAt: new Date().toISOString(),
      _app: "trust-no-one",
      state: parsed.state,
    };

    const json = JSON.stringify(saveData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `xfiles-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error exportando backup:", err);
    alert("Error al exportar el backup.");
  }
}

/**
 * Import a JSON backup file and overwrite the current Zustand persisted state.
 * Returns true on success, false on failure.
 */
export function importSaveData(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== "string") {
          alert("Error leyendo el archivo.");
          resolve(false);
          return;
        }

        const saveData: SaveData = JSON.parse(text);

        // Basic validation
        if (!saveData.state || typeof saveData.state !== "object") {
          alert("Archivo de backup inválido: no contiene datos de estado.");
          resolve(false);
          return;
        }

        if (saveData._app !== "trust-no-one") {
          alert("Este archivo no es un backup de Trust No One.");
          resolve(false);
          return;
        }

        // Write directly to localStorage — Zustand persist will pick it up on reload
        const persistData = {
          state: saveData.state,
          version: 5, // match current store version
        };
        localStorage.setItem("xfiles-game-storage", JSON.stringify(persistData));

        // Reload to let Zustand rehydrate with the new data
        window.location.reload();
        resolve(true);
      } catch (err) {
        console.error("Error importando backup:", err);
        alert("Error al importar el backup. Asegúrate de que el archivo es válido.");
        resolve(false);
      }
    };
    reader.onerror = () => {
      alert("Error leyendo el archivo.");
      resolve(false);
    };
    reader.readAsText(file);
  });
}
