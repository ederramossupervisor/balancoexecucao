// Painel consolidado do VT 3. Usa sb, esc, dataBR, view e listaView definidos em app.js.
(function () {
  // A rota #/painel cai em listaView(); aqui ela é desviada para o painel.
  const _lista = listaView;
  listaView = function () { return location.hash === '#/painel' ? painelView() : _lista(); };

  const SIT = ['Realizada', 'Parcialmente realizada', 'Em andamento', 'Não realizada'];
  const COR = { 'Realizada': 'success', 'Parcialmente realizada': 'info', 'Em andamento': 'warning', 'Não realizada': 'danger' };
  const ABREV = { 'Realizada': 'R', 'Parcialmente realizada': 'P', 'Em andamento': 'A', 'Não realizada': 'N' };
  const card = (n, l) => `<div class="col-6 col-md-3"><div class="card text-center"><div class="card-body py-2">
    <div class="fs-4 fw-bold">${n}</div><small class="text-muted">${l}</small></div></div></div>`;

  async function painelView() {
    view.innerHTML = '<div class="text-muted">Carregando…</div>';
    const [vs, as, es, ec] = await Promise.all([
      sb.from('vt3_visitas').select('id,escola,data_visita,finalizada').order('data_visita', { ascending: false }),
      sb.from('vt3_acoes').select('visita_id,numero,acao_mapa,categoria,situacao_execucao,ponto_atencao,encaminhamentos'),
      sb.from('vt3_escutas').select('visita_id,realizada,sintese,evidencias,orientacao_2027'),
      sb.from('escolas').select('nome').order('nome')
    ]);
    const falha = [vs, as, es, ec].find(r => r.error);
    if (falha) return view.innerHTML = `<div class="alert alert-danger">${esc(falha.error.message)}</div>`;

    const visitas = vs.data, escolas = ec.data;
    const vmap = Object.fromEntries(visitas.map(v => [v.id, v]));
    const acoes = as.data.filter(x => x.acao_mapa || x.situacao_execucao);
    const cont = Object.fromEntries(SIT.map(s => [s, acoes.filter(x => x.situacao_execucao === s).length]));
    const semSit = acoes.filter(x => !x.situacao_execucao).length;
    const comVisita = new Set(visitas.map(v => v.escola));
    const finalizadas = visitas.filter(v => v.finalizada).length;
    const pct = n => acoes.length ? Math.round(100 * n / acoes.length) : 0;

    const escutasDe = id => es.data.filter(x => x.visita_id === id && (x.realizada || x.sintese || x.evidencias || x.orientacao_2027)).length;
    const acoesDe = id => acoes.filter(x => x.visita_id === id);

    // Categorias (texto livre: agrupa ignorando maiúsculas e espaços)
    const cats = {};
    acoes.forEach(x => {
      const k = (x.categoria || '').trim().toLowerCase();
      if (!k) return;
      cats[k] = cats[k] || { nome: x.categoria.trim(), n: 0, r: 0 };
      cats[k].n++;
      if (x.situacao_execucao === 'Realizada') cats[k].r++;
    });
    const topCats = Object.values(cats).sort((a, b) => b.n - a.n).slice(0, 10);

    const naoReal = acoes.filter(x => x.situacao_execucao === 'Não realizada');
    const semVt3 = escolas.filter(e => !comVisita.has(e.nome));

    view.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="m-0">Painel consolidado</h5><a href="#/" class="small">← Visitas</a></div>
      <div class="row g-2 mb-3">
        ${card(`${comVisita.size}/${escolas.length}`, 'escolas com VT 3')}
        ${card(`${finalizadas}/${visitas.length}`, 'visitas finalizadas')}
        ${card(acoes.length, 'ações registradas')}
        ${card(pct(cont['Realizada']) + '%', 'ações realizadas')}
      </div>

      <div class="card mb-3"><div class="card-body">
        <h6>Situação da execução das ações</h6>
        ${acoes.length ? `<div class="progress mb-2" style="height:26px">${SIT.filter(s => cont[s]).map(s =>
          `<div class="progress-bar bg-${COR[s]} ${COR[s] === 'warning' || COR[s] === 'info' ? 'text-dark' : ''}" style="width:${pct(cont[s])}%">${cont[s]}</div>`).join('')}</div>
        <div class="small">${SIT.map(s => `<span class="me-3"><span class="badge text-bg-${COR[s]}">&nbsp;</span> ${s} (${cont[s]})</span>`).join('')}
        ${semSit ? `<span class="text-muted">· sem situação informada: ${semSit}</span>` : ''}</div>` : '<span class="text-muted">Nenhuma ação preenchida ainda.</span>'}
      </div></div>

      <div class="card mb-3"><div class="card-body">
        <h6>Visitas por escola</h6>
        <div class="table-responsive"><table class="table table-sm align-middle mb-0">
          <thead><tr><th>Escola</th><th>Data</th><th>Status</th><th>Escutas</th><th>Ações (R/P/A/N)</th></tr></thead>
          <tbody>${visitas.map(v => {
            const a = acoesDe(v.id);
            const n = s => a.filter(x => x.situacao_execucao === s).length;
            return `<tr><td><a href="#/v/${v.id}">${esc(v.escola)}</a></td><td>${dataBR(v.data_visita)}</td>
              <td><span class="badge text-bg-${v.finalizada ? 'success' : 'warning'}">${v.finalizada ? 'Finalizada' : 'Em andamento'}</span></td>
              <td>${escutasDe(v.id)}/${GRUPOS.length}</td>
              <td>${SIT.map(s => n(s)).join(' / ')}</td></tr>`;
          }).join('') || '<tr><td colspan="5" class="text-muted">Nenhuma visita ainda.</td></tr>'}</tbody>
        </table></div>
      </div></div>

      ${topCats.length ? `<div class="card mb-3"><div class="card-body">
        <h6>Ações por categoria</h6>
        <div class="table-responsive"><table class="table table-sm mb-0">
          <thead><tr><th>Categoria</th><th>Ações</th><th>Realizadas</th></tr></thead>
          <tbody>${topCats.map(c => `<tr><td>${esc(c.nome)}</td><td>${c.n}</td><td>${c.r}</td></tr>`).join('')}</tbody>
        </table></div></div></div>` : ''}

      ${naoReal.length ? `<div class="card mb-3"><div class="card-body">
        <h6>Ações não realizadas</h6>
        <ul class="small mb-0 ps-3">${naoReal.map(x => `<li class="mb-2"><b>${esc((vmap[x.visita_id] || {}).escola)} · Ação ${x.numero}</b>${x.acao_mapa ? ': ' + esc(x.acao_mapa) : ''}
          ${x.ponto_atencao ? `<br><span class="text-muted">Ponto de atenção: ${esc(x.ponto_atencao)}</span>` : ''}
          ${x.encaminhamentos ? `<br><span class="text-muted">Encaminhamentos: ${esc(x.encaminhamentos)}</span>` : ''}</li>`).join('')}</ul>
      </div></div>` : ''}

      ${semVt3.length ? `<div class="card mb-3"><div class="card-body">
        <h6>Escolas ainda sem VT 3 (${semVt3.length})</h6>
        <div>${semVt3.map(e => `<span class="badge text-bg-light border me-1 mb-1">${esc(e.nome)}</span>`).join('')}</div>
      </div></div>` : ''}`;
  }
})();
