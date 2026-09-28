"use client";

import Link from "next/link";
import { useState } from "react";

export default function Entrar() {
  const [mode, setMode] = useState<"gestor" | "freelancer">("gestor");

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
          <button className={mode === "gestor" ? "active" : ""} onClick={() => setMode("gestor")}>Gestor</button>
          <button className={mode === "freelancer" ? "active" : ""} onClick={() => setMode("freelancer")}>Freelancer</button>
        </div>
        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <label>{mode === "gestor" ? "E-mail" : "ID do freelancer"}<input type={mode === "gestor" ? "email" : "text"} placeholder={mode === "gestor" ? "seu@email.com" : "TIO-48291"} /></label>
          <label>Senha<input type="password" placeholder="••••••••" /></label>
          <button className="button" type="submit">Entrar <span>→</span></button>
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
