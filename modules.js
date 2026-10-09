/* =========================================================
   Modules de l'écran CRC
   Chaque module renvoie zéro, une ou plusieurs lignes.
   L'ordre et l'activation se règlent dans l'admin (S.ordre, S.blocs).
   ========================================================= */

window.MODULES = [
  { id:"meteo",     nom:"Météo du moment" },
  { id:"previsions",nom:"Prévisions 3 jours" },
  { id:"fete",      nom:"Fête du jour" },
  { id:"anniv",     nom:"Anniversaires équipe" },
  { id:"rebours",   nom:"Comptes à rebours" },
  { id:"objectif",  nom:"Objectif du jour" },
  { id:"semaine",   nom:"Avancement de la semaine" },
  { id:"feries",    nom:"Jours fériés et ponts" },
  { id:"vacances",  nom:"Vacances scolaires (zone C)" },
  { id:"soleil",    nom:"Soleil et lune" },
  { id:"citation",  nom:"Citation du jour" },
  { id:"histoire",  nom:"Ce jour-là dans l'histoire" },
  { id:"messages",  nom:"Messages" }
];

const DAY = 864e5;
const jourCourt = d => d.toLocaleDateString('fr-FR',{weekday:'short'}).replace('.','');
const dateLongue = d => d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
const dateCourte = d => d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'}).replace('.','');
const minuit = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const ecart = (a,b) => Math.round((minuit(b) - minuit(a)) / DAY);
const hm = iso => { const d = new Date(iso); return d.getHours()+"h"+String(d.getMinutes()).padStart(2,'0'); };
function barre(pct, color="vert"){
  const n = LAY==="carrousel" ? 20 : 30, on = Math.round(Math.max(0,Math.min(100,pct))/100*n);
  return `<div class="bar bar-${color}">${Array.from({length:n},(_,i)=>`<i class="${i<on?'on':''}"></i>`).join("")}</div>`;
}
function ligneBarre(badge, color, texte, pct, side=""){
  return `<div class="row fade"><div class="badge glow c-${color}"><span>${esc(badge)}</span></div><div class="main glow c-${color}" style="overflow:visible;white-space:normal"><span>${texte}</span>${barre(pct,color)}</div>${side?`<div class="side">${side}</div>`:""}</div>`;
}

/* ---------- Prévisions courtes ---------- */
const WMO_COURT = c => c===0?"Soleil":c<=2?"Éclaircies":c===3?"Couvert":c<=48?"Brouillard":c<=57?"Bruine":c<=67?"Pluie":c<=77?"Neige":c<=82?"Averses":c<=86?"Neige":"Orage";

/* ---------- Lune ---------- */
function lune(d){
  const syn = 29.530588853, ref = Date.UTC(2000,0,6,18,14);
  const age = (((d - ref) / DAY) % syn + syn) % syn;
  const noms = [[1.84,"Nouvelle lune"],[5.53,"Premier croissant"],[9.22,"Premier quartier"],[12.91,"Lune gibbeuse croissante"],
    [16.61,"Pleine lune"],[20.30,"Lune gibbeuse décroissante"],[23.99,"Dernier quartier"],[27.68,"Dernier croissant"],[99,"Nouvelle lune"]];
  const nom = noms.find(n => age < n[0])[1];
  const illum = Math.round((1 - Math.cos(2*Math.PI*age/syn)) / 2 * 100);
  return { nom, illum };
}

/* ---------- Jours fériés ---------- */
function paques(y){
  const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),
    h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),
    mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;
  return new Date(y,mo-1,da);
}
function feries(y){
  const p = paques(y), plus = n => new Date(p.getFullYear(), p.getMonth(), p.getDate()+n);
  return [
    [new Date(y,0,1),"Jour de l'An"],[plus(1),"Lundi de Pâques"],[new Date(y,4,1),"Fête du Travail"],
    [new Date(y,4,8),"Victoire 1945"],[plus(39),"Ascension"],[plus(50),"Lundi de Pentecôte"],
    [new Date(y,6,14),"Fête nationale"],[new Date(y,7,15),"Assomption"],[new Date(y,10,1),"Toussaint"],
    [new Date(y,10,11),"Armistice"],[new Date(y,11,25),"Noël"]
  ];
}
function prochainsFeries(d){
  const t = minuit(d);
  return [...feries(d.getFullYear()), ...feries(d.getFullYear()+1)].filter(f => f[0] >= t).sort((a,b)=>a[0]-b[0]);
}

/* ---------- Vacances scolaires (API Éducation nationale, zone C) ---------- */
let VAC = null, VAC_JOUR = "";
async function loadVacances(){
  const today = new Date().toISOString().slice(0,10);
  if(VAC_JOUR === today) return;
  try{
    const where = encodeURIComponent(`zones="Zone C" and end_date>=date'${today}'`);
    const u = `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-calendrier-scolaire/records?where=${where}&order_by=start_date&limit=40`;
    const j = await (await fetch(u)).json();
    const vus = new Set();
    VAC = (j.results||[])
      .filter(r => r.description && r.start_date && r.end_date && !/enseignant/i.test(r.population||""))
      .map(r => ({ nom:r.description.trim(), debut:new Date(r.start_date), fin:new Date(r.end_date) }))
      .filter(v => { const k = v.nom + v.debut.toDateString(); if(vus.has(k)) return false; vus.add(k); return true; })
      .sort((a,b)=>a.debut-b.debut);
    VAC_JOUR = today;
  }catch(e){ VAC = null; }
}

/* ---------- Éphéméride (Wikipédia) ---------- */
let HIST = null, HIST_JOUR = "";
async function loadHistoire(){
  const d = new Date(), mm = String(d.getMonth()+1).padStart(2,'0'), jj = String(d.getDate()).padStart(2,'0');
  if(HIST_JOUR === mm+jj) return;
  try{
    let r = await fetch(`https://fr.wikipedia.org/api/rest_v1/feed/onthisday/selected/${mm}/${jj}`);
    let j = r.ok ? await r.json() : {};
    let list = j.selected || [];
    if(!list.length){ r = await fetch(`https://fr.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${jj}`); j = r.ok ? await r.json() : {}; list = j.events || []; }
    HIST = list.filter(e => e.text && e.year && e.text.length < 200).map(e => ({ an:e.year, txt:e.text.replace(/\s+/g," ").trim() }));
    HIST_JOUR = mm+jj;
  }catch(e){ HIST = null; }
}

/* ---------- Citations ---------- */
const CITATIONS = [
  ["Seul on va plus vite, ensemble on va plus loin.","Proverbe africain"],
  ["Le succès, c'est d'aller d'échec en échec sans perdre son enthousiasme.","Attribuée à Winston Churchill"],
  ["Petit à petit, l'oiseau fait son nid.","Proverbe"],
  ["Il n'y a pas de vent favorable pour celui qui ne sait pas où il va.","Sénèque"],
  ["La patience est amère, mais son fruit est doux.","Jean-Jacques Rousseau"],
  ["Rien ne sert de courir, il faut partir à point.","Jean de La Fontaine"],
  ["Le sourire est la plus courte distance entre deux personnes.","Victor Borge"],
  ["Ce n'est pas parce que les choses sont difficiles que nous n'osons pas, c'est parce que nous n'osons pas qu'elles sont difficiles.","Sénèque"],
  ["La simplicité est la sophistication suprême.","Attribuée à Léonard de Vinci"],
  ["Qui ne tente rien n'a rien.","Proverbe"],
  ["Le meilleur moyen de prévoir l'avenir, c'est de le créer.","Attribuée à Peter Drucker"],
  ["Après la pluie, le beau temps.","Proverbe"],
  ["On ne voit bien qu'avec le cœur.","Antoine de Saint-Exupéry"],
  ["Chaque jour est une nouvelle chance.","Proverbe"],
  ["La politesse est à l'esprit ce que la grâce est au visage.","Voltaire"],
  ["L'union fait la force.","Proverbe"],
  ["Le travail éloigne de nous trois grands maux : l'ennui, le vice et le besoin.","Voltaire"],
  ["Il faut toujours viser la lune, car même en cas d'échec on atterrit dans les étoiles.","Attribuée à Oscar Wilde"],
  ["La persévérance est la noblesse de l'obstination.","Proverbe"],
  ["Un problème sans solution est un problème mal posé.","Attribuée à Albert Einstein"],
  ["L'écoute est le premier pas vers la solution.","Proverbe"],
  ["Ils ne savaient pas que c'était impossible, alors ils l'ont fait.","Attribuée à Mark Twain"],
  ["Vingt fois sur le métier remettez votre ouvrage.","Nicolas Boileau"],
  ["La gentillesse est la langue que les sourds entendent et que les aveugles voient.","Attribuée à Mark Twain"],
  ["Le temps est un grand maître, il règle bien des choses.","Pierre Corneille"],
  ["Faites de votre vie un rêve, et d'un rêve, une réalité.","Antoine de Saint-Exupéry"],
  ["Mieux vaut tard que jamais.","Proverbe"],
  ["Le doute est le commencement de la sagesse.","Aristote"],
  ["C'est en forgeant qu'on devient forgeron.","Proverbe"],
  ["La vie, c'est comme une bicyclette, il faut avancer pour ne pas perdre l'équilibre.","Attribuée à Albert Einstein"],
  ["Un client satisfait est la meilleure des publicités.","Proverbe"],
  ["Qui veut aller loin ménage sa monture.","Proverbe"],
  ["La bonne humeur est contagieuse, passez-la à vos voisins.","Proverbe de bureau"],
  ["L'imagination est plus importante que le savoir.","Albert Einstein"],
  ["Tout ce qui mérite d'être fait mérite d'être bien fait.","Proverbe"],
  ["Le calme est la force de ceux qui savent.","Proverbe"],
  ["Il n'est jamais trop tard pour bien faire.","Proverbe"],
  ["On a deux oreilles et une bouche pour écouter deux fois plus qu'on ne parle.","Attribuée à Épictète"],
  ["Le courage n'est pas l'absence de peur, mais la capacité de la vaincre.","Attribuée à Nelson Mandela"],
  ["Les petits ruisseaux font les grandes rivières.","Proverbe"]
];

/* ---------- Construction de toutes les lignes ---------- */
function lignesModule(id, d){
  const B = S.blocs || {}, out = [];
  if(B[id] === false) return out;
  switch(id){

    case "meteo":
      if(B.meteo === undefined || B.meteo)
        out.push(meteo
          ? row("Météo","ambre", `${esc(meteo.txt)} ${meteo.t}°`, `${esc(S.ville)} · ${meteo.min}° / ${meteo.max}° · vent ${meteo.v} km/h`)
          : row("Météo","ambre","Chargement…", esc(S.ville)));
      break;

    case "previsions":
      if(B.previsions && meteo && meteo.jours){
        const j = meteo.jours.slice(1,4);
        out.push(row("Prévisions","bleu",
          j.map(x=>`${esc(jourCourt(x.d))} ${x.max}°`).join(" · "),
          j.map(x=>`${esc(jourCourt(x.d))} ${esc(WMO_COURT(x.code))} ${x.min}°/${x.max}°`).join(" · ")));
      }
      break;

    case "fete":
      if(B.fete !== false){ const f = fete(d); if(f) out.push(row("Fête","blanc", esc(f))); }
      break;

    case "anniv":
      if(B.anniv){
        const avance = Math.max(0, +S.anniv_avance || 0);
        (S.anniversaires||[]).forEach(a=>{
          if(!a.prenom || !a.date) return;
          const [mm,jj] = a.date.split("-").map(Number);
          let x = new Date(d.getFullYear(), mm-1, jj);
          if(minuit(x) < minuit(d)) x = new Date(d.getFullYear()+1, mm-1, jj);
          const n = ecart(d, x);
          if(n === 0) out.push(row("Anniv","rouge", `Joyeux anniversaire ${esc(a.prenom)} !`));
          else if(n <= avance) out.push(row("Anniv","blanc", `Anniv de ${esc(a.prenom)} ${n===1?"demain":"dans "+n+" jours"}`, esc(dateLongue(x))));
        });
      }
      break;

    case "rebours":
      if(B.rebours){
        (S.rebours||[]).filter(r=>r.titre && r.date).map(r=>({...r, x:new Date(r.date+"T00:00:00")}))
          .sort((a,b)=>a.x-b.x)
          .forEach(r=>{
            const n = ecart(d, r.x), max = r.afficher ? +r.afficher : 9999;
            if(n < 0 || n > max) return;
            out.push(row(n===0 ? "Jour J" : "J-"+n, r.couleur||"ambre", esc(r.titre), n===0 ? "C'est aujourd'hui" : esc(dateLongue(r.x))));
          });
      }
      break;

    case "objectif":
      if(B.objectif && S.objectif && S.objectif.titre){
        const o = S.objectif, v = +o.valeur || 0, c = +o.cible || 0, u = o.unite || "";
        const pct = c ? v/c*100 : 0, ok = c && v >= c;
        out.push(ligneBarre("Objectif", ok ? "vert" : "ambre", `${esc(o.titre)} : ${v}${esc(u)} / ${c}${esc(u)}${ok?" ✓":""}`, pct));
      }
      break;

    case "semaine":
      if(B.semaine !== false){
        const w = semaine(d), n = LAY==="carrousel" ? 20 : 30, on = Math.round(w.pct/100*n);
        const bar = `<div class="bar">${Array.from({length:n},(_,i)=>`<i class="${i<on?'on':''}"></i>`).join("")}</div>`;
        const days = `<div class="days">${["L","M","M","J","V","S"].map((l,i)=>`<b class="${w.dow===0||i+1<w.dow?'done':i+1===w.dow?'now':''}">${l}</b>`).join("")}</div>`;
        out.push(`<div class="row fade"><div class="badge glow c-vert"><span>Semaine</span></div><div class="main glow c-vert" style="overflow:visible;white-space:normal"><span>${Math.round(w.pct)} % · ${esc(w.label)}</span>${bar}</div><div class="side">${days}</div></div>`);
      }
      break;

    case "feries":
      if(B.feries){
        const [x, nom] = prochainsFeries(d)[0], n = ecart(d, x);
        const jw = x.getDay(), pont = jw===2 ? "Pont possible le lundi" : jw===4 ? "Pont possible le vendredi" : "";
        if(n === 0) out.push(row("Férié","rouge", `Aujourd'hui c'est férié : ${esc(nom)}`));
        else out.push(row("Férié","bleu", `${esc(nom)} ${n===1?"demain":"dans "+n+" jours"}`, esc(dateLongue(x)) + (pont ? " · "+pont : "")));
      }
      break;

    case "vacances":
      if(B.vacances && VAC && VAC.length){
        const t = minuit(d);
        const enCours = VAC.find(v => minuit(v.debut) <= t && t < minuit(v.fin));
        if(enCours) out.push(row("Vacances","vert", `${esc(enCours.nom)} en cours`, "Rentrée " + esc(dateLongue(enCours.fin))));
        else{
          const v = VAC.find(v => minuit(v.debut) > t);
          if(v){ const n = ecart(d, v.debut);
            out.push(row("Vacances","vert", `${esc(v.nom)} ${n===1?"demain":"dans "+n+" jours"}`, `Du ${esc(dateCourte(v.debut))} au ${esc(dateCourte(new Date(v.fin - DAY)))} · zone C`)); }
        }
      }
      break;

    case "soleil":
      if(B.soleil && meteo && meteo.lever){
        const l = lune(d);
        out.push(row("Soleil","ambre", `Lever ${meteo.lever} · Coucher ${meteo.coucher}`, `${esc(l.nom)} · éclairée à ${l.illum} %`));
      }
      break;

    case "citation":
      if(B.citation){
        const perso = (S.citations_perso||[]).filter(Boolean).map(t=>[t,""]);
        const all = [...perso, ...CITATIONS];
        const doy = Math.floor((minuit(d) - new Date(d.getFullYear(),0,0)) / DAY);
        const [t, a] = all[doy % all.length];
        out.push(row("Citation","blanc", `«\u00a0${esc(t)}\u00a0»`, esc(a)));
      }
      break;

    case "histoire":
      if(B.histoire && HIST && HIST.length){
        const h = HIST[d.getHours() % HIST.length];
        out.push(row("En "+h.an,"bleu", esc(h.txt)));
      }
      break;

    case "messages":
      if(B.messages !== false)
        (S.messages||[]).filter(m=>m.actif!==false && (m.texte||"").trim())
          .forEach(m => out.push(row(m.badge||"Info", m.couleur||"ambre", esc(m.texte))));
      break;
  }
  return out;
}
function ordreModules(){
  const ids = MODULES.map(m=>m.id);
  const o = (S.ordre||[]).filter(id => ids.includes(id));
  return [...o, ...ids.filter(id => !o.includes(id))];
}
function buildRows(d){
  return ordreModules().flatMap(id => { try{ return lignesModule(id, d); }catch(e){ return []; } });
}
