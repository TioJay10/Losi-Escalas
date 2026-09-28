"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Status = "Aberta" | "Cheia" | "Fechada" | "Cancelada";

type Scale = {
  id: string;
  date: string;
  day: string;
  start: string;
  end: string;
  capacity: number;
  occupied: number;
  status: Status;
  notes: string;
};

const initialScales: Scale[] = [
  { id: "ESC-20260928-01", date: "28/09/2026", day: "Hoje", start: "08:00", end: "17:00", capacity: 12, occupied: 8, status: "Aberta", notes: "Operação regular do parque." },
  { id: "ESC-20260929-01", date: "29/09/2026", day: "Amanhã", start: "09:00", end: "18:00", capacity: 10, occupied: 10, status: "Cheia", notes: "Escala com capacidade máxima." },
  { id: "ESC-20261001-01", date: "01/10/2026", day: "Qui", start: "08:30", end: "16:30", capacity: 14, occupied: 6, status: "Aberta", notes: "" },
  { id: "ESC-20261003-01", date: "03/10/2026", day: "Sáb", start: "09:00", end: "19:00", capacity: 16, occupied: 0, status: "Fechada", notes: "Aguardando abertura da operação." },
];

const statusClass: Record<Status, string> = {
  Aberta: "scale-status-open",
  Cheia: "scale-status-full",
  Fechada: "scale-status-closed",
  Cancelada: "scale-status-cancelled",
};

export default function EscalasPage() {
  const [scales, setScales] = useState(initialScales);
  const [filter, setFilter] = useState<"Todas" | Status>("Todas");
  const [showNew, setShowNew] = useState(false);
  const [copied, setCopied] = useState("");
  const [form, setForm] = useState({ date: "", start: "08:00", end: "17:00", capacity: "10", notes: "" });

  const filtered = useMemo(
    () => filter === "Todas" ? scales : scales.filter((scale) => scale.status === filter),
    [filter, scales]
  );

  function createScale(event: React.FormEvent) {
    event.preventDefault();
    if (!form.date || !form.start || !form.end || Number(form.capacity) < 1) return;
    const date = new Date(form.date + "T12:00:00");
    const day = date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
    const dateLabel = date.toLocaleDateString("pt-BR");
    setScales((current) => [
      {
        id: `ESC-${form.date.replaceAll("-", "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        date: dateLabel,
        day: day.charAt(0).toUpperCase() + day.slice(1),
        start: form.start,
        end: form.end,
        capacity: Number(form.capacity),
        occupied: 0,
        status: "Aberta",
        notes: form.notes,
      },
      ...current,
    ]);
    setForm({ date: "", start: "08:00", end: "17:00", capacity: "10", notes: "" });
    setShowNew(false);
  }

  function copyLink(id: string) {
    const url = `${window.location.origin}/escala/${id}`;
    navigator.clipboard?.writeText(url);
    setCopied(id);
    window.setTimeout(() => setCopied(""), 1800);
  }

  function changeStatus(id: string, status: Status) {
    setScales((current) => current.map((scale) => scale.id === id ? { ...scale, status } : scale));
  }

  return (
    <main className="dashboard scales-page">
      <header className="dash-header">
        <Link href="/painel" className="auth-brand"><span className="brand-mark">L</span><span><b>LOSI</b> ESCALA</span></Link>
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
        <button className="button" onClick={() => setShowNew(true)}>+ Nova escala</button>
      </section>

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
          <span>{filtered.length} escala(s)</span>
        </div>

        <div className="scale-list">
          {filtered.map((scale) => {
            const available = Math.max(scale.capacity - scale.occupied, 0);
            const percent = Math.min((scale.occupied / scale.capacity) * 100, 100);
            return (
              <article className="scale-card" key={scale.id}>
                <div className="scale-date">
                  <span>{scale.day}</span>
                  <strong>{scale.date.split("/")[0]}</strong>
                  <small>{scale.date.slice(3)}</small>
                </div>
                <div className="scale-main">
                  <div className="scale-title-row">
                    <div>
                      <span className="scale-id">{scale.id}</span>
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
                  <button onClick={() => copyLink(scale.id)}>{copied === scale.id ? "Link copiado ✓" : "Compartilhar link ↗"}</button>
                  {scale.status === "Aberta" && <button onClick={() => changeStatus(scale.id, "Fechada")}>Fechar escala</button>}
                  {scale.status === "Fechada" && <button onClick={() => changeStatus(scale.id, "Aberta")}>Abrir escala</button>}
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
            <div className="scale-modal-footer"><button type="button" className="scale-cancel" onClick={() => setShowNew(false)}>Cancelar</button><button className="button" type="submit">Criar escala</button></div>
          </form>
        </div>
      )}
    </main>
  );
}
