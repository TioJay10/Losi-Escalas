"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Program = {
  id:string; date:string; status:string; start_time:string; end_time:string;
  lunch_start:string|null; lunch_end:string|null; snack_start:string|null; snack_end:string|null;
  exit_time:string|null; notes:string|null; scale_id:string|null;
};

const statusLabel:Record<string,string>={draft:"Rascunho",generated:"Gerada",with_conflict:"Com conflito",published:"Publicada",modified:"Modificada",closed:"Encerrada"};

function formatDate(value:string){
  return new Date(value+"T12:00:00").toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"2-digit",year:"numeric"}).replace(".","");
}

export default function ProgramacoesPage(){
  const[rows,setRows]=useState<Program[]>([]);
  const[scales,setScales]=useState<Array<{id:string;date:string;start_time:string;end_time:string}>>([]);
  const[parkId,setParkId]=useState("");
  const[showNew,setShowNew]=useState(false);
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState("");
  const[form,setForm]=useState({date:"",start:"08:00",end:"17:00",lunchStart:"12:00",lunchEnd:"13:00",snackStart:"",snackEnd:"",exitTime:"17:00",scaleId:"",notes:""});
  const today=new Date().toISOString().slice(0,10);
  const upcoming=useMemo(()=>rows.filter(x=>x.date>=today&&x.status!=="closed").length,[rows,today]);

  async function loadData(){
    setLoading(true);setError("");
    const{data:auth}=await supabase.auth.getUser();
    if(!auth.user){setError("Entre como gestor para acessar as programações do parque.");setLoading(false);return;}
    const{data:membership,error:membershipError}=await supabase.from("park_users").select("park_id").eq("id",auth.user.id).maybeSingle();
    if(membershipError||!membership){setError("Seu usuário ainda não está vinculado a um parque.");setLoading(false);return;}
    setParkId(membership.park_id);
    const[programsResult,scalesResult]=await Promise.all([
      supabase.from("programs").select("id,date,status,start_time,end_time,lunch_start,lunch_end,snack_start,snack_end,exit_time,notes,scale_id").eq("park_id",membership.park_id).order("date",{ascending:true}).order("start_time",{ascending:true}),
      supabase.from("scales").select("id,date,start_time,end_time").eq("park_id",membership.park_id).neq("status","cancelled").order("date",{ascending:true}).order("start_time",{ascending:true})
    ]);
    if(programsResult.error||scalesResult.error){setError("Não foi possível carregar as programações.");setLoading(false);return;}
    setRows(programsResult.data??[]);setScales(scalesResult.data??[]);setLoading(false);
  }
  useEffect(()=>{void loadData()},[]);

  function openNew(){
    const next=scales.find(x=>x.date>=today);
    setForm({date:next?.date??today,start:next?.start_time?.slice(0,5)??"08:00",end:next?.end_time?.slice(0,5)??"17:00",lunchStart:"12:00",lunchEnd:"13:00",snackStart:"",snackEnd:"",exitTime:next?.end_time?.slice(0,5)??"17:00",scaleId:next?.id??"",notes:""});
    setError("");setShowNew(true);
  }
  function selectScale(value:string){
    const scale=scales.find(x=>x.id===value);
    setForm(x=>({...x,scaleId:value,date:scale?.date??x.date,start:scale?.start_time?.slice(0,5)??x.start,end:scale?.end_time?.slice(0,5)??x.end,exitTime:scale?.end_time?.slice(0,5)??x.exitTime}));
  }
  async function createProgram(e:React.FormEvent){
    e.preventDefault();
    if(!parkId||!form.date||!form.start||!form.end)return;
    if(form.end<=form.start){setError("O horário final precisa ser depois do horário inicial.");return;}
    if(form.lunchStart&&form.lunchEnd&&form.lunchEnd<=form.lunchStart){setError("Confira o horário do almoço.");return;}
    setSaving(true);setError("");
    const{data:auth}=await supabase.auth.getUser();
    const{data,error:createError}=await supabase.from("programs").insert({
      park_id:parkId,scale_id:form.scaleId||null,date:form.date,start_time:form.start,end_time:form.end,
      lunch_start:form.lunchStart||null,lunch_end:form.lunchEnd||null,snack_start:form.snackStart||null,snack_end:form.snackEnd||null,
      exit_time:form.exitTime||null,notes:form.notes.trim()||null,status:"draft",created_by:auth.user?.id??null
    }).select("id,date,status,start_time,end_time,lunch_start,lunch_end,snack_start,snack_end,exit_time,notes,scale_id").single();
    if(createError||!data){setError("Não foi possível criar a programação. Verifique seu acesso ao parque.");setSaving(false);return;}
    setRows(x=>[...x,data].sort((a,b)=>(a.date+a.start_time).localeCompare(b.date+b.start_time)));
    setShowNew(false);setSaving(false);
  }

  return <main className="dashboard programs-page">
    <header className="dash-header">
      <Link href="/painel" className="auth-brand"><span className="brand-mark">L</span><span><b>LOSI</b> ESCALA</span></Link>
      <nav className="dash-nav">
        <Link href="/painel">Visão geral</Link><Link href="/painel/escalas">Escalas</Link><Link href="/painel/freelancers">Freelancers</Link><Link href="/painel/grupos">Grupos</Link><Link href="/painel/atividades">Atividades</Link><Link href="/painel/programacoes" className="active">Programações</Link><Link href="/painel/operacao">Operação</Link>
      </nav>
      <details className="dash-mobile-menu"><summary aria-label="Abrir menu">☰</summary><nav>
        <Link href="/painel">Visão geral</Link><Link href="/painel/escalas">Escalas</Link><Link href="/painel/freelancers">Freelancers</Link><Link href="/painel/grupos">Grupos</Link><Link href="/painel/atividades">Atividades</Link><Link href="/painel/programacoes" className="active">Programações</Link><Link href="/painel/operacao">Operação</Link>
      </nav></details>
      <div className="dash-user"><span>SEU PARQUE</span><b>Gestor</b></div>
    </header>

    <section className="programs-hero"><div><span className="eyebrow-text">PLANEJAMENTO OPERACIONAL</span><h1>Programações.<br/><span>O dia ganha ordem.</span></h1><p>Monte o roteiro do parque por data, grupos, atividades, equipe e horários de refeição. Depois publique para a operação.</p></div>
      <div className="programs-hero-actions"><Link className="program-secondary-button" href="/painel/atividades">Gerenciar atividades</Link><button className="button" type="button" onClick={openNew} disabled={!parkId}>+ Nova programação</button></div>
    </section>
    {error&&<div className="scales-error">{error}</div>}

    <section className="programs-content">
      <div className="programs-summary"><div><span>PROGRAMAS CADASTRADOS</span><strong>{rows.length}</strong></div><div><span>PRÓXIMOS</span><strong>{upcoming}</strong></div><div><span>PUBLICADOS</span><strong>{rows.filter(x=>x.status==="published").length}</strong></div></div>
      <div className="programs-section-head"><div><span className="eyebrow-text">ROTEIROS DO PARQUE</span><h2>Seus dias.</h2></div><span>{loading?"Carregando...":rows.length+" programação(ões)"}</span></div>
      {loading?<div className="program-empty"><strong>Carregando programações...</strong></div>:rows.length===0?<div className="program-empty"><strong>Nenhuma programação cadastrada.</strong><span>Crie o primeiro dia operacional e depois associe grupos e atividades.</span><button className="button" type="button" onClick={openNew}>+ Criar primeira programação</button></div>:
        <div className="program-list">{rows.map(program=><article className="program-card" key={program.id}>
          <div className="program-date"><span>{formatDate(program.date)}</span><strong>{program.date.slice(8,10)}</strong><small>{program.date.slice(5,7)}/{program.date.slice(0,4)}</small></div>
          <div className="program-main"><div className="program-title-row"><div><span className="scale-id">{program.id.slice(0,8).toUpperCase()}</span><h2>{program.start_time.slice(0,5)} — {program.end_time.slice(0,5)}</h2></div><span className={"program-status program-status-"+program.status}>{statusLabel[program.status]??program.status}</span></div>
            <p>{program.notes||"Roteiro pronto para receber grupos e atividades."}</p>
            <div className="program-meta"><span>Almoço {program.lunch_start&&program.lunch_end?program.lunch_start.slice(0,5)+"–"+program.lunch_end.slice(0,5):"não definido"}</span><span>Saída {program.exit_time?.slice(0,5)||"não definida"}</span></div>
          </div><div className="program-actions"><Link href={"/painel/programacoes/"+program.id}>Abrir programação →</Link></div>
        </article>)}</div>}
    </section>

    {showNew&&<div className="program-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setShowNew(false)}}>
      <form className="program-modal" onSubmit={createProgram}>
        <div className="program-modal-head"><div><span className="eyebrow-text">NOVA PROGRAMAÇÃO</span><h2>Monte o dia.</h2></div><button type="button" onClick={()=>setShowNew(false)} aria-label="Fechar">×</button></div>
        <div className="program-form-section"><span>HORÁRIO OPERACIONAL</span><div className="program-form-grid">
          <label>Data<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required/></label><label>Início<input type="time" value={form.start} onChange={e=>setForm({...form,start:e.target.value})} required/></label><label>Fim<input type="time" value={form.end} onChange={e=>setForm({...form,end:e.target.value})} required/></label><label>Saída<input type="time" value={form.exitTime} onChange={e=>setForm({...form,exitTime:e.target.value})}/></label>
        </div></div>
        <div className="program-form-section"><span>ESCALA E REFEIÇÕES</span><div className="program-form-grid">
          <label className="program-field-wide">Escala do dia<select value={form.scaleId} onChange={e=>selectScale(e.target.value)}><option value="">Sem escala vinculada</option>{scales.map(s=><option key={s.id} value={s.id}>{formatDate(s.date)} · {s.start_time.slice(0,5)}–{s.end_time.slice(0,5)}</option>)}</select></label>
          <label>Almoço — início<input type="time" value={form.lunchStart} onChange={e=>setForm({...form,lunchStart:e.target.value})}/></label><label>Almoço — fim<input type="time" value={form.lunchEnd} onChange={e=>setForm({...form,lunchEnd:e.target.value})}/></label>
          <label>Lanche — início<input type="time" value={form.snackStart} onChange={e=>setForm({...form,snackStart:e.target.value})}/></label><label>Lanche — fim<input type="time" value={form.snackEnd} onChange={e=>setForm({...form,snackEnd:e.target.value})}/></label>
        </div></div>
        <label className="program-notes">Observações<textarea rows={3} placeholder="Ex.: chegada do ônibus, oficina especial, orientação de segurança..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
        <div className="program-modal-footer"><button type="button" className="scale-cancel" onClick={()=>setShowNew(false)}>Cancelar</button><button className="button" type="submit" disabled={saving}>{saving?"Criando...":"Criar programação"}</button></div>
      </form>
    </div>}
  </main>;
}
