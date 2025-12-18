fetch('articles.json')
  .then(res => res.json())
  .then(articles => {
    populateFilters(articles);
    renderArticles(articles);

    document.querySelectorAll('.filters select')
      .forEach(select => {
        select.addEventListener('change', () => {
          applyFilters(articles);
        });
      });
  });

function populateFilters(articles) {
  fillSelect('filterRue', articles.map(a => a.rue));
  fillSelect('filterPeriode', articles.map(a => a.periode));
  fillSelect('filterFamille', articles.map(a => a.famille));
  fillSelect('filterTheme', articles.map(a => a.theme));
}

function fillSelect(id, values) {
  const select = document.getElementById(id);
  [...new Set(values.filter(v => v))].sort().forEach(v => {
    const option = document.createElement('option');
    option.value = v;
    option.textContent = v;
    select.appendChild(option);
  });
}

function applyFilters(articles) {
  const filters = {
    rue: document.getElementById('filterRue').value,
    periode: document.getElementById('filterPeriode').value,
    famille: document.getElementById('filterFamille').value,
    theme: document.getElementById('filterTheme').value
  };

  const filtered = articles.filter(a =>
    (!filters.rue || a.rue === filters.rue) &&
    (!filters.periode || a.periode === filters.periode) &&
    (!filters.famille || a.famille === filters.famille) &&
    (!filters.theme || a.theme === filters.theme)
  );

  renderArticles(filtered);
}

function renderArticles(list) {
  const container = document.getElementById('articlesList');
  container.innerHTML = '';

  list.forEach(a => {
    const div = document.createElement('div');
    div.className = 'article-item';
    div.innerHTML = `
      <h3>${a.title}</h3>
      <p>
        ${a.rue ? '📍 ' + a.rue + '<br>' : ''}
        ${a.periode ? '🕰 ' + a.periode + '<br>' : ''}
        ${a.famille ? '👨‍👩‍👧 ' + a.famille + '<br>' : ''}
        ${a.theme ? '🏷 ' + a.theme : ''}
      </p>
      <a href="${a.file}">Lire l’article</a>
    `;
    container.appendChild(div);
  });
}
