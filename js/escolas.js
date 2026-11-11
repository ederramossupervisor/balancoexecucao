// Cadastro de escolas (#/escolas). Usa sb, $, esc, toast, view e listaView definidos em app.js.
(function () {
  const _lista = listaView;
  listaView = function () { return location.hash === '#/escolas' ? escolasView() : _lista(); };

  const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').toLowerCase().trim();
  const msgErro = e => /row-level security|permission denied/i.test(e.message) || e.code === '42501'
    ? 'O banco não permite cadastrar escolas por aqui (falta a política de INSERT na tabela "escolas"). Rode o SQL que enviei no SQL Editor do Supabase.'
    : e.message;

  async function escolasView() {
    view.innerHTML = '<div class="text-muted">Carregando…</div>';
    const { data: escolas, error } = await sb.from('escolas').select('*').order('nome');
    if (error) return view.innerHTML = `<a href="#/" class="small">← Início</a><div class="alert alert-danger mt-2">${esc(msgErro(error))}</div>`;

    view.innerHTML = `<div class="mx-auto" style="max-width:640px">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="m-0">Cadastrar escolas</h5><a href="#/" class="small">← Início</a></div>
      <label class="form-label fw-semibold" for="e-nomes">Nome da escola (uma por linha para cadastrar várias)</label>
      <textarea id="e-nomes" class="form-control mb-2" rows="4" placeholder="EEEFM Exemplo&#10;EMEF Outro Exemplo"></textarea>
      <button id="e-add" class="btn btn-primary w-100">Cadastrar</button>
      <div id="e-msg" class="small mt-2"></div>
      <hr class="my-4">
      <h6>Escolas cadastradas (${escolas.length})</h6>
      ${escolas.length ? `<ul class="list-group">${escolas.map(s => `<li class="list-group-item d-flex justify-content-between align-items-center">
        <span>${esc(s.nome)}</span>
        <button class="btn btn-outline-danger btn-sm" data-del-escola="${esc(s.nome)}">Excluir</button></li>`).join('')}</ul>`
        : '<p class="text-muted">Nenhuma escola cadastrada ainda.</p>'}
    </div>`;

    const msg = (t, ok) => { const m = $('#e-msg'); m.textContent = t; m.className = 'small mt-2 ' + (ok ? 'text-success' : 'text-danger'); };

    $('#e-add').onclick = async ev => {
      const btn = ev.currentTarget;
      const vistos = new Set(escolas.map(s => norm(s.nome)));
      const novos = [];
      for (const linha of $('#e-nomes').value.split('\n')) {
        const nome = linha.replace(/\s+/g, ' ').trim();
        if (nome && !vistos.has(norm(nome))) { vistos.add(norm(nome)); novos.push({ nome }); }
      }
      if (!novos.length) return msg('Digite pelo menos um nome novo (os que já existem são ignorados).', false);
      btn.disabled = true;
      const { error } = await sb.from('escolas').insert(novos);
      if (error) { btn.disabled = false; return msg(msgErro(error), false); }
      toast(novos.length === 1 ? 'Escola cadastrada' : novos.length + ' escolas cadastradas');
      escolasView();
    };

    view.querySelectorAll('[data-del-escola]').forEach(b => b.onclick = async () => {
      const nome = b.dataset.delEscola;
      if (!confirm(`Excluir a escola "${nome}"?\n\nAs visitas já registradas para ela não são apagadas.`)) return;
      b.disabled = true;
      const { data: del, error } = await sb.from('escolas').delete().eq('nome', nome).select('nome');
      if (error || !del || !del.length) { b.disabled = false; return msg(error ? msgErro(error) : 'Não foi possível excluir (sem permissão no banco).', false); }
      toast('Escola excluída');
      escolasView();
    });
  }

  // se a rota atual já era #/escolas quando o script carregou, reabre
  if (location.hash === '#/escolas') route();
})();
