"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Participant={id:string;freelancerId:string;name:string;label:string;whatsapp:string;systemId:string;status:string;joinedAt:string};
type Scale={id:string;date:string;start:string;end:string;capacity:number;status:string;notes:string;shareToken:string};

const statusLabels:Record<string,string>={available:"Disponível",confirmed:"Confirmado",removed:"Removido",left:"Saiu da escala",cancelled:"Cancelado"};

function dateLabel(v:string){return new Date(v+"T12:00:00").toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}
function joinedLabel(v:string){return new Date(v).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}

export default function EscalaDetalhe(){
 const {id}=useParams<{id:string}>(); const[scale,setScale]=useState<Scale|null>(null); const[people,setPeople]=useState<Participant[]>([]); const[loading,setLoading]=useState(true); const[error,setError]=useState(""); const[removing,setRemoving]=useState(""); const[copied,setCopied]=useState(false);
 const active=useMemo(()=>people.filter(p=>p.status==="confirmed"||p.status==="available"),[people]);
 async function load(){
  setLoading(true);setError("");
  const{data:auth}=await supabase.auth.getUser(); if(!auth.user){setError("Entre como gestor para administrar esta escala.");setLoading(false);return}
  const{data:member}=await supabase.from("park_users").select("park_id").eq("id",auth.user.id).limit(1).maybeSingle();
  if(!member){setError("Seu usuário ainda não está vinculado a um parque.");setLoading(false);return}
  const{data:s,error:se}=await supabase.from("scales").select("id,date,start_time,end_time,max_freelancers,status,notes,share_token").eq("id",id).eq("park_id",member.park_id).maybeSingle();
  if(se||!s){setError("Escala não encontrada ou sem acesso.");setLoading(false);return}
  setScale({id:s.id,date:s.date,start:s.start_time.slice(0,5),end:s.end_time.slice(0,5),capacity:s.max_freelancers,status:s.status,notes:s.notes??"",shareToken:s.share_token});
  const{data:links,error:le}=await supabase.from("scale_freelancers").select("id,freelancer_id,status,joined_at").eq("scale_id",id).order("joined_at",{ascending:true});
  if(le){setError("Não foi possível carregar os participantes.");setLoading(false);return}
  const ids=(links??[]).map(x=>x.freelancer_id); let map=new Map<string,any>();
  if(ids.length){const{data:fs,error:fe}=await supabase.from("freelancers").select("id,name,label,whatsapp,system_id").in("id",ids);if(fe){setError("Não foi possível carregar os freelancers.");setLoading(false);return}map=new Map((fs??[]).map(x=>[x.id,x]))}
  setPeople((links??[]).map(x=>{const f=map.get(x.freelancer_id);return{id:x.id,freelancerId:x.freelancer_id,name:f?.name??"Freelancer",label:f?.label??"Freelancer",whatsapp:f?.whatsapp??"",systemId:f?.system_id??"—",status:x.status,joinedAt:x.joined_at}}));setLoading(false)
 }
 useEffect(()=>{if(id)void load()},[id]);
 async function remove(p:Participant){if(!confirm(`Remover ${p.name} desta escala? A vaga será liberada.`))return;setRemoving(p.id);setError("");const{error:e}=await supabase.rpc("remove_freelancer_from_scale",{p_scale_id:id,p_freelancer_id:p.freelancerId});if(e){setError("Não foi possível remover o freelancer da escala.");setRemoving("");return}setPeople(v=>v.map(x=>x.id===p.id?{...x,status:"removed"}:x));setScale(v=>v&&v.status==="full"?{...v,status:"open"}:v);setRemoving("")}
 async function copy(){if(!scale)return;await navigator.clipboard?.writeText(`${location.origin}/escala/${scale.shareToken}`);setCopied(true);setTimeout(()=>setCopied(false),1800)}
 if(loading&&!scale)return <main className="dashboard"><section className="dash-hero"><h1>Carregando escala...</h1></section></main>;
 return <main className="dashboard scale-detail-page">
  <header className="dash-header"><Link href="/painel" className="auth-brand"><span className="brand-mark">L</span><span><b>LOSI</b> ESCALA</span></Link><nav className="dash-nav"><Link href="/painel">Visão geral</Link><Link href="/painel/escalas" className="active">Escalas</Link><Link href="/painel/freelancers">Freelancers</Link><Link href="/painel/grupos">Grupos</Link><Link href="/painel/programacoes">Programações</Link></nav><details className="dash-mobile-menu"><summary aria-label="Abrir menu">☰</summary><nav><Link href="/painel">Visão geral</Link><Link href="/painel/escalas" className="active">Escalas</Link><Link href="/painel/freelancers">Freelancers</Link><Link href="/painel/grupos">Grupos</Link><Link href="/painel/programacoes">Programações</Link></nav></details><div className="dash-user"><span>SEU PARQUE</span><b>Gestor</b></div></header>
  <section className="scale-detail-hero"><Link href="/painel/escalas" className="scale-detail-back">← Voltar para escalas</Link>{scale&&<><div className="scale-detail-kicker"><span className="eyebrow-text">GERENCIAR ESCALA</span><span className="scale-status">{scale.status==="full"?"Cheia":scale.status==="open"?"Aberta":scale.status==="closed"?"Fechada":scale.status}</span></div><h1>{dateLabel(scale.date)}<br/><span>{scale.start} — {scale.end}</span></h1><p>{scale.notes||"Sem observações adicionadas."}</p><div className="scale-detail-actions"><button className="button" onClick={()=>void copy()}>{copied?"Link copiado ✓":"Compartilhar escala ↗"}</button><span>{active.length} / {scale.capacity} freelancers</span></div></>}</section>
  {error&&<div className="scales-error">{error}</div>}
  {scale&&<section className="scale-detail-content"><div className="scale-detail-summary"><div><span>ATIVOS</span><strong>{active.length}</strong></div><div><span>VAGAS DISPONÍVEIS</span><strong>{Math.max(scale.capacity-active.length,0)}</strong></div><div><span>CAPACIDADE</span><strong>{scale.capacity}</strong></div></div><div className="scale-detail-section-head"><div><span className="eyebrow-text">EQUIPE DA ESCALA</span><h2>Freelancers inscritos.</h2></div><span>{active.length} ativo(s)</span></div>{people.length===0?<div className="scale-detail-empty"><strong>Ninguém entrou nesta escala ainda.</strong><span>Compartilhe o link para que os freelancers registrem a disponibilidade.</span></div>:<div className="scale-participant-list">{people.map(p=>{const on=p.status==="confirmed"||p.status==="available";return <article className={`scale-participant-card ${on?"":"is-inactive"}`} key={p.id}><div className="participant-avatar">{p.name.slice(0,1).toUpperCase()}</div><div className="participant-main"><div className="participant-title"><div><h3>{p.name}</h3><span>{p.label}</span></div><b className="participant-status">{statusLabels[p.status]??p.status}</b></div><div className="participant-meta"><span>ID: <b>{p.systemId}</b></span>{p.whatsapp&&<span>WhatsApp: <b>{p.whatsapp}</b></span>}<span>Entrada: <b>{joinedLabel(p.joinedAt)}</b></span></div></div>{on&&scale.status!=="closed"&&scale.status!=="cancelled"&&<button className="participant-remove" disabled={removing===p.id} onClick={()=>void remove(p)}>{removing===p.id?"Removendo...":"Remover da escala"}</button>}</article>})}</div>}</section>}
 </main>
}