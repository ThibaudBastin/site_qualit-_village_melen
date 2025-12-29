(async function () {
  try {
    const [optRes, artRes] = await Promise.all([
      fetch('options.json'),
      fetch('articles.json')
    ]);
    const options = await optRes.json();
    const articles = await artRes.json();

    const selRue = document.getElementById('filterRue');
    const selPer = document.getElementById('filterPeriode');
    const selFam = document.getElementById('filterFamille');
    const selThe = document.getElementById('filterTheme');
    const container = document.getElementById('articlesList');

    function fillSelect(id, arr, placeholder) {
      const sel = document.getElementById(id);
      sel.innerHTML = '';
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = placeholder;
      sel.appendChild(opt);
      (arr || []).forEach((label, i) => {
        const o = document.createElement('option');
        o.value = String(i);
        o.textContent = label;
        sel.appendChild(o);
      });
    }

    fillSelect('filterRue', options.rues, 'Toutes');
    fillSelect('filterPeriode', options.periodes, 'Toutes');
    fillSelect('filterFamille', options.familles, 'Tous');
    fillSelect('filterTheme', options.themes, 'Tous');

    // apply filters and render
    function applyFilters(allArticles) {
      const fRue = selRue.value;
      const fPer = selPer.value;
      const fFam = selFam.value;
      const fThe = selThe.value;

      const filtered = allArticles.filter(a => {
        if (fRue !== '' && String(a.rueId) !== fRue) return false;
        if (fPer !== '' && String(a.periode) !== fPer) return false;
        if (fFam !== '' && String(a.famille) !== fFam) return false;
        if (fThe !== '' && String(a.theme) !== fThe) return false;
        return true;
      });

      renderArticles(filtered, options);
    }

    // render list of articles (articles use indices into options)
    function renderArticles(list, opts) {
      container.innerHTML = '';
      if (!list.length) {
        container.textContent = 'Aucun article trouvé.';
        return;
      }

      list.forEach(a => {
        const div = document.createElement('div');
        div.className = 'article-item';

        // media
        let mediaHtml = '';
        if (a.image) {
          mediaHtml = `<img src="${a.image}" alt="${escapeHtml(a.title || '')}" class="article-image" style="max-width:100%;border-radius:6px;">`;
        } else if (a.video) {
          mediaHtml = `
            <video class="article-video" controls style="max-width:100%;border-radius:6px;">
              <source src="${a.video}" type="video/mp4">
              Votre navigateur ne supporte pas la vidéo.
            </video>
          `;
        }

        const rueName = (a.rueId != null && opts.rues && opts.rues[a.rueId]) ? opts.rues[a.rueId] : '';
        const periodeName = (a.periode != null && opts.periodes && opts.periodes[a.periode]) ? opts.periodes[a.periode] : '';
        const familleName = (a.famille != null && opts.familles && opts.familles[a.famille]) ? opts.familles[a.famille] : '';
        const themeName = (a.theme != null && opts.themes && opts.themes[a.theme]) ? opts.themes[a.theme] : '';

        const rueLink = (a.rueId != null && rueName)
          ? `<a href="carte.html?rue=${a.rueId}">📍 ${escapeHtml(rueName)}</a>`
          : '';

        const metaParts = [];
        if (rueLink) metaParts.push(rueLink);
        if (periodeName) metaParts.push('🕰 ' + escapeHtml(periodeName));
        if (familleName) metaParts.push('👨‍👩‍👧 ' + escapeHtml(familleName));
        if (themeName) metaParts.push('🏷 ' + escapeHtml(themeName));

        const metaHtml = metaParts.length ? `<p>${metaParts.join('<br>')}</p>` : '';

        div.innerHTML = `
          <h3>${escapeHtml(a.title || 'Sans titre')}</h3>
          ${mediaHtml}
          ${metaHtml}
          ${a.file ? `<p><a href="${a.file}">Lire l’article</a></p>` : ''}
        `;

        container.appendChild(div);
      });
    }

    // escape helper simple
    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    // attach listeners
    [selRue, selPer, selFam, selThe].forEach(s => {
      s.addEventListener('change', () => applyFilters(articles));
    });

    // initial render
    applyFilters(articles);
  } catch (err) {
    console.error('Erreur fetch/options:', err);
    const container = document.getElementById('articlesList');
    if (container) container.textContent = 'Erreur lors du chargement des articles.';
  }
})();
