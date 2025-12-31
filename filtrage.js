(async function () {
  try {
    const [optRes, artRes] = await Promise.all([
      fetch('options.json'),
      fetch('articles.json')
    ]);
    const options = await optRes.json();
    const articles = await artRes.json();

    // normaliser lieux depuis options.rues
    const normalizedRues = Array.isArray(options.rues)
      ? options.rues.map((r, i) => ({
          index: String(i),
          id: String(r.id ?? i),
          nom: String(r.nom ?? r.name ?? ''),
          coords: r.coords || null
        }))
      : [];

    const lieuxMap = {};
    normalizedRues.forEach(l => {
      lieuxMap[l.id] = l;
    });

    const selRue = document.getElementById('filterRue');
    const selPer = document.getElementById('filterPeriode');
    const selFam = document.getElementById('filterFamille');
    const selThe = document.getElementById('filterTheme');
    const container = document.getElementById('articlesList');

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
          o.value = item.index;
          o.textContent = item.nom || item.id || `Rue ${item.index}`;
        } else {
          o.value = String(i);
          o.textContent = item;
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

    function resolveLieuForArticle(a) {
      if (!a || a.rueId == null) return { name: '', linkParam: '' };

      const idx = typeof a.rueId === 'number' ? a.rueId : Number(a.rueId);
      if (!isNaN(idx) && normalizedRues[idx]) {
        const r = normalizedRues[idx];
        return { name: r.nom, linkParam: r.id };
      }

      const r = lieuxMap[String(a.rueId)];
      if (r) return { name: r.nom, linkParam: r.id };

      return { name: '', linkParam: '' };
    }

    function applyFilters(allArticles) {
      const fRue = selRue.value;
      const fPer = selPer.value;
      const fFam = selFam.value;
      const fThe = selThe.value;

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
