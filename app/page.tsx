
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

function Icon({ type }: { type: "users"|"calendar"|"layers"|"spark"|"shield"|"chart" }) {
  const common = { width: 34, height: 34, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths = {
    users: <><circle cx="9" cy="8" r="3"/><path d="M3.5 20c.6-3.2 2.5-5 5.5-5s4.9 1.8 5.5 5"/><path d="M16 5.2a3 3 0 0 1 0 5.6"/><path d="M16.5 15c2.1.5 3.4 2.1 4 5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/></>,
    spark: <><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z"/><path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></>,
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
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    window.scrollTo(0, 0);
    const frame = window.requestAnimationFrame(() => window.scrollTo(0, 0));

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".reveal-text"));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
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
          <a href="#solucao">Como funciona</a>
          <a href="#recursos">Recursos</a>
          <a href="#operacao">Operação</a>
        </nav>
        <div className="header-actions">
          <button className="theme-toggle" onClick={() => setDark(v => !v)} aria-label="Alternar modo escuro">{dark ? "☼" : "☾"}</button>
          <a className="button button-small" href="#contato">Conhecer</a>
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow"><span className="eyebrow-dot"/> Sistema de gestão para parques</div>
          <h1><RevealText>Organize sua equipe.</RevealText><br/><RevealText className="gold-text">Monte suas escalas.</RevealText><br/><RevealText>Controle sua operação.</RevealText></h1>
          <p className="hero-copy"><RevealText>O LOSI ESCALA reúne freelancers, escalas, grupos e programação em um único sistema. Você organiza quem trabalha, define onde e quando cada grupo estará e acompanha tudo em tempo real.</RevealText></p>
          <div className="hero-actions">
            <a className="button" href="#contato">Conhecer o LOSI ESCALA <span>→</span></a>
            <a className="text-link" href="#solucao">Ver como funciona <span>↓</span></a>
          </div>
        </div>
      </section>

      <section className="hero-showcase" aria-label="Visão da operação">
        <div className="showcase-shell">
          <div className="showcase-heading">
            <span className="eyebrow-text">COMO FUNCIONA</span>
            <h2><RevealText>Da equipe disponível à programação do dia.</RevealText></h2>
          </div>
          <div className="operation-window">
            <div className="window-top">
              <span>Operação de hoje</span>
              <span className="live"><i/> AO VIVO</span>
            </div>
            <div className="window-main">
              <div className="window-number">04</div>
              <div><span>grupos em operação</span><small>Horários, atividades e equipe organizados em um só lugar.</small></div>
            </div>
            <div className="window-grid">
              <div><strong>01</strong><span>Equipe escalada</span></div>
              <div><strong>04</strong><span>Grupos organizados</span></div>
              <div><strong>08</strong><span>Atividades programadas</span></div>
              <div><strong>100%</strong><span>Visão da operação</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="statement">
        <RevealText className="statement-kicker">O PROBLEMA</RevealText>
        <h2><RevealText>Chega de controlar disponibilidade, escalas, grupos e horários em planilhas e conversas espalhadas.</RevealText></h2>
      </section>

      <section id="solucao" className="solution section">
        <div className="section-intro">
          <RevealText className="eyebrow-text">A SOLUÇÃO</RevealText>
          <h2><RevealText>Você cadastra, organiza, gera e acompanha.</RevealText></h2>
        </div>
        <div className="feature-grid">
          {[
            ["users","Cadastre sua equipe","Registre freelancers, contatos e disponibilidade para saber quem pode trabalhar em cada escala."],
            ["calendar","Crie e compartilhe escalas","Defina data, horário e limite de pessoas. Gere um link e envie para sua equipe."],
            ["layers","Organize os grupos","Cadastre quantidade, responsáveis, contatos, transporte e os profissionais de cada grupo."],
            ["spark","Gere a programação","Defina atividades, duração, capacidade e regras. O sistema monta a programação e aponta conflitos."],
            ["shield","Controle os acessos","Cada gestor e freelancer acessa apenas as informações permitidas para sua função."],
            ["chart","Acompanhe em tempo real","Veja o que está acontecendo agora, o próximo horário e a operação de cada grupo."]
          ].map(([icon,title,desc]) => (
            <article className="feature-card" key={title}>
              <div className="icon-box"><Icon type={icon as "spark"}/></div>
              <h3><RevealText>{title}</RevealText></h3>
              <p><RevealText>{desc}</RevealText></p>
              <span className="card-arrow">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section id="recursos" className="immersive-section">
        <div className="immersive-copy">
          <RevealText className="eyebrow-text">FEITO PARA A ROTINA DO PARQUE</RevealText>
          <h2><RevealText>Menos improviso. Mais controle.</RevealText></h2>
          <p><RevealText>O gestor sabe quem está disponível, quem está escalado, quais grupos estão ativos e quais atividades precisam acontecer.</RevealText></p>
          <p><RevealText>O freelancer recebe suas escalas. O grupo tem sua programação. Todos trabalham com a mesma informação.</RevealText></p>
        </div>
        <div className="brand-preview">
          <div className="park-logo">L</div>
          <div className="brand-preview-copy"><strong>SEU PARQUE</strong><span>Escala de colaboradores</span></div>
          <div className="preview-link">/escala/8K4X9</div>
        </div>
      </section>

      <section id="operacao" className="operation section">
        <div className="section-intro"><RevealText className="eyebrow-text">NO DIA DA OPERAÇÃO</RevealText><h2><RevealText>O sistema mostra o agora, o próximo passo e quem está responsável.</RevealText></h2></div>
        <div className="timeline">
          {[
            ["AGORA","09:30 — 10:00","Piscina","Grupo Azul"],
            ["PRÓXIMO","10:00 — 10:30","Oficina","Grupo Azul"],
            ["DEPOIS","10:30 — 11:00","Recreação","Grupo Azul"]
          ].map(([tag,time,activity,group],i) => (
            <div className={`timeline-item ${i===0 ? "active":""}`} key={tag}>
              <span>{tag}</span><div><strong>{time}</strong><b>{activity}</b><small>{group}</small></div>
            </div>
          ))}
        </div>
      </section>

      <section className="closing" id="contato">
        <RevealText className="eyebrow-text">LOSI ESCALA</RevealText>
        <h2><RevealText>Da escala à operação.</RevealText><br/><RevealText className="gold-text">Tudo organizado.</RevealText></h2>
        <p><RevealText>Centralize sua equipe, organize grupos, gere sua programação e acompanhe o parque em tempo real.</RevealText></p>
        <a className="button" href="mailto:contato@losiescala.com">Quero conhecer o LOSI ESCALA <span>→</span></a>
      </section>

      <footer><span>© LOSI ESCALA</span><span>Gestão operacional para parques</span></footer>
    </main>
  );
}