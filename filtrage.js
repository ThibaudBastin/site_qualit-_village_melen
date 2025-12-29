(async function () {
  try {
    const [optRes, artRes, lieuxRes] = await Promise.all([
      fetch('options.json'),
      fetch('articles.json'),
      fetch('lieux.json')
    ]);
    const options = await optRes.json();
    const articles = await artRes.json();
    const lieuxRaw = await lieuxRes.json();

    // normaliser lieux en map par id
    const lieuxList = Array.isArray(lieuxRaw) ? lieuxRaw : Object.values(lieuxRaw || {});
    const lieuxMap = {};
    lieuxList.forEach(l => {
      if (l && l.id != null) lieuxMap[String(l.id)] = l;
    });

    const selRue = document.getElementById('filterRue');
    const selPer = document.getElementById('filterPeriode');
    const selFam = document.getElementById('filterFamille');
    const selThe = document.getElementById('filterTheme');
    const container = document.getElementById('articlesList');

    // Normaliser options.rues en tableau d'objets { index, id, nom }
    const normalizedRues = Array.isArray(options.rues)
      ? options.rues.map((r, i) => {
          if (r && typeof r === 'object') {
            return { index: String(i), id: String(r.id ?? i), nom: String(r.nom ?? r.name ?? '') };
          }
          // string case
          return { index: String(i), id: String(i), nom: String(r ?? '') };
        })
      : [];

    function fillSelect(id, arr, placeholder, isRueObjects = false) {
      const sel = document.getElementById(id);
      if (!sel) return;
      sel.innerHTML = '';
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = placeholder;
      sel.appendChild(opt);

      (arr || []).forEach((item, i) => {
        const o = document.createElement('option');
        if (isRueObjects) {
          // item is { index, id, nom }
          o.value = item.index;
          o.textContent = item.nom || item.id || `Rue ${item.index}`;
        } else {
          if (typeof item === 'string') {
            o.value = String(i);
            o.textContent = item;
          } else if (item && typeof item === 'object') {
            o.value = String(item.id ?? i);
            o.textContent = item.nom ?? item.name ?? String(item);
          } else {
            o.value = String(i);
            o.textContent = String(item);
          }
        }
        sel.appendChild(o);
      });
    }

    fillSelect('filterRue', normalizedRues, 'Toutes', true);
    fillSelect('filterPeriode', options.periodes || [], 'Toutes');
    fillSelect('filterFamille', options.familles || [], 'Tous');
    fillSelect('filterTheme', options.themes || [], 'Tous');

    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    // resolve article -> { name: string, linkParam: string }
    function resolveLieuForArticle(a) {
      if (a == null || a.rueId == null) return { name: '', linkParam: '' };

      // If numeric index (number or numeric string) => index into options.rues
      if (typeof a.rueId === 'number' || (/^\d+$/.test(String(a.rueId)))) {
        const idx = Number(a.rueId);
        const entry = normalizedRues[idx];
        if (entry) {
          // try map to lieux by entry.id
          const lieu = lieuxMap[String(entry.id)];
          if (lieu) return { name: String(lieu.nom || lieu.name || entry.nom || ''), linkParam: String(lieu.id) };
          // fallback to name from options
          return { name: String(entry.nom || entry.id || ''), linkParam: String(entry.index) };
        }
        // no options entry found -> treat as string fallback
      }

      // treat as string id (could be lieu.id or option entry id)
      const rid = String(a.rueId);
      // direct match to lieux
      if (lieuxMap[rid]) return { name: String(lieuxMap[rid].nom || lieuxMap[rid].name || ''), linkParam: rid };

      // maybe options.rues contains an object with id === rid
      const optionMatch = normalizedRues.find(r => r.id === rid || r.nom === rid);
      if (optionMatch) {
        const lieu = lieuxMap[String(optionMatch.id)];
        if (lieu) return { name: String(lieu.nom || lieu.name || optionMatch.nom), linkParam: String(lieu.id) };
        return { name: String(optionMatch.nom || optionMatch.id), linkParam: optionMatch.index };
      }

      // last attempt: match by name (case-insensitive) against lieux.nom
      const lowerRid = rid.trim().toLowerCase();
      const foundByName = lieuxList.find(l => String(l.nom || l.name || '').trim().toLowerCase() === lowerRid);
      if (foundByName) return { name: String(foundByName.nom || foundByName.name || ''), linkParam: String(foundByName.id) };

      // nothing found
      return { name: '', linkParam: '' };
    }

    function applyFilters(allArticles) {
      const fRue = selRue ? selRue.value : '';
      const fPer = selPer ? selPer.value : '';
      const fFam = selFam ? selFam.value : '';
      const fThe = selThe ? selThe.value : '';

      const filtered = (allArticles || []).filter(a => {
        if (fRue !== '' && String(a.rueId) !== fRue) return false;
        if (fPer !== '' && String(a.periode) !== fPer) return false;
        if (fFam !== '' && String(a.famille) !== fFam) return false;
        if (fThe !== '' && String(a.theme) !== fThe) return false;
        return true;
      });

      renderArticles(filtered);
    }

    function renderArticles(list) {
      container.innerHTML = '';
      if (!list || !list.length) {
        container.textContent = 'Aucun article trouvé.';
        return;
      }

      list.forEach(a => {
        const div = document.createElement('div');
        div.className = 'article-item';

        let mediaHtml = '';
        if (a.image) {
          mediaHtml = `<img src="${escapeHtml(a.image)}" alt="${escapeHtml(a.title||'')}" style="max-width:100%;border-radius:6px;">`;
        } else if (a.video) {
          mediaHtml = `<video controls style="max-width:100%;border-radius:6px;"><source src="${escapeHtml(a.video)}" type="video/mp4">Votre navigateur ne supporte pas la vidéo.</video>`;
        }

        const lieu = resolveLieuForArticle(a);
        const rueHtml = lieu.name ? `<a href="carte.html?rue=${encodeURIComponent(lieu.linkParam)}">📍 ${escapeHtml(lieu.name)}</a>` : '';

        const periodeName = (a.periode != null && options.periodes && options.periodes[a.periode]) ? options.periodes[a.periode] : '';
        const familleName = (a.famille != null && options.familles && options.familles[a.famille]) ? options.familles[a.famille] : '';
        const themeName = (a.theme != null && options.themes && options.themes[a.theme]) ? options.themes[a.theme] : '';

        const metaParts = [];
        if (rueHtml) metaParts.push(rueHtml);
        if (periodeName) metaParts.push('🕰 ' + escapeHtml(periodeName));
        if (familleName) metaParts.push('👨‍👩‍👧 ' + escapeHtml(familleName));
        if (themeName) metaParts.push('🏷 ' + escapeHtml(themeName));

        const metaHtml = metaParts.length ? `<p>${metaParts.join(' • ')}</p>` : '';

        div.innerHTML = `
          <h3>${escapeHtml(a.title || 'Sans titre')}</h3>
          ${mediaHtml}
          ${metaHtml}
          ${a.file ? `
            <p>
                <a href="article.html?file=${encodeURIComponent(a.file)}">
                Lire l’article
                </a>
            </p>
            ` : ''}
        `;
        container.appendChild(div);
      });
    }

    // attach listeners
    [selRue, selPer, selFam, selThe].forEach(s => {
      if (s) s.addEventListener('change', () => applyFilters(articles));
    });

    applyFilters(articles);
  } catch (err) {
    console.error('Erreur fetch/options:', err);
    const container = document.getElementById('articlesList');
    if (container) container.textContent = 'Erreur lors du chargement des articles.';
  }
})();
