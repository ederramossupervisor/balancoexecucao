const sb = supabase.createClient(
  'https://kcdlyfejflyyaplterjt.supabase.co',
  'sb_publishable_KMiNhwsv2_7zDu7xLuAZag_XIeUFYlm'
);
const $ = s => document.querySelector(s);
const view = $('#view');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dataBR = d => new Date(d + 'T12:00').toLocaleDateString('pt-BR');

// Roteiro da escuta (temas e perguntas norteadoras do instrumento)
const ROTEIRO = {
  'Equipe Gestora': {
    t: 'Avanços na execução do Plano de Ação; incidência das ações nos desafios prioritários; monitoramento dos indicadores e resultados da escola; desafios que permaneceram ao longo do ano; prioridades para o próximo planejamento.',
    q: [
      'Quais foram os principais avanços da escola na execução do Plano de Ação ao longo do ano?',
      'Quais ações apresentaram maior incidência nos desafios identificados inicialmente? Que evidências sustentam essa avaliação?',
      'Quais desafios permaneceram, apesar das estratégias desenvolvidas e das correções de rota realizadas?',
      'Quais foram as principais dificuldades enfrentadas para garantir a frequência dos estudantes?',
      'Que ações foram realizadas diante das faltas recorrentes e quais resultados foram observados?',
      'O que a escola considera necessário manter, modificar ou priorizar no Plano de Ação para 2027?'
    ]
  },
  'Pedagogas': {
    t: 'Acompanhamento pedagógico e intervenções nas aprendizagens; monitoramento dos resultados dos estudantes; estratégias de recomposição das aprendizagens; articulação entre planejamento, avaliação e intervenções; práticas pedagógicas a manter ou aprimorar.',
    q: [
      'Quais estratégias de acompanhamento pedagógico contribuíram mais para a aprendizagem dos estudantes?',
      'Quais dificuldades de aprendizagem permaneceram mais evidentes ao longo dos três trimestres?',
      'Como os resultados das avaliações e os registros de acompanhamento foram utilizados para orientar intervenções pedagógicas?',
      'Que estratégias ou ações precisam ser fortalecidas ou reformuladas no próximo ano?'
    ]
  },
  'Coordenadores': {
    t: 'Indisciplina e convivência escolar; acompanhamento e intervenção junto aos estudantes; comunicação e parceria com as famílias; frequência escolar e prevenção da infrequência; estratégias de prevenção e resolução de conflitos.',
    q: [
      'Quais foram as situações de indisciplina mais recorrentes durante o ano? Que estratégias foram adotadas e quais apresentaram melhores resultados?',
      'Como foi realizado o acompanhamento dos estudantes que apresentaram dificuldades de comportamento, participação ou adaptação à rotina escolar? Houve mudanças ao longo do ano?',
      'Como ocorreu o contato com as famílias diante de situações de indisciplina ou dificuldades de frequência? Quais estratégias favoreceram uma maior participação e parceria dos responsáveis?',
      'As ações desenvolvidas contribuíram para prevenir a reincidência de situações de indisciplina e faltas? Que evidências permitem avaliar essa contribuição?',
      'Quais estratégias de acompanhamento, contato com as famílias e intervenção junto aos estudantes devem ser mantidas, aprimoradas ou implementadas no próximo Plano de Ação?'
    ]
  },
  'PCAs': {
    t: 'Estratégias pedagógicas desenvolvidas nas áreas de conhecimento; monitoramento dos descritores e resultados de aprendizagem; intervenções diante das dificuldades de aprendizagem; articulação e compartilhamento de práticas entre professores; estratégias de ensino a manter ou aprimorar.',
    q: [
      'Quais estratégias desenvolvidas nas áreas de conhecimento contribuíram para melhorar a aprendizagem dos estudantes?',
      'Como o acompanhamento dos descritores, das avaliações e dos resultados dos estudantes subsidiou o planejamento dos professores?',
      'Quais dificuldades de aprendizagem permaneceram mais evidentes nas respectivas áreas de conhecimento?',
      'Que práticas pedagógicas apresentaram resultados positivos e devem ser mantidas ou ampliadas no próximo Plano de Ação?'
    ]
  },
  'PCI': {
    t: 'Metodologias ativas e práticas inovadoras de ensino; uso pedagógico de recursos tecnológicos e ferramentas digitais; formação e acompanhamento dos professores para implementação de metodologias inovadoras; monitoramento das rotinas e práticas de inovação na escola; contribuições das estratégias de inovação para o engajamento e a aprendizagem dos estudantes; desafios e prioridades para o aprimoramento das práticas de inovação no próximo ano.',
    q: [
      'Quais ações contribuíram para ampliar o envolvimento dos estudantes nas atividades escolares?',
      'Como as atividades desenvolvidas favoreceram a articulação entre os componentes curriculares e os desafios do Plano de Ação?',
      'Quais projetos ou estratégias apresentaram maior participação dos estudantes e evidências de aprendizagem?',
      'Que ações ou projetos precisam ser mantidos, reformulados ou planejados para o próximo ano?'
    ]
  },
  'Professores da Base': {
    t: 'Estratégias de ensino e aprendizagem; dificuldades de aprendizagem e intervenções realizadas; participação, engajamento e frequência dos estudantes; resultados das ações pedagógicas desenvolvidas; práticas que funcionaram e desafios para o próximo ano.',
    q: [
      'O que mais contribuiu para a aprendizagem dos estudantes durante o ano? Cite uma estratégia ou experiência concreta.',
      'Quais dificuldades os estudantes apresentaram com maior frequência e como foram trabalhadas?',
      'Que mudanças você percebeu na participação, no interesse, na frequência ou no desempenho dos estudantes?',
      'Que estratégia pedagógica deveria permanecer no próximo ano?'
    ]
  },
  'Professores do AEE': {
    t: 'Aprendizagem, participação e autonomia dos estudantes público-alvo da Educação Especial; identificação e enfrentamento das barreiras à aprendizagem; articulação entre AEE, professores da Base e equipe pedagógica; recursos e estratégias de acessibilidade e inclusão; necessidades de apoio e aprimoramento para o próximo ano.',
    q: [
      'Quais ações contribuíram para ampliar a participação, a aprendizagem e a autonomia dos estudantes público-alvo da Educação Especial?',
      'Quais barreiras à aprendizagem e à participação foram identificadas ao longo do ano? Que estratégias foram adotadas para enfrentá-las?',
      'Como ocorreu a articulação entre o AEE, os professores da Base e a equipe pedagógica? O que favoreceu ou dificultou esse trabalho?',
      'Que recursos, estratégias ou formas de acompanhamento precisam ser mantidos ou aprimorados no próximo ano?'
    ]
  },
  'Líderes de turma': {
    t: 'Aprendizagem e estratégias que mais ajudaram os estudantes; participação e envolvimento nas atividades escolares; convivência, respeito e relacionamento entre os estudantes; frequência escolar e dificuldades para participar das aulas; sugestões dos estudantes para melhorar a escola no próximo ano.',
    q: [
      'Quais atividades ou estratégias fizeram os alunos se sentirem mais motivados a participar das aulas?',
      'O que dificultou a aprendizagem ou a participação dos estudantes durante o ano?',
      'O que a escola deveria continuar fazendo? O que precisa melhorar ou ser prioridade no próximo ano?'
    ]
  }
};
const GRUPOS = Object.keys(ROTEIRO);

// Listas fixas (vindas dos Planos de Ação do Circuito de Gestão 2026)
const SITUACOES = ['Realizada', 'Parcialmente realizada', 'Não realizada', 'Em andamento'];
const COR_SIT = { 'Realizada': 'success', 'Parcialmente realizada': 'info', 'Em andamento': 'warning', 'Não realizada': 'danger' };
const CATEGORIAS = ['Pedagógico', 'Gestão de pessoas', 'Vulnerabilidade e aspectos socioemocionais'];
const PRIORIDADES = ['Crítica', 'Alta', 'Média'];

// [coluna, rótulo, tipo, opções (só para tipo 'sel')]
const CAMPOS_ACAO = [
  ['acao_mapa', 'Ação (mapa)', 'area'], ['desafio', 'Desafio', 'area'],
  ['problema', 'Problema', 'area'], ['produto_esperado', 'Produto esperado', 'area'],
  ['resultado_esperado', 'Resultado esperado', 'area'],
  ['prioridade', 'Prioridade', 'sel', PRIORIDADES],
  ['categoria', 'Categoria', 'sel', CATEGORIAS],
  ['situacao_execucao', 'Situação da execução', 'sel', SITUACOES],
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
  else if (kind === 'sel') {
    // valor já salvo que não está na lista continua visível
    const lista = val && !opts.includes(val) ? [...opts, val] : opts;
    el = `<select class="form-select" ${a}><option value=""></option>${lista.map(o => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  } else el = `<input class="form-control" type="${kind}" value="${esc(val)}" ${a}>`;
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

// Excluir ação e renumerar as restantes (1, 2, 3...)
document.addEventListener('click', async e => {
  const id = e.target.dataset.delAcao;
  if (!id) return;
  if (!confirm('Excluir esta ação? Não é possível desfazer.')) return;
  e.target.disabled = true;
  const vid = location.hash.slice(3);
  const { data: del, error } = await sb.from('vt3_acoes').delete().eq('id', id).select('id');
  if (error || !del || !del.length) { e.target.disabled = false; return toast('Não foi possível excluir', false); }
  const { data: resto } = await sb.from('vt3_acoes').select('id,numero').eq('visita_id', vid).order('numero');
  for (let i = 0; i < (resto || []).length; i++) {
    if (resto[i].numero !== i + 1) await sb.from('vt3_acoes').update({ numero: i + 1 }).eq('id', resto[i].id);
  }
  toast('Ação excluída');
  visitaView(vid, { aba: 'p3' });
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
    if (r1.error) toast('Visita criada, mas houve erro ao montar os formulários', false);
    location.hash = '#/v/' + v.id;
  };
}

// ---------- Visita (3 abas) ----------
const roteiroHtml = g => {
  const r = ROTEIRO[g];
  if (!r) return '';
  return `<details class="mb-3" open><summary class="fw-semibold text-primary">Roteiro da escuta</summary>
    <div class="small bg-light border rounded p-2 mt-2">
      <div class="mb-2"><b>Temas:</b> ${esc(r.t)}</div>
      <b>Perguntas norteadoras:</b>
      <ol class="mb-0 ps-3">${r.q.map(q => `<li class="mb-1">${esc(q)}</li>`).join('')}</ol>
    </div></details>`;
};

const escutaHtml = (x, i) => `<div class="accordion-item">
  <h2 class="accordion-header"><button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#e${i}">${esc(x.grupo)}${x.realizada ? ' ✓' : ''}</button></h2>
  <div id="e${i}" class="accordion-collapse collapse"><div class="accordion-body">
    ${roteiroHtml(x.grupo)}
    <div class="form-check mb-3"><input class="form-check-input" type="checkbox" id="r${i}" ${x.realizada ? 'checked' : ''} data-t="vt3_escutas" data-id="${x.id}" data-c="realizada"><label class="form-check-label" for="r${i}">Escuta realizada</label></div>
    ${fld('vt3_escutas', x.id, 'sintese', 'Síntese das percepções', x.sintese, 'area')}
    ${fld('vt3_escutas', x.id, 'evidencias', 'Exemplos ou evidências', x.evidencias, 'area')}
    ${fld('vt3_escutas', x.id, 'orientacao_2027', 'Como a escuta orienta o Plano de 2027', x.orientacao_2027, 'area')}
  </div></div></div>`;

const acaoHtml = (x, i) => `<div class="accordion-item">
  <h2 class="accordion-header"><button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#a${i}"><span class="me-2">Ação ${x.numero}${x.acao_mapa ? ' · ' + esc(x.acao_mapa.slice(0, 40)) : ''}</span>${x.situacao_execucao ? `<span class="badge text-bg-${COR_SIT[x.situacao_execucao] || 'secondary'}">${esc(x.situacao_execucao)}</span>` : ''}</button></h2>
  <div id="a${i}" class="accordion-collapse collapse"><div class="accordion-body">
    ${CAMPOS_ACAO.map(([c, l, k, o]) => fld('vt3_acoes', x.id, c, l, x[c], k, o)).join('')}
    <button class="btn btn-outline-danger btn-sm" data-del-acao="${x.id}">Excluir ação</button>
  </div></div></div>`;

async function visitaView(id, opts = {}) {
  view.innerHTML = '<div class="text-muted">Carregando…</div>';
  const [v, e, a] = await Promise.all([
    sb.from('vt3_visitas').select('*').eq('id', id).single(),
    sb.from('vt3_escutas').select('*').eq('visita_id', id),
    sb.from('vt3_acoes').select('*').eq('visita_id', id).order('numero')
  ]);
  if (v.error) return view.innerHTML = `<a href="#/" class="small">← Visitas</a><div class="alert alert-danger mt-2">${esc(v.error.message)}</div>`;
  const vis = v.data, T = 'vt3_visitas';
  const escutas = GRUPOS.map(g => (e.data || []).find(x => x.grupo === g)).filter(Boolean);
  const acoes = a.data || [];
  view.innerHTML = `<a href="#/" class="small">← Visitas</a>
    <h5 class="mt-2">${esc(vis.escola)} <small class="text-muted">· ${dataBR(vis.data_visita)}</small></h5>
    <ul class="nav nav-pills mb-3">
      <li class="nav-item"><button class="nav-link active" data-bs-toggle="pill" data-bs-target="#p1">Identificação</button></li>
      <li class="nav-item"><button class="nav-link" data-bs-toggle="pill" data-bs-target="#p2">Escuta</button></li>
      <li class="nav-item"><button class="nav-link" data-bs-toggle="pill" data-bs-target="#p3">Ações${acoes.length ? ` (${acoes.length})` : ''}</button></li>
    </ul>
    <div class="tab-content">
      <div class="tab-pane fade show active" id="p1">
        ${fld(T, id, 'data_visita', 'Data da visita', vis.data_visita, 'date')}
        ${fld(T, id, 'participantes_escola', 'Participantes da escola', vis.participantes_escola, 'area')}
        ${fld(T, id, 'supervisora_nome', 'Supervisora/SRE', vis.supervisora_nome)}
        <button id="fin" class="btn btn-${vis.finalizada ? 'outline-secondary' : 'success'}">${vis.finalizada ? 'Reabrir visita' : 'Marcar como finalizada'}</button>
      </div>
      <div class="tab-pane fade" id="p2"><div class="accordion">${escutas.map(escutaHtml).join('')}</div></div>
      <div class="tab-pane fade" id="p3">
        <div class="d-flex flex-wrap gap-2 mb-3">
          <button id="nova-acao" class="btn btn-primary btn-sm">+ Inserir nova ação</button>
          <button id="imp-plano" class="btn btn-outline-primary btn-sm">Importar do Plano de Ação</button>
        </div>
        ${acoes.length ? `<div class="accordion">${acoes.map(acaoHtml).join('')}</div>` : '<p class="text-muted">Nenhuma ação inserida ainda.</p>'}
      </div>
    </div>`;
  $('#nova-acao').onclick = async ev => {
    const btn = ev.currentTarget;
    btn.disabled = true;
    const numero = acoes.reduce((m, x) => Math.max(m, x.numero || 0), 0) + 1;
    const { data: nova, error } = await sb.from('vt3_acoes').insert({ visita_id: id, numero }).select('id').single();
    if (error) { btn.disabled = false; return toast('Erro ao inserir ação', false); }
    visitaView(id, { aba: 'p3', abrirAcao: nova.id });
  };
  $('#imp-plano').onclick = () => importarPlano(id, acoes);
  if (opts.aba) {
    new bootstrap.Tab($(`[data-bs-target="#${opts.aba}"]`)).show();
    const i = acoes.findIndex(x => x.id === opts.abrirAcao);
    if (i >= 0) {
      const col = $('#a' + i);
      col.classList.add('show');
      col.previousElementSibling.querySelector('button').classList.remove('collapsed');
      col.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
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
