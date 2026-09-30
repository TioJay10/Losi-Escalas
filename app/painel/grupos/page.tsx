"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Group = {
  id: string;
  name: string;
  quantity: number;
  quantity_label: string;
  responsible_name: string | null;
  responsible_role: string | null;
  responsible_whatsapp: string | null;
};

type Freelancer = {
  id: string;
  name: string;
  system_id: string;
  label: string;
};

type GroupForm = {
  name: string;
  quantity: string;
  quantity_label: string;
  responsible_name: string;
  responsible_role: string;
  responsible_whatsapp: string;
};

const emptyForm: GroupForm = {
  name: "",
  quantity: "0",
  quantity_label: "participantes",
  responsible_name: "",
  responsible_role: "",
  responsible_whatsapp: "",
};

function normalizeWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : digits.length >= 10 ? `55${digits}` : digits;
}

function whatsappHref(value: string | null) {
  const number = normalizeWhatsapp(value ?? "");
  return number ? `https://wa.me/${number}` : "";
}

export default function GruposPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [links, setLinks] = useState<Record<string, string>>({});
  const [parkId, setParkId] = useState("");
  const [form, setForm] = useState<GroupForm>(emptyForm);
  const [editing, setEditing] = useState<Group | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");

  const assignedCount = useMemo(
    () => Object.values(selected).reduce((sum, ids) => sum + ids.length, 0),
    [selected]
  );

  async function loadData() {
    setLoading(true);
    setError("");

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setError("Entre como gestor para acessar os grupos do parque.");
      setLoading(false);
      return;
    }

    const { data: membership, error: membershipError } = await supabase
      .from("park_users")
      .select("park_id")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      setError("Seu usuário ainda não está vinculado a um parque.");
      setLoading(false);
      return;
    }

    setParkId(membership.park_id);

    const [groupsResult, freelancersResult, linksResult] = await Promise.all([
      supabase
        .from("groups")
        .select("id,name,quantity,quantity_label,responsible_name,responsible_role,responsible_whatsapp")
        .eq("park_id", membership.park_id)
        .order("name"),
      supabase
        .from("freelancers")
        .select("id,name,system_id,label")
        .eq("park_id", membership.park_id)
        .eq("status", "active")
        .order("name"),
      supabase.from("group_freelancers").select("group_id,freelancer_id"),
    ]);

    if (groupsResult.error) {
      setError("Não foi possível carregar os grupos.");
      setLoading(false);
      return;
    }

    if (freelancersResult.error) {
      setError("Não foi possível carregar os freelancers.");
      setLoading(false);
      return;
    }

    const map: Record<string, string[]> = {};
    (linksResult.data ?? []).forEach((item) => {
      (map[item.group_id] ??= []).push(item.freelancer_id);
    });

    setGroups(groupsResult.data ?? []);
    setFreelancers(freelancersResult.data ?? []);
    setSelected(map);
    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  function updateForm<K extends keyof GroupForm>(key: K, value: GroupForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openNew() {
    setError("");
    setForm(emptyForm);
    setShowNew(true);
  }

  function openEdit(group: Group) {
    setError("");
    setEditing(group);
    setForm({
      name: group.name,
      quantity: String(group.quantity),
      quantity_label: group.quantity_label,
      responsible_name: group.responsible_name ?? "",
      responsible_role: group.responsible_role ?? "",
      responsible_whatsapp: group.responsible_whatsapp ?? "",
    });
  }

  async function saveGroup(event: React.FormEvent) {
    event.preventDefault();
    if (!parkId || !form.name.trim()) return;

    const quantity = Number(form.quantity);
    if (!Number.isFinite(quantity) || quantity < 0) {
      setError("Informe uma quantidade válida.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      quantity: Math.floor(quantity),
      quantity_label: form.quantity_label,
      responsible_name: form.responsible_name.trim() || null,
      responsible_role: form.responsible_role.trim() || null,
      responsible_whatsapp: form.responsible_whatsapp.trim() || null,
    };

    if (editing) {
      const { data, error: updateError } = await supabase
        .from("groups")
        .update(payload)
        .eq("id", editing.id)
        .eq("park_id", parkId)
        .select("id,name,quantity,quantity_label,responsible_name,responsible_role,responsible_whatsapp")
        .single();

      if (updateError || !data) {
        setError("Não foi possível salvar o grupo.");
        setSaving(false);
        return;
      }

      setGroups((current) => current.map((item) => item.id === editing.id ? data : item));
      setEditing(null);
    } else {
      const { data, error: createError } = await supabase
        .from("groups")
        .insert({ park_id: parkId, ...payload })
        .select("id,name,quantity,quantity_label,responsible_name,responsible_role,responsible_whatsapp")
        .single();

      if (createError || !data) {
        setError("Não foi possível criar o grupo.");
        setSaving(false);
        return;
      }

      setGroups((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)));
      setShowNew(false);
    }

    setForm(emptyForm);
    setSaving(false);
  }

  async function deleteGroup(group: Group) {
    if (!window.confirm(`Excluir o grupo "${group.name}"? Essa ação não pode ser desfeita.`)) return;

    setBusyId(group.id);
    setError("");

    const { error: deleteError } = await supabase
      .from("groups")
      .delete()
      .eq("id", group.id)
      .eq("park_id", parkId);

    if (deleteError) {
      setError(
        deleteError.code === "23503"
          ? "Este grupo já está sendo usado em uma programação ou operação e não pode ser excluído."
          : "Não foi possível excluir o grupo."
      );
      setBusyId("");
      return;
    }

    setGroups((current) => current.filter((item) => item.id !== group.id));
    setSelected((current) => {
      const next = { ...current };
      delete next[group.id];
      return next;
    });
    setBusyId("");
  }

  async function toggleFreelancer(groupId: string, freelancerId: string) {
    const current = selected[groupId] ?? [];
    setBusyId(`${groupId}:${freelancerId}`);
    setError("");

    if (current.includes(freelancerId)) {
      const { error: unlinkError } = await supabase.rpc("unlink_freelancer_from_group", {
        p_group_id: groupId,
        p_freelancer_id: freelancerId,
      });

      if (unlinkError) {
        setError("Não foi possível remover o freelancer do grupo.");
        setBusyId("");
        return;
      }

      setSelected((value) => ({
        ...value,
        [groupId]: current.filter((id) => id !== freelancerId),
      }));
    } else {
      const { error: linkError } = await supabase.rpc("link_freelancer_to_group", {
        p_group_id: groupId,
        p_freelancer_id: freelancerId,
      });

      if (linkError) {
        setError("Não foi possível vincular o freelancer ao grupo.");
        setBusyId("");
        return;
      }

      setSelected((value) => ({
        ...value,
        [groupId]: [...current, freelancerId],
      }));
    }

    setBusyId("");
  }

  async function generateGroupLink(groupId: string) {
    setBusyId(groupId);
    setError("");

    const { data, error: linkError } = await supabase.rpc("create_group_link", {
      p_group_id: groupId,
    });

    if (linkError || !data) {
      setError("Não foi possível gerar o link do grupo.");
      setBusyId("");
      return;
    }

    const url = `${window.location.origin}/grupo/${data}`;
    setLinks((current) => ({ ...current, [groupId]: url }));

    try {
      await navigator.clipboard?.writeText(url);
      setCopied(groupId);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      // O link continua visível mesmo quando o navegador não permite copiar.
    }

    setBusyId("");
  }

  return (
    <main className="dashboard groups-page">
      <header className="dash-header">
        <Link href="/painel" className="auth-brand">
          <span className="brand-mark">L</span>
          <span><b>LOSI</b> ESCALA</span>
        </Link>

        <nav className="dash-nav">
          <Link href="/painel">Visão geral</Link>
          <Link href="/painel/escalas">Escalas</Link>
          <Link href="/painel/freelancers">Freelancers</Link>
          <Link href="/painel/grupos" className="active">Grupos</Link>
          <Link href="/painel/programacoes">Programações</Link>
        </nav>

        <details className="dash-mobile-menu">
          <summary aria-label="Abrir menu">☰</summary>
          <nav>
            <Link href="/painel">Visão geral</Link>
            <Link href="/painel/escalas">Escalas</Link>
            <Link href="/painel/freelancers">Freelancers</Link>
            <Link href="/painel/grupos" className="active">Grupos</Link>
            <Link href="/painel/programacoes">Programações</Link>
          </nav>
        </details>

        <div className="dash-user">
          <span>SEU PARQUE</span>
          <b>Gestor</b>
        </div>
      </header>

      <section className="groups-hero">
        <div>
          <span className="eyebrow-text">GRUPOS</span>
          <h1>Grupos.<br /><span>Organize quem chega.</span></h1>
          <p>Cadastre grupos, responsáveis, transporte e a equipe que poderá atuar em cada operação.</p>
        </div>
        <button className="button" type="button" onClick={openNew} disabled={!parkId}>+ Novo grupo</button>
      </section>

      {error && <div className="groups-error">{error}</div>}

      <section className="groups-content">
        <div className="groups-summary">
          <div><span>GRUPOS CADASTRADOS</span><strong>{groups.length}</strong></div>
          <div><span>PARTICIPANTES</span><strong>{groups.reduce((sum, group) => sum + group.quantity, 0)}</strong></div>
          <div><span>VÍNCULOS DE EQUIPE</span><strong>{assignedCount}</strong></div>
        </div>

        <div className="groups-section-head">
          <div>
            <span className="eyebrow-text">CADASTRO OPERACIONAL</span>
            <h2>Seus grupos.</h2>
          </div>
          <span>{loading ? "Carregando..." : `${groups.length} grupo(s)`}</span>
        </div>

        {loading ? (
          <div className="groups-empty"><strong>Carregando grupos...</strong></div>
        ) : groups.length === 0 ? (
          <div className="groups-empty">
            <strong>Nenhum grupo cadastrado.</strong>
            <span>Crie o primeiro grupo para começar a montar suas programações.</span>
            <button className="button" type="button" onClick={openNew}>+ Criar primeiro grupo</button>
          </div>
        ) : (
          <div className="groups-list">
            {groups.map((group) => {
              const assigned = selected[group.id] ?? [];
              const wa = whatsappHref(group.responsible_whatsapp);

              return (
                <article className="group-card" key={group.id}>
                  <div className="group-quantity">
                    <span>GRUPO</span>
                    <strong>{group.quantity}</strong>
                    <small>{group.quantity_label}</small>
                  </div>

                  <div className="group-main">
                    <div className="group-title-row">
                      <div>
                        <span className="scale-id">GRUPO</span>
                        <h2>{group.name}</h2>
                      </div>
                      <span className="group-count">{assigned.length} freelancer(s)</span>
                    </div>

                    <div className="group-responsible">
                      <div>
                        <span>RESPONSÁVEL</span>
                        <strong>{group.responsible_name || "Não informado"}</strong>
                        {group.responsible_role && <small>{group.responsible_role}</small>}
                      </div>
                      {wa && (
                        <a href={wa} target="_blank" rel="noreferrer" className="group-whatsapp">
                          WhatsApp
                        </a>
                      )}
                    </div>

                    <div className="group-team">
                      <div className="group-subhead">
                        <span>EQUIPE DO GRUPO</span>
                        <small>Toque para vincular ou remover</small>
                      </div>
                      {freelancers.length === 0 ? (
                        <p className="group-muted">Cadastre freelancers ativos antes de vinculá-los ao grupo.</p>
                      ) : (
                        <div className="group-freelancers">
                          {freelancers.map((freelancer) => {
                            const active = assigned.includes(freelancer.id);
                            const busy = busyId === `${group.id}:${freelancer.id}`;
                            return (
                              <button
                                type="button"
                                key={freelancer.id}
                                className={active ? "group-freelancer is-selected" : "group-freelancer"}
                                onClick={() => void toggleFreelancer(group.id, freelancer.id)}
                                disabled={busy}
                              >
                                {active ? "✓ " : ""}{freelancer.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {links[group.id] && (
                      <div className="group-link">
                        <span>LINK DO GRUPO</span>
                        <a href={links[group.id]} target="_blank" rel="noreferrer">{links[group.id]}</a>
                      </div>
                    )}
                  </div>

                  <div className="group-actions">
                    <button type="button" onClick={() => void generateGroupLink(group.id)} disabled={busyId === group.id}>
                      {copied === group.id ? "Link copiado ✓" : busyId === group.id ? "Gerando..." : "Gerar link"}
                    </button>
                    <button type="button" onClick={() => openEdit(group)}>Editar grupo</button>
                    <button type="button" className="group-danger" onClick={() => void deleteGroup(group)} disabled={busyId === group.id}>
                      {busyId === group.id ? "Excluindo..." : "Excluir grupo"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {(showNew || editing) && (
        <div
          className="scale-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowNew(false);
              setEditing(null);
            }
          }}
        >
          <form className="scale-modal group-modal" onSubmit={saveGroup}>
            <div className="scale-modal-head">
              <div>
                <span className="eyebrow-text">{editing ? "EDITAR GRUPO" : "NOVO GRUPO"}</span>
                <h2>{editing ? "Atualize as informações." : "Cadastre o grupo."}</h2>
              </div>
              <button
                type="button"
                onClick={() => { setShowNew(false); setEditing(null); }}
                aria-label="Fechar"
                disabled={saving}
              >
                ×
              </button>
            </div>

            <div className="scale-form-grid">
              <label>Nome do grupo
                <input value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="Ex.: Grupo Azul" required />
              </label>
              <label>Quantidade
                <input type="number" min="0" value={form.quantity} onChange={(event) => updateForm("quantity", event.target.value)} required />
              </label>
              <label>Unidade da quantidade
                <select value={form.quantity_label} onChange={(event) => updateForm("quantity_label", event.target.value)}>
                  <option>participantes</option>
                  <option>crianças</option>
                  <option>alunos</option>
                  <option>pessoas</option>
                  <option>convidados</option>
                </select>
              </label>
              <label>Responsável
                <input value={form.responsible_name} onChange={(event) => updateForm("responsible_name", event.target.value)} placeholder="Nome do responsável" />
              </label>
              <label>Função do responsável
                <input value={form.responsible_role} onChange={(event) => updateForm("responsible_role", event.target.value)} placeholder="Ex.: Professor, monitor..." />
              </label>
              <label>WhatsApp
                <input value={form.responsible_whatsapp} onChange={(event) => updateForm("responsible_whatsapp", event.target.value)} placeholder="(11) 99999-9999" inputMode="tel" />
              </label>
            </div>

            <div className="scale-modal-footer">
              <button type="button" className="scale-cancel" onClick={() => { setShowNew(false); setEditing(null); }} disabled={saving}>Cancelar</button>
              <button className="button" type="submit" disabled={saving}>
                {saving ? "Salvando..." : editing ? "Salvar alterações" : "Criar grupo"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
