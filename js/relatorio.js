// Relatório PDF da visita VT 3. Usa sb, GRUPOS, CAMPOS_ACAO e toast definidos em app.js.
(function () {
  const btn = document.getElementById('pdf');
  const idAtual = () => (location.hash.match(/^#\/v\/(.+)$/) || [])[1];
  const mostrar = () => btn.classList.toggle('d-none', !idAtual());
  window.addEventListener('hashchange', mostrar);
  mostrar();

  const fmt = d => new Date(d + 'T12:00').toLocaleDateString('pt-BR');
  const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  const vazio = x => x == null || String(x).trim() === '';

  btn.onclick = async () => {
    const id = idAtual();
    btn.disabled = true;
    try {
      await new Promise(r => setTimeout(r, 500)); // deixa salvar o campo que estava em edição
      const [v, e, a] = await Promise.all([
        sb.from('vt3_visitas').select('*').eq('id', id).single(),
        sb.from('vt3_escutas').select('*').eq('visita_id', id),
        sb.from('vt3_acoes').select('*').eq('visita_id', id).order('numero')
      ]);
      if (v.error || !v.data) throw new Error('visita');
      gerar(v.data, e.data || [], a.data || []);
    } catch (err) {
      toast('Não foi possível gerar o PDF', false);
    }
    btn.disabled = false;
  };

  function gerar(vis, escutas, acoes) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('VT 3 - Balanço da Execução do Plano de Ação', 14, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`${vis.escola} · ${fmt(vis.data_visita)}`, 14, 25);

    const kv = (titulo, linhas) => {
      const y0 = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 32;
      doc.autoTable({
        startY: y0,
        head: [[{ content: titulo, colSpan: 2 }]],
        body: linhas,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2, valign: 'top' },
        headStyles: { fillColor: [13, 110, 253] },
        columnStyles: { 0: { cellWidth: 42, fontStyle: 'bold', fillColor: [245, 247, 250] } },
        margin: { left: 14, right: 14, bottom: 16 }
      });
    };

    const doGrupo = g => escutas.find(x => x.grupo === g);
    const temRegistro = x => x && (x.realizada || !vazio(x.sintese) || !vazio(x.evidencias) || !vazio(x.orientacao_2027));
    const ouvidos = GRUPOS.filter(g => temRegistro(doGrupo(g)));
    const semRegistro = GRUPOS.filter(g => !temRegistro(doGrupo(g)));

    kv('Identificação', [
      ['Escola', vis.escola],
      ['Data da visita', fmt(vis.data_visita)],
      ['Participantes da escola', vis.participantes_escola || '-'],
      ['Supervisor(a)/SRE', vis.supervisora_nome || vis.supervisor || '-'],
      ['Escuta registrada com', ouvidos.join(', ') || '-'],
      ['Sem registro de escuta', semRegistro.join(', ') || '-']
    ]);

    ouvidos.forEach(g => {
      const x = doGrupo(g);
      kv(`Escuta da comunidade escolar - ${g}`, [
        ['Síntese das percepções', x.sintese || '-'],
        ['Exemplos ou evidências', x.evidencias || '-'],
        ['Como a escuta orienta o Plano de 2027', x.orientacao_2027 || '-']
      ]);
    });

    acoes.filter(x => CAMPOS_ACAO.some(([c]) => !vazio(x[c]))).forEach(x => {
      kv(`Balanço das ações - Ação ${x.numero}`, CAMPOS_ACAO.map(([c, l]) => [l, x[c] || '-']));
    });

    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`${vis.escola} · VT 3 · página ${i} de ${n}`, 14, 290);
    }

    doc.save(`VT3_${slug(vis.escola)}_${vis.data_visita}.pdf`);
  }
})();
