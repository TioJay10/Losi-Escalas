"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ScalePageProps = {
  params: Promise<{ token: string }>;
};

export default function EscalaPublica({ params }: ScalePageProps) {
  const [token, setToken] = useState("");
  const [s, setS] = useState<any>(null);
  const [id, setId] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const resolved = await params;
      if (cancelled) return;
      setToken(resolved.token);

      const { data, error } = await supabase
        .from("scales")
        .select("id,date,start_time,end_time,max_freelancers,status,parks(name,logo_url,primary_color)")
        .eq("share_token", resolved.token)
        .maybeSingle();

      if (!cancelled) {
        if (!error) setS(data);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params]);

  async function join() {
    setMsg("");
    const { data, error } = await supabase.rpc("join_scale_by_system_id", {
      p_token: token,
      p_system_id: id.trim(),
    });

    setMsg(
      error
        ? "Não foi possível confirmar sua disponibilidade. Verifique seu ID e tente novamente."
        : data?.status === "joined"
          ? "Presença confirmada na escala."
          : "Você já está confirmado.",
    );
  }

  if (loading) {
    return <main className="public-scale"><h1>Carregando escala...</h1></main>;
  }

  if (!s) {
    return <main className="public-scale"><h1>Escala não encontrada.</h1></main>;
  }

  return (
    <main className="public-scale">
      <div className="public-scale-card">
        <span className="eyebrow-text">{s.parks?.name || "SEU PARQUE"}</span>
        <h1>Escala de equipe</h1>
        <p>
          {new Date(s.date + "T12:00:00").toLocaleDateString("pt-BR")} ·{" "}
          {s.start_time.slice(0, 5)} — {s.end_time.slice(0, 5)}
        </p>
        <strong>{s.max_freelancers} vagas · {s.status}</strong>
        <input
          placeholder="ID do freelancer"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
        <button className="button" onClick={join}>Confirmar disponibilidade</button>
        {msg && <small>{msg}</small>}
      </div>
    </main>
  );
}
