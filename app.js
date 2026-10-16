import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const categories = [
  ['🧱','Seramik'],['🎨','Boya'],['🪨','Mermer'],['🪚','Mobilya'],
  ['⚡','Elektrik'],['🚿','Tesisat'],['🏗️','Alçıpan'],['🔩','Demir']
];

const demoTeams = [
  {name:'Maraş Seramik Ekibi',category:'Seramik',city:'Kahramanmaraş',rating:'4.9',jobs:28,member_count:4,is_available:true},
  {name:'Usta Dekor',category:'Boya & Alçıpan',city:'Kahramanmaraş',rating:'4.8',jobs:19,member_count:5,is_available:true},
  {name:'TaşArt Mermer',category:'Mermer',city:'Gaziantep',rating:'4.7',jobs:34,member_count:3,is_available:true}
];

const demoJobs = [
  {title:'800 m² seramik işi',city:'Kahramanmaraş',category:'Seramik',start_date:null,description:'Konut projesi için 3–4 kişilik deneyimli ekip aranıyor.',status:'open'},
  {title:'Daire komple boya',city:'Kayseri',category:'Boya',start_date:null,description:'180 m² daire. Malzeme işverene ait, işçilik teklifleri alınacaktır.',status:'open'}
];

let teams = [];
let jobs = [];

const categoryGrid = document.querySelector('#categoryGrid');
const teamCards = document.querySelector('#teamCards');
const jobCards = document.querySelector('#jobCards');
const modal = document.querySelector('#modal');
const modalTitle = document.querySelector('#modalTitle');
const modalText = document.querySelector('#modalText');

function showModal(title, text){
  modalTitle.textContent = title;
  modalText.textContent = text;
  modal.showModal();
}

categories.forEach(([icon,name])=>{
  const el=document.createElement('button');
  el.className='category';
  el.innerHTML=`<span>${icon}</span><strong>${name}</strong>`;
  el.addEventListener('click',()=>{
    document.querySelector('#searchInput').value=name;
    document.querySelector('#searchPanel').scrollIntoView({behavior:'smooth'});
  });
  categoryGrid.appendChild(el);
});

function renderTeams(list=teams){
  teamCards.innerHTML='';
  if(!list.length){
    teamCards.innerHTML='<p class="muted">Henüz ekip kaydı yok.</p>';
    return;
  }
  list.forEach(team=>{
    const initials=(team.name || 'TE').split(' ').slice(0,2).map(x=>x[0]).join('');
    const rating=team.rating ?? 'Yeni';
    const jobsCount=team.jobs ?? 0;
    const size=team.member_count ?? team.size ?? 1;
    const cat=team.category ?? team.cat ?? 'Genel';
    const el=document.createElement('article');
    el.className='team-card';
    el.innerHTML=`
      <div class="team-top">
        <div style="display:flex;gap:10px;align-items:center">
          <div class="avatar">${initials}</div>
          <div><strong>${team.name}</strong><div class="muted">${cat} • ${team.city || ''}</div></div>
        </div>
        <div class="rating">⭐ ${rating}</div>
      </div>
      <div class="status">${team.is_available === false ? 'Dolu' : 'Müsait'}</div>
      <p class="muted">${jobsCount} tamamlanan iş • ${size} kişilik ekip</p>
      <div class="actions"><button class="secondary profile">Profili gör</button><button class="primary contact">İletişim</button></div>`;
    el.querySelector('.profile').onclick=()=>showModal(team.name,`${cat} alanında çalışan ${size} kişilik ekip. Ayrıntılı profil ekranı hazırlanıyor.`);
    el.querySelector('.contact').onclick=()=>{
      if(team.whatsapp){
        const phone=String(team.whatsapp).replace(/\D/g,'');
        window.open(`https://wa.me/${phone}`,'_blank','noopener');
      } else {
        showModal('İletişim','Bu ekip henüz WhatsApp numarası eklememiş.');
      }
    };
    teamCards.appendChild(el);
  });
}

function renderJobs(list=jobs){
  jobCards.innerHTML='';
  if(!list.length){
    jobCards.innerHTML='<p class="muted">Henüz aktif iş ilanı yok.</p>';
    return;
  }
  list.forEach(job=>{
    const el=document.createElement('article');
    el.className='job-card';
    const startLabel=job.start_date ? new Date(job.start_date+'T00:00:00').toLocaleDateString('tr-TR') : 'Yeni ilan';
    el.innerHTML=`<div class="job-top"><div><h3>${job.title}</h3><div class="muted">${job.city || ''}</div></div><strong>${startLabel}</strong></div><div class="chips"><span class="chip">${job.category || 'Genel'}</span><span class="chip">${job.status === 'closed' ? 'Kapalı' : 'Aktif ilan'}</span></div><p>${job.description || ''}</p><button class="secondary interested">İlgileniyorum</button>`;
    el.querySelector('.interested').onclick=()=>{
      if(job.contact_whatsapp){
        const phone=String(job.contact_whatsapp).replace(/\D/g,'');
        window.open(`https://wa.me/${phone}`,'_blank','noopener');
      } else {
        showModal('İlana başvur','İlan sahibi henüz WhatsApp numarası eklememiş.');
      }
    };
    jobCards.appendChild(el);
  });
}

async function loadData(){
  const [teamsResult,jobsResult] = await Promise.all([
    supabase.from('teams').select('*').order('featured',{ascending:false}).order('created_at',{ascending:false}).limit(20),
    supabase.from('jobs').select('*').eq('status','open').order('featured',{ascending:false}).order('created_at',{ascending:false}).limit(20)
  ]);

  if(teamsResult.error){
    console.warn('TrendEkip teams verisi okunamadı:',teamsResult.error.message);
    teams = demoTeams;
  } else {
    teams = teamsResult.data?.length ? teamsResult.data : demoTeams;
  }

  if(jobsResult.error){
    console.warn('TrendEkip jobs verisi okunamadı:',jobsResult.error.message);
    jobs = demoJobs;
  } else {
    jobs = jobsResult.data?.length ? jobsResult.data : demoJobs;
  }

  renderTeams();
  renderJobs();
}

document.querySelector('#searchBtn').onclick=()=>{
  const q=document.querySelector('#searchInput').value.toLocaleLowerCase('tr');
  const city=document.querySelector('#citySelect').value;
  const filtered=teams.filter(t=>{
    const haystack=`${t.name || ''} ${t.category || t.cat || ''}`.toLocaleLowerCase('tr');
    return (!q || haystack.includes(q)) && (!city || t.city===city);
  });
  renderTeams(filtered);
  if(!filtered.length) showModal('Sonuç bulunamadı','Filtreyi değiştirerek tekrar deneyebilirsin.');
};

document.querySelector('[data-action="find"]').onclick=()=>document.querySelector('#searchPanel').scrollIntoView({behavior:'smooth'});
document.querySelector('[data-action="post"]').onclick=()=>showModal('İş ilanı ver','Gerçek ilan oluşturma formu sıradaki adımda Supabase Auth ile aktif olacak.');
document.querySelector('#loginBtn').onclick=()=>showModal('Giriş / Kayıt','E-posta ile ücretsiz üyelik sıradaki adımda aktif olacak.');
document.querySelector('#showAllBtn').onclick=()=>document.querySelector('#searchPanel').scrollIntoView({behavior:'smooth'});

loadData();

if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{});}
