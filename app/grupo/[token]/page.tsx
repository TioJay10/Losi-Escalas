"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type GroupPageProps = {
  params: Promise<{ token: string }>;
};

export default function Grupo({ params }: GroupPageProps) {
  const [token, setToken] = useState("");
  const [d, setD] = useState<any>(null);
  const [e, setE] = useState("");
  const [id, setId] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const now = Date.now();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const resolved = await params;
      if (cancelled) return;
      setToken(resolved.token);

      const { data, error } = await supabase.rpc("get_public_group", { p_token: resolved.token });

      if (error || !data) {
        setE("Link inválido ou expirado.");
        return;
      }
      setD(data);
    })();

    return () => {
      cancelled = true;
    };
  }, [params]);

  async function enter() {
    setE("");
    const { data, error } = await supabase.rpc("get_group_schedule", {
      p_token: token,
      p_system_id: id.trim().toUpperCase(),
    });

    if (error) {
      setE("ID inválido ou sem autorização para este grupo.");
      return;
    }

    setAuthorized(true);
    setItems(data?.items || []);
  }

  const current = useMemo(() => {
    const t = Date.now();
    return items.find(x => new Date(x.starts_at).getTime() <= t && new Date(x.ends_at).getTime() > t);
  }, [items, now]);

  const next = useMemo(
    () => items.find(x => new Date(x.starts_at).getTime() > Date.now()),
    [items, now],
  );

  if (e && !d) {
    return <main className="dashboard"><section className="dash-hero"><h1>{e}</h1></section></main>;
  }

  if (!d) {
    return <main className="dashboard"><section className="dash-hero"><h1>Carregando grupo...</h1></section></main>;
  }

  return (
    <main className="dashboard">
      <header className="dash-header">
        <div className="auth-brand"><span className="brand-mark">L</span><span><b>LOSI</b> ESCALA</span></div>
        <span>{d.park?.name || "SEU PARQUE"}</span>
      </header>

      <section className="dash-hero">
        <div>
          <span className="eyebrow-text">GRUPO</span>
          <h1>{d.group?.name}</h1>
          <p>{d.group?.quantity} {d.group?.quantity_label || "participantes"}</p>
          <p>{d.group?.responsible_name || "Responsável não informado"}</p>
        </div>
      </section>

      <section className="scales-content">
        <article className="scale-card">
          <h2>Acesso da equipe</h2>

          {!authorized ? (
            <>
              <p>Informe seu ID para ver a programação deste grupo.</p>
              <input
                placeholder="Ex.: COL-12345"
                value={id}
                onChange={x => setId(x.target.value)}
              />
              <button className="button" onClick={enter}>Entrar</button>
              {e && <small>{e}</small>}
            </>
          ) : (
            <div style={{ marginTop: 20 }}>
              <h2>Operação do grupo</h2>
              {current
                ? <p><strong>AGORA:</strong> {current.activity_name} · {current.location || "Local não definido"} · até {new Date(current.ends_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                : <p><strong>AGORA:</strong> Nenhuma atividade em andamento.</p>}
              {next && <p><strong>PRÓXIMO:</strong> {next.activity_name} · {next.location || "Local não definido"} · {new Date(next.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>}
              <h3>Programação completa</h3>
              {items.length
                ? items.map(x => (
                    <p key={x.id}>
                      {new Date(x.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} — {new Date(x.ends_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {x.activity_name} · {x.location || "Local não definido"}
                    </p>
                  ))
                : <p>Programação ainda não publicada.</p>}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
