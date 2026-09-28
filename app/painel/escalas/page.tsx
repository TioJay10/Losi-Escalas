"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type DbStatus = "draft" | "open" | "full" | "closed" | "cancelled";
type Status = "Aberta" | "Cheia" | "Fechada" | "Cancelada" | "Rascunho";

type Scale = {
  id: string;
  date: string;
  day: string;
  start: string;
  end: string;
  capacity: number;
  occupied: number;
  status: Status;
  dbStatus: DbStatus;
  notes: string;
  shareToken: string;
};

const statusLabel: Record<DbStatus, Status> = {
  draft: "Rascunho",
  open: "Aberta",
  full: "Cheia",
  closed: "Fechada",
  cancelled: "Cancelada",
};

const statusClass: Record<Status, string> = {
  Aberta: "scale-status-open",
  Cheia: "scale-status-full",
  Fechada: "scale-status-closed",
  Cancelada: "scale-status-cancelled",
  Rascunho: "scale-status-closed",
};

function formatDate(value: string) {
  return new Date(value + "T12:00:00").toLocaleDateString("pt-BR");
}

function weekday(value: string) {
  const label = new Date(value + "T12:00:00")
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function EscalasPage() {
  const [scales, setScales] = useState<Scale[]>([]);
  const [filter, setFilter] = useState<"Todas" | Status>("Todas");
  const [showNew, setShowNew] = useState(false);
  const [copied, setCopied] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [parkId, setParkId] = useState("");
  const [form, setForm] = useState({
    date: "",
    start: "08:00",
    end: "17:00",
    capacity: "10",
    notes: "",
  });

  const filtered = useMemo(
    () => filter === "Todas" ? scales : scales.filter((scale) => scale.status === filter),
    [filter, scales]
  );

  async function loadScales() {
    setLoading(true);
    setError("");

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setError("Entre como gestor para acessar as escalas do parque.");
      setLoading(false);
      return;
    }

    const { data: membership, error: membershipError } = await supabase
      .from("park_users")
      .select("park_id")
      .eq("id", auth.user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError || !membership) {
      setError("Seu usuário ainda não está vinculado a um parque.");
      setLoading(false);
      return;
    }

    setParkId(membership.park_id);

    const { data, error: scalesError } = await supabase
      .from("scales")
      .select("id,date,start_time,end_time,max_freelancers,status,notes,share_token,scale_freelancers(status)")
      .eq("park_id", membership.park_id)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (scalesError) {
      setError("Não foi possível carregar as escalas.");
      setLoading(false);
      return;
    }

    setScales((data ?? []).map((row) => {
      const activeParticipants = (row.scale_freelancers ?? []).filter(
        (item: { status: string }) => item.status === "confirmed" || item.status === "available"
      ).length;
      const dbStatus = row.status as DbStatus;
      return {
        id: row.id,
        date: row.date,
        day: weekday(row.date),
        start: row.start_time.slice(0, 5),
        end: row.end_time.slice(0, 5),
        capacity: row.max_freelancers,
        occupied: activeParticipants,
        status: statusLabel[dbStatus],
        dbStatus,
        notes: row.notes ?? "",
        shareToken: row.share_token,
      };
    }));

    setLoading(false);
  }

  useEffect(() => {
    void loadScales();
  }, []);

  async function createScale(event: React.FormEvent) {
    event.preventDefault();
    if (!parkId || !form.date || !form.start || !form.end || Number(form.capacity) < 1) return;

    setSaving(true);
    setError("");

    const { data: auth } = await supabase.auth.getUser();
    const { data, error: createError } = await supabase
      .from("scales")
      .insert({
        park_id: parkId,
        date: form.date,
        start_time: form.start,
        end_time: form.end,
        max_freelancers: Number(form.capacity),
        notes: form.notes.trim() || null,
        status: "open",
        created_by: auth.user?.id ?? null,
      })
      .select("id,date,start_time,end_time,max_freelancers,status,notes,share_token")
      .single();

    if (createError || !data) {
      setError("Não foi possível criar a escala. Verifique seu acesso ao parque.");
      setSaving(false);
      return;
    }

    setScales((current) => [{
      id: data.id,
      date: data.date,
      day: weekday(data.date),
      start: data.start_time.slice(0, 5),
      end: data.end_time.slice(0, 5),
      capacity: data.max_freelancers,
      occupied: 0,
      status: "Aberta",
      dbStatus: "open",
      notes: data.notes ?? "",
      shareToken: data.share_token,
    }, ...current]);

    setForm({ date: "", start: "08:00", end: "17:00", capacity: "10", notes: "" });
    setShowNew(false);
    setSaving(false);
  }

  async function copyLink(scale: Scale) {
    const url = `${window.location.origin}/escala/${scale.shareToken}`;
    await navigator.clipboard?.writeText(url);
    setCopied(scale.id);
    window.setTimeout(() => setCopied(""), 1800);
  }

  async function changeStatus(scale: Scale, nextStatus: "open" | "closed") {
    const { error: updateError } = await supabase
      .from("scales")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", scale.id)
      .eq("park_id", parkId);

    if (updateError) {
      setError("Não foi possível alterar o status da escala.");
      return;
    }

    setScales((current) => current.map((item) =>
      item.id === scale.id
        ? { ...item, dbStatus: nextStatus, status: statusLabel[nextStatus] }
        : item
    ));
  }

  return (
    <main className="dashboard scales-page">
      <header className="dash-header">
        <Link href="/painel" className="auth-brand">
          <span className="brand-mark">L</span><span><b>LOSI</b> ESCALA</span>
        </Link>
        <nav className="dash-nav">
          <Link href="/painel">Visão geral</Link>
          <Link href="/painel/escalas" className="active">Escalas</Link>
          <Link href="/painel/freelancers">Freelancers</Link>
          <Link href="/painel/grupos">Grupos</Link>
          <Link href="/painel/programacoes">Programações</Link>
        </nav>
        <div className="dash-user"><span>SEU PARQUE</span><b>Gestor</b></div>
        <Link href="/painel" className="scales-back-mobile" aria-label="Voltar ao painel">←</Link>
      </header>

      <section className="scales-hero">
        <div>
          <span className="eyebrow-text">GESTÃO DE EQUIPE</span>
          <h1>Escalas.<br /><span>Organize cada dia.</span></h1>
          <p>Crie a escala, defina a capacidade e compartilhe um único link para que os freelancers confirmem sua disponibilidade.</p>
        </div>
        <button className="button" onClick={() => setShowNew(true)} disabled={!parkId}>+ Nova escala</button>
      </section>

      {error && <div className="scales-error">{error}</div>}

      <section className="scales-content">
        <div className="scale-summary">
          <div><span>ESCALAS VISÍVEIS</span><strong>{scales.length}</strong></div>
          <div><span>FREELANCERS CONFIRMADOS</span><strong>{scales.reduce((sum, scale) => sum + scale.occupied, 0)}</strong></div>
          <div><span>VAGAS DISPONÍVEIS</span><strong>{scales.reduce((sum, scale) => sum + Math.max(scale.capacity - scale.occupied, 0), 0)}</strong></div>
        </div>

        <div className="scales-toolbar">
          <div>
            {(["Todas", "Aberta", "Cheia", "Fechada", "Cancelada"] as const).map((item) => (
              <button key={item} className={filter === item ? "filter-active" : ""} onClick={() => setFilter(item)}>{item}</button>
            ))}
          </div>
          <span>{loading ? "Carregando..." : `${filtered.length} escala(s)`}</span>
        </div>

        <div className="scale-list">
          {!loading && filtered.length === 0 && (
            <div className="scale-empty">
              <strong>Nenhuma escala cadastrada.</strong>
              <span>Crie a primeira escala para começar a organizar sua equipe.</span>
            </div>
          )}

          {filtered.map((scale) => {
            const available = Math.max(scale.capacity - scale.occupied, 0);
            const percent = Math.min((scale.occupied / scale.capacity) * 100, 100);
            return (
              <article className="scale-card" key={scale.id}>
                <div className="scale-date">
                  <span>{scale.day}</span>
                  <strong>{formatDate(scale.date).split("/")[0]}</strong>
                  <small>{formatDate(scale.date).slice(3)}</small>
                </div>
                <div className="scale-main">
                  <div className="scale-title-row">
                    <div>
                      <span className="scale-id">{scale.id.slice(0, 8).toUpperCase()}</span>
                      <h2>{scale.start} — {scale.end}</h2>
                    </div>
                    <span className={`scale-status ${statusClass[scale.status]}`}>{scale.status}</span>
                  </div>
                  <p>{scale.notes || "Sem observações adicionadas."}</p>
                  <div className="scale-occupancy">
                    <div className="occupancy-head"><span>Equipe confirmada</span><b>{scale.occupied}/{scale.capacity}</b></div>
                    <div className="occupancy-bar"><i style={{ width: `${percent}%` }} /></div>
                    <small>{available > 0 ? `${available} vaga(s) disponível(is)` : "Capacidade máxima atingida"}</small>
                  </div>
                </div>
                <div className="scale-actions">
                  <button onClick={() => void copyLink(scale)}>{copied === scale.id ? "Link copiado ✓" : "Compartilhar link ↗"}</button>
                  {scale.status === "Aberta" && <button onClick={() => void changeStatus(scale, "closed")}>Fechar escala</button>}
                  {scale.status === "Fechada" && <button onClick={() => void changeStatus(scale, "open")}>Abrir escala</button>}
                  <Link href={`/painel/escalas/${scale.id}`}>Gerenciar →</Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {showNew && (
        <div className="scale-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowNew(false); }}>
          <form className="scale-modal" onSubmit={createScale}>
            <div className="scale-modal-head">
              <div><span className="eyebrow-text">NOVA ESCALA</span><h2>Prepare a equipe.</h2></div>
              <button type="button" onClick={() => setShowNew(false)} aria-label="Fechar">×</button>
            </div>
            <div className="scale-form-grid">
              <label>Data<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label>
              <label>Limite de freelancers<input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required /></label>
              <label>Início<input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} required /></label>
              <label>Fim<input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} required /></label>
            </div>
            <label className="scale-notes">Observações<textarea rows={4} placeholder="Ex.: operação especial, horário de chegada..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            <div className="scale-modal-footer">
              <button type="button" className="scale-cancel" onClick={() => setShowNew(false)}>Cancelar</button>
              <button className="button" type="submit" disabled={saving}>{saving ? "Criando..." : "Criar escala"}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
