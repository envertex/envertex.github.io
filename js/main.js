
document.querySelectorAll('.copy-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    navigator.clipboard.writeText(btn.dataset.copy);
    btn.textContent='COPIED';
    setTimeout(()=>btn.textContent='COPY',1200);
  });
});

const searchInput=document.getElementById('searchInput');
const clearBtn=document.getElementById('clearBtn');

if(searchInput){
  searchInput.addEventListener('input',()=>{
    const q=searchInput.value.toLowerCase().split(/\s+/);
    document.querySelectorAll('.section').forEach(sec=>{
      const text=sec.innerText.toLowerCase();
      sec.style.display=q.every(w=>text.includes(w))?'block':'none';
    });
  });
}
if(clearBtn){
  clearBtn.onclick=()=>{
    searchInput.value='';
    document.querySelectorAll('.section').forEach(s=>s.style.display='block');
  }
}
