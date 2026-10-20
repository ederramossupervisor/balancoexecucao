// Importar ações do Plano de Ação (PDF). Usa sb, $, esc, toast, PRIORIDADES, CATEGORIAS e visitaView (app.js).
// O pdf.js é carregado só quando o botão é usado.
(function () {
  const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/';
  const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  // colunas do plano que viram campos da ação (a parte da visita fica em branco)
  const CAMPOS = ['acao_mapa', 'desafio', 'problema', 'produto_esperado', 'resultado_esperado', 'prioridade', 'categoria'];
  const ROT = {
    acao_mapa: 'Ação', desafio: 'Desafio', problema: 'Problema', produto_esperado: 'Produto esperado',
    resultado_esperado: 'Resultado esperado', prioridade: 'Prioridade', categoria: 'Categoria'
  };

  let carregando;
  const carregar = () => carregando ||= new Promise((ok, no) => {
    if (window.pdfjsLib) return ok();
    const s = document.createElement('script');
    s.src = PDFJS + 'pdf.min.js';
    s.onload = () => { pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; ok(); };
    s.onerror = () => { carregando = null; no(new Error('pdf.js')); };
    document.head.appendChild(s);
  });

  // Páginas → linhas (agrupadas pela posição vertical) → itens com posição x
  async function paginasDe(pdf) {
    const paginas = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const tc = await (await pdf.getPage(p)).getTextContent();
      const its = tc.items.filter(i => i.str && i.str.trim())
        .map(i => ({ s: i.str.trim(), x: i.transform[4], y: i.transform[5], w: i.width || 0 }))
        .sort((a, b) => b.y - a.y || a.x - b.x);
      const linhas = [];
      for (const it of its) {
        const l = linhas.find(l => Math.abs(l.y - it.y) <= 2.5);
        l ? l.it.push(it) : linhas.push({ y: it.y, it: [it] });
      }
      linhas.forEach(l => { l.it.sort((a, b) => a.x - b.x); l.t = l.it.map(i => i.s).join(' '); });
      paginas.push(linhas.sort((a, b) => b.y - a.y));
    }
    return paginas;
  }

  const casar = (v, lista) => {
    const n = norm(v);
    return lista.find(o => norm(o) === n) || lista.find(o => n.includes(norm(o)) || norm(o).includes(n)) || (v.length <= 40 ? v : null);
  };
  function limpar(a) {
    const o = {};
    for (const c of CAMPOS) {
      const v = String(a[c] ?? '').replace(/\s+/g, ' ').trim();
      if (v) o[c] = v;
    }
    if (o.prioridade) o.prioridade = casar(o.prioridade, PRIORIDADES);
    if (o.categoria) o.categoria = casar(o.categoria, CATEGORIAS);
    return o;
  }

  // PDF do "Circuito de Gestão": cada rótulo em negrito fica numa linha e o texto vem logo abaixo.
  // Estrutura: "N. Problema" (Problema, Desafio, Prioridade) → "N. Ação" (Nome da ação, Categoria, Produto/Resultado esperado) → "N. Tarefa" (ignorada).
  const ROTULOS = {
    'problema': 'problema', 'desafio': 'desafio', 'prioridade': 'prioridade', 'nome da acao': 'acao_mapa',
    'produto esperado': 'produto_esperado', 'resultado esperado': 'resultado_esperado', 'categoria': 'categoria'
  };
  const OUTROS = new Set(['ofertas de ensino', 'descricao', 'premissa', 'publico-alvo', 'justificativa do produto', 'status do produto',
    'justificativa do resultado', 'responsavel', 'colaboradores', 'nome', 'inicio previsto', 'termino previsto']);
  const TITULOS = new Set(['dados do problema', 'objetivos estrategicos', 'dados do plano', 'composicao do plano', 'lista dos problemas']);
  const RUIDO = /^(pagina \d+ de \d+|gerado em .*|\d+ (objetivos?|acoes?|tarefas?))$/; // cabeçalho, rodapé e "1 objetivos 1 ações 6 tarefas"
  const ehRotulo = n => n in ROTULOS || OUTROS.has(n);

  function documento(paginas) {
    const acoes = []; let sec = null, p = null, a = null, slots = [];
    const fecha = () => {
      for (const s of slots) {
        const col = ROTULOS[s.l], v = s.t.join(' ');
        if (!col) continue;
        if (sec === 'problema' && p && ['problema', 'desafio', 'prioridade'].includes(col)) p[col] = v;
        else if (sec === 'acao' && a && col === 'categoria') (a.cats ||= []).push(v);
        else if (sec === 'acao' && a && ['acao_mapa', 'produto_esperado', 'resultado_esperado'].includes(col)) a[col] = v;
      }
      slots = [];
    };
    for (const linhas of paginas) for (const l of linhas) {
      const its = l.it.filter(i => !RUIDO.test(norm(i.s)));
      if (!its.length) continue;
      const t = norm(its.map(i => i.s).join(' '));
      const m = t.match(/^\d+\.\s*(problema|acao|tarefa)$/);
      if (m) {
        fecha(); sec = m[1];
        if (sec === 'problema') p = {};
        if (sec === 'acao') { a = { p }; acoes.push(a); }
        continue;
      }
      if (TITULOS.has(t)) { fecha(); continue; }
      if (!sec) continue;
      if (its.every(i => ehRotulo(norm(i.s)))) { fecha(); slots = its.map(i => ({ l: norm(i.s), x: i.x, t: [] })); continue; } // ex.: Categoria | Premissa | Categoria | Público-alvo
      if (ehRotulo(t)) { fecha(); slots = [{ l: t, x: i0(its), t: [] }]; continue; }
      its.forEach(i => { let s = slots[0]; slots.forEach(k => { if (i.x + 4 >= k.x) s = k; }); s && s.t.push(i.s); });
    }
    fecha();
    const catOk = c => CATEGORIAS.some(o => norm(o) === norm(c));
    return acoes.map(a => limpar({
      acao_mapa: a.acao_mapa, desafio: a.p?.desafio, problema: a.p?.problema, produto_esperado: a.produto_esperado,
      resultado_esperado: a.resultado_esperado, prioridade: a.p?.prioridade,
      categoria: (a.cats || []).find(catOk) || (a.cats || []).slice(-1)[0] // há 2 "Categoria": a do tipo (Protagonismo) e a pedagógica
    })).filter(o => o.acao_mapa);
  }
  const i0 = its => its[0].x;

  const analisar = paginas => ({ modo: 'Plano do Circuito de Gestão', acoes: documento(paginas) });

  if (typeof module !== 'undefined') { module.exports = { paginasDe, analisar }; return; }

  function preview(vid, existentes, nome, modo, acoes, paginas) {
    const texto = paginas.map((ls, p) => `--- página ${p + 1} ---\n` + ls.map(l => l.it.map(i => `${Math.round(i.x)}:${i.s}`).join(' | ')).join('\n')).join('\n');
    const cards = acoes.map((a, k) => `<div class="card mb-2"><div class="card-body p-2 small">
      <div class="form-check mb-1"><input class="form-check-input" type="checkbox" id="imp${k}" checked>
      <label class="form-check-label fw-semibold" for="imp${k}">Ação ${k + 1}</label></div>
      ${Object.keys(ROT).filter(c => a[c] || c === 'acao_mapa').map(c => `<div><span class="text-muted">${ROT[c]}:</span> ${a[c] ? esc(a[c]) : '<i class="text-danger">não encontrado</i>'}</div>`).join('')}
    </div></div>`).join('');
    $('#imp-modal')?.remove();
    document.body.insertAdjacentHTML('beforeend', `<div class="modal fade" id="imp-modal" tabindex="-1"><div class="modal-dialog modal-lg modal-dialog-scrollable"><div class="modal-content">
      <div class="modal-header"><h6 class="modal-title">Importar do Plano de Ação</h6><button class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body">
        <div class="small text-muted mb-2">${esc(nome)} · leitura em modo <b>${modo}</b> · ${acoes.length} ação(ões) encontrada(s)</div>
        ${acoes.length ? cards : '<div class="alert alert-warning">Não consegui identificar ações neste PDF. Copie o texto lido abaixo para ajustarmos a leitura.</div>'}
        <details class="mt-3"><summary class="small">Texto lido do PDF (posição x : texto)</summary>
          <button id="imp-copiar" class="btn btn-outline-secondary btn-sm my-2">Copiar texto lido</button>
          <pre class="small bg-light border rounded p-2" style="max-height:260px;overflow:auto;white-space:pre-wrap">${esc(texto.slice(0, 20000))}</pre></details>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button>
        <button id="imp-ok" class="btn btn-primary btn-sm" ${acoes.length ? '' : 'disabled'}>Importar ações</button></div>
    </div></div></div>`);
    const el = $('#imp-modal'), m = new bootstrap.Modal(el);
    el.addEventListener('hidden.bs.modal', () => el.remove());
    $('#imp-copiar').onclick = () => navigator.clipboard.writeText(texto).then(() => toast('Texto copiado'), () => toast('Não foi possível copiar', false));
    $('#imp-ok').onclick = async () => {
      const sel = acoes.filter((_, k) => $('#imp' + k).checked);
      if (!sel.length) return toast('Nenhuma ação selecionada', false);
      const base = existentes.reduce((mx, x) => Math.max(mx, x.numero || 0), 0);
      $('#imp-ok').disabled = true;
      const { error } = await sb.from('vt3_acoes').insert(sel.map((a, k) => ({ visita_id: vid, numero: base + k + 1, ...a })));
      if (error) { $('#imp-ok').disabled = false; return toast('Erro ao importar', false); }
      m.hide();
      toast(sel.length + ' ação(ões) importada(s)');
      visitaView(vid, { aba: 'p3' });
    };
    m.show();
  }

  window.importarPlano = (vid, existentes) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/pdf';
    inp.onchange = async () => {
      const f = inp.files[0];
      if (!f) return;
      toast('Lendo PDF…');
      try {
        await carregar();
        const pdf = await pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise;
        const paginas = await paginasDe(pdf);
        const { modo, acoes } = analisar(paginas);
        preview(vid, existentes, f.name, modo, acoes, paginas);
      } catch (e) { toast('Não foi possível ler o PDF', false); }
    };
    inp.click();
  };
})();
