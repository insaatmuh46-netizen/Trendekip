const categories = [
  ['🧱','Seramik'],['🎨','Boya'],['🪨','Mermer'],['🪚','Mobilya'],
  ['⚡','Elektrik'],['🚿','Tesisat'],['🏗️','Alçıpan'],['🔩','Demir']
];

const teams = [
  {name:'Maraş Seramik Ekibi',cat:'Seramik',city:'Kahramanmaraş',rating:'4.9',jobs:28,size:4},
  {name:'Usta Dekor',cat:'Boya & Alçıpan',city:'Kahramanmaraş',rating:'4.8',jobs:19,size:5},
  {name:'TaşArt Mermer',cat:'Mermer',city:'Gaziantep',rating:'4.7',jobs:34,size:3}
];

const jobs = [
  {title:'800 m² seramik işi',city:'Kahramanmaraş',cat:'Seramik',date:'Bu hafta',desc:'Konut projesi için 3–4 kişilik deneyimli ekip aranıyor.'},
  {title:'Daire komple boya',city:'Kayseri',cat:'Boya',date:'Pazartesi',desc:'180 m² daire. Malzeme işverene ait, işçilik teklifleri alınacaktır.'}
];

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
  list.forEach(team=>{
    const initials=team.name.split(' ').slice(0,2).map(x=>x[0]).join('');
    const el=document.createElement('article');
    el.className='team-card';
    el.innerHTML=`
      <div class="team-top">
        <div style="display:flex;gap:10px;align-items:center">
          <div class="avatar">${initials}</div>
          <div><strong>${team.name}</strong><div class="muted">${team.cat} • ${team.city}</div></div>
        </div>
        <div class="rating">⭐ ${team.rating}</div>
      </div>
      <div class="status">Müsait</div>
      <p class="muted">${team.jobs} tamamlanan iş • ${team.size} kişilik ekip</p>
      <div class="actions"><button class="secondary profile">Profili gör</button><button class="primary contact">İletişim</button></div>`;
    el.querySelector('.profile').onclick=()=>showModal(team.name,`${team.cat} alanında ${team.jobs} tamamlanmış iş. ${team.size} kişilik ekip. Profil ayrıntıları Supabase bağlantısından sonra aktif olacak.`);
    el.querySelector('.contact').onclick=()=>showModal('İletişim','WhatsApp bağlantısı kullanıcı profilleri açıldığında aktif olacak.');
    teamCards.appendChild(el);
  });
}

jobs.forEach(job=>{
  const el=document.createElement('article');
  el.className='job-card';
  el.innerHTML=`<div class="job-top"><div><h3>${job.title}</h3><div class="muted">${job.city}</div></div><strong>${job.date}</strong></div><div class="chips"><span class="chip">${job.cat}</span><span class="chip">Aktif ilan</span></div><p>${job.desc}</p><button class="secondary interested">İlgileniyorum</button>`;
  el.querySelector('.interested').onclick=()=>showModal('İlana başvur','Üyelik ve WhatsApp bağlantısı Supabase kurulunca aktif olacak.');
  jobCards.appendChild(el);
});

renderTeams();

document.querySelector('#searchBtn').onclick=()=>{
  const q=document.querySelector('#searchInput').value.toLocaleLowerCase('tr');
  const city=document.querySelector('#citySelect').value;
  const filtered=teams.filter(t=>(!q || `${t.name} ${t.cat}`.toLocaleLowerCase('tr').includes(q)) && (!city || t.city===city));
  renderTeams(filtered);
  if(!filtered.length) showModal('Sonuç bulunamadı','Filtreyi değiştirerek tekrar deneyebilirsin.');
};

document.querySelector('[data-action="find"]').onclick=()=>document.querySelector('#searchPanel').scrollIntoView({behavior:'smooth'});
document.querySelector('[data-action="post"]').onclick=()=>showModal('İş ilanı ver','İlan oluşturma formunu bir sonraki aşamada Supabase ile aktif edeceğiz.');
document.querySelector('#loginBtn').onclick=()=>showModal('Giriş / Kayıt','E-posta ile ücretsiz üyelik Supabase Auth bağlandığında burada açılacak.');
document.querySelector('#showAllBtn').onclick=()=>document.querySelector('#searchPanel').scrollIntoView({behavior:'smooth'});

if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{});}
