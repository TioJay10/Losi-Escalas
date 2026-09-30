"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Card = [string,string,string,string,string];

export default function Painel() {
  const [parkName, setParkName] = useState("SEU PARQUE");
  const [metrics, setMetrics] = useState({ scales:0, freelancers:0, groups:0, programs:0 });
  const [live, setLive] = useState<Array<{group_name:string;activity_name:string;starts_at:string;ends_at:string;location:string|null}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) { if(active) setLoading(false); return; }
      const { data: membership } = await supabase.from("park_users").select("park_id").eq("id",user.id).maybeSingle();
      if (!membership) { if(active) setLoading(false); return; }
      const parkId = membership.park_id;
      const [park, scales, freelancers, groups, programs, liveRows] = await Promise.all([
        supabase.from("parks").select("name").eq("id",parkId).maybeSingle(),
        supabase.from("scales").select("id",{count:"exact",head:true}).eq("park_id",parkId),
        supabase.from("freelancers").select("id",{count:"exact",head:true}).eq("park_id",parkId).eq("status","active"),
        supabase.from("groups").select("id",{count:"exact",head:true}).eq("park_id",parkId),
        supabase.from("programs").select("id",{count:"exact",head:true}).eq("park_id",parkId),
        supabase.from("live_program_operation").select("group_name,activity_name,starts_at,ends_at,location").eq("park_id",parkId).eq("program_status","published").order("starts_at").limit(8)
      ]);
      if(!active)return;
      setParkName(park.data?.name || "SEU PARQUE");
      setMetrics({scales:scales.count||0,freelancers:freelancers.count||0,groups:groups.count||0,programs:programs.count||0});
      setLive((liveRows.data||[]) as typeof live);
      setLoading(false);
    }
    void load();
    return ()=>{active=false};
  },[]);

  const cards:Card[]=[
    ["Escalas","Organize quem trabalha em cada dia.",String(metrics.scales),"Abrir escalas","/painel/escalas"],
    ["Freelancers","Disponibilidade e equipe.",String(metrics.freelancers),"Gerenciar equipe","/painel/freelancers"],
    ["Grupos","Pessoas, responsáveis e transporte.",String(metrics.groups),"Abrir grupos","/painel/grupos"],
    ["Programações","Horários, atividades e conflitos.",String(metrics.programs),"Ver programações","/painel/programacoes"],
  ];

  return <main className="dashboard">
    <header className="dash-header">
      <Link href="/painel" className="auth-brand"><span className="brand-mark">L</span><span><b>LOSI</b> ESCALA</span></Link>
      <nav className="dash-nav">
        <Link href="/painel" className="active">Visão geral</Link><Link href="/painel/escalas">Escalas</Link><Link href="/painel/freelancers">Freelancers</Link><Link href="/painel/grupos">Grupos</Link><Link href="/painel/atividades">Atividades</Link><Link href="/painel/programacoes">Programações</Link><Link href="/painel/operacao">Operação</Link>
      </nav><details className="dash-mobile-menu"><summary aria-label="Abrir menu">☰</summary><nav><Link href="/painel">Visão geral</Link><Link href="/painel/escalas">Escalas</Link><Link href="/painel/freelancers">Freelancers</Link><Link href="/painel/grupos">Grupos</Link><Link href="/painel/atividades">Atividades</Link><Link href="/painel/programacoes">Programações</Link><Link href="/painel/operacao">Operação</Link></nav></details>
      <div className="dash-user"><span>{parkName}</span><b>Gestor</b></div>
    </header>
    <section className="dash-hero"><div><span className="eyebrow-text">PAINEL DO GESTOR</span><h1>Bom dia.<br/><span>Sua operação está organizada.</span></h1><p>Uma visão clara da equipe, das escalas e do que acontece no parque.</p></div><Link className="button" href="/painel/escalas">+ Nova escala</Link></section>
    <section className="dash-cards">{cards.map(([title,desc,value,cta,href])=><article className="dash-card" key={title}><span className="dash-card-value">{loading?"—":value}</span><h2>{title}</h2><p>{desc}</p><Link href={href}>{cta} →</Link></article>)}</section>
    <section className="dash-live"><div className="dash-section-head"><div><span className="eyebrow-text">OPERAÇÃO EM TEMPO REAL</span><h2>O que está acontecendo.</h2></div><Link href="/painel/operacao">Ver operação →</Link></div><div className="live-board">{live.length===0?<div className="live-empty"><strong>Nenhuma programação publicada.</strong><span>Quando uma programação for publicada, a operação aparecerá aqui.</span></div>:live.map((item,i)=><div className="live-row" key={item.group_name+"-"+item.starts_at+"-"+i}><span>{new Date(item.starts_at).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</span><strong>{item.activity_name}</strong><b>{item.group_name}</b><small>{item.location||"Local não definido"}</small></div>)}</div></section>
  </main>;
}
