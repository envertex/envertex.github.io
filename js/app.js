// =============================
// 3 POSTS MÁS RECIENTES (40% ancho centrado)
// =============================
const recentGridPost = document.getElementById('recentGridPost');

async function loadRecentPosts() {
  if (!recentGridPost) return;

  try {
    // Leer JSON desde la raíz
    const res = await fetch('/index.json?nocache=' + new Date().getTime());
    const posts = await res.json();

    // Ordenar de más nuevo a más viejo
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Tomar 3 más recientes
    const recent = posts.slice(0, 3);

    // Limpiar contenedor
    recentGridPost.innerHTML = '';

    recent.forEach(p => {
      const date = new Date(p.date);
      const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      const dateStr = isNaN(date) ? p.date : `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;

      const tagsHTML = (p.tags || []).map(tag => `<span class="post-tag">${tag}</span>`).join('');

      const imgHTML = p.image ? `<div class="post-image">
        <img src="${p.image}" alt="${p.title} - Featured image" loading="lazy">
      </div>` : `<div class="post-image placeholder"></div>`;

      const article = document.createElement('article');
      article.className = 'post-card clickable-card';
      article.style.display = 'flex';
      article.style.gap = '15px';
      article.style.margin = '20px auto';
      article.style.width = '80%';
      article.style.cursor = 'pointer';
      article.innerHTML = `
        ${imgHTML}
        <div class="post-content" style="flex:1">
          <h3 class="post-title" style="margin:0; font-size:1.2rem;"><a href="${p.permalink}" style="text-decoration:none; color: inherit;">${p.title}</a></h3>
          <p class="post-description" style="margin:5px 0; color:#555;">${p.summary}</p>
          <div class="post-meta-inline" style="font-size:0.85rem; color:#888;"><time>${dateStr}</time></div>
          <div class="post-tags" style="margin-top:5px;">${tagsHTML}</div>
        </div>
      `;

      article.addEventListener('click', () => {
        window.location.href = p.permalink;
      });

      recentGridPost.appendChild(article);
    });

  } catch (err) {
    console.error('Error loading recent posts:', err);
    recentGridPost.innerHTML = '<p>Error loading recent posts.</p>';
  }
}

// =============================
// POSTS PAGINADOS (9 por página)
// =============================
const postsGrid = document.getElementById('postsGrid');
const pagination = document.getElementById('postsPagination');
const searchInput = document.getElementById('searchInputPost');
const searchBtn = document.getElementById('searchBtnPost');
const clearBtn = document.getElementById('clearPost');
const resultsMeta = document.getElementById('resultsMeta');

let allPosts = [];
let filteredPosts = [];
let currentPage = 1;
const postsPerPage = 9;

async function loadAllPosts() {
  if (!postsGrid) return;

  try {
    const res = await fetch('/index.json?nocache=' + new Date().getTime());
    allPosts = await res.json();

    // Ordenar de más nuevo a más viejo
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Inicialmente no hay filtro
    filteredPosts = [...allPosts];

    currentPage = 1;
    renderPostsPage(currentPage);
    renderPagination();
    updateResultsMeta();

  } catch(err) {
    console.error('Error loading all posts:', err);
    postsGrid.innerHTML = '<p>Error loading posts.</p>';
  }
}

function renderPostsPage(page) {
  postsGrid.innerHTML = '';
  const start = (page - 1) * postsPerPage;
  const end = start + postsPerPage;
  const pagePosts = filteredPosts.slice(start, end);

  pagePosts.forEach(p => {
    const date = new Date(p.date);
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const dateStr = isNaN(date) ? p.date : `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
    const tagsHTML = (p.tags || []).map(tag => `<span class="post-tag">${tag}</span>`).join('');
    const imgHTML = p.image ? `<div class="post-image"><img src="${p.image}" alt="${p.title}" loading="lazy"></div>` : `<div class="post-image placeholder"></div>`;

    const article = document.createElement('article');
    article.className = 'post-card clickable-card';
    article.style.display = 'flex';
    article.style.flexDirection = 'column';
    article.style.margin = '15px';
    article.style.padding = '10px';
    article.style.width = 'calc(33% - 30px)';
    article.style.boxSizing = 'border-box';
    article.style.borderRadius = '10px';
    article.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
    article.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
    article.addEventListener('mouseenter', () => {
      article.style.transform = 'translateY(-3px)';
      article.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)';
    });
    article.addEventListener('mouseleave', () => {
      article.style.transform = 'translateY(0)';
      article.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
    });

    article.innerHTML = `
      ${imgHTML}
      <div class="post-content" style="padding:12px;">
        <h3 class="post-title" style="margin:0 0 5px; font-size:1.1rem;"><a href="${p.permalink}" style="text-decoration:none; color: inherit;">${p.title}</a></h3>
        <p class="post-description" style="margin:5px 0; color:#555;">${p.summary}</p>
        <div class="post-meta-inline" style="font-size:0.8rem; color:#888;">${dateStr}</div>
        <div class="post-tags" style="margin-top:5px;">${tagsHTML}</div>
      </div>
    `;
    article.addEventListener('click', () => window.location.href = p.permalink);

    postsGrid.appendChild(article);
  });

  postsGrid.style.display = 'flex';
  postsGrid.style.flexWrap = 'wrap';
  postsGrid.style.justifyContent = 'space-between';
}

function renderPagination() {
  if (!pagination) return;
  pagination.innerHTML = '';
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Anterior';
  prevBtn.disabled = currentPage === 1;
  prevBtn.className = 'pagination-btn';
  prevBtn.addEventListener('click', () => {
    currentPage--;
    renderPostsPage(currentPage);
    renderPagination();
  });
  pagination.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = 'pagination-btn';
    if (i === currentPage) btn.classList.add('active');
    btn.addEventListener('click', () => {
      currentPage = i;
      renderPostsPage(currentPage);
      renderPagination();
    });
    pagination.appendChild(btn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Siguiente';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.className = 'pagination-btn';
  nextBtn.addEventListener('click', () => {
    currentPage++;
    renderPostsPage(currentPage);
    renderPagination();
  });
  pagination.appendChild(nextBtn);

  pagination.style.display = 'flex';
  pagination.style.justifyContent = 'center';
  pagination.style.gap = '8px';
  pagination.style.margin = '20px 0';

  Array.from(pagination.children).forEach(btn => {
    btn.style.padding = '6px 12px';
    btn.style.border = `1px solid var(--border-color)`;
    btn.style.borderRadius = '6px';
    btn.style.background = 'var(--bg-secondary)';
    btn.style.color = 'var(--text-primary)';
    btn.style.cursor = btn.disabled ? 'not-allowed' : 'pointer';
    btn.style.transition = 'all var(--transition-fast)';
  });

  const activeBtn = pagination.querySelector('.active');
  if (activeBtn) {
    activeBtn.style.background = 'var(--accent-primary)';
    activeBtn.style.color = 'var(--bg-primary)';
    activeBtn.style.borderColor = 'var(--accent-primary)';
  }

  Array.from(pagination.children).forEach(btn => {
    if (!btn.disabled) {
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'var(--accent-primary-rgba-05)';
        btn.style.color = 'var(--bg-primary)';
      });
      btn.addEventListener('mouseleave', () => {
        if (!btn.classList.contains('active')) {
          btn.style.background = 'var(--bg-secondary)';
          btn.style.color = 'var(--text-primary)';
        }
      });
    }
  });
}

// =============================
// SEARCH
// =============================
function performSearchModelModelModelModel() {
  const q = searchInput.value.trim().toLowerCase();

  if (!q) {
    filteredPosts = [...allPosts];
  } else {
    filteredPosts = allPosts.filter(p => {
      const inTitle = p.title?.toLowerCase().includes(q);
      const inSummary = p.summary?.toLowerCase().includes(q);
      const inContent = p.content?.toLowerCase().includes(q);
      const inTags = (p.tags || []).some(tag => tag.toLowerCase().includes(q));
      return inTitle || inSummary || inContent || inTags;
    });
  }

  currentPage = 1;
  renderPostsPage(currentPage);
  renderPagination();
  updateResultsMeta();
}

function updateResultsMeta() {
  if (!resultsMeta) return;

  const total = filteredPosts.length;
  resultsMeta.textContent = total
    ? `Mostrando ${total} resultado${total > 1 ? 's' : ''}`
    : 'No se encontraron resultados';
}

if (searchBtn) searchBtn.addEventListener('click', performSearchModelModelModelModel);
if (searchInput) searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') performSearchModelModelModel();
});
if (clearBtn) clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  filteredPosts = [...allPosts];
  currentPage = 1;
  renderPostsPage(currentPage);
  renderPagination();
  updateResultsMeta();
});

// =============================
// Inicializar ambos
// =============================
loadRecentPosts();
loadAllPosts();
/* =============================
   ELEMENTS
============================= */
const searchField = document.getElementById("searchInput");
const osSelect = document.getElementById("filterOS");
const difficultySelect = document.getElementById("filterDifficulty");
const certSelect = document.getElementById("filterCert");
const clearFiltersBtn = document.getElementById("clearBtn");

const tableBody = document.getElementById("machinesBody");
const resultsCounter = document.getElementById("resultsMeta");

/* =============================
   STATE
============================= */
let machinesData = [];

/* =============================
   LOAD DATA
============================= */
fetch("/machines.json")
  .then(res => res.json())
  .then(data => {
    machinesData = data;
    renderTable(machinesData);
  })
  .catch(() => {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6">Error loading machines</td>
      </tr>
    `;
  });

/* =============================
   FILTER LOGIC
============================= */
function applyMachineFilters() {
  const query = searchField.value.toLowerCase().trim();
  const selectedOS = osSelect.value;
  const selectedDifficulty = difficultySelect.value;
  const selectedCert = certSelect.value;

  const filtered = machinesData.filter(machine => {
    /* 🔍 SEARCH IN ALL FIELDS */
    const searchableText = `
      ${machine.name}
      ${machine.os}
      ${machine.difficulty}
      ${machine.platform}
      ${(machine.techniques || []).join(" ")}
      ${(machine.certifications || []).join(" ")}
    `.toLowerCase();

    const matchesSearch = !query || searchableText.includes(query);
    const matchesOS = !selectedOS || machine.os === selectedOS;
    const matchesDifficulty =
      !selectedDifficulty || machine.difficulty === selectedDifficulty;
    const matchesCert =
      !selectedCert || (machine.certifications || []).includes(selectedCert);

    return (
      matchesSearch &&
      matchesOS &&
      matchesDifficulty &&
      matchesCert
    );
  });

  renderTable(filtered);
}

/* =============================
   RENDER TABLE
============================= */
function renderTable(list) {
  tableBody.innerHTML = "";

  if (!list.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6">No results</td>
      </tr>
    `;
    resultsCounter.textContent = "";
    return;
  }

  list.forEach(machine => {
    const row = document.createElement("tr");
    row.classList.add("clickable-row");
    row.title = "Writeup";

    row.innerHTML = `
      <td>
        <strong>${machine.name}</strong>
        <span class="row-hint">Writeup ↗</span>
      </td>
      <td>${machine.os}</td>
      <td>${machine.difficulty}</td>
      <td>${(machine.techniques || []).join(", ")}</td>
      <td>${machine.platform}</td>
      <td>${(machine.certifications || []).join(", ")}</td>
    `;

    row.addEventListener("click", () => {
      if (machine.writeup) {
        window.open(machine.writeup, "_blank");
      }
    });

    tableBody.appendChild(row);
  });

  resultsCounter.textContent = `Showing ${list.length} machine(s)`;
}

/* =============================
   EVENTS
============================= */
searchField.addEventListener("input", applyMachineFilters);
osSelect.addEventListener("change", applyMachineFilters);
difficultySelect.addEventListener("change", applyMachineFilters);
certSelect.addEventListener("change", applyMachineFilters);

/* =============================
   CLEAR BUTTON (IMPORTANT FIX)
============================= */
clearFiltersBtn.addEventListener("click", () => {
  searchField.value = "";

  // 🔑 restore placeholders
  osSelect.selectedIndex = 0;
  difficultySelect.selectedIndex = 0;
  certSelect.selectedIndex = 0;

  renderTable(machinesData);
});

