const sb = supabase.createClient(
  'https://kcdlyfejflyyaplterjt.supabase.co',
  'sb_publishable_KMiNhwsv2_7zDu7xLuAZag_XIeUFYlm'
);
const $ = s => document.querySelector(s);
const view = $('#view');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dataBR = d => new Date(d + 'T12:00').toLocaleDateString('pt-BR');

const GRUPOS = ['Equipe Gestora', 'Pedagogas', 'Coordenadores', 'PCAs', 'PCI',
  'Professores da Base', 'Professores do AEE', 'Líderes de turma'];
const SITUACOES = ['Realizada', 'Parcialmente realizada', 'Não realizada', 'Em andamento'];
const CAMPOS_ACAO = [
  ['acao_mapa', 'Ação (mapa)', 'area'], ['desafio', 'Desafio', 'area'],
  ['problema', 'Problema', 'area'], ['produto_esperado', 'Produto esperado', 'area'],
  ['resultado_esperado', 'Resultado esperado', 'area'], ['prioridade', 'Prioridade', 'text'],
  ['categoria', 'Categoria', 'text'], ['situacao_execucao', 'Situação da execução', 'sel'],
  ['principal_avanco', 'Principal avanço', 'area'], ['ponto_atencao', 'Ponto de atenção', 'area'],
  ['evidencias', 'Evidências', 'area'], ['indicador', 'Indicador', 'area'],
  ['prioridades_2027', 'Prioridades para 2027', 'area'], ['encaminhamentos', 'Encaminhamentos', 'area']
];

function toast(m, ok = true) {
  const t = $('#toast');
  t.textContent = m;
  t.className = 'badge text-bg-' + (ok ? 'success' : 'danger');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.add('d-none'), 1800);
}

// Campo com salvamento automático (data-t = tabela, data-id = linha, data-c = coluna)
const fld = (t, id, c, label, val, kind = 'text', opts = []) => {
  const a = `data-t="${t}" data-id="${id}" data-c="${c}"`;
  let el;
  if (kind === 'area') el = `<textarea class="form-control" rows="3" ${a}>${esc(val)}</textarea>`;
  else if (kind === 'sel') el = `<select class="form-select" ${a}><option value=""></option>${opts.map(o => `<option ${o === val ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  else el = `<input class="form-control" type="${kind}" value="${esc(val)}" ${a}>`;
  return `<div class="mb-3"><label class="form-label fw-semibold">${label}</label>${el}</div>`;
};

document.addEventListener('change', async e => {
  const d = e.target.dataset;
  if (!d.t) return;
  let v = e.target.type === 'checkbox' ? e.target.checked : e.target.value.trim();
  if (v === '') { if (d.c === 'data_visita') return; v = null; }
  const { error } = await sb.from(d.t).update({ [d.c]: v }).eq('id', d.id);
  toast(error ? 'Erro ao salvar' : 'Salvo', !error);
});

// ---------- Login ----------
function loginView() {
  view.innerHTML = `<div class="mx-auto" style="max-width:380px">
    <h5 class="mb-3">Entrar</h5>
    <input id="em" type="email" class="form-control mb-2" placeholder="E-mail" autocomplete="username">
    <input id="pw" type="password" class="form-control mb-2" placeholder="Senha" autocomplete="current-password">
    <button id="go" class="btn btn-primary w-100">Entrar</button>
    <div id="msg" class="text-danger small mt-2"></div></div>`;
  $('#go').onclick = async () => {
    const { error } = await sb.auth.signInWithPassword({ email: $('#em').value.trim(), password: $('#pw').value });
    if (error) $('#msg').textContent = 'E-mail ou senha inválidos.';
    else route();
  };
}

// ---------- Lista de visitas ----------
async function listaView() {
  view.innerHTML = '<div class="text-muted">Carregando…</div>';
  const { data, error } = await sb.from('vt3_visitas')
    .select('id,escola,data_visita,finalizada').order('data_visita', { ascending: false });
  if (error) return view.innerHTML = `<div class="alert alert-danger">${esc(error.message)}</div>`;
  view.innerHTML = `<div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="m-0">Visitas</h5><a href="#/nova" class="btn btn-primary btn-sm">+ Nova visita</a></div>` +
    (data.length ? data.map(v => `<a href="#/v/${v.id}" class="card mb-2 text-decoration-none">
      <div class="card-body d-flex justify-content-between">
        <div><div class="fw-semibold">${esc(v.escola)}</div><small class="text-muted">${dataBR(v.data_visita)}</small></div>
        <span class="badge text-bg-${v.finalizada ? 'success' : 'warning'} align-self-center">${v.finalizada ? 'Finalizada' : 'Em andamento'}</span>
      </div></a>`).join('') : '<p class="text-muted">Nenhuma visita ainda.</p>');
}

// ---------- Nova visita ----------
async function novaView() {
  const { data: escolas, error } = await sb.from('escolas').select('nome').order('nome');
  if (error) return view.innerHTML = `<div class="alert alert-danger">${esc(error.message)}</div>`;
  if (!escolas.length) return view.innerHTML = '<a href="#/" class="small">← Visitas</a><div class="alert alert-warning mt-2">Nenhuma escola disponível para o seu usuário.</div>';
  view.innerHTML = `<a href="#/" class="small">← Visitas</a><h5 class="mt-2 mb-3">Nova visita</h5>
    <div class="mb-3"><label class="form-label fw-semibold">Escola</label>
      <select id="n-esc" class="form-select">${escolas.map(s => `<option>${esc(s.nome)}</option>`).join('')}</select></div>
    <div class="mb-3"><label class="form-label fw-semibold">Data da visita</label>
      <input id="n-data" type="date" class="form-control" value="${new Date().toLocaleDateString('sv-SE')}"></div>
    <button id="n-go" class="btn btn-primary w-100">Criar visita</button>
    <div id="n-msg" class="text-danger small mt-2"></div>`;
  $('#n-go').onclick = async () => {
    const { data: v, error } = await sb.from('vt3_visitas')
      .insert({ escola: $('#n-esc').value, data_visita: $('#n-data').value }).select('id').single();
    if (error) return $('#n-msg').textContent = error.message;
    const r1 = await sb.from('vt3_escutas').insert(GRUPOS.map(grupo => ({ visita_id: v.id, grupo })));
    const r2 = await sb.from('vt3_acoes').insert(Array.from({ length: 10 }, (_, i) => ({ visita_id: v.id, numero: i + 1 })));
    if (r1.error || r2.error) toast('Visita criada, mas houve erro ao montar os formulários', false);
    location.hash = '#/v/' + v.id;
  };
}

// ---------- Visita (3 abas) ----------
const escutaHtml = (x, i) => `<div class="accordion-item">
  <h2 class="accordion-header"><button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#e${i}">${esc(x.grupo)}${x.realizada ? ' ✓' : ''}</button></h2>
  <div id="e${i}" class="accordion-collapse collapse"><div class="accordion-body">
    <div class="form-check mb-3"><input class="form-check-input" type="checkbox" id="r${i}" ${x.realizada ? 'checked' : ''} data-t="vt3_escutas" data-id="${x.id}" data-c="realizada"><label class="form-check-label" for="r${i}">Escuta realizada</label></div>
    ${fld('vt3_escutas', x.id, 'sintese', 'Síntese das percepções', x.sintese, 'area')}
    ${fld('vt3_escutas', x.id, 'evidencias', 'Exemplos ou evidências', x.evidencias, 'area')}
    ${fld('vt3_escutas', x.id, 'orientacao_2027', 'Como a escuta orienta o Plano de 2027', x.orientacao_2027, 'area')}
  </div></div></div>`;

const acaoHtml = (x, i) => `<div class="accordion-item">
  <h2 class="accordion-header"><button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#a${i}">Ação ${x.numero}${x.acao_mapa ? ' · ' + esc(x.acao_mapa.slice(0, 40)) : ''}</button></h2>
  <div id="a${i}" class="accordion-collapse collapse"><div class="accordion-body">
    ${CAMPOS_ACAO.map(([c, l, k]) => fld('vt3_acoes', x.id, c, l, x[c], k, SITUACOES)).join('')}
  </div></div></div>`;

async function visitaView(id) {
  view.innerHTML = '<div class="text-muted">Carregando…</div>';
  const [v, e, a] = await Promise.all([
    sb.from('vt3_visitas').select('*').eq('id', id).single(),
    sb.from('vt3_escutas').select('*').eq('visita_id', id),
    sb.from('vt3_acoes').select('*').eq('visita_id', id).order('numero')
  ]);
  if (v.error) return view.innerHTML = `<a href="#/" class="small">← Visitas</a><div class="alert alert-danger mt-2">${esc(v.error.message)}</div>`;
  const vis = v.data, T = 'vt3_visitas';
  const escutas = GRUPOS.map(g => (e.data || []).find(x => x.grupo === g)).filter(Boolean);
  view.innerHTML = `<a href="#/" class="small">← Visitas</a>
    <h5 class="mt-2">${esc(vis.escola)} <small class="text-muted">· ${dataBR(vis.data_visita)}</small></h5>
    <ul class="nav nav-pills mb-3">
      <li class="nav-item"><button class="nav-link active" data-bs-toggle="pill" data-bs-target="#p1">Identificação</button></li>
      <li class="nav-item"><button class="nav-link" data-bs-toggle="pill" data-bs-target="#p2">Escuta</button></li>
      <li class="nav-item"><button class="nav-link" data-bs-toggle="pill" data-bs-target="#p3">Ações</button></li>
    </ul>
    <div class="tab-content">
      <div class="tab-pane fade show active" id="p1">
        ${fld(T, id, 'data_visita', 'Data da visita', vis.data_visita, 'date')}
        ${fld(T, id, 'participantes_escola', 'Participantes da escola', vis.participantes_escola, 'area')}
        ${fld(T, id, 'supervisora_nome', 'Supervisora/SRE', vis.supervisora_nome)}
        <button id="fin" class="btn btn-${vis.finalizada ? 'outline-secondary' : 'success'}">${vis.finalizada ? 'Reabrir visita' : 'Marcar como finalizada'}</button>
      </div>
      <div class="tab-pane fade" id="p2"><div class="accordion">${escutas.map(escutaHtml).join('')}</div></div>
      <div class="tab-pane fade" id="p3"><div class="accordion">${(a.data || []).map(acaoHtml).join('')}</div></div>
    </div>`;
  $('#fin').onclick = async () => {
    const { error } = await sb.from(T).update({ finalizada: !vis.finalizada }).eq('id', id);
    if (error) return toast('Erro ao salvar', false);
    visitaView(id);
  };
}

// ---------- Rotas ----------
async function route() {
  const { data: { session } } = await sb.auth.getSession();
  $('#sair').classList.toggle('d-none', !session);
  if (!session) return loginView();
  const h = location.hash.slice(1) || '/';
  if (h === '/nova') return novaView();
  if (h.startsWith('/v/')) return visitaView(h.slice(3));
  return listaView();
}
window.addEventListener('hashchange', route);
sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT') route(); });
$('#sair').onclick = () => sb.auth.signOut();
route();
