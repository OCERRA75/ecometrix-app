import { useState, useRef, useEffect, useContext, createContext, useCallback } from "react";
import {
  Camera, CheckCircle, XCircle, AlertCircle, Download,
  LogOut, ChevronLeft, Trash2, Eye, RefreshCw, Shield,
  BarChart2, Upload, ClipboardList, AlertTriangle,
  Users, PenTool, Building2, Wifi, WifiOff, Plus, Edit2,
  FileSpreadsheet, Sliders, Moon, Sun, Clock, History,
  AlertOctagon, Table2, Activity
} from "lucide-react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { auth, db } from "./firebase";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  createUserWithEmailAndPassword, updateProfile
} from "firebase/auth";
import {
  collection, doc, setDoc, getDoc, getDocs, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, where
} from "firebase/firestore";

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const CATS = [
  { id:1, name:"Acceso al sitio",                 icon:"🚪", hint:"Fotografía clara del acceso principal: puerta, camino o vía de entrada al sitio.",             criterios:["Puerta/acceso visible","Señalización visible","Sin obstáculos","Buena iluminación"] },
  { id:2, name:"General del sitio",               icon:"🏗️", hint:"Vista panorámica completa del sitio mostrando torre, shelter y entorno inmediato.",             criterios:["Torre completa en cuadro","Shelter visible","Entorno capturado","Vista sin obstrucciones"] },
  { id:3, name:"Equipos existentes",              icon:"📡", hint:"Todos los equipos activos (BBUs, RRUs, cables). Etiquetas y modelos claramente visibles.",       criterios:["Equipos en foco","Etiquetas legibles","Todos los modelos visibles","Cableado visible"] },
  { id:4, name:"Espacio en escalerillas",         icon:"🪜", hint:"Espacio disponible en escalerillas para futuros tendidos de cable.",                            criterios:["Escalerilla completa","Espacio libre visible","Cables actuales visibles","Medidas estimables"] },
  { id:5, name:"Posibles ubicaciones de equipos", icon:"📌", hint:"Espacios libres en shelter o exterior para instalar nuevos equipos.",                          criterios:["Espacio libre visible","Dimensiones estimables","Sin obstrucciones","Acceso eléctrico visible"] },
  { id:6, name:"Generales de la torre",           icon:"🗼", hint:"Foto completa de la torre: base, cuerpo y punta con todas las antenas visibles.",               criterios:["Torre completa de base a punta","Todas las antenas visibles","Sin elementos cortados","Buena perspectiva"] },
  { id:7, name:"Sectores existentes (RF)",        icon:"📶", hint:"Cada sector con sus antenas. Recorrido completo: Alpha, Beta y Gamma.",                         criterios:["Sector Alpha visible","Sector Beta visible","Sector Gamma visible","Modelos de antena legibles"] },
  { id:8, name:"Área arrendada (RF)",             icon:"🔲", hint:"Vista general del área de arrendamiento con límites físicos visibles.",                         criterios:["Límites del área visibles","Señalización de área","Instalaciones dentro del área","Vista panorámica"] },
  { id:9, name:"Espacios para antenas",           icon:"🎯", hint:"Posiciones disponibles en torre para instalación de nuevas antenas.",                          criterios:["Posición disponible visible","Espacio en estructura","Sin interferencias","Altura estimable"] },
];

const WO_DEFAULT = { numero:"SMP-WO-0320561", fecha:"10/02/2026", tipo:"VAD · Visita de Diseño", proyecto:"Network Expansion 2026", sitio:"Hurtado" };
const RISK_LEVELS = ["ALTO","MEDIO","BAJO"];
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_KEY;

// ─── THEME ────────────────────────────────────────────────────────────────────

const ThemeCtx = createContext(null);
const makeTheme = (dark) => ({
  pageBg:      dark ? "#0a0f1e" : "#f1f5f9",
  surface:     dark ? "#1e293b" : "#ffffff",
  surfaceAlt:  dark ? "#162032" : "#f8fafc",
  border:      dark ? "#334155" : "#e2e8f0",
  borderLight: dark ? "#1e293b" : "#f1f5f9",
  text:        dark ? "#f1f5f9" : "#1e293b",
  textSub:     dark ? "#94a3b8" : "#64748b",
  textHint:    dark ? "#475569" : "#94a3b8",
  topBar:      dark ? "#020617" : "#0f172a",
  topBarSub:   dark ? "#0a0f1e" : "#1e293b",
  inputBg:     dark ? "#0f172a" : "#ffffff",
  inputBorder: dark ? "#334155" : "#e2e8f0",
  modalBg:     dark ? "#1e293b" : "#ffffff",
});
const useTheme = () => useContext(ThemeCtx);

// ─── TOAST ────────────────────────────────────────────────────────────────────

const ToastCtx = createContext(null);
const useToast = () => useContext(ToastCtx);

function ToastContainer({ toasts }) {
  return (
    <div style={{ position:"fixed", bottom:20, right:20, zIndex:9999, display:"flex", flexDirection:"column", gap:8, pointerEvents:"none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type==="error"?"#dc2626":t.type==="warn"?"#d97706":t.type==="info"?"#2563eb":"#059669",
          color:"#fff", padding:"0.625rem 1rem", borderRadius:"0.75rem", fontSize:"0.8rem", fontWeight:600,
          boxShadow:"0 4px 20px rgba(0,0,0,0.3)", minWidth:220, animation:"slideIn 0.2s ease",
          display:"flex", alignItems:"center", gap:8
        }}>
          {t.type==="error"?"✗":t.type==="warn"?"⚠":t.type==="info"?"ℹ":"✓"} {t.msg}
        </div>
      ))}
      <style>{`@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}} @keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}

// ─── LOCAL STORAGE FALLBACK ───────────────────────────────────────────────────

const storage = {
  get: (k) => { try{ const v=localStorage.getItem(k); return v?JSON.parse(v):null; }catch{return null;} },
  set: (k,v) => { try{ localStorage.setItem(k,JSON.stringify(v)); }catch{} },
  del: (k) => { try{ localStorage.removeItem(k); }catch{} },
};

// ─── AI ───────────────────────────────────────────────────────────────────────

async function callAI(base64, catName, hint) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{ "Content-Type":"application/json","x-api-key":ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-ipc":"true" },
    body: JSON.stringify({
      model:"claude-sonnet-4-20250514", max_tokens:900,
      messages:[{ role:"user", content:[
        { type:"image", source:{ type:"base64", media_type:"image/jpeg", data:base64 } },
        { type:"text", text:`Eres un experto inspector de sitios de telecomunicaciones.\nAnaliza esta fotografía para la categoría: "${catName}".\nCriterio: ${hint}\n\nResponde ÚNICAMENTE con JSON:\n{"estado":"APROBADA"|"OBSERVACION"|"RECHAZADA","puntaje":1-10,"resumen":"máximo 15 palabras","criterios":{"encuadre":true/false,"nitidez":true/false,"iluminacion":true/false,"contenido_correcto":true/false},"observaciones":["obs1"],"sugerencias":["sug1"]}` }
      ]}]
    })
  });
  if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e?.error?.message||`Error API: ${res.status}`); }
  const d = await res.json();
  return JSON.parse(d.content[0].text.replace(/```json|```/g,"").trim());
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const getPhotoStatus = (p) => { if(!p)return"VACIO"; if(p.validation)return p.validation.estado; return"PENDIENTE"; };
const statusColors = {
  APROBADA:   {border:"#6ee7b7",bg:"#f0fdf4",badge:"#dcfce7",badgeText:"#15803d"},
  OBSERVACION:{border:"#fcd34d",bg:"#fffbeb",badge:"#fef9c3",badgeText:"#92400e"},
  RECHAZADA:  {border:"#fca5a5",bg:"#fef2f2",badge:"#fee2e2",badgeText:"#dc2626"},
  PENDIENTE:  {border:"#93c5fd",bg:"#eff6ff",badge:"#dbeafe",badgeText:"#1d4ed8"},
  VACIO:      {border:"#e2e8f0",bg:"#fff",   badge:"#f1f5f9",badgeText:"#64748b"},
};
const fmtTime=(s)=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

// ─── FIREBASE HELPERS ─────────────────────────────────────────────────────────

const saveInspectionToFirebase = async (userId, wo, photos, risks, signature, companyLogo) => {
  try {
    const inspRef = doc(db, "inspections", `${userId}_${wo.numero}`);
    const photosData = {};
    Object.entries(photos).forEach(([k,p]) => {
      photosData[k] = {
        dataUrl: p.dataUrl,
        validation: p.validation || null,
        timestamp: p.timestamp,
        notes: p.notes || "",
        gps: p.gps || null,
      };
    });
    await setDoc(inspRef, {
      userId, wo, photos: photosData,
      risks: risks || [],
      signature: signature || null,
      companyLogo: companyLogo || null,
      progress: Math.round((Object.keys(photos).length / CATS.length) * 100),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch(e) { console.error(e); return false; }
};

const loadInspectionFromFirebase = async (userId, woNumero) => {
  try {
    const inspRef = doc(db, "inspections", `${userId}_${woNumero}`);
    const snap = await getDoc(inspRef);
    if (snap.exists()) return snap.data();
    return null;
  } catch(e) { return null; }
};

// ─── EXCEL EXPORT ─────────────────────────────────────────────────────────────

function generateExcel(photos, user, wo, risks) {
  const wb = XLSX.utils.book_new();
  const wP=Object.keys(photos).length;
  const ws1=XLSX.utils.aoa_to_sheet([
    ["FIELD INSPECTOR PRO - REPORTE"],[],
    ["WO",wo.numero],["Fecha",wo.fecha],["Sitio",wo.sitio],
    ["Inspector",user?.displayName||user?.email],["Progreso",`${Math.round((wP/CATS.length)*100)}%`],[],
    ["Generado",new Date().toLocaleString("es-CO")],
  ]);
  XLSX.utils.book_append_sheet(wb,ws1,"Resumen");
  const h2=["#","Categoría","Estado","Puntaje","Resumen","Notas","GPS","Observaciones","Fecha"];
  const rows=CATS.map(cat=>{
    const p=photos[cat.id],v=p?.validation,st=!p?"SIN FOTO":v?v.estado:"PENDIENTE";
    return [cat.id,cat.name,st,v?.puntaje??"-",v?.resumen??"-",p?.notes||"-",p?.gps?`${p.gps.lat.toFixed(5)},${p.gps.lng.toFixed(5)}`:"-",v?.observaciones?.join(" | ")??"-",p?new Date(p.timestamp).toLocaleString("es-CO"):"-"];
  });
  const ws2=XLSX.utils.aoa_to_sheet([h2,...rows]);
  XLSX.utils.book_append_sheet(wb,ws2,"Detalle");
  if(risks?.length>0){
    const ws3=XLSX.utils.aoa_to_sheet([["#","Descripción","Nivel","Fecha"],...risks.map((r,i)=>[i+1,r.description,r.level,new Date(r.timestamp).toLocaleString("es-CO")])]);
    XLSX.utils.book_append_sheet(wb,ws3,"Riesgos");
  }
  XLSX.writeFile(wb,`Reporte_${wo.numero}_${new Date().toISOString().split("T")[0]}.xlsx`);
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

async function generatePDF(photos, user, wo, signature, companyLogo, risks) {
  const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
  const W=210,H=297,m=15;
  const sf=(r,g,b)=>doc.setFillColor(r,g,b);
  const sc=(r,g,b)=>doc.setTextColor(r,g,b);
  const wP=Object.keys(photos).length;
  const ap=Object.values(photos).filter(p=>p.validation?.estado==="APROBADA").length;
  const ob=Object.values(photos).filter(p=>p.validation?.estado==="OBSERVACION").length;
  const re=Object.values(photos).filter(p=>p.validation?.estado==="RECHAZADA").length;
  const pct=Math.round((wP/CATS.length)*100);
  const inspName = user?.displayName || user?.email || "Inspector";

  sf(15,23,42); doc.rect(0,0,W,62,"F");
  sf(37,99,235); doc.rect(0,60,W,3,"F");

  if(companyLogo){try{const fmt=companyLogo.startsWith("data:image/png")?"PNG":"JPEG";sf(255,255,255);doc.roundedRect(W-m-50,2,48,32,3,3,"F");doc.addImage(companyLogo,fmt,W-m-48,4,44,28);}catch(e){}}

  sc(255,255,255);
  doc.setFont("helvetica","bold"); doc.setFontSize(22); doc.text("REPORTE FOTOGRÁFICO",m,28);
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.text("Inspección de Sitio · Telecomunicaciones",m,37);
  doc.setFontSize(7.5); doc.text(`Generado: ${new Date().toLocaleString("es-CO")}  ·  Inspector: ${inspName}`,m,46);

  const badges=[{label:"Fotos",val:`${wP}/${CATS.length}`,c:[37,99,235]},{label:"Aprobadas",val:String(ap),c:[5,150,105]},{label:"Observación",val:String(ob),c:[217,119,6]},{label:"Rechazadas",val:String(re),c:[220,38,38]},{label:"Progreso",val:`${pct}%`,c:[100,116,135]}];
  let bx=m;
  badges.forEach(b=>{sf(...b.c);doc.roundedRect(bx,70,33,16,2,2,"F");sc(255,255,255);doc.setFontSize(13);doc.setFont("helvetica","bold");doc.text(b.val,bx+16.5,79,{align:"center"});doc.setFontSize(7);doc.setFont("helvetica","normal");doc.text(b.label,bx+16.5,84,{align:"center"});bx+=36;});

  let y=98;
  sf(241,245,249); doc.rect(m,y,W-m*2,28,"F"); sf(37,99,235); doc.rect(m,y,0.8,28,"F");
  sc(37,99,235); doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.text("ORDEN DE TRABAJO",m+4,y+8);
  [["WO:",wo.numero],["Fecha:",wo.fecha],["Tipo:",wo.tipo],["Proyecto:",wo.proyecto],["Sitio:",wo.sitio],["Inspector:",inspName]].forEach((f,i)=>{
    const col=i%2===0?m+4:m+95,row=y+16+Math.floor(i/2)*6;
    sc(15,23,42); doc.setFont("helvetica","bold"); doc.text(f[0],col,row); doc.setFont("helvetica","normal"); doc.text(f[1]||"-",col+24,row);
  });

  y=134;
  sc(100,116,135); doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.text(`PROGRESO GENERAL: ${pct}%`,m,y);
  sf(226,232,240); doc.roundedRect(m,y+3,W-m*2,5,2,2,"F");
  sf(...(pct===100?[5,150,105]:[37,99,235])); doc.roundedRect(m,y+3,Math.max(4,(W-m*2)*pct/100),5,2,2,"F");

  y=148;
  sc(15,23,42); doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.text("DETALLE POR CATEGORÍA",m,y);
  sf(37,99,235); doc.rect(m,y+2,W-m*2,0.5,"F"); y+=9;

  for(const cat of CATS){
    const photo=photos[cat.id],val=photo?.validation;
    const status=!photo?"SIN FOTO":val?val.estado:"PENDIENTE";
    const sc2=status==="APROBADA"?[5,150,105]:status==="RECHAZADA"?[220,38,38]:status==="OBSERVACION"?[217,119,6]:status==="PENDIENTE"?[37,99,235]:[100,116,135];
    const extraH=(photo?.notes?8:0)+(photo?.gps?6:0);
    const rowH=photo?52+extraH:22;
    if(y+rowH>H-18){doc.addPage();y=m;}
    sf(241,245,249); doc.roundedRect(m,y,W-m*2,rowH-2,2,2,"F");
    sf(...sc2); doc.roundedRect(W-m-30,y+3,29,8,2,2,"F");
    sc(255,255,255); doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.text(status,W-m-15.5,y+8.5,{align:"center"});
    sc(...sc2); doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.text(String(cat.id).padStart(2,"0"),m+3,y+9);
    sc(15,23,42); doc.text(cat.name,m+12,y+9);
    if(photo){
      try{doc.addImage(photo.dataUrl,"JPEG",m+3,y+12,40,32);}catch(e){}
      if(val){
        const tx=m+48;
        sc(...sc2); doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.text(`Puntaje: ${val.puntaje}/10`,tx,y+18);
        sc(15,23,42); doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.text(doc.splitTextToSize(`"${val.resumen}"`,100),tx,y+25);
        if(val.criterios){let cx=tx,cy=y+34;Object.entries(val.criterios).forEach(([k,v])=>{sc(...(v?[5,150,105]:[220,38,38]));doc.setFontSize(7);doc.text(`${v?"✓":"✗"} ${k.replace(/_/g," ")}`,cx,cy);cx+=38;if(cx>W-m-20){cx=tx;cy+=5;}});}
        if(val.observaciones?.length>0){sc(217,119,6);doc.setFont("helvetica","bold");doc.setFontSize(7);doc.text("Obs:",tx,y+46);sc(15,23,42);doc.setFont("helvetica","normal");doc.text((val.observaciones[0]||"").substring(0,90),tx+8,y+46);}
      }else{sc(100,116,135);doc.setFontSize(7.5);doc.setFont("helvetica","italic");doc.text("Foto cargada — pendiente de validación",m+48,y+25);}
      let ey=y+48;
      if(photo.notes){sc(37,99,235);doc.setFont("helvetica","bold");doc.setFontSize(6.5);doc.text("Nota:",m+3,ey);sc(15,23,42);doc.setFont("helvetica","normal");doc.text(photo.notes.substring(0,120),m+16,ey);ey+=6;}
      if(photo.gps){sc(5,150,105);doc.setFont("helvetica","bold");doc.setFontSize(6.5);doc.text("GPS:",m+3,ey);sc(15,23,42);doc.setFont("helvetica","normal");doc.text(`${photo.gps.lat.toFixed(6)}, ${photo.gps.lng.toFixed(6)}`,m+14,ey);}
      sc(100,116,135);doc.setFontSize(6.5);doc.setFont("helvetica","normal");doc.text(new Date(photo.timestamp).toLocaleString("es-CO"),m+48,y+46+extraH);
    }
    y+=rowH;
  }

  if(risks?.length>0){
    if(y+20>H-18){doc.addPage();y=m;}
    y+=4; sc(15,23,42); doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.text("RIESGOS Y HALLAZGOS",m,y);
    sf(220,38,38); doc.rect(m,y+2,W-m*2,0.5,"F"); y+=9;
    for(const risk of risks){
      const lC=risk.level==="ALTO"?[220,38,38]:risk.level==="MEDIO"?[217,119,6]:[5,150,105];
      const rH=18; if(y+rH>H-18){doc.addPage();y=m;}
      sf(241,245,249); doc.roundedRect(m,y,W-m*2,rH-2,2,2,"F");
      sf(...lC); doc.roundedRect(m,y,0.8,rH-2,0,0,"F"); doc.roundedRect(W-m-22,y+3,21,8,2,2,"F");
      sc(255,255,255); doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.text(risk.level,W-m-11.5,y+8.5,{align:"center"});
      sc(15,23,42); doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.text(doc.splitTextToSize(risk.description||"-",155),m+6,y+10);
      y+=rH;
    }
  }

  if(signature){
    if(y+44>H-18){doc.addPage();y=m;}
    sf(241,245,249); doc.rect(m,y,W-m*2,40,"F"); sf(37,99,235); doc.rect(m,y,0.8,40,"F");
    sc(37,99,235); doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.text("FIRMA DEL INSPECTOR",m+4,y+8);
    try{doc.addImage(signature,"PNG",m+4,y+11,64,20);}catch(e){}
    sc(15,23,42); doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.text(inspName,m+4,y+34);
  }

  const np=doc.getNumberOfPages();
  for(let i=1;i<=np;i++){
    doc.setPage(i); sf(15,23,42); doc.rect(0,H-12,W,12,"F");
    sc(255,255,255); doc.setFontSize(7); doc.setFont("helvetica","normal");
    doc.text(`Field Inspector Pro · ${wo.numero} · ${inspName}`,m,H-5);
    doc.text(`Pág. ${i} / ${np}`,W-m,H-5,{align:"right"});
  }
  doc.save(`Reporte_${wo.numero}_${new Date().toISOString().split("T")[0]}.pdf`);
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

function Login() {
  const toast=useToast();
  const [form,setForm]=useState({email:"",password:"",err:"",loading:false});

  const submit=async()=>{
    if(form.loading)return;
    setForm(f=>({...f,loading:true,err:""}));
    try{
      await signInWithEmailAndPassword(auth,form.email,form.password);
      toast("Bienvenido 👋");
    }catch(e){
      setForm(f=>({...f,err:"Usuario o contraseña incorrectos",loading:false}));
    }
  };

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <div style={{background:"#fff",borderRadius:"1.5rem",boxShadow:"0 25px 60px rgba(0,0,0,0.4)",width:"100%",maxWidth:"380px",overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,#1e40af,#3b82f6)",padding:"2rem",textAlign:"center"}}>
          <div style={{width:60,height:60,background:"rgba(255,255,255,0.2)",borderRadius:"1rem",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1rem"}}><Shield size={30} color="#fff"/></div>
          <h1 style={{color:"#fff",fontSize:"1.5rem",fontWeight:800,margin:0}}>Field Inspector Pro</h1>
          <p style={{color:"rgba(255,255,255,0.75)",fontSize:"0.8rem",margin:"0.4rem 0 0"}}>Reporte Fotográfico · Telecomunicaciones</p>
        </div>
        <div style={{padding:"2rem"}}>
          <div style={{marginBottom:"1rem"}}>
            <label style={{display:"block",fontSize:"0.7rem",fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.4rem"}}>Correo</label>
            <input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value,err:""}))} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="correo@empresa.com" style={{width:"100%",padding:"0.75rem 1rem",border:"1.5px solid #e2e8f0",borderRadius:"0.75rem",fontSize:"0.95rem",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div style={{marginBottom:"1.25rem"}}>
            <label style={{display:"block",fontSize:"0.7rem",fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.4rem"}}>Contraseña</label>
            <input type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value,err:""}))} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="••••••••" style={{width:"100%",padding:"0.75rem 1rem",border:"1.5px solid #e2e8f0",borderRadius:"0.75rem",fontSize:"0.95rem",outline:"none",boxSizing:"border-box"}}/>
          </div>
          {form.err&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"0.5rem",padding:"0.6rem 0.875rem",marginBottom:"1rem",display:"flex",alignItems:"center",gap:6}}><AlertTriangle size={14} color="#ef4444"/><span style={{fontSize:"0.8rem",color:"#dc2626"}}>{form.err}</span></div>}
          <button onClick={submit} style={{width:"100%",padding:"0.875rem",background:form.loading?"#93c5fd":"#2563eb",color:"#fff",border:"none",borderRadius:"0.75rem",fontSize:"0.95rem",fontWeight:700,cursor:"pointer"}}>{form.loading?"Verificando...":"Ingresar →"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ─────────────────────────────────────────────────────────────

function AdminPanel({ onClose }) {
  const {T}=useTheme();
  const toast=useToast();
  const [inspections,setInspections]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("inspections");
  const [newUser,setNewUser]=useState({email:"",password:"",name:"",role:"Inspector RF"});
  const [creatingUser,setCreatingUser]=useState(false);

  useEffect(()=>{
    const q=query(collection(db,"inspections"),orderBy("updatedAt","desc"));
    const unsub=onSnapshot(q,(snap)=>{
      setInspections(snap.docs.map(d=>({id:d.id,...d.data()})));
      setLoading(false);
    });
    return unsub;
  },[]);

  const createUser=async()=>{
    if(!newUser.email||!newUser.password||!newUser.name){toast("Completa todos los campos","warn");return;}
    setCreatingUser(true);
    try{
      const cred=await createUserWithEmailAndPassword(auth,newUser.email,newUser.password);
      await updateProfile(cred.user,{displayName:newUser.name});
      await setDoc(doc(db,"users",cred.user.uid),{name:newUser.name,email:newUser.email,role:newUser.role,createdAt:serverTimestamp()});
      toast(`Usuario ${newUser.name} creado ✓`);
      setNewUser({email:"",password:"",name:"",role:"Inspector RF"});
    }catch(e){toast("Error: "+e.message,"error");}
    setCreatingUser(false);
  };

  const lC={ALTO:"#dc2626",MEDIO:"#d97706",BAJO:"#059669"};

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:50,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"1rem",overflowY:"auto"}}>
      <div style={{background:T.modalBg,borderRadius:"1.25rem",width:"100%",maxWidth:700,marginTop:"1rem",marginBottom:"1rem",overflow:"hidden",boxShadow:"0 30px 80px rgba(0,0,0,0.4)"}}>
        <div style={{background:"#0f172a",padding:"1rem 1.25rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><Activity size={18} color="#93c5fd"/><span style={{color:"#fff",fontWeight:800,fontSize:"0.95rem"}}>Panel de Administrador</span></div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:"1.2rem"}}>×</button>
        </div>

        <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,background:T.surface}}>
          {[{id:"inspections",label:"📋 Inspecciones"},{id:"users",label:"👥 Crear Usuario"}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"0.75rem 1.25rem",background:"none",border:"none",borderBottom:`2px solid ${tab===t.id?"#3b82f6":"transparent"}`,color:tab===t.id?"#2563eb":T.textSub,fontWeight:tab===t.id?700:500,fontSize:"0.82rem",cursor:"pointer"}}>{t.label}</button>
          ))}
        </div>

        <div style={{padding:"1.25rem",maxHeight:"70vh",overflowY:"auto"}}>
          {tab==="inspections"&&(
            <>
              <p style={{fontSize:"0.72rem",fontWeight:700,color:T.textSub,textTransform:"uppercase",margin:"0 0 0.875rem"}}>{inspections.length} inspecciones en la base de datos</p>
              {loading&&<p style={{color:T.textSub,textAlign:"center",padding:"2rem"}}>Cargando...</p>}
              {inspections.map(insp=>{
                const wP=Object.keys(insp.photos||{}).length;
                const ap=Object.values(insp.photos||{}).filter(p=>p.validation?.estado==="APROBADA").length;
                const risks=(insp.risks||[]).length;
                return(
                  <div key={insp.id} style={{background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:"0.875rem",padding:"0.875rem",marginBottom:"0.625rem"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.5rem"}}>
                      <div>
                        <p style={{fontWeight:700,fontSize:"0.9rem",color:T.text,margin:0}}>{insp.wo?.numero||"Sin WO"}</p>
                        <p style={{fontSize:"0.72rem",color:T.textSub,margin:"0.15rem 0 0"}}>{insp.wo?.sitio} · {insp.wo?.proyecto}</p>
                      </div>
                      <span style={{fontSize:"0.68rem",fontWeight:800,padding:"3px 10px",borderRadius:999,background:insp.progress===100?"#dcfce7":"#dbeafe",color:insp.progress===100?"#15803d":"#1d4ed8"}}>{insp.progress||0}%</span>
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {[["Fotos",wP],["Aprobadas",ap],["Riesgos",risks]].map(([l,v])=>(
                        <span key={l} style={{fontSize:"0.65rem",fontWeight:700,padding:"2px 8px",borderRadius:999,background:T.surface,color:T.textSub,border:`1px solid ${T.border}`}}>{l}: {v}</span>
                      ))}
                      {insp.updatedAt?.seconds&&<span style={{fontSize:"0.65rem",color:T.textHint,marginLeft:"auto"}}>{new Date(insp.updatedAt.seconds*1000).toLocaleString("es-CO")}</span>}
                    </div>
                    {(insp.risks||[]).length>0&&(
                      <div style={{marginTop:"0.5rem",display:"flex",gap:6,flexWrap:"wrap"}}>
                        {(insp.risks||[]).map((r,i)=><span key={i} style={{fontSize:"0.62rem",fontWeight:700,padding:"1px 7px",borderRadius:999,background:lC[r.level]+"20",color:lC[r.level],border:`1px solid ${lC[r.level]}40`}}>{r.level}</span>)}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {tab==="users"&&(
            <div>
              <p style={{fontSize:"0.72rem",fontWeight:700,color:T.textSub,textTransform:"uppercase",margin:"0 0 1rem"}}>Crear nuevo inspector</p>
              {[{label:"Nombre completo *",key:"name",ph:"Ej: Ing. García",type:"text"},{label:"Correo electrónico *",key:"email",ph:"garcia@empresa.com",type:"email"},{label:"Contraseña *",key:"password",ph:"Mínimo 6 caracteres",type:"password"}].map(f=>(
                <div key={f.key} style={{marginBottom:"0.75rem"}}>
                  <label style={{display:"block",fontSize:"0.68rem",fontWeight:700,color:T.textSub,textTransform:"uppercase",marginBottom:"0.3rem"}}>{f.label}</label>
                  <input type={f.type} value={newUser[f.key]} onChange={e=>setNewUser(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={{width:"100%",padding:"0.6rem 0.875rem",border:`1.5px solid ${T.inputBorder}`,borderRadius:"0.625rem",fontSize:"0.88rem",outline:"none",boxSizing:"border-box",background:T.inputBg,color:T.text}}/>
                </div>
              ))}
              <div style={{marginBottom:"1.25rem"}}>
                <label style={{display:"block",fontSize:"0.68rem",fontWeight:700,color:T.textSub,textTransform:"uppercase",marginBottom:"0.3rem"}}>Rol</label>
                <select value={newUser.role} onChange={e=>setNewUser(p=>({...p,role:e.target.value}))} style={{width:"100%",padding:"0.6rem 0.875rem",border:`1.5px solid ${T.inputBorder}`,borderRadius:"0.625rem",fontSize:"0.88rem",outline:"none",background:T.inputBg,color:T.text}}>
                  {["Inspector RF","Supervisor","QA","Técnico"].map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <button onClick={createUser} disabled={creatingUser} style={{width:"100%",padding:"0.75rem",background:creatingUser?"#93c5fd":"#2563eb",color:"#fff",border:"none",borderRadius:"0.75rem",fontWeight:700,cursor:"pointer"}}>
                {creatingUser?"Creando...":"Crear Inspector"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CATEGORY CARD ────────────────────────────────────────────────────────────

function CatCard({ cat, photo, onClick }) {
  const status=getPhotoStatus(photo),c=statusColors[status];
  return(
    <div onClick={onClick} style={{cursor:"pointer",borderRadius:"0.875rem",border:`2px solid ${c.border}`,background:c.bg,padding:"0.875rem",transition:"all 0.2s"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 20px rgba(0,0,0,0.1)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.5rem"}}>
        <span style={{fontSize:"1.5rem"}}>{cat.icon}</span>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
          <span style={{fontSize:"0.62rem",fontWeight:800,padding:"2px 8px",borderRadius:"999px",background:c.badge,color:c.badgeText}}>{status==="VACIO"?"SIN FOTO":status}</span>
          {photo?.gps&&<span style={{fontSize:"0.55rem",color:"#059669",fontWeight:600}}>📍</span>}
          {photo?.notes&&<span style={{fontSize:"0.55rem",color:"#2563eb",fontWeight:600}}>📝</span>}
        </div>
      </div>
      {photo&&<div style={{borderRadius:"0.5rem",overflow:"hidden",height:72,marginBottom:"0.5rem",background:"#f1f5f9"}}><img src={photo.dataUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>}
      <p style={{fontSize:"0.78rem",fontWeight:700,color:"#1e293b",lineHeight:1.35,margin:0}}>{cat.name}</p>
      {photo?.validation&&<p style={{fontSize:"0.68rem",color:"#64748b",margin:"0.2rem 0 0"}}>Puntaje: <strong>{photo.validation.puntaje}/10</strong></p>}
      <p style={{fontSize:"0.65rem",color:"#94a3b8",margin:"0.15rem 0 0"}}>Categoría #{cat.id}</p>
    </div>
  );
}

// ─── CATEGORY MODAL ───────────────────────────────────────────────────────────

function CatModal({ cat, photo, onUpload, onValidate, onManualValidate, onDelete, onClose, onSaveNote, validating, offlineMode }) {
  const {T}=useTheme(), toast=useToast();
  const fileRef=useRef(), val=photo?.validation;
  const [zoom,setZoom]=useState(false), [showManual,setShowManual]=useState(false);
  const [note,setNote]=useState(photo?.notes||"");

  const dlPhoto=()=>{if(!photo)return;const a=document.createElement("a");a.href=photo.dataUrl;a.download=`${String(cat.id).padStart(2,"0")}_${cat.name.replace(/\s+/g,"_")}.jpg`;a.click();toast("Foto descargada");};

  const Btn=({color,disabled,onClick,icon,label})=>(
    <button onClick={disabled?undefined:onClick} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,padding:"0.75rem 0.5rem",background:disabled?"#f1f5f9":color,color:disabled?"#94a3b8":"#fff",border:"none",borderRadius:"0.75rem",fontSize:"0.72rem",fontWeight:700,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.6:1}}>
      {icon}{label}
    </button>
  );

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:50,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"1rem",overflowY:"auto"}}>
      <div style={{background:T.modalBg,borderRadius:"1.25rem",width:"100%",maxWidth:520,marginTop:"1rem",marginBottom:"1rem",overflow:"hidden",boxShadow:"0 30px 80px rgba(0,0,0,0.4)"}}>
        <div style={{background:"#0f172a",padding:"1rem 1.25rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:"1.5rem"}}>{cat.icon}</span>
            <div><p style={{color:"#fff",fontWeight:800,margin:0,fontSize:"0.95rem"}}>{cat.name}</p><p style={{color:"#94a3b8",margin:0,fontSize:"0.7rem"}}>Categoría #{cat.id}</p></div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:"1.3rem"}}>×</button>
        </div>
        <div style={{background:"#eff6ff",borderBottom:"1px solid #bfdbfe",padding:"0.6rem 1.25rem",display:"flex",gap:8}}>
          <ClipboardList size={14} color="#3b82f6" style={{flexShrink:0,marginTop:1}}/>
          <p style={{fontSize:"0.75rem",color:"#1d4ed8",margin:0}}><strong>Criterio:</strong> {cat.hint}</p>
        </div>
        <div style={{padding:"1.25rem"}}>
          {photo?(
            <div style={{marginBottom:"1rem",position:"relative"}}>
              <img src={photo.dataUrl} alt="" onClick={()=>setZoom(true)} style={{width:"100%",borderRadius:"0.75rem",objectFit:"contain",maxHeight:240,background:"#f8fafc",cursor:"zoom-in"}}/>
              {photo.gps&&<div style={{position:"absolute",top:8,left:8}}><span style={{background:"rgba(5,150,105,0.85)",color:"#fff",fontSize:"0.6rem",fontWeight:700,padding:"2px 7px",borderRadius:999}}>📍 {photo.gps.lat.toFixed(4)}, {photo.gps.lng.toFixed(4)}</span></div>}
              <div style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.5)",borderRadius:"0.5rem",padding:"3px 8px"}}><span style={{fontSize:"0.65rem",color:"#fff",fontWeight:600}}>{new Date(photo.timestamp).toLocaleString("es-CO",{dateStyle:"short",timeStyle:"short"})}</span></div>
            </div>
          ):(
            <div onClick={()=>fileRef.current.click()} style={{border:"2px dashed #cbd5e1",borderRadius:"0.75rem",height:160,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#94a3b8",marginBottom:"1rem",cursor:"pointer"}}>
              <Camera size={36} style={{marginBottom:8}}/><p style={{fontSize:"0.85rem",fontWeight:600,margin:0}}>Toca para agregar foto</p>
            </div>
          )}
          <div style={{display:"flex",gap:8,marginBottom:"1rem"}}>
            <Btn color="#2563eb" onClick={()=>fileRef.current.click()} icon={<Camera size={18}/>} label="Capturar"/>
            <Btn color={offlineMode?"#334155":"#7c3aed"} disabled={!photo||(!offlineMode&&validating)} onClick={offlineMode?()=>setShowManual(true):onValidate}
              icon={offlineMode?<Sliders size={18}/>:(validating?<RefreshCw size={18} style={{animation:"spin 1s linear infinite"}}/>:<Eye size={18}/>)}
              label={offlineMode?"Manual":(validating?"Validando…":"Validar IA")}/>
            <Btn color="#059669" disabled={!photo} onClick={dlPhoto} icon={<Download size={18}/>} label="Descargar"/>
            <Btn color="#dc2626" disabled={!photo} onClick={onDelete} icon={<Trash2 size={18}/>} label="Eliminar"/>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={onUpload}/>
          <div style={{marginBottom:"1rem"}}>
            <label style={{fontSize:"0.68rem",fontWeight:700,color:T.textSub,textTransform:"uppercase",display:"block",marginBottom:"0.3rem"}}>📝 Notas de campo</label>
            <div style={{display:"flex",gap:6}}>
              <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Observaciones adicionales…" rows={2} style={{flex:1,padding:"0.5rem 0.75rem",border:`1.5px solid ${T.inputBorder}`,borderRadius:"0.625rem",fontSize:"0.8rem",outline:"none",resize:"vertical",fontFamily:"inherit",background:T.inputBg,color:T.text}}/>
              <button onClick={()=>{onSaveNote(note);toast("Nota guardada");}} style={{padding:"0.5rem 0.75rem",background:"#2563eb",color:"#fff",border:"none",borderRadius:"0.625rem",cursor:"pointer",fontSize:"0.72rem",fontWeight:700,flexShrink:0}}>Guardar</button>
            </div>
          </div>
          {showManual&&<ManualValidationForm onSave={r=>{onManualValidate(r);setShowManual(false);toast("Validación manual guardada");}} onCancel={()=>setShowManual(false)}/>}
          {val&&!showManual&&(()=>{
            const c=statusColors[val.estado]||statusColors.PENDIENTE;
            return(
              <div style={{borderRadius:"0.875rem",border:`2px solid ${c.border}`,background:c.bg,padding:"1rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {val.estado==="APROBADA"?<CheckCircle size={20} color="#16a34a"/>:val.estado==="RECHAZADA"?<XCircle size={20} color="#dc2626"/>:<AlertCircle size={20} color="#d97706"/>}
                    <span style={{fontWeight:800,fontSize:"0.9rem",color:val.estado==="APROBADA"?"#15803d":val.estado==="RECHAZADA"?"#dc2626":"#92400e"}}>{val.estado}</span>
                  </div>
                  <div><span style={{fontSize:"1.5rem",fontWeight:900,color:"#0f172a"}}>{val.puntaje}</span><span style={{fontSize:"0.75rem",color:"#64748b"}}>/10</span></div>
                </div>
                <p style={{fontSize:"0.82rem",color:"#475569",fontStyle:"italic",margin:"0 0 0.75rem"}}>"{val.resumen}"</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {Object.entries(val.criterios||{}).map(([k,v])=>(
                    <div key={k} style={{display:"flex",alignItems:"center",gap:5,fontSize:"0.75rem",color:"#475569"}}>
                      {v?<CheckCircle size={13} color="#16a34a"/>:<XCircle size={13} color="#dc2626"/>}
                      <span style={{textTransform:"capitalize"}}>{k.replace(/_/g," ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      {zoom&&photo&&<div onClick={()=>setZoom(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",cursor:"zoom-out"}}><img src={photo.dataUrl} alt="" style={{maxWidth:"95vw",maxHeight:"95vh",objectFit:"contain",borderRadius:"0.75rem"}}/></div>}
    </div>
  );
}

// ─── MANUAL VALIDATION ────────────────────────────────────────────────────────

function ManualValidationForm({ onSave, onCancel }) {
  const {T}=useTheme();
  const [f,setF]=useState({estado:"APROBADA",puntaje:7,resumen:"",criterios:{encuadre:true,nitidez:true,iluminacion:true,contenido_correcto:true},observaciones:"",sugerencias:""});
  const save=()=>{if(!f.resumen.trim()){alert("Escribe un resumen.");return;}onSave({estado:f.estado,puntaje:f.puntaje,resumen:f.resumen,criterios:f.criterios,observaciones:f.observaciones?[f.observaciones]:[],sugerencias:f.sugerencias?[f.sugerencias]:[]});};
  const ec={APROBADA:"#059669",OBSERVACION:"#d97706",RECHAZADA:"#dc2626"};
  return(
    <div style={{marginTop:"1rem",border:`2px solid ${T.border}`,borderRadius:"0.875rem",padding:"1rem",background:T.surfaceAlt}}>
      <p style={{fontSize:"0.7rem",fontWeight:800,color:T.textSub,textTransform:"uppercase",margin:"0 0 0.875rem",display:"flex",alignItems:"center",gap:6}}><Sliders size={13}/> Validación Manual</p>
      <div style={{marginBottom:"0.75rem"}}>
        <label style={{fontSize:"0.68rem",fontWeight:700,color:T.textSub,textTransform:"uppercase",display:"block",marginBottom:"0.3rem"}}>Estado</label>
        <div style={{display:"flex",gap:6}}>{["APROBADA","OBSERVACION","RECHAZADA"].map(e=><button key={e} onClick={()=>setF(p=>({...p,estado:e}))} style={{flex:1,padding:"0.45rem",border:`2px solid ${f.estado===e?ec[e]:"#e2e8f0"}`,background:f.estado===e?ec[e]:"#fff",color:f.estado===e?"#fff":"#64748b",borderRadius:"0.5rem",fontWeight:700,fontSize:"0.65rem",cursor:"pointer"}}>{e}</button>)}</div>
      </div>
      <div style={{marginBottom:"0.75rem"}}>
        <label style={{fontSize:"0.68rem",fontWeight:700,color:T.textSub,textTransform:"uppercase",display:"block",marginBottom:"0.3rem"}}>Puntaje: {f.puntaje}/10</label>
        <input type="range" min={1} max={10} value={f.puntaje} onChange={e=>setF(p=>({...p,puntaje:Number(e.target.value)}))} style={{width:"100%",accentColor:"#3b82f6"}}/>
      </div>
      <div style={{marginBottom:"0.75rem"}}>
        <label style={{fontSize:"0.68rem",fontWeight:700,color:T.textSub,textTransform:"uppercase",display:"block",marginBottom:"0.3rem"}}>Resumen *</label>
        <input value={f.resumen} onChange={e=>setF(p=>({...p,resumen:e.target.value}))} placeholder="Describe brevemente la foto" style={{width:"100%",padding:"0.5rem 0.75rem",border:`1.5px solid ${T.inputBorder}`,borderRadius:"0.5rem",fontSize:"0.8rem",outline:"none",boxSizing:"border-box",background:T.inputBg,color:T.text}}/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={onCancel} style={{flex:1,padding:"0.625rem",background:"#f1f5f9",border:"none",borderRadius:"0.625rem",fontWeight:700,cursor:"pointer",color:"#64748b"}}>Cancelar</button>
        <button onClick={save} style={{flex:1,padding:"0.625rem",background:"#059669",color:"#fff",border:"none",borderRadius:"0.625rem",fontWeight:700,cursor:"pointer"}}>Guardar</button>
      </div>
    </div>
  );
}

// ─── RISKS SECTION ────────────────────────────────────────────────────────────

function RisksSection({ risks, onAdd, onDelete }) {
  const {T}=useTheme(), toast=useToast();
  const fileRef=useRef();
  const [form,setForm]=useState({description:"",level:"ALTO",dataUrl:null}), [show,setShow]=useState(false);
  const handleFile=(e)=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=(ev)=>setForm(p=>({...p,dataUrl:ev.target.result}));r.readAsDataURL(file);e.target.value="";};
  const save=()=>{if(!form.description.trim()){toast("Describe el hallazgo","warn");return;}onAdd({id:Date.now(),description:form.description,level:form.level,dataUrl:form.dataUrl,timestamp:new Date().toISOString()});setForm({description:"",level:"ALTO",dataUrl:null});setShow(false);toast("Hallazgo registrado");};
  const lC={ALTO:"#dc2626",MEDIO:"#d97706",BAJO:"#059669"},lB={ALTO:"#fef2f2",MEDIO:"#fffbeb",BAJO:"#f0fdf4"};
  return(
    <div style={{maxWidth:960,margin:"0 auto",padding:"1.25rem 1.5rem"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
        <h2 style={{fontSize:"0.82rem",fontWeight:700,color:T.textSub,textTransform:"uppercase",margin:0}}>⚠️ Riesgos y Hallazgos ({risks.length})</h2>
        <button onClick={()=>setShow(!show)} style={{display:"flex",alignItems:"center",gap:6,background:"#dc2626",color:"#fff",border:"none",padding:"0.5rem 0.875rem",borderRadius:"0.625rem",cursor:"pointer",fontSize:"0.78rem",fontWeight:700}}><Plus size={14}/> Nuevo Hallazgo</button>
      </div>
      {show&&(
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"1rem",padding:"1.25rem",marginBottom:"1rem"}}>
          <div style={{marginBottom:"0.875rem"}}>
            <label style={{fontSize:"0.68rem",fontWeight:700,color:T.textSub,textTransform:"uppercase",display:"block",marginBottom:"0.3rem"}}>Nivel</label>
            <div style={{display:"flex",gap:8}}>{RISK_LEVELS.map(l=><button key={l} onClick={()=>setForm(p=>({...p,level:l}))} style={{flex:1,padding:"0.5rem",border:`2px solid ${form.level===l?lC[l]:"#e2e8f0"}`,background:form.level===l?lC[l]:"#fff",color:form.level===l?"#fff":"#64748b",borderRadius:"0.5rem",fontWeight:700,fontSize:"0.75rem",cursor:"pointer"}}>{l}</button>)}</div>
          </div>
          <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Describe el hallazgo…" rows={3} style={{width:"100%",padding:"0.625rem",border:`1.5px solid ${T.inputBorder}`,borderRadius:"0.625rem",fontSize:"0.85rem",outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box",marginBottom:"0.875rem",background:T.inputBg,color:T.text}}/>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShow(false)} style={{flex:1,padding:"0.7rem",background:T.surfaceAlt,border:"none",borderRadius:"0.75rem",fontWeight:700,cursor:"pointer",color:T.textSub}}>Cancelar</button>
            <button onClick={save} style={{flex:2,padding:"0.7rem",background:"#dc2626",color:"#fff",border:"none",borderRadius:"0.75rem",fontWeight:700,cursor:"pointer"}}>Registrar</button>
          </div>
        </div>
      )}
      {risks.length===0&&!show&&<div style={{textAlign:"center",padding:"3rem",color:T.textHint}}><AlertOctagon size={40} style={{margin:"0 auto 1rem",display:"block",opacity:0.3}}/><p style={{fontWeight:600,margin:0}}>Sin hallazgos registrados</p></div>}
      <div style={{display:"grid",gap:"0.75rem"}}>
        {risks.map(r=>(
          <div key={r.id} style={{background:lB[r.level],border:`1px solid ${lC[r.level]}40`,borderLeft:`4px solid ${lC[r.level]}`,borderRadius:"0.875rem",padding:"1rem",display:"flex",gap:"0.875rem",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.4rem"}}>
                <span style={{fontSize:"0.68rem",fontWeight:800,padding:"2px 10px",borderRadius:999,background:lC[r.level],color:"#fff"}}>{r.level}</span>
                <button onClick={()=>{if(window.confirm("¿Eliminar?"))onDelete(r.id);}} style={{background:"none",border:"none",color:"#dc2626",cursor:"pointer"}}><Trash2 size={13}/></button>
              </div>
              <p style={{fontSize:"0.85rem",color:"#1e293b",margin:"0 0 0.35rem"}}>{r.description}</p>
              <p style={{fontSize:"0.68rem",color:"#64748b",margin:0}}>{new Date(r.timestamp).toLocaleString("es-CO")}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SIGNATURE MODAL ──────────────────────────────────────────────────────────

function SignatureModal({ currentSignature, onSave, onClose }) {
  const {T}=useTheme();
  const canvasRef=useRef(),[drawing,setDrawing]=useState(false),[hasDrawn,setHasDrawn]=useState(false),lastPos=useRef(null);
  useEffect(()=>{const c=canvasRef.current;if(!c)return;const ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle="#1e293b";ctx.lineWidth=2.5;ctx.lineCap="round";ctx.lineJoin="round";if(currentSignature){const img=new window.Image();img.onload=()=>ctx.drawImage(img,0,0);img.src=currentSignature;setHasDrawn(true);}},[]); 
  const gP=(e,c)=>{const r=c.getBoundingClientRect(),sx=c.width/r.width,sy=c.height/r.height;if(e.touches)return{x:(e.touches[0].clientX-r.left)*sx,y:(e.touches[0].clientY-r.top)*sy};return{x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy};};
  const startDraw=(e)=>{e.preventDefault();setDrawing(true);setHasDrawn(true);lastPos.current=gP(e,canvasRef.current);};
  const draw=(e)=>{e.preventDefault();if(!drawing)return;const c=canvasRef.current,ctx=c.getContext("2d"),pos=gP(e,c);ctx.beginPath();ctx.moveTo(lastPos.current.x,lastPos.current.y);ctx.lineTo(pos.x,pos.y);ctx.stroke();lastPos.current=pos;};
  const clearC=()=>{const c=canvasRef.current,ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);setHasDrawn(false);};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <div style={{background:T.modalBg,borderRadius:"1.25rem",width:"100%",maxWidth:460,overflow:"hidden",boxShadow:"0 30px 80px rgba(0,0,0,0.4)"}}>
        <div style={{background:"#0f172a",padding:"1rem 1.25rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><PenTool size={18} color="#a78bfa"/><span style={{color:"#fff",fontWeight:800}}>Firma Digital</span></div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:"1.2rem"}}>×</button>
        </div>
        <div style={{padding:"1.25rem"}}>
          <div style={{border:`2px solid ${T.border}`,borderRadius:"0.75rem",overflow:"hidden",marginBottom:"1rem",touchAction:"none",background:"#fff"}}>
            <canvas ref={canvasRef} width={420} height={160} style={{display:"block",width:"100%",cursor:"crosshair"}} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={()=>setDrawing(false)} onMouseLeave={()=>setDrawing(false)} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={()=>setDrawing(false)}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={clearC} style={{flex:1,padding:"0.7rem",background:T.surfaceAlt,border:"none",borderRadius:"0.75rem",fontWeight:700,cursor:"pointer",color:T.textSub}}>Limpiar</button>
            <button onClick={()=>onSave(canvasRef.current.toDataURL("image/png"))} disabled={!hasDrawn} style={{flex:1,padding:"0.7rem",background:hasDrawn?"#7c3aed":"#e2e8f0",color:hasDrawn?"#fff":"#94a3b8",border:"none",borderRadius:"0.75rem",fontWeight:700,cursor:hasDrawn?"pointer":"not-allowed"}}>Guardar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LOGO MODAL ───────────────────────────────────────────────────────────────

function LogoModal({ currentLogo, onSave, onClose }) {
  const {T}=useTheme(),fileRef=useRef(),[preview,setPreview]=useState(currentLogo);
  const hF=(e)=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=(ev)=>setPreview(ev.target.result);r.readAsDataURL(f);e.target.value="";};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <div style={{background:T.modalBg,borderRadius:"1.25rem",width:"100%",maxWidth:380,overflow:"hidden",boxShadow:"0 30px 80px rgba(0,0,0,0.4)"}}>
        <div style={{background:"#0f172a",padding:"1rem 1.25rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><Building2 size={18} color="#34d399"/><span style={{color:"#fff",fontWeight:800}}>Logo de Empresa</span></div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:"1.2rem"}}>×</button>
        </div>
        <div style={{padding:"1.25rem"}}>
          {preview?<div style={{border:`1px solid ${T.border}`,borderRadius:"0.75rem",padding:"1rem",textAlign:"center",marginBottom:"1rem",background:T.surfaceAlt}}><img src={preview} alt="" style={{maxHeight:90,maxWidth:"100%",objectFit:"contain"}}/></div>:<div onClick={()=>fileRef.current.click()} style={{border:`2px dashed ${T.border}`,borderRadius:"0.75rem",height:110,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:T.textHint,marginBottom:"1rem",cursor:"pointer"}}><Building2 size={30} style={{marginBottom:8}}/><p style={{fontSize:"0.8rem",fontWeight:600,margin:0}}>Subir logo</p></div>}
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={hF}/>
          <div style={{display:"flex",gap:8}}>
            {preview&&<button onClick={()=>fileRef.current.click()} style={{flex:1,padding:"0.7rem",background:"#eff6ff",border:"none",borderRadius:"0.75rem",fontWeight:700,cursor:"pointer",color:"#2563eb"}}>Cambiar</button>}
            <button onClick={()=>onSave(preview)} style={{flex:preview?1:2,padding:"0.7rem",background:"#059669",color:"#fff",border:"none",borderRadius:"0.75rem",fontWeight:700,cursor:"pointer"}}>Guardar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP INNER ────────────────────────────────────────────────────────────────

function AppInner({ user }) {
  const {T,isDark,toggle:toggleDark}=useTheme(), toast=useToast();
  const isAdmin = user?.email === "pedrocandanozasas@gmail.com";

  const [view,setView]=useState("fotos");
  const [selCat,setSelCat]=useState(null);
  const [photos,setPhotos]=useState({});
  const [validating,setValidating]=useState(false);
  const [wo,setWo]=useState(WO_DEFAULT);
  const [signature,setSignature]=useState(()=>storage.get("fi_sig")||null);
  const [companyLogo,setCompanyLogo]=useState(()=>storage.get("fi_logo")||null);
  const [offlineMode,setOfflineMode]=useState(()=>storage.get("fi_offline")||false);
  const [risks,setRisks]=useState([]);
  const [showSigModal,setShowSigModal]=useState(false);
  const [showLogoModal,setShowLogoModal]=useState(false);
  const [showAdmin,setShowAdmin]=useState(false);
  const [saving,setSaving]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const xlsxRef=useRef();

  // Cargar datos del inspector desde Firebase al iniciar
  useEffect(()=>{
    if(!user) return;
    loadInspectionFromFirebase(user.uid, wo.numero).then(data=>{
      if(data){
        setPhotos(data.photos||{});
        setRisks(data.risks||[]);
        if(data.signature) setSignature(data.signature);
        if(data.companyLogo) setCompanyLogo(data.companyLogo);
        if(data.wo) setWo(data.wo);
        toast("Datos cargados desde la nube ☁️","info");
      }
    });
  },[user]);

  const firstPhotoTime=Object.values(photos).reduce((mn,p)=>p.timestamp&&(!mn||p.timestamp<mn)?p.timestamp:mn,null);
  useEffect(()=>{
    if(!firstPhotoTime)return;
    const start=new Date(firstPhotoTime).getTime();
    const tick=()=>setElapsed(Math.floor((Date.now()-start)/1000));
    tick(); const id=setInterval(tick,1000); return()=>clearInterval(id);
  },[firstPhotoTime]);

  const saveToCloud=async(newPhotos, newRisks, newSig, newLogo)=>{
    setSaving(true);
    const ok=await saveInspectionToFirebase(user.uid, wo, newPhotos||photos, newRisks||risks, newSig||signature, newLogo||companyLogo);
    if(ok) toast("Guardado en la nube ☁️");
    else toast("Error al guardar","error");
    setSaving(false);
  };

  const savePhotos=(np)=>{ setPhotos(np); saveToCloud(np, null, null, null); };
  const saveRisks=(nr)=>{ setRisks(nr); saveToCloud(null, nr, null, null); };

  const handleXlsx=async(e)=>{
    const file=e.target.files[0]; if(!file)return;
    const parts=file.name.split("_"), woNum=parts.find(p=>p.includes("WO-")||p.includes("SMP"))||WO_DEFAULT.numero;
    const newWo={...WO_DEFAULT,numero:woNum,sitio:parts[1]||WO_DEFAULT.sitio};
    setWo(newWo); toast(`WO cargada: ${woNum}`); e.target.value="";
  };

  const handleUpload=(e)=>{
    const file=e.target.files[0]; if(!file||!selCat)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const dataUrl=ev.target.result, base64=dataUrl.split(",")[1];
      const pd={base64,dataUrl,validation:null,timestamp:new Date().toISOString(),notes:photos[selCat.id]?.notes||""};
      if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(
          pos=>{pd.gps={lat:pos.coords.latitude,lng:pos.coords.longitude};savePhotos({...photos,[selCat.id]:pd});toast("Foto guardada con GPS 📍");},
          ()=>{savePhotos({...photos,[selCat.id]:pd});toast("Foto guardada");},
          {timeout:5000}
        );
      }else{savePhotos({...photos,[selCat.id]:pd});toast("Foto guardada");}
    };
    reader.readAsDataURL(file); e.target.value="";
  };

  const handleValidate=async()=>{
    if(!selCat||!photos[selCat.id])return;
    if(ANTHROPIC_API_KEY==="TU_API_KEY_AQUI"){toast("Configura tu API Key","warn");return;}
    setValidating(true);
    try{const r=await callAI(photos[selCat.id].base64,selCat.name,selCat.hint);savePhotos({...photos,[selCat.id]:{...photos[selCat.id],validation:r}});toast(`${r.estado} · ${r.puntaje}/10`);}
    catch(err){toast("Error IA: "+err.message,"error");}
    setValidating(false);
  };

  const handleManualValidate=(result)=>{if(!selCat||!photos[selCat.id])return;savePhotos({...photos,[selCat.id]:{...photos[selCat.id],validation:result}});};
  const handleSaveNote=(note)=>{if(!selCat||!photos[selCat.id])return;savePhotos({...photos,[selCat.id]:{...photos[selCat.id],notes:note}});};
  const handleDelete=()=>{if(!selCat||!window.confirm("¿Eliminar?"))return;const np={...photos};delete np[selCat.id];savePhotos(np);toast("Foto eliminada");};
  const handleSaveSig=(sig)=>{setSignature(sig);storage.set("fi_sig",sig);setShowSigModal(false);saveToCloud(null,null,sig,null);toast(sig?"Firma guardada":"Firma eliminada");};
  const handleSaveLogo=(logo)=>{setCompanyLogo(logo);storage.set("fi_logo",logo);setShowLogoModal(false);saveToCloud(null,null,null,logo);toast(logo?"Logo guardado":"Logo eliminado");};
  const toggleOffline=()=>{const n=!offlineMode;setOfflineMode(n);storage.set("fi_offline",n);toast(n?"Modo Offline 📴":"Modo IA Claude 🤖","info");};

  const totalPhotos=Object.keys(photos).length, progress=Math.round((totalPhotos/CATS.length)*100), approved=Object.values(photos).filter(p=>p.validation?.estado==="APROBADA").length;
  const inspName=user?.displayName||user?.email||"Inspector";

  const NavBtn=({icon,title,onClick,active,ac="#93c5fd"})=>(
    <button onClick={onClick} title={title} style={{background:active?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.07)",border:active?`1px solid ${ac}30`:"1px solid transparent",color:active?ac:"#94a3b8",width:32,height:32,borderRadius:"0.5rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
      onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.15)"} onMouseLeave={e=>e.currentTarget.style.background=active?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.07)"}>
      {icon}
    </button>
  );

  const TABS=[{id:"fotos",label:"Fotos",icon:"📷"},{id:"riesgos",label:"Riesgos",icon:"⚠️",count:risks.length}];

  return(
    <div style={{minHeight:"100vh",background:T.pageBg}}>
      <div style={{background:T.topBar}}>
        <div style={{maxWidth:960,margin:"0 auto",padding:"0.75rem 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,background:"#3b82f6",borderRadius:"0.5rem",display:"flex",alignItems:"center",justifyContent:"center"}}><Shield size={20} color="#fff"/></div>
            <div><p style={{color:"#fff",fontWeight:800,margin:0,fontSize:"0.95rem"}}>Field Inspector Pro</p><p style={{color:"#64748b",margin:0,fontSize:"0.68rem"}}>{wo.numero} · {wo.tipo}</p></div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            {isAdmin&&<NavBtn icon={<Activity size={14}/>} title="Panel Admin" onClick={()=>setShowAdmin(true)} active={showAdmin} ac="#93c5fd"/>}
            {isAdmin&&<NavBtn icon={<Building2 size={14}/>} title="Logo" onClick={()=>setShowLogoModal(true)} active={!!companyLogo} ac="#34d399"/>}
            <NavBtn icon={<PenTool size={14}/>} title="Firma" onClick={()=>setShowSigModal(true)} active={!!signature} ac="#a78bfa"/>
            <NavBtn icon={offlineMode?<WifiOff size={14}/>:<Wifi size={14}/>} title="Modo" onClick={toggleOffline} active={offlineMode} ac="#fb923c"/>
            <NavBtn icon={isDark?<Sun size={14}/>:<Moon size={14}/>} title="Tema" onClick={toggleDark} active={isDark} ac="#f472b6"/>
            <div style={{width:1,height:20,background:"#334155",margin:"0 3px"}}/>
            <div style={{textAlign:"right"}}><p style={{color:"#fff",fontWeight:700,margin:0,fontSize:"0.82rem"}}>{inspName}</p><p style={{color:"#64748b",margin:0,fontSize:"0.65rem"}}>{user?.email}</p></div>
            <div style={{width:32,height:32,background:"#3b82f6",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:"#fff",fontSize:"0.72rem"}}>{inspName.substring(0,2).toUpperCase()}</div>
            <button onClick={()=>signOut(auth)} title="Salir" style={{background:"rgba(255,255,255,0.07)",border:"none",color:"#94a3b8",width:32,height:32,borderRadius:"0.5rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><LogOut size={14}/></button>
          </div>
        </div>
        <div style={{background:T.topBarSub,padding:"0.5rem 1.5rem"}}>
          <div style={{maxWidth:960,margin:"0 auto",display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1}}><div style={{height:5,background:"#334155",borderRadius:99}}><div style={{height:5,background:progress===100?"#10b981":"#3b82f6",borderRadius:99,width:`${progress}%`,transition:"width 0.4s"}}/></div></div>
            <span style={{color:"#94a3b8",fontSize:"0.7rem",whiteSpace:"nowrap"}}>{totalPhotos}/{CATS.length} · <span style={{color:"#10b981",fontWeight:700}}>{approved} ✓</span> · {progress}%</span>
            {firstPhotoTime&&<span style={{display:"flex",alignItems:"center",gap:4,color:"#fbbf24",fontSize:"0.68rem",fontWeight:700}}><Clock size={11}/>{fmtTime(elapsed)}</span>}
            {saving&&<span style={{fontSize:"0.63rem",color:"#93c5fd",fontWeight:700}}>☁️ Guardando...</span>}
            <span style={{fontSize:"0.63rem",fontWeight:700,padding:"2px 7px",borderRadius:999,background:offlineMode?"#1c1917":"#0f2a1e",border:offlineMode?"1px solid #f97316":"1px solid #16a34a",color:offlineMode?"#fb923c":"#4ade80"}}>{offlineMode?"📴 OFFLINE":"🤖 IA"}</span>
          </div>
        </div>
      </div>

      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"0.875rem 1.5rem"}}>
        <div style={{maxWidth:960,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
          {[
            {label:"Nueva Foto",icon:<Camera size={17}/>,color:"#2563eb",action:()=>{const c=CATS.find(c=>!photos[c.id])||CATS[0];setSelCat(c);}},
            {label:"Validar IA", icon:<Eye size={17}/>,  color:"#7c3aed",action:()=>{const c=CATS.find(c=>photos[c.id]&&!photos[c.id].validation);if(c)setSelCat(c);else toast("No hay fotos sin validar","info");}},
            {label:"Reporte",    icon:<BarChart2 size={17}/>,color:"#0f172a",action:()=>setView("report")},
            {label:"PDF",        icon:<Download size={17}/>,color:"#059669",action:()=>{generatePDF(photos,user,wo,signature,companyLogo,risks);toast("PDF generado");}},
            {label:"Excel",      icon:<FileSpreadsheet size={17}/>,color:"#15803d",action:()=>{generateExcel(photos,user,wo,risks);toast("Excel generado");}},
          ].map(btn=>(
            <button key={btn.label} onClick={btn.action} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,padding:"0.7rem 0.4rem",background:btn.color,color:"#fff",border:"none",borderRadius:"0.75rem",fontSize:"0.7rem",fontWeight:700,cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.opacity="0.85"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              {btn.icon}{btn.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`}}>
        <div style={{maxWidth:960,margin:"0 auto",padding:"0 1.5rem",display:"flex"}}>
          {TABS.map(tab=>(
            <button key={tab.id} onClick={()=>setView(tab.id)} style={{padding:"0.75rem 1.25rem",background:"none",border:"none",borderBottom:`2px solid ${view===tab.id?"#3b82f6":"transparent"}`,color:view===tab.id?"#2563eb":T.textSub,fontWeight:view===tab.id?700:500,fontSize:"0.8rem",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              {tab.icon} {tab.label}
              {tab.count>0&&<span style={{background:view===tab.id?"#2563eb":"#e2e8f0",color:view===tab.id?"#fff":"#64748b",fontSize:"0.6rem",fontWeight:800,padding:"1px 6px",borderRadius:999}}>{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {view==="fotos"&&(
        <div style={{maxWidth:960,margin:"1.25rem auto 0",padding:"0 1.5rem"}}>
          <div style={{background:T.surface,borderRadius:"1rem",border:`1px solid ${T.border}`,padding:"1rem 1.25rem",marginBottom:"1.25rem",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"0.75rem"}}>
            <div style={{display:"flex",gap:"1.25rem",flexWrap:"wrap",alignItems:"center"}}>
              {companyLogo&&<img src={companyLogo} alt="" style={{height:32,objectFit:"contain"}}/>}
              {[["WO",wo.numero],["Fecha",wo.fecha],["Proyecto",wo.proyecto]].map(([l,v])=>(
                <div key={l}><span style={{fontSize:"0.68rem",color:T.textHint,fontWeight:600,textTransform:"uppercase",display:"block"}}>{l}</span><span style={{fontSize:"0.85rem",color:T.text,fontWeight:700}}>{v}</span></div>
              ))}
              {signature&&<div><span style={{fontSize:"0.68rem",color:T.textHint,fontWeight:600,textTransform:"uppercase",display:"block"}}>Firma</span><img src={signature} alt="" style={{height:26,objectFit:"contain"}}/></div>}
            </div>
            <button onClick={()=>xlsxRef.current.click()} style={{display:"flex",alignItems:"center",gap:6,background:T.surfaceAlt,border:`1.5px dashed ${T.border}`,color:T.textSub,padding:"0.5rem 0.875rem",borderRadius:"0.625rem",cursor:"pointer",fontSize:"0.75rem",fontWeight:600}}>
              <Upload size={14}/> Cargar Excel WO
            </button>
            <input ref={xlsxRef} type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={handleXlsx}/>
          </div>
          <h2 style={{fontSize:"0.8rem",fontWeight:700,color:T.textSub,textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 0.875rem"}}>📷 Categorías Fotográficas ({totalPhotos}/{CATS.length})</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))",gap:"0.875rem",paddingBottom:"2rem"}}>
            {CATS.map(cat=><CatCard key={cat.id} cat={cat} photo={photos[cat.id]} onClick={()=>setSelCat(cat)}/>)}
          </div>
        </div>
      )}

      {view==="riesgos"&&<RisksSection risks={risks} onAdd={r=>saveRisks([...risks,r])} onDelete={id=>saveRisks(risks.filter(r=>r.id!==id))}/>}

      {view==="report"&&(
        <div style={{maxWidth:640,margin:"1.25rem auto",padding:"0 1.5rem"}}>
          <div style={{background:T.surface,borderRadius:"1rem",border:`1px solid ${T.border}`,padding:"1.25rem",marginBottom:"1rem"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"0.625rem",marginBottom:"1rem"}}>
              {[["Fotos",totalPhotos,"#2563eb","#eff6ff"],["Aprobadas",approved,"#16a34a","#f0fdf4"],["Riesgos",risks.length,"#dc2626","#fef2f2"],["Progreso",`${progress}%`,"#7c3aed","#f5f3ff"]].map(([l,v,c,bg])=>(
                <div key={l} style={{background:bg,borderRadius:"0.75rem",padding:"0.875rem",textAlign:"center"}}><p style={{fontSize:"1.75rem",fontWeight:900,color:c,margin:0}}>{v}</p><p style={{fontSize:"0.7rem",color:"#64748b",margin:0}}>{l}</p></div>
              ))}
            </div>
            <button onClick={()=>{generatePDF(photos,user,wo,signature,companyLogo,risks);toast("PDF generado");}} style={{width:"100%",padding:"0.875rem",background:"#059669",color:"#fff",border:"none",borderRadius:"0.75rem",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <Download size={18}/> Descargar PDF Completo
            </button>
          </div>
        </div>
      )}

      <div style={{textAlign:"center",fontSize:"0.68rem",color:T.textHint,padding:"1rem"}}>
        Field Inspector Pro · {wo.numero} · {inspName} · ☁️ Firebase
      </div>

      {selCat&&<CatModal cat={selCat} photo={photos[selCat.id]} onUpload={handleUpload} onValidate={handleValidate} onManualValidate={handleManualValidate} onDelete={handleDelete} onClose={()=>setSelCat(null)} onSaveNote={handleSaveNote} validating={validating} offlineMode={offlineMode}/>}
      {showSigModal&&<SignatureModal currentSignature={signature} onSave={handleSaveSig} onClose={()=>setShowSigModal(false)}/>}
      {showLogoModal&&<LogoModal currentLogo={companyLogo} onSave={handleSaveLogo} onClose={()=>setShowLogoModal(false)}/>}
      {showAdmin&&<AdminPanel onClose={()=>setShowAdmin(false)}/>}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [isDark,setIsDark]=useState(()=>{ try{ return JSON.parse(localStorage.getItem("fi_dark"))||false; }catch{return false;} });
  const T=makeTheme(isDark);
  const toggle=()=>{const n=!isDark;setIsDark(n);try{localStorage.setItem("fi_dark",JSON.stringify(n));}catch{}};
  const [toasts,setToasts]=useState([]);
  const addToast=useCallback((msg,type="success")=>{const id=Date.now();setToasts(p=>[...p,{id,msg,type}]);setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3200);},[]);
  const [user,setUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,(u)=>{setUser(u);setAuthLoading(false);});
    return unsub;
  },[]);

  if(authLoading) return(
    <div style={{minHeight:"100vh",background:"#0f172a",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:48,height:48,border:"3px solid #3b82f6",borderTop:"3px solid transparent",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 1rem"}}/>
        <p style={{color:"#94a3b8",fontSize:"0.9rem"}}>Conectando...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  return(
    <ThemeCtx.Provider value={{T,isDark,toggle}}>
      <ToastCtx.Provider value={addToast}>
        {user ? <AppInner user={user}/> : <Login/>}
        <ToastContainer toasts={toasts}/>
      </ToastCtx.Provider>
    </ThemeCtx.Provider>
  );
}
