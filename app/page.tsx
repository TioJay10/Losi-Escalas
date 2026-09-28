"use client";

import { useEffect, useState } from "react";

function RevealText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const text = typeof children === "string" ? children : "";
  return (
    <span className={`reveal-text ${className}`} aria-label={text}>
      {text.split(/(\s+)/).map((part, index) => (
        <span className="reveal-word" key={`${part}-${index}`} aria-hidden="true">
          {part.trim()
            ? part.split("").map((char, charIndex) => (
                <span className="reveal-char" key={`${char}-${charIndex}`} style={{ "--char-index": charIndex } as React.CSSProperties}>{char}</span>
              ))
            : "\u00A0"}
        </span>
      ))}
    </span>
  );
}

function Icon({ type }: { type: "spark"|"users"|"calendar"|"layers"|"shield"|"chart" }) {
  const common = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths = {
    spark: <><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z"/><path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></>,
    users: <><circle cx="9" cy="8" r="3"/><path d="M3.5 20c.6-3.2 2.5-5 5.5-5s4.9 1.8 5.5 5"/><path d="M16 5.2a3 3 0 0 1 0 5.6"/><path d="M16.5 15c2.1.5 3.4 2.1 4 5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/></>,
    shield: <><path d="M12 3 20 6v5c0 5.1-3.2 8.3-8 10-4.8-1.7-8-4.9-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></>,
    chart: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-7"/></>
  };
  return <svg {...common}>{paths[type]}</svg>;
}

export default function Home() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".reveal-text"));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -10% 0px" });

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#" aria-label="LOSI ESCALA">
          <span className="brand-mark">L</span>
          <span><b>LOSI</b> ESCALA</span>
        </a>
        <nav className="nav">
          <a href="#solucao">Solução</a><a href="#recursos">Recursos</a><a href="#operacao">Operação</a>
        </nav>
        <div className="header-actions">
          <button className="theme-toggle" onClick={() => setDark(v => !v)} aria-label="Alternar modo escuro">
            <span>{dark ? "☼" : "☾"}</span>
          </button>
          <a className="button button-small" href="#contato">Conhecer</a>
        </div>
      </header>

      <section className="hero">
        <div className="hero-orb orb-one"/><div className="hero-orb orb-two"/>
        <div className="hero-content">
          <div className="eyebrow"><span className="eyebrow-dot"/> Gestão operacional inteligente</div>
          <h1><RevealText>Seu parque.</RevealText><br/><RevealText className="gold-text">Sua equipe.</RevealText><br/><RevealText>Tudo sob controle.</RevealText></h1>
          <p className="hero-copy"><RevealText>Organize sua equipe, crie escalas e acompanhe a operação do seu parque em um só lugar.</RevealText></p>
          <div className="hero-actions">
            <a className="button" href="#contato">Quero conhecer o LOSI ESCALA <span>→</span></a>
            <a className="text-link" href="#solucao">Descobrir como funciona <span>↓</span></a>
          </div>
        </div>
        <div className="hero-panel" aria-hidden="true">
          <div className="glass-card">
            <div className="panel-top"><span>Operação de hoje</span><span className="live"><i/> AO VIVO</span></div>
            <div className="panel-number">04</div>
            <div className="panel-label">grupos em operação</div>
            <div className="mini-grid">
              <div><strong>09:30</strong><span>Piscina</span></div><div><strong>10:15</strong><span>Oficina</span></div>
              <div><strong>11:00</strong><span>Recreação</span></div><div><strong>11:45</strong><span>Circuito</span></div>
            </div>
            <div className="panel-line"><span>Programação sem conflitos</span><b>✓</b></div>
          </div>
        </div>
      </section>

      <section className="statement">
        <RevealText className="statement-kicker">GESTÃO SIMPLES. OPERAÇÃO ORGANIZADA.</RevealText>
        <h2><RevealText>Saiba quem trabalha, onde e quando. Tudo organizado em um só sistema.</RevealText></h2>
      </section>

      <section id="solucao" className="solution section">
        <div className="section-intro"><RevealText className="eyebrow-text">TUDO EM UM SÓ LUGAR</RevealText><h2><RevealText>Equipe, escalas, grupos e programação organizados.</RevealText></h2></div>
        <div className="feature-grid">
          {[
            ["users","Freelancers","Cadastre sua equipe e controle a disponibilidade."],
            ["calendar","Escalas","Crie escalas e compartilhe com sua equipe."],
            ["layers","Grupos","Organize grupos, responsáveis e transportes."],
            ["spark","Programação inteligente","Monte a programação com horários, limites e regras."],
            ["shield","Controle de acesso","Cada usuário acessa somente o que precisa."],
            ["chart","Operação em tempo real","Acompanhe o que acontece agora e o próximo passo."]
          ].map(([icon,title,desc]) => (
            <article className="feature-card" key={title}>
              <div className="icon-box"><Icon type={icon as "spark"}/></div>
              <h3><RevealText>{title}</RevealText></h3>
              <p><RevealText>{desc}</RevealText></p>
            </article>
          ))}
        </div>
      </section>

      <section id="recursos" className="immersive-section">
        <div className="immersive-copy">
          <RevealText className="eyebrow-text">DO SEU JEITO</RevealText>
          <h2><RevealText>Configure o sistema para o seu parque.</RevealText></h2>
          <p><RevealText>Personalize nome, logo, cores, atividades e regras.</RevealText></p>
          <p><RevealText>Gestor, equipe e grupos conectados à mesma operação.</RevealText></p>
        </div>
        <div className="brand-preview">
          <div className="park-logo">L</div><div><strong>SEU PARQUE</strong><span>Escala de colaboradores</span></div>
          <div className="preview-link">/escala/8K4X9</div>
        </div>
      </section>

      <section id="operacao" className="operation section">
        <div className="section-intro"><RevealText className="eyebrow-text">OPERAÇÃO EM TEMPO REAL</RevealText><h2><RevealText>Saiba o que está acontecendo e o que vem depois.</RevealText></h2></div>
        <div className="timeline">
          {[
            ["AGORA","09:30 — 10:00","Piscina","Grupo Azul"],
            ["PRÓXIMO","10:00 — 10:30","Oficina","Grupo Azul"],
            ["DEPOIS","10:30 — 11:00","Recreação","Grupo Azul"]
          ].map(([tag,time,activity,group],i) => <div className={`timeline-item ${i===0 ? "active":""}`} key={tag}><span>{tag}</span><div><strong>{time}</strong><b>{activity}</b><small>{group}</small></div></div>)}
        </div>
      </section>

      <section className="closing" id="contato">
        <div className="closing-glow"/>
        <RevealText className="eyebrow-text">LOSI ESCALA</RevealText>
        <h2><RevealText>Seu parque já é complexo.</RevealText><br/><RevealText className="gold-text">A gestão não precisa ser.</RevealText></h2>
        <p><RevealText>Organize sua equipe, automatize sua programação e tenha uma visão clara da operação.</RevealText></p>
        <a className="button" href="mailto:contato@losiescala.com">Quero conhecer o LOSI ESCALA <span>→</span></a>
      </section>

      <footer><span>© LOSI ESCALA</span><span>Gestão operacional inteligente</span></footer>
    </main>
  );
}
