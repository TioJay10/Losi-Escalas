"use client";

import Link from "next/link";
import { useState } from "react";

const cards = [
  ["Escalas", "Organize quem trabalha em cada dia.", "04", "Abrir escalas", "/painel/escalas"],
  ["Freelancers", "Veja sua equipe e disponibilidade.", "18", "Gerenciar equipe", "/painel/freelancers"],
  ["Grupos", "Centralize grupos, responsáveis e transporte.", "06", "Ver grupos", "/painel/grupos"],
  ["Programações", "Monte a programação e acompanhe conflitos.", "08", "Ver programação", "/painel/programacoes"],
];

export default function Painel() {
  const [menu, setMenu] = useState(false);
  return (
    <main className="dashboard">
      <header className="dash-header">
        <Link href="/" className="auth-brand"><span className="brand-mark">L</span><span><b>LOSI</b> ESCALA</span></Link>
        <nav className={`dash-nav ${menu ? "open" : ""}`}>
          <Link href="/painel">Visão geral</Link><Link href="/painel/escalas">Escalas</Link><Link href="/painel/freelancers">Freelancers</Link><Link href="/painel/grupos">Grupos</Link><Link href="/painel/programacoes">Programações</Link>
        </nav>
        <button className="dash-menu" onClick={() => setMenu(v => !v)} aria-label="Abrir menu">☰</button>
        <div className="dash-user"><span>SEU PARQUE</span><b>Gestor</b></div>
      </header>
      <section className="dash-hero">
        <span className="eyebrow-text">VISÃO GERAL</span>
        <h1>Bom dia.<br/><span>Sua operação está organizada.</span></h1>
        <p>Acompanhe equipe, escalas, grupos e programação em um só lugar.</p>
      </section>
      <section className="dash-content">
        <div className="dash-section-head"><div><span className="eyebrow-text">HOJE</span><h2>O que está acontecendo.</h2></div><Link className="text-link" href="/painel/escalas">Ver todas →</Link></div>
        <div className="dash-grid">{cards.map(([title,desc,num,action,href])=><Link href={href} className="dash-card" key={title}><span className="dash-card-label">{title}</span><strong>{num}</strong><p>{desc}</p><span className="dash-card-action">{action} ↗</span></Link>)}</div>
        <div className="dash-live"><div><span className="eyebrow-text">OPERAÇÃO EM TEMPO REAL</span><h2>Agora, no seu parque.</h2><p>Tenha uma visão rápida do que está acontecendo, qual é a próxima atividade e quem está responsável.</p></div><div className="dash-status"><span><i/> EM OPERAÇÃO</span><strong>04 grupos</strong><small>08 atividades programadas</small><Link href="/painel/operacao">Acompanhar operação →</Link></div></div>
      </section>
    </main>
  );
}
