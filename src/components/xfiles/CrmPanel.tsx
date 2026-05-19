"use client";

import { useState, useMemo, useCallback } from "react";
import { useGameStore } from "@/lib/game-store";
import {
  COMPANY_STATES,
  COMPANY_CHANNELS,
  type Company,
  type CompanyState,
  type CompanyChannel,
} from "@/lib/game-store";
import { useModeColors } from "@/hooks/use-mode-colors";
import { useThemeText } from "@/hooks/use-theme-text";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Building2,
  Plus,
  Search,
  X,
  Trash2,
  ChevronRight,
  PlusCircle,
  ExternalLink,
  Mail,
  User,
  Calendar,
  FileText,
  Tag,
  Globe,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Download,
} from "lucide-react";

const getTodayStr = () => new Date().toISOString().slice(0, 10);

const EMPTY_COMPANY = {
  empresa: "",
  estado: "Por contactar" as CompanyState,
  canal: "LinkedIn" as CompanyChannel,
  contacto: "",
  emailContacto: "",
  urlOferta: "",
  fechaPrimerContacto: getTodayStr(),
  ultimoMovimiento: getTodayStr(),
  notas: "",
};

export default function CrmPanel() {
  const { companies, addCompany, updateCompany, deleteCompany, addCompanyAction, clearAllCompanies } =
    useGameStore();
  const mc = useModeColors();
  const t = useThemeText();

  const crmBg = mc.bg;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterCanal, setFilterCanal] = useState("");

  // Detail view
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<(typeof EMPTY_COMPANY) | null>(null);
  const [newActionText, setNewActionText] = useState("");

  // New company form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState<typeof EMPTY_COMPANY>({ ...EMPTY_COMPANY });

  // Sorting
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortArrow = (key: string) => {
    if (sortKey !== key) return <ArrowUpDown className="w-3 h-3 opacity-30 inline ml-1" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 opacity-80 inline ml-1" /> : <ArrowDown className="w-3 h-3 opacity-80 inline ml-1" />;
  };

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  // Filtered + sorted companies
  const filtered = useMemo(() => {
    let result = companies.filter((c) => {
      if (search && !c.empresa.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterEstado && c.estado !== filterEstado) return false;
      if (filterCanal && c.canal !== filterCanal) return false;
      return true;
    });
    if (sortKey) {
      result = [...result].sort((a, b) => {
        let va: string | number = "";
        let vb: string | number = "";
        if (sortKey === "empresa") { va = a.empresa.toLowerCase(); vb = b.empresa.toLowerCase(); }
        else if (sortKey === "estado") { va = a.estado.toLowerCase(); vb = b.estado.toLowerCase(); }
        else if (sortKey === "canal") { va = a.canal.toLowerCase(); vb = b.canal.toLowerCase(); }
        else if (sortKey === "contacto") { va = (a.contacto || "zzz").toLowerCase(); vb = (b.contacto || "zzz").toLowerCase(); }
        else if (sortKey === "ultimoMovimiento") { va = a.ultimoMovimiento || ""; vb = b.ultimoMovimiento || ""; }
        else if (sortKey === "acciones") { va = a.acciones.length; vb = b.acciones.length; }
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [companies, search, filterEstado, filterCanal, sortKey, sortDir]);

  // Active companies (not Descartada)
  const activeCount = useMemo(
    () => companies.filter((c) => c.estado !== "Descartada").length,
    [companies]
  );

  const clearFilters = () => {
    setSearch("");
    setFilterEstado("");
    setFilterCanal("");
  };

  const hasFilters = search || filterEstado || filterCanal;

  // Open detail
  const openDetail = (id: string) => {
    const company = companies.find((c) => c.id === id);
    if (!company) return;
    setSelectedId(id);
    setEditForm({
      empresa: company.empresa,
      estado: company.estado,
      canal: company.canal,
      contacto: company.contacto,
      emailContacto: company.emailContacto,
      urlOferta: company.urlOferta,
      fechaPrimerContacto: company.fechaPrimerContacto,
      ultimoMovimiento: company.ultimoMovimiento,
      notas: company.notas,
    });
    setNewActionText("");
  };

  const closeDetail = () => {
    setSelectedId(null);
    setEditForm(null);
    setNewActionText("");
  };

  const saveDetail = useCallback(() => {
    if (!selectedId || !editForm) return;
    updateCompany(selectedId, editForm);
    closeDetail();
  }, [selectedId, editForm, updateCompany]);

  const handleAddAction = useCallback(() => {
    const text = newActionText.trim();
    if (!text || !selectedId) return;
    addCompanyAction(selectedId, text);
    setNewActionText("");
  }, [newActionText, selectedId, addCompanyAction]);

  const handleNewCompany = useCallback(() => {
    if (!newForm.empresa.trim()) return;
    addCompany(newForm);
    setNewForm({ ...EMPTY_COMPANY });
    setShowNewForm(false);
  }, [newForm, addCompany]);

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteCompany(deleteTarget);
      setDeleteTarget(null);
      if (selectedId === deleteTarget) closeDetail();
    }
  }, [deleteTarget, deleteCompany, selectedId]);

  const exportCSV = useCallback(() => {
    const headers = ["Empresa", "Estado", "Canal", "Contacto", "Email", "URL Oferta", "Primer Contacto", "Ultimo Movimiento", "Notas", "Acciones"];
    const rows = filtered.map((c) => [
      c.empresa,
      c.estado,
      c.canal,
      c.contacto,
      c.emailContacto,
      c.urlOferta,
      c.fechaPrimerContacto,
      c.ultimoMovimiento,
      c.notas.replace(/[\n\r]/g, " "),
      c.acciones.map((a) => `[${formatDateTime(a.date)}] ${a.text}`).join(" | "),
    ]);
    const csvContent = [headers, ...rows].map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""') }"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crm_buscador_${getTodayStr()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const confirmClear = useCallback(() => {
    clearAllCompanies();
    setConfirmClearAll(false);
    closeDetail();
  }, [clearAllCompanies]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" });
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const selectedCompany = selectedId ? companies.find((c) => c.id === selectedId) : null;

  const selectClass =
    "w-full bg-[rgba(20,20,20,0.5)] border border-[rgba(var(--mode-accent-rgb),0.25)] rounded px-3 py-2 font-mono text-[13px] text-[#e0e0e0] focus:outline-none focus:border-[rgba(var(--mode-accent-rgb),0.5)] appearance-none cursor-pointer";

  const inputClass =
    "w-full bg-[rgba(20,20,20,0.5)] border border-[rgba(var(--mode-accent-rgb),0.25)] rounded px-3 py-2 font-mono text-[13px] text-[#e0e0e0] placeholder-[#666666] focus:outline-none focus:border-[rgba(var(--mode-accent-rgb),0.5)]";

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-2 py-1 rounded border text-[#6b8a6b] transition-all font-mono text-[10px] cursor-pointer"
        style={{ borderColor: `rgba(${mc.accentRgb},0.15)` }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = mc.accent;
          e.currentTarget.style.borderColor = `rgba(${mc.accentRgb},0.3)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "";
          e.currentTarget.style.borderColor = `rgba(${mc.accentRgb},0.15)`;
        }}
        data-tooltip="Empresas"
      >
        <Building2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">EMPRESAS</span>
      </button>

      {/* Main Dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!v && (selectedId || showNewForm)) { closeDetail(); setShowNewForm(false); return; } setOpen(v); if (!v) { closeDetail(); setShowNewForm(false); } }}>
        <DialogContent
          className="xfiles-card h-[80vh] flex flex-col overflow-hidden"
          overlayClassName="bg-black/95"
          style={{ background: crmBg, maxWidth: "68rem", width: "95vw", borderColor: `rgba(${mc.accentRgb},0.15)` }}
        >
          <DialogHeader className="shrink-0 pb-2 border-b border-[rgba(var(--mode-accent-rgb),0.12)]">
            <DialogTitle className="font-mono text-lg flex items-center gap-2" style={{ color: mc.accent }}>
              <Building2 className="w-4 h-4" />
              {selectedId ? (
                <>
                  <button onClick={closeDetail} className="text-[#666666] hover:text-[#d4d4d4] transition-colors mr-1">
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  {editForm?.empresa || t.crmFallback}
                </>
              ) : (
                t.crmTitle
              )}
            </DialogTitle>
          </DialogHeader>

          {/* MAIN VIEW: Table */}
          {!selectedId && !showNewForm && (
            <div className="flex flex-col flex-1 min-h-0 gap-3 mt-2">
              {/* Toolbar: search + filters */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Search */}
                <div className="relative flex-1 min-w-[140px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mode-accent-dim)]" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar empresa..."
                    className={`${inputClass} pl-8`}
                  />
                </div>

                {/* Estado filter */}
                <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className={selectClass}>
                  <option value="">Estado</option>
                  {COMPANY_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                {/* Canal filter */}
                <select value={filterCanal} onChange={(e) => setFilterCanal(e.target.value)} className={selectClass}>
                  <option value="">Canal</option>
                  {COMPANY_CHANNELS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {/* Clear filters */}
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-[var(--mode-accent-dim)] hover:text-[var(--mode-accent)] transition-colors p-1"
                    data-tooltip="Limpiar filtros"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* New company button */}
                <button
                  onClick={() => { setNewForm({ ...EMPTY_COMPANY }); setShowNewForm(true); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border font-mono text-[12px] text-[var(--mode-accent)] border-[rgba(var(--mode-accent-rgb),0.3)] hover:bg-[rgba(var(--mode-accent-rgb),0.12)] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Nueva empresa
                </button>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border font-mono text-[12px] text-[var(--mode-accent)] border-[rgba(var(--mode-accent-rgb),0.3)] hover:bg-[rgba(var(--mode-accent-rgb),0.12)] transition-all"
                  data-tooltip="Exportar CSV"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
                <span className="font-mono text-[11px] text-[var(--mode-accent-dim)] ml-auto">
                  {activeCount} activas / {companies.length} total
                </span>
              </div>

              {/* Table */}
              <div className="flex-1 min-h-0 overflow-y-auto scroll-cyan">
                {filtered.length === 0 ? (
                  <div className="font-mono text-[12px] text-[var(--mode-accent-dim)] text-center py-8 tracking-wider">
                    {hasFilters ? "Sin resultados" : `{ }`}
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[rgba(var(--mode-accent-rgb),0.1)]">
                        <th onClick={() => toggleSort("empresa")} className="font-mono text-[11px] text-[var(--mode-accent-dim)] uppercase tracking-wider py-2.5 px-3 font-normal cursor-pointer hover:text-[var(--mode-accent)] select-none transition-colors">Empresa{sortArrow("empresa")}</th>
                        <th onClick={() => toggleSort("estado")} className="font-mono text-[11px] text-[var(--mode-accent-dim)] uppercase tracking-wider py-2.5 px-3 font-normal cursor-pointer hover:text-[var(--mode-accent)] select-none transition-colors hidden sm:table-cell">Estado{sortArrow("estado")}</th>
                        <th onClick={() => toggleSort("canal")} className="font-mono text-[11px] text-[var(--mode-accent-dim)] uppercase tracking-wider py-2.5 px-3 font-normal cursor-pointer hover:text-[var(--mode-accent)] select-none transition-colors hidden md:table-cell">Canal{sortArrow("canal")}</th>
                        <th onClick={() => toggleSort("contacto")} className="font-mono text-[11px] text-[var(--mode-accent-dim)] uppercase tracking-wider py-2.5 px-3 font-normal cursor-pointer hover:text-[var(--mode-accent)] select-none transition-colors hidden lg:table-cell">Contacto{sortArrow("contacto")}</th>
                        <th onClick={() => toggleSort("ultimoMovimiento")} className="font-mono text-[11px] text-[var(--mode-accent-dim)] uppercase tracking-wider py-2.5 px-3 font-normal cursor-pointer hover:text-[var(--mode-accent)] select-none transition-colors hidden md:table-cell">Último mov.{sortArrow("ultimoMovimiento")}</th>
                        <th onClick={() => toggleSort("acciones")} className="font-mono text-[11px] text-[var(--mode-accent-dim)] uppercase tracking-wider py-2.5 px-3 font-normal cursor-pointer hover:text-[var(--mode-accent)] select-none transition-colors text-right">Acc.{sortArrow("acciones")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((company) => (
                        <tr
                          key={company.id}
                          onClick={() => openDetail(company.id)}
                          className="border-b border-[rgba(var(--mode-accent-rgb),0.06)] cursor-pointer transition-colors duration-150 hover:bg-[rgba(var(--mode-accent-rgb),0.06)]"
                        >
                          <td className="py-3 px-3">
                            <div className="font-mono text-[13px] text-[#eeeeee]">{company.empresa}</div>
                            <div className="font-mono text-[11px] text-[#aaaaaa] sm:hidden">{company.estado}</div>
                          </td>
                          <td className="py-3 px-3 hidden sm:table-cell">
                            <EstadoBadge estado={company.estado} />
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[12px] text-[#cccccc] hidden md:table-cell">{company.canal}</td>
                          <td className="py-2.5 px-3 font-mono text-[12px] text-[#cccccc] hidden lg:table-cell">{company.contacto || "—"}</td>
                          <td className="py-2.5 px-3 font-mono text-[12px] text-[#bbbbbb] hidden md:table-cell">{formatDate(company.ultimoMovimiento)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-[12px] text-[#dddddd]">{company.acciones.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer: clear all */}
              {companies.length > 0 && (
                <div className="border-t border-[rgba(var(--mode-accent-rgb),0.08)] pt-2 shrink-0">
                  <button
                    onClick={() => setConfirmClearAll(true)}
                    className="font-mono text-[12px] text-[#6b4a4a] hover:text-[#ef4444] transition-colors duration-200 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3 h-3" />
                    Eliminar todo el archivo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* NEW COMPANY FORM */}
          {showNewForm && (
            <div className="flex flex-col flex-1 min-h-0 gap-3 mt-2 overflow-y-auto scroll-cyan pr-1">
              <div className="font-mono text-[12px] text-[var(--mode-accent)] uppercase tracking-wider mb-1">
                Nueva empresa
              </div>
              <CompanyFields form={newForm} setForm={setNewForm} selectClass={selectClass} inputClass={inputClass} />
              <div className="flex gap-2 shrink-0 pt-2">
                <button
                  onClick={() => setShowNewForm(false)}
                  className="flex-1 font-mono text-[12px] py-2 rounded border border-[rgba(var(--mode-accent-rgb),0.2)] text-[#bbbbbb] hover:text-[#e0e0e0] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleNewCompany}
                  disabled={!newForm.empresa.trim()}
                  className="flex-1 font-mono text-[12px] py-2 rounded border border-[rgba(var(--mode-accent-rgb),0.3)] text-[var(--mode-accent)] bg-[rgba(var(--mode-accent-rgb),0.08)] transition-colors disabled:opacity-30 hover:bg-[rgba(var(--mode-accent-rgb),0.15)]"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Crear empresa
                </button>
              </div>
            </div>
          )}

          {/* DETAIL VIEW */}
          {selectedId && editForm && (
            <div className="flex flex-col flex-1 min-h-0 gap-3 mt-2 overflow-y-auto scroll-cyan pr-1">
              <CompanyFields form={editForm} setForm={setEditForm} selectClass={selectClass} inputClass={inputClass} />

              {/* Actions section */}
              <div className="border-t border-[rgba(var(--mode-accent-rgb),0.1)] pt-3">
                <div className="font-mono text-[12px] text-[var(--mode-accent-dim)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />
                  ACCIONES ({selectedCompany?.acciones.length ?? 0})
                </div>

                {/* Add new action */}
                <div className="flex gap-2 mb-2">
                  <input
                    value={newActionText}
                    onChange={(e) => setNewActionText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddAction(); }}
                    placeholder="Nueva acción..."
                    className={`${inputClass} flex-1`}
                  />
                  <button
                    onClick={handleAddAction}
                    disabled={!newActionText.trim()}
                    className="shrink-0 text-[var(--mode-accent-dim)] hover:text-[var(--mode-accent)] transition-colors disabled:opacity-30"
                    data-tooltip="Añadir acción"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>

                {/* Actions list */}
                {selectedCompany && selectedCompany.acciones.length > 0 && (
                  <div className="space-y-1 max-h-[30vh] overflow-y-auto scroll-cyan">
                    {selectedCompany.acciones.map((action) => (
                      <div
                        key={action.id}
                        className="bg-[rgba(20,20,20,0.4)] border border-[rgba(var(--mode-accent-rgb),0.08)] rounded px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-[#aaaaaa] shrink-0">{formatDateTime(action.date)}</span>
                          <span className="font-mono text-[12px] text-[#e0e0e0]">{action.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 shrink-0 pt-2 border-t border-[rgba(var(--mode-accent-rgb),0.1)]">
                <button
                  onClick={closeDetail}
                  className="flex-1 font-mono text-[12px] py-2 rounded border border-[rgba(var(--mode-accent-rgb),0.2)] text-[#bbbbbb] hover:text-[#e0e0e0] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveDetail}
                  className="flex-1 font-mono text-[12px] py-2 rounded border border-[rgba(var(--mode-accent-rgb),0.3)] text-[var(--mode-accent)] bg-[rgba(var(--mode-accent-rgb),0.08)] hover:bg-[rgba(var(--mode-accent-rgb),0.15)] transition-colors"
                >
                  Guardar cambios
                </button>
                <button
                  onClick={() => setDeleteTarget(selectedId)}
                  className="shrink-0 font-mono text-[10px] py-1.5 px-3 rounded border border-[rgba(var(--mode-accent-rgb),0.2)] text-[var(--mode-accent-dim)] hover:text-[var(--mode-accent)] hover:border-[rgba(var(--mode-accent-rgb),0.3)] transition-colors"
                  data-tooltip="Eliminar empresa"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="xfiles-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-[#ef4444] text-sm">
              Eliminar empresa
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs text-[#666666]">
              Esta empresa y todas sus acciones se eliminarán permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono text-xs text-[#666666]" style={{ borderColor: "rgba(var(--mode-accent-rgb),0.2)" }}>
              Cancelar
            </AlertDialogCancel>
            <button
              onClick={confirmDelete}
              className="font-mono text-xs bg-[rgba(239,68,68,0.15)] text-[#ef4444] border border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.25)] rounded px-4 py-2 transition-colors duration-200"
            >
              Eliminar
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm clear all */}
      <AlertDialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
        <AlertDialogContent className="xfiles-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-[#ef4444] text-sm">
              Eliminar todo el archivo
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs text-[#666666]">
              Se eliminarán permanentemente las {companies.length} empresas. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono text-xs text-[#666666]" style={{ borderColor: "rgba(var(--mode-accent-rgb),0.2)" }}>
              Cancelar
            </AlertDialogCancel>
            <button
              onClick={confirmClear}
              className="font-mono text-xs bg-[rgba(239,68,68,0.15)] text-[#ef4444] border border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.25)] rounded px-4 py-2 transition-colors duration-200"
            >
              Eliminar todo ({companies.length})
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---- State badge color ----
function EstadoBadge({ estado }: { estado: CompanyState }) {
  const colorMap: Record<CompanyState, string> = {
    "Por contactar": "text-[#999999]",
    "Candidatura enviada": "text-[#60a5fa]",
    "Respuesta recibida": "text-[#22d3ee]",
    "Entrevista programada": "text-[#fbbf24]",
    "En proceso": "text-[#a78bfa]",
    "Oferta recibida": "text-[#4ade80]",
    "Descartada": "text-[#555555]",
    "Para seguimiento": "text-[#f97316]",
  };
  return (
    <span className={`font-mono text-[12px] ${colorMap[estado] ?? "text-[#bbbbbb]"}`}>
      {estado}
    </span>
  );
}

// ---- Shared form fields ----
function CompanyFields({
  form,
  setForm,
  selectClass,
  inputClass,
}: {
  form: (typeof EMPTY_COMPANY);
  setForm: (f: typeof EMPTY_COMPANY) => void;
  selectClass: string;
  inputClass: string;
}) {
  const update = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const labelClass = "font-mono text-[11px] text-[var(--mode-accent-dim)] uppercase tracking-wider flex items-center gap-1.5 mb-1";

  return (
    <div className="space-y-3">
      {/* Row: Empresa */}
      <div>
        <label className={labelClass}><Building2 className="w-3 h-3" /> Empresa</label>
        <input value={form.empresa} onChange={(e) => update("empresa", e.target.value)} className={inputClass} placeholder="Nombre de la empresa" />
      </div>

      {/* Row: Estado + Canal */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}><Tag className="w-3 h-3" /> Estado</label>
          <select value={form.estado} onChange={(e) => update("estado", e.target.value)} className={selectClass}>
            {COMPANY_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}><Globe className="w-3 h-3" /> Canal</label>
          <select value={form.canal} onChange={(e) => update("canal", e.target.value)} className={selectClass}>
            {COMPANY_CHANNELS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row: Contacto + Email */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}><User className="w-3 h-3" /> Contacto</label>
          <input value={form.contacto} onChange={(e) => update("contacto", e.target.value)} className={inputClass} placeholder="Nombre" />
        </div>
        <div>
          <label className={labelClass}><Mail className="w-3 h-3" /> Email</label>
          <input value={form.emailContacto} onChange={(e) => update("emailContacto", e.target.value)} className={inputClass} placeholder="email@ejemplo.com" type="email" />
        </div>
      </div>

      {/* Row: URL oferta */}
      <div>
        <label className={labelClass}><ExternalLink className="w-3 h-3" /> URL oferta</label>
        <input value={form.urlOferta} onChange={(e) => update("urlOferta", e.target.value)} className={inputClass} placeholder="https://..." type="url" />
      </div>

      {/* Row: Fechas */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}><Calendar className="w-3 h-3" /> Primer contacto</label>
          <input value={form.fechaPrimerContacto} onChange={(e) => update("fechaPrimerContacto", e.target.value)} className={inputClass} type="date" />
        </div>
        <div>
          <label className={labelClass}><Calendar className="w-3 h-3" /> Último movimiento</label>
          <input value={form.ultimoMovimiento} onChange={(e) => update("ultimoMovimiento", e.target.value)} className={inputClass} type="date" />
        </div>
      </div>

      {/* Row: Notas */}
      <div>
        <label className={labelClass}><FileText className="w-3 h-3" /> Notas</label>
        <textarea
          value={form.notas}
          onChange={(e) => update("notas", e.target.value)}
          className={`${inputClass} resize-none`}
          rows={3}
          placeholder="Notas sobre la empresa..."
        />
      </div>
    </div>
  );
}
