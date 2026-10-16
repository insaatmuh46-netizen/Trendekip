import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';

let supabase = null;

const categories = [
  ['🧱','Seramik'],['🎨','Boya'],['🪨','Mermer'],['🪚','Mobilya'],
  ['⚡','Elektrik'],['🚿','Tesisat'],['🏗️','Alçıpan'],['🔩','Demir']
];

const demoTeams = [
  {name:'Maraş Seramik Ekibi',category:'Seramik',city:'Kahramanmaraş',rating:'4.9',jobs:28,member_count:4,is_available:true,description:'Seramik ve granit uygulamalarında deneyimli ekip.'},
  {name:'Usta Dekor',category:'Boya & Alçıpan',city:'Kahramanmaraş',rating:'4.8',jobs:19,member_count:5,is_available:true,description:'Boya, alçıpan ve dekorasyon uygulamaları.'},
  {name:'TaşArt Mermer',category:'Mermer',city:'Gaziantep',rating:'4.7',jobs:34,member_count:3,is_available:true,description:'Mermer, porselen ve doğal taş uygulamaları.'}
];

const demoJobs = [
  {title:'800 m² seramik işi',city:'Kahramanmaraş',category:'Seramik',start_date:null,description:'Konut projesi için 3–4 kişilik deneyimli ekip aranıyor.',status:'open'},
  {title:'Daire komple boya',city:'Kayseri',category:'Boya',start_date:null,description:'180 m² daire. Malzeme işverene ait, işçilik teklifleri alınacaktır.',status:'open'}
];

let teams = [...demoTeams];
let jobs = [...demoJobs];
let currentSession = null;
let pendingAction = null;

const categoryGrid = document.querySelector('#categoryGrid');
const teamCards = document.querySelector('#teamCards');
const jobCards = document.querySelector('#jobCards');
const modal = document.querySelector('#modal');
const modalTitle = document.querySelector('#modalTitle');
const modalBody = document.querySelector('#modalBody');
const loginBtn = document.querySelector('#loginBtn');

const esc = (value='') => String(value)
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;');

function openModal(title, html){
  modalTitle.textContent = title;
  modalBody.innerHTML = html;
  if(!modal.open) modal.showModal();
}

function closeModal(){ if(modal.open) modal.close(); }

document.querySelector('#modalClose').onclick = closeModal;
modal.addEventListener('click',(e)=>{
  const rect = modal.getBoundingClientRect();
  const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
  if(!inside) closeModal();
});

function showMessage(title,text,type='notice'){
  openModal(title,`<div class="${type}">${esc(text)}</div><div class="modal-actions"><button class="primary" id="messageOk">Tamam</button></div>`);
  document.querySelector('#messageOk').onclick=closeModal;
}

function setActiveNav(name){
  document.querySelectorAll('.bottom-nav button').forEach(btn=>btn.classList.toggle('active',btn.dataset.nav===name));
}

function goTo(id,nav){
  document.querySelector(id)?.scrollIntoView({behavior:'smooth',block:'start'});
  if(nav) setActiveNav(nav);
}

categories.forEach(([icon,name])=>{
  const el=document.createElement('button');
  el.className='category';
  el.innerHTML=`<span>${icon}</span><strong>${name}</strong>`;
  el.addEventListener('click',()=>{
    document.querySelector('#searchInput').value=name;
    filterTeams();
    goTo('#teamsSection','teams');
  });
  categoryGrid.appendChild(el);
});

function renderTeams(list=teams){
  teamCards.innerHTML='';
  if(!list.length){ teamCards.innerHTML='<p class="muted">Bu filtreye uygun ekip bulunamadı.</p>'; return; }
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
          <div class="avatar">${esc(initials)}</div>
          <div><strong>${esc(team.name)}</strong><div class="muted">${esc(cat)} • ${esc(team.city || '')}</div></div>
        </div>
        <div class="rating">⭐ ${esc(rating)}</div>
      </div>
      <div class="status ${team.is_available === false ? 'busy' : ''}">${team.is_available === false ? 'Dolu' : 'Müsait'}</div>
      <p class="muted">${esc(jobsCount)} tamamlanan iş • ${esc(size)} kişilik ekip</p>
      <div class="actions"><button class="secondary profile">Profili gör</button><button class="primary contact">İletişim</button></div>`;
    el.querySelector('.profile').onclick=()=>showTeamProfile(team);
    el.querySelector('.contact').onclick=()=>contactWhatsApp(team.whatsapp,team.name);
    teamCards.appendChild(el);
  });
}

function showTeamProfile(team){
  const size=team.member_count ?? team.size ?? 1;
  openModal(team.name || 'Ekip Profili',`
    <div class="profile-summary">
      <strong>${esc(team.name || 'TrendEkip ustası')}</strong>
      <span>${esc(team.category || team.cat || 'Genel')} • ${esc(team.city || '')}${team.district ? ' / '+esc(team.district) : ''}</span>
      <span>${esc(team.experience_years ?? 0)} yıl deneyim • ${esc(size)} kişilik ekip</span>
      <span>${team.is_available === false ? 'Şu an dolu' : 'Şu an müsait'}</span>
    </div>
    <p>${esc(team.description || 'Bu kullanıcı henüz ayrıntılı açıklama eklememiş.')}</p>
    <div class="modal-actions">
      <button class="secondary" id="teamClose">Kapat</button>
      <button class="primary" id="teamContact">WhatsApp</button>
    </div>`);
  document.querySelector('#teamClose').onclick=closeModal;
  document.querySelector('#teamContact').onclick=()=>contactWhatsApp(team.whatsapp,team.name);
}

function contactWhatsApp(number,name='Bu kullanıcı'){
  if(number){
    const phone=String(number).replace(/\D/g,'');
    window.open(`https://wa.me/${phone}`,'_blank','noopener');
  } else showMessage('İletişim',`${name} henüz WhatsApp numarası eklememiş.`);
}

function renderJobs(list=jobs){
  jobCards.innerHTML='';
  if(!list.length){ jobCards.innerHTML='<p class="muted">Henüz aktif iş ilanı yok.</p>'; return; }
  list.forEach(job=>{
    const el=document.createElement('article');
    el.className='job-card';
    const startLabel=job.start_date ? new Date(job.start_date+'T00:00:00').toLocaleDateString('tr-TR') : 'Yeni ilan';
    el.innerHTML=`<div class="job-top"><div><h3>${esc(job.title)}</h3><div class="muted">${esc(job.city || '')}${job.district ? ' / '+esc(job.district) : ''}</div></div><strong>${esc(startLabel)}</strong></div><div class="chips"><span class="chip">${esc(job.category || 'Genel')}</span><span class="chip">${job.status === 'closed' ? 'Kapalı' : 'Aktif ilan'}</span></div><p>${esc(job.description || '')}</p><button class="secondary interested">İlgileniyorum</button>`;
    el.querySelector('.interested').onclick=()=>contactWhatsApp(job.contact_whatsapp,'İlan sahibi');
    jobCards.appendChild(el);
  });
}

async function loadData(){
  if(!supabase){ renderTeams(); renderJobs(); return; }
  const [teamsResult,jobsResult] = await Promise.all([
    supabase.from('teams').select('*').order('featured',{ascending:false}).order('created_at',{ascending:false}).limit(50),
    supabase.from('jobs').select('*').eq('status','open').order('featured',{ascending:false}).order('created_at',{ascending:false}).limit(50)
  ]);
  teams = teamsResult.error || !teamsResult.data?.length ? demoTeams : teamsResult.data;
  jobs = jobsResult.error || !jobsResult.data?.length ? demoJobs : jobsResult.data;
  renderTeams(); renderJobs();
}

function filterTeams(){
  const q=document.querySelector('#searchInput').value.trim().toLocaleLowerCase('tr');
  const city=document.querySelector('#citySelect').value;
  const filtered=teams.filter(t=>{
    const haystack=`${t.name || ''} ${t.category || t.cat || ''} ${t.description || ''}`.toLocaleLowerCase('tr');
    return (!q || haystack.includes(q)) && (!city || t.city===city);
  });
  renderTeams(filtered);
  return filtered;
}

document.querySelector('#searchBtn').onclick=()=>{
  const filtered=filterTeams();
  goTo('#teamsSection','teams');
  if(!filtered.length) showMessage('Sonuç bulunamadı','Filtreyi değiştirerek tekrar deneyebilirsin.');
};
document.querySelector('#searchInput').addEventListener('keydown',e=>{if(e.key==='Enter') document.querySelector('#searchBtn').click();});
document.querySelector('[data-action="find"]').onclick=()=>goTo('#searchPanel','teams');
document.querySelector('[data-action="post"]').onclick=showJobForm;
document.querySelector('#postJobBtn').onclick=showJobForm;
document.querySelector('#showAllBtn').onclick=()=>{
  document.querySelector('#searchInput').value='';
  document.querySelector('#citySelect').value='';
  renderTeams(teams);
  goTo('#teamsSection','teams');
};
document.querySelector('#brandHome').onclick=()=>goTo('#top','home');
document.querySelectorAll('.bottom-nav button').forEach(btn=>{
  btn.onclick=()=>{
    const target=btn.dataset.nav;
    if(target==='home') goTo('#top','home');
    if(target==='jobs') goTo('#jobsSection','jobs');
    if(target==='teams') goTo('#teamsSection','teams');
    if(target==='profile') showProfile();
  };
});
loginBtn.onclick=()=> currentSession ? showProfile() : showAuth();

function ensureSupabase(){
  if(supabase) return true;
  showMessage('Bağlantı kurulamadı','Üyelik servisine şu an ulaşılamıyor. Ana menüler ve arama çalışmaya devam ediyor. Sayfayı yenileyip tekrar deneyebilirsin.','notice error');
  return false;
}

function showAuth(mode='login',message=''){
  const isSignup=mode==='signup';
  openModal(isSignup ? 'Ücretsiz hesap oluştur' : 'Giriş yap',`
    ${message ? `<div class="notice">${esc(message)}</div>` : ''}
    <form id="authForm" class="form-grid">
      ${isSignup ? '<label>Ad Soyad<input name="full_name" autocomplete="name" required maxlength="80"></label>' : ''}
      <label>E-posta<input name="email" type="email" autocomplete="email" required></label>
      <label>Şifre<input name="password" type="password" autocomplete="${isSignup ? 'new-password' : 'current-password'}" required minlength="6"></label>
      <button class="primary" type="submit">${isSignup ? 'Hesap oluştur' : 'Giriş yap'}</button>
    </form>
    <div class="modal-actions"><button class="secondary" id="switchAuth">${isSignup ? 'Zaten hesabım var' : 'Yeni hesap oluştur'}</button></div>
    <p class="form-help">TrendEkip hesabınla profilini, ekip kartını ve iş ilanlarını yönetebilirsin.</p>`);
  document.querySelector('#switchAuth').onclick=()=>showAuth(isSignup?'login':'signup');
  document.querySelector('#authForm').onsubmit=async(e)=>{
    e.preventDefault();
    if(!ensureSupabase()) return;
    const form=new FormData(e.currentTarget);
    const email=String(form.get('email')||'').trim();
    const password=String(form.get('password')||'');
    const submit=e.currentTarget.querySelector('button[type="submit"]');
    submit.disabled=true; submit.textContent='İşleniyor...';
    let result;
    if(isSignup){
      const fullName=String(form.get('full_name')||'').trim();
      result=await supabase.auth.signUp({email,password,options:{data:{full_name:fullName}}});
    } else result=await supabase.auth.signInWithPassword({email,password});
    submit.disabled=false; submit.textContent=isSignup?'Hesap oluştur':'Giriş yap';
    if(result.error){ showAuth(mode,result.error.message); return; }
    if(isSignup && !result.data.session){
      pendingAction=null;
      showMessage('E-postanı kontrol et','Hesabını etkinleştirmek için e-postana gönderilen doğrulama bağlantısına dokun.','notice success');
      return;
    }
    closeModal(); await refreshSession();
    if(pendingAction==='postJob'){ pendingAction=null; showJobForm(); } else showProfile();
  };
}

async function refreshSession(){
  if(!supabase){ currentSession=null; updateAuthButton(); return; }
  const {data}=await supabase.auth.getSession();
  currentSession=data.session;
  updateAuthButton();
}

function updateAuthButton(){ loginBtn.textContent=currentSession ? 'Profilim' : 'Giriş yap'; }

async function showProfile(){
  setActiveNav('profile');
  if(!currentSession){ showAuth('login','Profilini görmek için giriş yap.'); return; }
  if(!ensureSupabase()) return;
  const uid=currentSession.user.id;
  const [{data:profile},{data:team}]=await Promise.all([
    supabase.from('profiles').select('*').eq('id',uid).maybeSingle(),
    supabase.from('teams').select('*').eq('owner_id',uid).order('created_at',{ascending:false}).limit(1).maybeSingle()
  ]);
  openModal('Profilim',`
    <form id="profileForm" class="form-grid">
      <label>Ad Soyad<input name="full_name" value="${esc(profile?.full_name || '')}" maxlength="80" required></label>
      <label>Hesap türü<select name="account_type"><option value="professional" ${profile?.account_type!=='employer'?'selected':''}>Usta / Ekip</option><option value="employer" ${profile?.account_type==='employer'?'selected':''}>İşveren</option></select></label>
      <label>Şehir<input name="city" value="${esc(profile?.city || '')}" placeholder="Kahramanmaraş"></label>
      <label>İlçe<input name="district" value="${esc(profile?.district || '')}"></label>
      <label>WhatsApp<input name="whatsapp" value="${esc(profile?.whatsapp || '')}" inputmode="tel" placeholder="905xxxxxxxxx"></label>
      <label>Meslek / Uzmanlık<input name="trade" value="${esc(profile?.trade || '')}" placeholder="Mermer, seramik, boya..."></label>
      <label>Deneyim (yıl)<input name="experience_years" type="number" min="0" max="70" value="${esc(profile?.experience_years ?? 0)}"></label>
      <label>Hakkımda<textarea name="about">${esc(profile?.about || '')}</textarea></label>
      <button class="primary" type="submit">Profili kaydet</button>
    </form>
    <div class="split-actions" style="margin-top:12px">
      <button class="secondary" id="teamManage">${team ? 'Ekip kartımı düzenle' : 'Ekip / Usta kartı oluştur'}</button>
      <button class="secondary" id="myJobs">İlanlarım</button>
    </div>
    <div class="modal-actions"><button class="secondary" id="logoutBtn">Çıkış yap</button></div>`);
  document.querySelector('#profileForm').onsubmit=async(e)=>{
    e.preventDefault();
    const fd=new FormData(e.currentTarget);
    const payload={id:uid,full_name:String(fd.get('full_name')||'').trim(),account_type:String(fd.get('account_type')||'professional'),city:String(fd.get('city')||'').trim()||null,district:String(fd.get('district')||'').trim()||null,whatsapp:String(fd.get('whatsapp')||'').trim()||null,trade:String(fd.get('trade')||'').trim()||null,experience_years:Number(fd.get('experience_years')||0),about:String(fd.get('about')||'').trim()||null,updated_at:new Date().toISOString()};
    const {error}=await supabase.from('profiles').upsert(payload);
    if(error){showMessage('Kaydedilemedi',error.message,'notice error');return;}
    showMessage('Kaydedildi','Profil bilgilerin güncellendi.','notice success');
  };
  document.querySelector('#teamManage').onclick=()=>showTeamForm(team,profile);
  document.querySelector('#myJobs').onclick=showMyJobs;
  document.querySelector('#logoutBtn').onclick=async()=>{ await supabase.auth.signOut(); closeModal(); setActiveNav('home'); };
}

function showTeamForm(team,profile){
  if(!currentSession){showAuth();return;}
  if(!ensureSupabase()) return;
  openModal(team?'Ekip kartını düzenle':'Ekip / Usta kartı oluştur',`
    <form id="teamForm" class="form-grid">
      <label>Görünen ad<input name="name" value="${esc(team?.name || profile?.full_name || '')}" required maxlength="80"></label>
      <label>Kategori<input name="category" value="${esc(team?.category || profile?.trade || '')}" required placeholder="Mermer"></label>
      <label>Şehir<input name="city" value="${esc(team?.city || profile?.city || '')}" required></label>
      <label>İlçe<input name="district" value="${esc(team?.district || profile?.district || '')}"></label>
      <label>Ekip kişi sayısı<input name="member_count" type="number" min="1" max="100" value="${esc(team?.member_count ?? 1)}"></label>
      <label>Deneyim (yıl)<input name="experience_years" type="number" min="0" max="70" value="${esc(team?.experience_years ?? profile?.experience_years ?? 0)}"></label>
      <label>WhatsApp<input name="whatsapp" value="${esc(team?.whatsapp || profile?.whatsapp || '')}" inputmode="tel" placeholder="905xxxxxxxxx"></label>
      <label>Açıklama<textarea name="description">${esc(team?.description || profile?.about || '')}</textarea></label>
      <label><select name="is_available"><option value="true" ${team?.is_available!==false?'selected':''}>Müsaitim</option><option value="false" ${team?.is_available===false?'selected':''}>Şu an doluyum</option></select></label>
      <button class="primary" type="submit">Kaydet ve yayınla</button>
    </form>`);
  document.querySelector('#teamForm').onsubmit=async(e)=>{
    e.preventDefault();
    const fd=new FormData(e.currentTarget);
    const payload={owner_id:currentSession.user.id,name:String(fd.get('name')||'').trim(),category:String(fd.get('category')||'').trim(),city:String(fd.get('city')||'').trim(),district:String(fd.get('district')||'').trim()||null,member_count:Number(fd.get('member_count')||1),experience_years:Number(fd.get('experience_years')||0),whatsapp:String(fd.get('whatsapp')||'').trim()||null,description:String(fd.get('description')||'').trim()||null,is_available:String(fd.get('is_available'))==='true',updated_at:new Date().toISOString()};
    const query=team?.id ? supabase.from('teams').update(payload).eq('id',team.id) : supabase.from('teams').insert(payload);
    const {error}=await query;
    if(error){showMessage('Kaydedilemedi',error.message,'notice error');return;}
    await loadData(); showMessage('Yayında','Ekip/Usta kartın TrendEkip’te yayınlandı.','notice success');
  };
}

function showJobForm(){
  if(!currentSession){ pendingAction='postJob'; showAuth('login','İş ilanı verebilmek için giriş yap veya ücretsiz hesap oluştur.'); return; }
  if(!ensureSupabase()) return;
  openModal('İş ilanı ver',`
    <form id="jobForm" class="form-grid">
      <label>İlan başlığı<input name="title" required maxlength="100" placeholder="800 m² seramik işi"></label>
      <label>Kategori<input name="category" required placeholder="Seramik"></label>
      <label>Şehir<input name="city" required placeholder="Kahramanmaraş"></label>
      <label>İlçe<input name="district"></label>
      <label>İş başlangıç tarihi<input name="start_date" type="date"></label>
      <label>İş miktarı / kapsamı<input name="work_amount" placeholder="800 m², 2 daire..."></label>
      <label>WhatsApp<input name="contact_whatsapp" inputmode="tel" required placeholder="905xxxxxxxxx"></label>
      <label>Açıklama<textarea name="description" required placeholder="İşin kapsamını, malzeme durumunu ve beklentini yaz."></textarea></label>
      <button class="primary" type="submit">İlanı yayınla</button>
    </form>`);
  document.querySelector('#jobForm').onsubmit=async(e)=>{
    e.preventDefault();
    const fd=new FormData(e.currentTarget);
    const payload={owner_id:currentSession.user.id,title:String(fd.get('title')||'').trim(),category:String(fd.get('category')||'').trim(),city:String(fd.get('city')||'').trim(),district:String(fd.get('district')||'').trim()||null,start_date:String(fd.get('start_date')||'')||null,work_amount:String(fd.get('work_amount')||'').trim()||null,contact_whatsapp:String(fd.get('contact_whatsapp')||'').trim(),description:String(fd.get('description')||'').trim(),status:'open'};
    const {error}=await supabase.from('jobs').insert(payload);
    if(error){showMessage('İlan yayınlanamadı',error.message,'notice error');return;}
    await loadData(); showMessage('İlan yayında','İş ilanınız başarıyla yayınlandı.','notice success');
  };
}

async function showMyJobs(){
  if(!currentSession){showAuth();return;}
  if(!ensureSupabase()) return;
  const {data,error}=await supabase.from('jobs').select('*').eq('owner_id',currentSession.user.id).order('created_at',{ascending:false});
  if(error){showMessage('İlanlar alınamadı',error.message,'notice error');return;}
  const items=(data||[]).map(j=>`<div class="profile-summary"><strong>${esc(j.title)}</strong><span>${esc(j.city)} • ${j.status==='open'?'Aktif':'Kapalı'}</span><div class="modal-actions"><button class="secondary toggle-job" data-id="${esc(j.id)}" data-status="${esc(j.status)}">${j.status==='open'?'İlanı kapat':'Tekrar aç'}</button></div></div>`).join('');
  openModal('İlanlarım',items || '<div class="notice">Henüz iş ilanı vermedin.</div>');
  document.querySelectorAll('.toggle-job').forEach(btn=>btn.onclick=async()=>{
    const next=btn.dataset.status==='open'?'closed':'open';
    const {error:err}=await supabase.from('jobs').update({status:next,updated_at:new Date().toISOString()}).eq('id',btn.dataset.id);
    if(err){showMessage('Güncellenemedi',err.message,'notice error');return;}
    await loadData(); showMyJobs();
  });
}

renderTeams();
renderJobs();
updateAuthButton();

(async()=>{
  try{
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    supabase.auth.onAuthStateChange((_event,session)=>{ currentSession=session; updateAuthButton(); });
    await refreshSession();
    await loadData();
  }catch(error){
    console.error('Supabase yüklenemedi:',error);
    currentSession=null;
    updateAuthButton();
  }
})();

if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{});}
