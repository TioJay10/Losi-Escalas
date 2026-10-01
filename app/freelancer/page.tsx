"use client";
import Link from "next/link";
import { useEffect,useMemo,useState } from "react";
import { supabase } from "@/lib/supabase";

type Freelancer={freelancer_id:string;system_id:string;name:string;label:string;whatsapp:string|null};
type Scale={id:string;share_token:string;date:string;start_time:string;end_time:string;capacity:number;status:string;notes:string|null;participation_status:string;joined_at:string};
type Group={id:string;name:string;quantity:number;quantity_label:string;responsible_name:string|null;responsible_whatsapp:string|null};
type Item={id:string;group_id:string;group_name:string;starts_at:string;ends_at:string;location:string|null;activity_name:string;program_id:string;program_status:string};

const tokenKey="losi_freelancer_token";
function fmtDate(v:string){return new Date(v+"T12:00:00").toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"2-digit"})}
function fmtTime(v:string){return v?.slice(0,5)}
function time(v:string){return new Date(v).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}

export default function FreelancerPage(){
 const [me,setMe]=useState<Freelancer|null>(null),[scales,setScales]=useState<Scale[]>([]),[groups,setGroups]=useState<Group[]>([]),[items,setItems]=useState<Item[]>([]),[tab,setTab]=useState<"inicio"|"escalas"|"grupos"|"programacao">("inicio"),[error,setError]=useState(""),[loading,setLoading]=useState(true),[leaving,setLeaving]=useState("");
 async function call(action:string,args:any={}){const {data,error}=await supabase.functions.invoke("freelancer-auth",{body:{action,...args}});if(error)throw error;if(data?.error)throw new Error(data.error);return data}
 async function load(){
   const t=localStorage.getItem(tokenKey); if(!t){location.href="/entrar";return}
   try{const m=await call("me",{token:t});setMe(m);const [s,g,p]=await Promise.all([call("scales",{token:t}),call("groups",{token:t}),call("program",{token:t})]);setScales(s||[]);setGroups(g||[]);setItems(p||[]);setError("")}
   catch(e:any){localStorage.removeItem(tokenKey);setError("Sua sessão expirou. Entre novamente.");}
   finally{setLoading(false)}
 }
 useEffect(()=>{void load()},[]);
 async function logout(){const t=localStorage.getItem(tokenKey);if(t){try{await call("logout",{token:t})}catch{}}localStorage.removeItem(tokenKey);location.href="/entrar"}
 async function leave(id:string){const t=localStorage.getItem(tokenKey);if(!t)return;setLeaving(id);try{await call("leave_scale",{token:t,scale_id:id});await load()}catch(e:any){setError(e?.message==="cannot_leave"?"Esta escala não pode mais ser abandonada.":"Não foi possível sair da escala.")}finally{setLeaving("")}}
 const now=Date.now();
 const next=useMemo(()=>items.filter(x=>new Date(x.ends_at).getTime()>now).sort((a,b)=>new Date(a.starts_at).getTime()-new Date(b.starts_at).getTime())[0],[items,now]);
 if(loading)return <main className="dashboard freelancer-page"><section className="dash-hero"><div><span className="eyebrow-text">LOSI ESCALA</span><h1>Carregando<br/><span>seu acesso.</span></h1></div></section></main>;
 if(!me)return <main className="dashboard freelancer-page"><section className="dash-hero"><div><span className="eyebrow-text">ACESSO</span><h1>Sessão encerrada.</h1><p>{error}</p><Link className="button" href="/entrar">Entrar novamente</Link></div></section></main>;
 return (
  <main className="dashboard">
    <header className="dash-header">
      <Link href="/freelancer" className="auth-brand"><span className="brand-mark">L</span><span><b>LOSI</b> ESCALA</span></Link>
      <button className="dash-menu" aria-label="Abrir menu" onClick={(e) => e.currentTarget.nextElementSibling?.classList.toggle("open")}>☰</button>
      <nav className="dash-nav">
        <button className={tab === "inicio" ? "active" : ""} onClick={() => setTab("inicio")}>Início</button>
        <button className={tab === "escalas" ? "active" : ""} onClick={() => setTab("escalas")}>Minhas escalas</button>
        <button className={tab === "grupos" ? "active" : ""} onClick={() => setTab("grupos")}>Meus grupos</button>
        <button className={tab === "programacao" ? "active" : ""} onClick={() => setTab("programacao")}>Programação</button>
      </nav>
      <div className="dash-user"><span>{me.system_id}</span><b>{me.name}</b><button onClick={logout}>Sair</button></div>
    </header>

    {error && <div className="scales-error">{error}</div>}

    {tab === "inicio" && (
      <div>
        <section className="dash-hero">
          <div>
            <span className="eyebrow-text">{me.label.toUpperCase()}</span>
            <h1>Olá, {me.name.split(" ")[0]}.<br /><span>Sua operação.</span></h1>
            <p>ID permanente: <strong>{me.system_id}</strong>. Aqui você acompanha escalas, grupos e programação.</p>
          </div>
          <button className="button" onClick={() => setTab("escalas")}>Ver minhas escalas →</button>
        </section>

        <section className="dash-cards">
          <article className="dash-card"><span className="dash-card-value">{scales.filter(x => ["available", "confirmed"].includes(x.participation_status)).length}</span><h2>Escalas ativas</h2><p>Escalas em que você está confirmado ou disponível.</p></article>
          <article className="dash-card"><span className="dash-card-value">{groups.length}</span><h2>Grupos</h2><p>Grupos aos quais você está vinculado.</p></article>
          <article className="dash-card"><span className="dash-card-value">{items.length}</span><h2>Atividades</h2><p>Itens publicados na sua programação.</p></article>
        </section>

        {next && (
          <section className="dash-live">
            <div className="dash-section-head"><div><span className="eyebrow-text">PRÓXIMA ATIVIDADE</span><h2>{next.activity_name}</h2></div><span>{next.group_name}</span></div>
            <div className="live-board"><div className="live-row"><span>{time(next.starts_at)}</span><strong>{next.activity_name}</strong><b>{next.group_name}</b><small>{next.location || "Local não definido"} · até {time(next.ends_at)}</small></div></div>
          </section>
        )}
      </div>
    )}

    {tab === "escalas" && (
      <section className="scales-content">
        <div className="dash-section-head"><div><span className="eyebrow-text">MINHAS ESCALAS</span><h2>Onde você está escalado.</h2></div></div>
        <div className="scale-list">
          {scales.length === 0 ? (
            <div className="live-empty"><strong>Nenhuma escala encontrada.</strong><span>Quando você entrar em uma escala, ela aparecerá aqui.</span></div>
          ) : scales.map(s => (
            <article className="scale-card" key={s.id}>
              <div className="scale-date"><span>{fmtDate(s.date)}</span><strong>{fmtTime(s.start_time)}</strong><small>até {fmtTime(s.end_time)}</small></div>
              <div className="scale-main">
                <div className="scale-title-row"><div><span className="scale-id">PARTICIPAÇÃO</span><h2>{s.participation_status === "left_voluntarily" ? "Saiu da escala" : s.status === "cancelled" ? "Cancelada" : "Confirmada"}</h2></div><span className="scale-status scale-status-open">{s.status}</span></div>
                <p>{s.notes || "Sem observações."}</p>
                {["available", "confirmed"].includes(s.participation_status) && !["closed", "cancelled"].includes(s.status) && (
                  <button className="button button-danger" disabled={leaving === s.id} onClick={() => leave(s.id)}>{leaving === s.id ? "Saindo..." : "Sair da escala"}</button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    )}

    {tab === "grupos" && (
      <section className="scales-content">
        <div className="dash-section-head"><div><span className="eyebrow-text">MEUS GRUPOS</span><h2>Grupos vinculados.</h2></div></div>
        <div className="scale-list">
          {groups.length === 0 ? <div className="live-empty"><strong>Nenhum grupo vinculado.</strong></div> : groups.map(g => (
            <article className="scale-card" key={g.id}>
              <div className="scale-date"><span>{g.quantity}</span><strong>{g.quantity_label}</strong></div>
              <div className="scale-main"><h2>{g.name}</h2><p>{g.responsible_name || "Responsável não informado"}{g.responsible_whatsapp ? " · " + g.responsible_whatsapp : ""}</p></div>
            </article>
          ))}
        </div>
      </section>
    )}

    {tab === "programacao" && (
      <section className="scales-content">
        <div className="dash-section-head"><div><span className="eyebrow-text">MINHA PROGRAMAÇÃO</span><h2>O que acontece no dia.</h2></div></div>
        <div className="live-board">
          {items.length === 0 ? <div className="live-empty"><strong>Nenhuma programação publicada.</strong></div> : items.map(x => (
            <div className="live-row" key={x.id}><span>{time(x.starts_at)}</span><strong>{x.activity_name}</strong><b>{x.group_name}</b><small>{x.location || "Local não definido"} · até {time(x.ends_at)}</small></div>
          ))}
        </div>
      </section>
    )}
  </main>
 );

}