"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Entrar() {
  const router = useRouter();
  const [mode, setMode] = useState<"gestor" | "freelancer">("gestor");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "freelancer") {
      const { data, error: loginError } = await supabase.functions.invoke("freelancer-auth", {
        body: { action: "login", system_id: identifier.trim(), password },
      });
      if (loginError || !data?.token) {
        setError("ID ou senha inválidos.");
        setLoading(false);
        return;
      }
      localStorage.setItem("losi_freelancer_token", data.token);
      router.push("/freelancer");
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: identifier.trim(),
      password,
    });

    if (signInError || !data.user) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }

    const { data: membership } = await supabase
      .from("park_users")
      .select("park_id")
      .eq("id", data.user.id)
      .limit(1)
      .maybeSingle();

    if (!membership) {
      await supabase.auth.signOut();
      setError("Seu usuário ainda não está vinculado a um parque.");
      setLoading(false);
      return;
    }

    router.push("/painel");
  }

  return (
    <main className="auth-page">
      <div className="auth-panel">
        <Link href="/" className="auth-brand"><span className="brand-mark">L</span><span><b>LOSI</b> ESCALA</span></Link>
        <div className="auth-copy">
          <span className="eyebrow-text">ACESSO SEGURO</span>
          <h1>Entre para<br/><span>organizar a operação.</span></h1>
          <p>Tenha acesso às suas escalas, grupos, programação e informações da operação.</p>
        </div>
        <div className="auth-switch">
          <button type="button" className={mode === "gestor" ? "active" : ""} onClick={() => { setMode("gestor"); setError(""); }}>Gestor</button>
          <button type="button" className={mode === "freelancer" ? "active" : ""} onClick={() => { setMode("freelancer"); setError(""); }}>Freelancer</button>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>{mode === "gestor" ? "E-mail" : "ID do freelancer"}
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} type={mode === "gestor" ? "email" : "text"} placeholder={mode === "gestor" ? "seu@email.com" : "COL-38119"} required />
          </label>
          <label>Senha
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" required />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="button" type="submit" disabled={loading}>{loading ? "Entrando..." : "Entrar"} <span>→</span></button>
        </form>
        <Link href="/" className="auth-back">← Voltar para apresentação</Link>
      </div>
      <div className="auth-visual">
        <div className="auth-visual-inner">
          <span className="eyebrow-text">LOSI ESCALA</span>
          <h2>Da escala à operação.<br/><em>Tudo organizado.</em></h2>
          <div className="auth-mini-card"><span>OPERAÇÃO DE HOJE</span><strong>04 grupos</strong><small>Equipe, horários e atividades em um só lugar.</small></div>
        </div>
      </div>
    </main>
  );
}
