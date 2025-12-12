/* main.js - Versión DEFINITIVA con filtrado combinado
   ------------------------------------------------------------
   - Búsqueda + Filtro de módulo trabajan JUNTOS
   - Primero filtra por módulo, luego busca dentro de esa sección
   - Sistema de colores múltiples mantenido
   - Búsqueda inteligente mejorada x200
   ------------------------------------------------------------ */

const KEYWORDS = [
  // Lenguajes / intérpretes
  "python", "python3", "py", "bash", "sh", "shell",
  "powershell", "pwsh", "php", "perl", "ruby", "node", "nodejs", "js",

  // Herramientas básicas de red
  "nmap", "nc", "netcat", "telnet",
  "curl", "wget",
  "ssh", "scp", "sftp",
  "ftp", "tftp", "smbclient",
  "dig", "nslookup", "host", "whois",
  "traceroute", "tracepath",
  "ip", "ifconfig", "arp",

  // Impacket & similares
  "impacket", "psexec", "wmiexec", "secretsdump", "smbexec",
  "getTGT", "getST", "rpcdump", "samrdump", "ntlmrelayx",

  // Enumeración / escaneo
  "enum4linux", "smbmap", "ldapsearch",
  "gobuster", "ffuf", "dirsearch",
  "nikto", "whatweb", "wafw00f",

  // Fuerza bruta
  "hydra", "medusa", "ncrack",

  // Hashing / cracking
  "hashcat", "john", "johnny",

  // Web / pentesting web
  "burp", "burpsuite",
  "sqlmap",

  // Explotación general
  "metasploit", "msfconsole", "msfvenom",
  "searchsploit", "exploitdb",

  // Reversing / binarios
  "gdb", "strace", "ltrace",
  "radare2", "r2", "ghidra",
  "objdump", "readelf", "strings", "file",

  // Servicios / protocolos
  "http", "https",
  "ssh", "ftp", "smb", "rpc", "ldap", "kerberos", "krb5",
  "mssql", "mysql", "postgres", "mongodb", "redis",
  "rdp", "vnc", "snmp",

  // DevOps y contenedores
  "docker", "kubectl", "k8s",

  // Extensiones útiles
  ".py", ".pyc",
  ".sh", ".bash",
  ".ps1", ".psm1",
  ".php", ".jsp", ".asp", ".aspx",
  ".js", ".rb",
  ".exe", ".dll",
  ".bat", ".cmd",
  ".pcap", ".pcapng",
  ".pem", ".crt", ".key", ".ppk",

  // Archivos de credenciales / sistema
  "shadow", "passwd", "ntds", "sam", "system", "security",

  // Otros útiles
  "put", // como pediste que se mantenga
  "scp", "mount", "umount",
  "tcpdump", "wireshark", "tshark",
  "netstat", "ss",
  "sudo", "su"
];


const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const LS_KEY = "oscp_notes_search_v2";

// Colores para cada palabra de búsqueda
const SEARCH_COLORS = [
  'rgba(255, 235, 59, 0.6)',   // amarillo
  'rgba(76, 175, 80, 0.6)',    // verde
  'rgba(244, 67, 54, 0.6)',    // rojo
  'rgba(33, 150, 243, 0.6)',   // azul
  'rgba(156, 39, 176, 0.6)'    // morado
];

// elementos globales
const sidebar      = $("#sidebar");
const overlay      = $("#overlay");
const menuBtn      = $("#menuBtn");
const closeSidebar = $("#closeSidebar");
const modulesList  = $("#modulesList");
const filterModule = $("#filterModule");
const searchInput  = $("#searchInput");
const searchBtn    = $("#searchBtn");
const clearBtn     = $("#clearBtn");
const noResults    = $("#noResults");
const yearEl       = $("#year");

// mapeo de H2 ID a su sección contenedora
let h2ToSectionMap = new Map();

document.addEventListener("DOMContentLoaded", () => {
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  setupSections();
  buildH2ToSectionMap();
  populateModuleSelect();
  buildDynamicTOC();
  loadLastSearch();
  bindEvents();
  highlightCodeBlocks();
});

/* -------------------------
   Normalizar texto para búsqueda mejorada
   ------------------------- */
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* -------------------------
   Crear mapeo H2 -> Section
   ------------------------- */
function buildH2ToSectionMap() {
  h2ToSectionMap.clear();
  const allH2 = $$("h2");
  
  allH2.forEach(h2 => {
    if (!h2.id) h2.id = generateIdFromText(h2.textContent || "module");
    
    let section = h2.closest('section, .section-block');
    
    if (!section) {
      section = findOrCreateVirtualSection(h2);
    }
    
    h2ToSectionMap.set(h2.id, section);
  });
}

/* -------------------------
   Encontrar o crear sección virtual para H2
   ------------------------- */
function findOrCreateVirtualSection(h2) {
  if (h2.dataset.sectionId) {
    return document.querySelector(`[data-section-id="${h2.dataset.sectionId}"]`);
  }
  
  const sectionId = 'section-' + h2.id;
  h2.dataset.sectionId = sectionId;
  
  const allH2s = $$("h2");
  const currentIndex = allH2s.indexOf(h2);
  const nextH2 = allH2s[currentIndex + 1];
  
  return {
    isVirtual: true,
    sectionId: sectionId,
    startElement: h2,
    endElement: nextH2 || null,
    style: {},
    dataset: {}
  };
}

/* -------------------------
   Guardar HTML original
   ------------------------- */
function setupSections() {
  const secs = $$('#content section, #content .section-block');
  secs.forEach(s => {
    if (!s.dataset.originalHtml) {
      s.dataset.originalHtml = s.innerHTML;
    }
  });
}

/* -------------------------
   Poblar <select> con H2
   ------------------------- */
function populateModuleSelect() {
  if (!filterModule) return;
  filterModule.innerHTML = '<option value="">Todos los módulos</option>';

  const allH2 = $$("h2");
  allH2.forEach(h2 => {
    if (!h2.id) h2.id = generateIdFromText(h2.textContent || "module");
    const opt = document.createElement("option");
    opt.value = h2.id;
    opt.textContent = h2.innerText.trim();
    filterModule.appendChild(opt);
  });
}

function generateIdFromText(txt) {
  return (txt || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, "");
}

/* -------------------------
   Eventos
   ------------------------- */
function bindEvents() {
  if (menuBtn) menuBtn.addEventListener("click", () => toggleSidebar(true));
  if (closeSidebar) closeSidebar.addEventListener("click", () => toggleSidebar(false));
  if (overlay) overlay.addEventListener("click", () => toggleSidebar(false));

  if (searchBtn) searchBtn.addEventListener("click", doSearch);
  if (searchInput) {
    searchInput.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); doSearch(); }
      if (e.key === "Escape") clearSearch();
    });
  }
  if (clearBtn) clearBtn.addEventListener("click", clearSearch);

  if (filterModule) {
    filterModule.addEventListener("change", doSearch);
  }
}

/* -------------------------
   Sidebar
   ------------------------- */
function toggleSidebar(open) {
  if (!sidebar || !overlay) return;
  sidebar.classList.toggle("active", open);
  overlay.classList.toggle("active", open);
}

/* -------------------------
   Utilidades regex/escape
   ------------------------- */
function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* -------------------------
   Restaurar sección a HTML original
   ------------------------- */
function restoreOriginal(section) {
  if (!section) return;
  
  if (section.isVirtual) {
    showVirtualSection(section);
    return;
  }
  
  if (section.dataset && section.dataset.originalHtml) {
    section.innerHTML = section.dataset.originalHtml;
  }
  section.style.display = "";
  section.querySelectorAll('*').forEach(el => el.style.removeProperty('display'));
}

/* -------------------------
   Manejar visibilidad de secciones virtuales
   ------------------------- */
function showVirtualSection(virtualSection) {
  let current = virtualSection.startElement;
  while (current && current !== virtualSection.endElement) {
    if (current.style) current.style.display = "";
    current = current.nextElementSibling;
  }
}

function hideVirtualSection(virtualSection) {
  let current = virtualSection.startElement;
  while (current && current !== virtualSection.endElement) {
    if (current.style) current.style.display = "none";
    current = current.nextElementSibling;
  }
}

/* -------------------------
   Limpiar <mark> previos
   ------------------------- */
function clearMarks(root = document) {
  Array.from((root || document).querySelectorAll('mark')).forEach(m => {
    const txt = document.createTextNode(m.textContent);
    m.parentNode.replaceChild(txt, m);
  });
  if (root && root.normalize) root.normalize();
}

/* -------------------------
   BÚSQUEDA MEJORADA x200
   ------------------------- */
function wordMatchesInText(word, text) {
  if (!word || !text) return false;
  
  const normalizedWord = normalizeText(word);
  const normalizedText = normalizeText(text);
  
  if (!normalizedWord) return false;
  
  return normalizedText.includes(normalizedWord);
}

/* -------------------------
   Resaltar términos con COLORES DIFERENTES
   ------------------------- */
function highlightTermsInNode(node, words) {
  if (!node || !words || words.length === 0) return;
  const IGNORES = ['SCRIPT', 'STYLE', 'MARK'];

  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
  const replacements = [];

  let t;
  while ((t = walker.nextNode())) {
    const parentTag = t.parentNode && t.parentNode.nodeName;
    if (parentTag && IGNORES.includes(parentTag)) continue;

    let original = t.nodeValue;
    let replaced = false;
    let candidate = original;

    words.forEach((w, index) => {
      if (!w) return;
      
      const normalizedWord = normalizeText(w);
      if (!normalizedWord) return;

      const escapedWord = escapeRegex(w);
      
      const pattern = escapedWord
        .split('')
        .map(char => {
          const accentMap = {
            'a': '[aáàäâ]', 'e': '[eéèëê]', 'i': '[iíìïî]', 
            'o': '[oóòöô]', 'u': '[uúùüû]', 'n': '[nñ]',
            'A': '[AÁÀÄÂ]', 'E': '[EÉÈËÊ]', 'I': '[IÍÌÏÎ]',
            'O': '[OÓÒÖÔ]', 'U': '[UÚÙÜÛ]', 'N': '[NÑ]'
          };
          return accentMap[char] || escapeRegex(char);
        })
        .join('');

      const r = new RegExp(pattern, "gi");
      
      if (r.test(candidate)) {
        replaced = true;
        candidate = candidate.replace(r, `@@MSTART${index}@@$&@@MEND${index}@@`);
      }
    });

    if (replaced) replacements.push({ node: t, html: candidate });
  }

  replacements.forEach(it => {
    const span = document.createElement("span");
    let html = escapeHtml(it.html);
    
    words.forEach((w, index) => {
      const color = SEARCH_COLORS[index % SEARCH_COLORS.length];
      const startTag = `<mark style="background-color: ${color}; padding: 2px 0; border-radius: 2px;">`;
      const endTag = '</mark>';
      
      html = html.replace(
        new RegExp(`@@MSTART${index}@@`, 'g'),
        startTag
      );
      html = html.replace(
        new RegExp(`@@MEND${index}@@`, 'g'),
        endTag
      );
    });

    span.innerHTML = html;
    it.node.parentNode.replaceChild(span, it.node);
  });
}

/* -------------------------
   Obtener todas las secciones únicas
   ------------------------- */
function getAllSections() {
  const sections = new Set();
  
  $$('#content section, #content .section-block').forEach(s => sections.add(s));
  h2ToSectionMap.forEach(section => sections.add(section));
  
  return Array.from(sections);
}

/* -------------------------
   🔥 doSearch: LÓGICA MEJORADA CON FILTRADO COMBINADO 🔥
   
   FLUJO DE TRABAJO:
   1. Si hay módulo seleccionado → PRIMERO filtra por módulo
   2. Si hay búsqueda → LUEGO busca SOLO dentro del módulo filtrado
   3. Resultado: búsqueda segmentada por sección
   ------------------------- */
function doSearch() {
  const raw = (searchInput && searchInput.value) ? searchInput.value.trim() : "";
  const words = raw.split(/\s+/).map(s => s.trim()).filter(Boolean);
  const moduleID = filterModule ? filterModule.value : "";

  const allSections = getAllSections();

  // Restaurar todo primero
  allSections.forEach(sec => {
    if (sec.isVirtual) {
      showVirtualSection(sec);
    } else {
      restoreOriginal(sec);
    }
  });
  clearMarks(document);

  saveLastSearch(raw, moduleID);

  // ============================================
  // PASO 1: Determinar secciones a considerar
  // ============================================
  let sectionsToSearch = [];
  
  if (moduleID) {
    // Si hay módulo seleccionado, SOLO buscar en esa sección
    const targetSection = h2ToSectionMap.get(moduleID);
    if (targetSection) {
      sectionsToSearch = [targetSection];
      
      // Ocultar TODAS las demás secciones
      allSections.forEach(sec => {
        if (sec !== targetSection) {
          if (sec.isVirtual) {
            hideVirtualSection(sec);
          } else {
            sec.style.display = "none";
          }
        }
      });
    }
  } else {
    // Si NO hay módulo, buscar en TODAS las secciones
    sectionsToSearch = allSections;
  }

  // ============================================
  // PASO 2: Si no hay búsqueda, mostrar sección(es) completa(s)
  // ============================================
  if (words.length === 0) {
    if (moduleID) {
      // Mostrar solo la sección del módulo seleccionado
      const targetSection = h2ToSectionMap.get(moduleID);
      if (targetSection) {
        if (targetSection.isVirtual) {
          showVirtualSection(targetSection);
        } else {
          targetSection.style.display = "";
        }
        
        // Scroll al H2
        const h2Element = document.getElementById(moduleID);
        if (h2Element) {
          setTimeout(() => {
            h2Element.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }
      }
    } else {
      // Mostrar todas las secciones
      allSections.forEach(sec => {
        if (sec.isVirtual) {
          showVirtualSection(sec);
        } else {
          sec.style.display = "";
        }
      });
    }
    
    if (noResults) noResults.hidden = true;
    return;
  }

  // ============================================
  // PASO 3: Aplicar búsqueda en secciones filtradas
  // ============================================
  let visibleSections = 0;
  
  sectionsToSearch.forEach(sec => {
    const hasMatch = filterAndHighlightSection(sec, words);
    if (hasMatch) visibleSections++;
  });

  // ============================================
  // PASO 4: Mostrar resultados
  // ============================================
  if (noResults) noResults.hidden = (visibleSections > 0);
  
  if (visibleSections > 0) {
    scrollToFirstMatch();
  } else {
    // Si hay módulo pero no resultados, mostrar mensaje específico
    if (moduleID) {
      if (noResults) {
        const targetSection = h2ToSectionMap.get(moduleID);
        const h2 = document.getElementById(moduleID);
        const moduleName = h2 ? h2.textContent.trim() : 'este módulo';
        noResults.innerHTML = `<p>No se encontraron resultados para "<strong>${raw}</strong>" en <strong>${moduleName}</strong>.</p>`;
        noResults.hidden = false;
      }
    }
  }
}

/* -------------------------
   Filtrar y resaltar una sección
   ------------------------- */
function filterAndHighlightSection(section, words) {
  if (!section || !words || words.length === 0) return false;

  const rootElement = section.isVirtual ? section.startElement.parentElement : section;
  
  const candidates = Array.from(rootElement.querySelectorAll(
    'p, li, pre, code, h2, h3, h4, h5, h6, td, th, dt, dd, blockquote, span, div, a'
  ));

  if (candidates.length === 0) {
    const sectionText = rootElement.textContent || "";
    const allMatch = words.some(w => wordMatchesInText(w, sectionText));
    
    if (allMatch) {
      if (section.isVirtual) {
        showVirtualSection(section);
      } else {
        section.style.display = "";
      }
      highlightTermsInNode(rootElement, words);
      return true;
    } else {
      if (section.isVirtual) {
        hideVirtualSection(section);
      } else {
        section.style.display = "none";
      }
      return false;
    }
  }

  let anyVisible = false;
  
  candidates.forEach(node => {
    const nodeText = node.textContent || "";
    const matchesNode = words.some(w => wordMatchesInText(w, nodeText));
    
    if (matchesNode) {
      node.style.display = "";
      highlightTermsInNode(node, words);
      anyVisible = true;
    } else {
      node.style.display = "none";
    }
  });

  if (!anyVisible) {
    const sectionText = rootElement.textContent || "";
    const sectionMatch = words.some(w => wordMatchesInText(w, sectionText));
    
    if (sectionMatch) {
      if (section.isVirtual) {
        showVirtualSection(section);
      } else {
        section.style.display = "";
      }
      highlightTermsInNode(rootElement, words);
      anyVisible = true;
    }
  }

  if (section.isVirtual) {
    if (anyVisible) {
      showVirtualSection(section);
    } else {
      hideVirtualSection(section);
    }
  } else {
    section.style.display = anyVisible ? "" : "none";
  }

  return anyVisible;
}

/* -------------------------
   Auto-scroll al primer <mark>
   ------------------------- */
function scrollToFirstMatch() {
  const m = document.querySelector("mark");
  if (!m) return;
  const top = m.getBoundingClientRect().top + window.scrollY - 100;
  window.scrollTo({ top, behavior: "smooth" });
}

/* -------------------------
   Limpiar búsqueda
   ------------------------- */
function clearSearch() {
  if (searchInput) searchInput.value = "";
  if (filterModule) filterModule.value = "";
  localStorage.removeItem(LS_KEY);

  const allSections = getAllSections();
  allSections.forEach(sec => {
    if (sec.isVirtual) {
      showVirtualSection(sec);
    } else {
      restoreOriginal(sec);
    }
  });
  
  clearMarks(document);
  if (noResults) {
    noResults.innerHTML = '<p>No se encontraron resultados para tu búsqueda.</p>';
    noResults.hidden = true;
  }
}

/* -------------------------
   Guardar / cargar última búsqueda
   ------------------------- */
function saveLastSearch(q, moduleId) {
  const data = { query: q || "", module: moduleId || "" };
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch(e) {}
}

function loadLastSearch() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.query && searchInput) searchInput.value = data.query;
    if (data.module && filterModule) filterModule.value = data.module;
    if ((data.query && data.query.trim()) || (data.module && data.module.trim())) {
      doSearch();
    }
  } catch(e) {}
}

/* -------------------------
   Highlight dentro de <pre><code>
   ------------------------- */
function highlightCodeBlocks() {
  $$("pre code").forEach(block => {
    let text = block.textContent || "";

    text = text.replace(/^(\s*#.*)$/gm, (m) => `<span class="code-comment">${escapeHtml(m)}</span>`);

    KEYWORDS.forEach(kw => {
      const rx = new RegExp("\\b" + escapeRegex(kw) + "\\b", "gi");
      text = text.replace(rx, (m) => `<span class="code-keyword">${escapeHtml(m)}</span>`);
    });

    block.innerHTML = text;
  });
}

/* -------------------------
   TOC Dinámico
   ------------------------- */
function buildDynamicTOC() {
  if (!modulesList) return;
  modulesList.innerHTML = "";

  const headings = $$("h2, h3, h4, h5, h6");
  const tree = [];
  const stack = [];

  headings.forEach(h => {
    const level = parseInt(h.tagName.substring(1), 10);

    const node = {
      id: h.id || h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      text: h.textContent.trim(),
      level,
      children: []
    };

    h.id = node.id;

    if (stack.length === 0 || level === 2) {
      tree.push(node);
      stack.length = 0;
      stack.push(node);
      return;
    }

    while (stack.length && stack[stack.length - 1].level >= level) stack.pop();

    if (stack.length) stack[stack.length - 1].children.push(node);
    else tree.push(node);

    stack.push(node);
  });

  modulesList.appendChild(buildLevel(tree, 2));

  modulesList.addEventListener("click", e => {
    const link = e.target.closest(".toc-link");
    if (!link) return;

    e.preventDefault();

    const li = link.parentElement;
    const children = li._children;

    if (children && children.length > 0) {
      li.classList.toggle("open");
      const existing = li.querySelector(":scope > ul");

      if (li.classList.contains("open")) {
        if (!existing) li.appendChild(buildLevel(children, children[0].level));
      } else {
        if (existing) existing.remove();
      }
    }

    const target = document.getElementById(link.dataset.target);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function buildLevel(nodes, level) {
  const ul = document.createElement("ul");
  ul.className = "toc-ul level-" + level;
  nodes.forEach(node => {
    const li = document.createElement("li");
    li.className = "toc-item";
    li._children = node.children;
    const a = document.createElement("a");
    a.href = "#";
    a.className = "toc-link";
    a.dataset.target = node.id;
    a.textContent = node.text;
    li.appendChild(a);
    if (node.children.length > 0) li.classList.add("has-children");
    ul.appendChild(li);
  });
  return ul;
}
