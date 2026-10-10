
/**
 * Arquivo: admin.js
 * Descrição: Painel Administrativo do Barbeiro - Odivelas Barbearia
 * Sincronização via Supabase + localStorage redundante
 * Duração de cada agendamento: 40 minutos
 */

const NUMERO_BARBEARIA = '5591985793959';

const DB_KEYS = {
  USUARIO_LOGADO: 'odivelas_usuario_logado',
  AGENDAMENTOS: 'odivelas_agendamentos',
  BLOQUEIOS: 'odivelas_bloqueIOS',
  HISTORICO: 'odivelas_historico',
  SERVICOS: 'odivelas_servicos'
};

const DURACAO_AGENDAMENTO_MINUTOS = 40;

// Expediente: 09h às 12h e 14h às 22h.
// O último horário de início é calculado para o serviço terminar
// dentro do expediente.
const HORARIOS_PADRAO = gerarHorariosPadrao();

function gerarHorariosPadrao() {
  const horarios = [];

  const periodos = [
    { inicio: '09:00', fim: '12:00' },
    { inicio: '14:00', fim: '22:00' }
  ];

  periodos.forEach(periodo => {
    let minutos = converterHoraParaMinutos(periodo.inicio);
    const fim = converterHoraParaMinutos(periodo.fim);

    while (minutos + DURACAO_AGENDAMENTO_MINUTOS <= fim) {
      horarios.push(converterMinutosParaHora(minutos));
      minutos += DURACAO_AGENDAMENTO_MINUTOS;
    }
  });

  return horarios;
}

function converterHoraParaMinutos(hora) {
  if (!hora || typeof hora !== 'string') return 0;

  const partes = hora.split(':');
  return Number(partes[0]) * 60 + Number(partes[1] || 0);
}

function converterMinutosParaHora(minutos) {
  const horas = Math.floor(minutos / 60);
  const restante = minutos % 60;

  return `${String(horas).padStart(2, '0')}:${String(restante).padStart(2, '0')}`;
}

function horariosSeSobrepoem(horaA, duracaoA, horaB, duracaoB) {
  const inicioA = converterHoraParaMinutos(horaA);
  const inicioB = converterHoraParaMinutos(horaB);

  const fimA = inicioA + duracaoA;
  const fimB = inicioB + duracaoB;

  return inicioA < fimB && inicioB < fimA;
}

const SERVICOS_PADRAO = [
  { nome: 'Degradê', preco: 20 },
  { nome: 'Navalhado', preco: 25 },
  { nome: 'Barba', preco: 20 },
  { nome: 'Sobrancelha', preco: 5 },
  { nome: 'Social', preco: 20 },
  { nome: 'Corte + Barba', preco: 35 }
];

document.addEventListener('DOMContentLoaded', () => {
  verificarAcessoAdmin();
  inicializarDataHoje();
  carregarGradeHorariosAdmin();
  carregarTabelaAgendamentosAdmin();
  carregarGerenciadorServicos();
  atualizarIndicadoresTopo();
});

// 0. VERIFICA ACESSO ADMIN E DATA

function verificarAcessoAdmin() {
  const sessao = JSON.parse(
    localStorage.getItem(DB_KEYS.USUARIO_LOGADO) || '{}'
  );

  if (sessao.tipo !== 'admin' && sessao.email !== 'admin@odivelas.com') {
    alert('Acesso restrito ao Administrador.');
    window.location.href = 'login.html';
  }
}

function inicializarDataHoje() {
  const inputData = document.getElementById('adminDataFiltro');

  if (inputData && !inputData.value) {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');

    inputData.value = `${ano}-${mes}-${dia}`;
  }
}

// 1. NAVEGAÇÃO DE ABAS

function trocarAba(idAba, elementoBtn) {
  ['abaHorarios', 'abaAgendamentos', 'abaServicos'].forEach(aba => {
    const el = document.getElementById(aba);
    if (el) el.classList.add('hidden');
  });

  const abaAtiva = document.getElementById(idAba);
  if (abaAtiva) abaAtiva.classList.remove('hidden');

  document.querySelectorAll('.aba-btn').forEach(btn => {
    btn.classList.remove('bg-red-600', 'text-white');
    btn.classList.add('bg-zinc-900', 'text-zinc-400');
  });

  if (elementoBtn) {
    elementoBtn.classList.remove('bg-zinc-900', 'text-zinc-400');
    elementoBtn.classList.add('bg-red-600', 'text-white');
  }

  if (idAba === 'abaServicos') {
    carregarGerenciadorServicos();
  }
}

// 2. GRADE DE HORÁRIOS DO ADMIN

async function carregarGradeHorariosAdmin(dataFiltro) {
  const container =
    document.getElementById('gridHorariosAdmin') ||
    document.getElementById('gradeHorariosAdmin');

  if (!container) return;

  const inputData = document.getElementById('adminDataFiltro');
  const dataAlvo =
    dataFiltro ||
    inputData?.value ||
    (() => {
      const agora = new Date();
      return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
    })();

  container.innerHTML =
    '<p class="text-xs text-zinc-500 col-span-full text-center py-4">Carregando horários...</p>';

  try {
    const { data: agendamentosDb, error: erroAgendamentos } =
      await supabaseClient
        .from('agendamentos')
        .select('id, horario, cliente_nome, status')
        .eq('data', dataAlvo)
        .neq('status', 'cancelado');

    if (erroAgendamentos) throw erroAgendamentos;

    const { data: bloqueiosDb, error: erroBloqueios } =
      await supabaseClient
        .from('bloqueios')
        .select('horario')
        .eq('data', dataAlvo);

    if (erroBloqueios) throw erroBloqueios;

    const agendamentos = agendamentosDb || [];
    const bloqueios = bloqueiosDb || [];

    container.innerHTML = '';

    HORARIOS_PADRAO.forEach(horario => {
      const agendamentoSobreposto = agendamentos.find(a =>
        a.horario &&
        horariosSeSobrepoem(
          horario,
          DURACAO_AGENDAMENTO_MINUTOS,
          a.horario,
          DURACAO_AGENDAMENTO_MINUTOS
        )
      );

      const bloqueioSobreposto = bloqueios.find(b =>
        b.horario &&
        horariosSeSobrepoem(
          horario,
          DURACAO_AGENDAMENTO_MINUTOS,
          b.horario,
          DURACAO_AGENDAMENTO_MINUTOS
        )
      );

      const div = document.createElement('div');

      if (agendamentoSobreposto) {
        const clienteNome = agendamentoSobreposto.cliente_nome || 'Ocupado';

        div.className =
          'p-3 rounded-2xl bg-amber-500/20 border-2 border-amber-500/80 text-amber-300 flex flex-col justify-between shadow-lg shadow-amber-500/10 min-h-[85px]';

        div.innerHTML = `
          <div class="flex justify-between items-center w-full">
            <span class="font-black text-base sm:text-lg text-white">${horario}</span>
            <span class="text-[10px] font-extrabold uppercase bg-amber-500 text-black px-1.5 py-0.5 rounded-md">Ocupado</span>
          </div>
          <div class="mt-1 w-full">
            <p class="text-xs font-bold text-amber-200 truncate w-full"
               title="${escaparHTML(clienteNome)}">${escaparHTML(clienteNome)}</p>
          </div>
        `;
      } else if (bloqueioSobreposto) {
        div.className =
          'p-3 rounded-2xl bg-red-950/80 border-2 border-red-500 text-red-300 flex flex-col justify-between shadow-lg shadow-red-500/20 transition active:scale-95 cursor-pointer min-h-[85px]';

        div.onclick = () =>
          alternarBloqueioHorario(dataAlvo, bloqueioSobreposto.horario, true);

        div.innerHTML = `
          <div class="flex justify-between items-center w-full">
            <span class="font-black text-base sm:text-lg text-white">${horario}</span>
            <span class="text-[10px] font-extrabold uppercase bg-red-600 text-white px-1.5 py-0.5 rounded-md shadow">Bloqueado</span>
          </div>
          <span class="mt-1 text-xs font-bold text-red-400 hover:text-white underline text-left">
            Bloqueio: ${bloqueioSobreposto.horario}
          </span>
        `;
      } else {
        div.className =
          'p-3 rounded-2xl bg-emerald-950/50 border-2 border-emerald-500/70 text-emerald-300 flex flex-col justify-between shadow-lg shadow-emerald-500/10 transition active:scale-95 cursor-pointer min-h-[85px]';

        div.onclick = () =>
          alternarBloqueioHorario(dataAlvo, horario, false);

        div.innerHTML = `
          <div class="flex justify-between items-center w-full">
            <span class="font-black text-base sm:text-lg text-white">${horario}</span>
            <span class="text-[10px] font-extrabold uppercase bg-emerald-500 text-black px-1.5 py-0.5 rounded-md">Livre</span>
          </div>
          <span class="mt-1 text-xs font-semibold text-emerald-400 hover:text-white text-left opacity-80">
            + Clique p/ Bloquear
          </span>
        `;
      }

      container.appendChild(div);
    });
  } catch (err) {
    console.error('Erro ao carregar grade admin:', err);

    container.innerHTML =
      '<p class="text-xs text-red-400 col-span-full text-center py-4">Não foi possível carregar os horários.</p>';
  }
}

function escaparHTML(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, caractere => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[caractere]);
}

// FUNÇÃO DE ALTERNAR BLOQUEIO

async function alternarBloqueioHorario(data, horario, jaBloqueado) {
  try {
    if (jaBloqueado) {
      const { error } = await supabaseClient
        .from('bloqueios')
        .delete()
        .eq('data', data)
        .eq('horario', horario);

      if (error) {
        alert('Erro ao desbloquear: ' + error.message);
        return;
      }
    } else {
      // Não permite bloquear um horário que já tenha um agendamento
      // dentro do intervalo de 40 minutos.
      const { data: agendamentos, error: erroAgendamentos } =
        await supabaseClient
          .from('agendamentos')
          .select('horario, cliente_nome, status')
          .eq('data', data)
          .neq('status', 'cancelado');

      if (erroAgendamentos) {
        alert('Não foi possível verificar os agendamentos existentes.');
        return;
      }

      const conflito = (agendamentos || []).some(a =>
        a.horario &&
        horariosSeSobrepoem(
          horario,
          DURACAO_AGENDAMENTO_MINUTOS,
          a.horario,
          DURACAO_AGENDAMENTO_MINUTOS
        )
      );

      if (conflito) {
        alert('Esse horário coincide com um agendamento existente e não pode ser bloqueado.');
        return;
      }

      const { data: bloqueiosExistentes, error: erroBuscaBloqueios } =
        await supabaseClient
          .from('bloqueios')
          .select('horario')
          .eq('data', data);

      if (erroBuscaBloqueios) {
        alert('Não foi possível verificar os bloqueios existentes.');
        return;
      }

      const jaExisteConflito = (bloqueiosExistentes || []).some(b =>
        b.horario &&
        horariosSeSobrepoem(
          horario,
          DURACAO_AGENDAMENTO_MINUTOS,
          b.horario,
          DURACAO_AGENDAMENTO_MINUTOS
        )
      );

      if (jaExisteConflito) {
        alert('Esse horário já está dentro de outro bloqueio.');
        return;
      }

      const { error } = await supabaseClient
        .from('bloqueios')
        .insert([{ data, horario }]);

      if (error) {
        alert('Erro ao bloquear no banco: ' + error.message);
        return;
      }
    }

    await carregarGradeHorariosAdmin(data);
    await atualizarIndicadoresTopo();
  } catch (err) {
    console.error('Erro ao alternar bloqueio:', err);
    alert('Ocorreu um erro ao alterar o bloqueio.');
  }
}

// 3. TABELA DE AGENDAMENTOS, CONCLUSÃO E CANCELAMENTO

async function carregarTabelaAgendamentosAdmin() {
  const tabela = document.getElementById('tabelaAgendamentosAdmin');
  if (!tabela) return;

  tabela.innerHTML =
    '<tr><td colspan="6" class="text-center py-6 text-zinc-500">Buscando agendamentos...</td></tr>';

  try {
    const { data: agendamentosDb, error } = await supabaseClient
      .from('agendamentos')
      .select('*')
      .neq('status', 'cancelado')
      .neq('status', 'concluido')
      .order('data', { ascending: true })
      .order('horario', { ascending: true });

    if (error) throw error;

    const agendamentos = agendamentosDb || [];

    if (agendamentos.length === 0) {
      tabela.innerHTML =
        '<tr><td colspan="6" class="text-center py-6 text-zinc-500">Nenhum agendamento pendente encontrado.</td></tr>';
      return;
    }

    tabela.innerHTML = agendamentos.map(a => {
      const horaExibicao = a.horario || a.hora || '--:--';
      const partesData = a.data ? a.data.split('-') : ['0000', '00', '00'];
      const dataFormatada =
        partesData.length === 3
          ? `${partesData[2]}/${partesData[1]}`
          : a.data;

      const nomeCliente = a.cliente_nome || a.clienteNome || 'Cliente';
      const emailCliente = a.cliente_email || a.clienteEmail || a.email || '';
      const telefoneCliente =
        a.cliente_telefone || a.clienteTelefone || a.telefone || 'N/A';
      const nomeServico = a.servico_nome || a.servico || 'Corte';
      const valorPreco = a.preco || a.valor || 0;

      return `
        <tr class="hover:bg-zinc-900/50 transition border-b border-zinc-800/40">
          <td class="py-3 px-2 font-black text-yellow-500">
            ${escaparHTML(horaExibicao)}
            <span class="block text-[10px] text-zinc-400 font-normal">${escaparHTML(dataFormatada)}</span>
          </td>
          <td class="py-3 px-2 font-bold text-white">
            ${escaparHTML(nomeCliente)}
            <span class="block text-xs font-normal text-zinc-400">${escaparHTML(emailCliente)}</span>
          </td>
          <td class="py-3 px-2 text-zinc-300 font-medium">${escaparHTML(telefoneCliente)}</td>
          <td class="py-3 px-2 font-medium text-zinc-200">${escaparHTML(nomeServico)}</td>
          <td class="py-3 px-2 font-bold text-green-400">
            R$ ${Number(valorPreco).toFixed(2).replace('.', ',')}
          </td>
          <td class="py-3 px-2">
            <div class="flex gap-2">
              <button onclick="concluirCorte('${a.id}')"
                class="bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white border border-green-600/30 px-2.5 py-1 rounded-lg text-xs font-bold transition">
                Concluir
              </button>
              <button onclick="cancelarAgendamentoAdmin('${a.id}')"
                class="bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white border border-red-600/30 px-2.5 py-1 rounded-lg text-xs font-bold transition">
                Cancelar
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Erro ao carregar agendamentos:', err);
    tabela.innerHTML =
      '<tr><td colspan="6" class="text-center py-6 text-red-400">Erro ao carregar agendamentos.</td></tr>';
  }
}

async function concluirCorte(idAgendamento) {
  if (!confirm('Deseja marcar este agendamento como concluído?')) return;

  try {
    const { error } = await supabaseClient
      .from('agendamentos')
      .update({ status: 'concluido' })
      .eq('id', idAgendamento);

    if (error) {
      console.error('Erro ao concluir no Supabase:', error.message);
      alert('Erro ao atualizar no banco de dados: ' + error.message);
      return;
    }

    const agendamentos = JSON.parse(
      localStorage.getItem(DB_KEYS.AGENDAMENTOS) || '[]'
    );

    const index = agendamentos.findIndex(
      a => String(a.id) === String(idAgendamento)
    );

    if (index !== -1) {
      agendamentos[index].status = 'concluido';
      localStorage.setItem(DB_KEYS.AGENDAMENTOS, JSON.stringify(agendamentos));
    }

    alert('Corte concluído com sucesso!');

    await carregarTabelaAgendamentosAdmin();
    await carregarGradeHorariosAdmin();
    await atualizarIndicadoresTopo();
  } catch (err) {
    console.error('Erro na função concluirCorte:', err);
    alert('Ocorreu um erro ao concluir o corte.');
  }
}

async function cancelarAgendamentoAdmin(idAgendamento) {
  if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;

  try {
    const { error } = await supabaseClient
      .from('agendamentos')
      .update({ status: 'cancelado' })
      .eq('id', idAgendamento);

    if (error) {
      console.error('Erro ao cancelar no Supabase:', error.message);
      alert('Erro ao cancelar o agendamento: ' + error.message);
      return;
    }

    const agendamentos = JSON.parse(
      localStorage.getItem(DB_KEYS.AGENDAMENTOS) || '[]'
    );

    const index = agendamentos.findIndex(
      a => String(a.id) === String(idAgendamento)
    );

    if (index !== -1) {
      agendamentos[index].status = 'cancelado';
      localStorage.setItem(DB_KEYS.AGENDAMENTOS, JSON.stringify(agendamentos));
    }

    alert('Agendamento cancelado!');

    await carregarTabelaAgendamentosAdmin();
    await carregarGradeHorariosAdmin();
    await atualizarIndicadoresTopo();
  } catch (err) {
    console.error('Erro ao cancelar agendamento:', err);
    alert('Ocorreu um erro ao cancelar o agendamento.');
  }
}

// 4. GERENCIADOR DE SERVIÇOS E ALTERAÇÃO DE PREÇOS

async function carregarGerenciadorServicos() {
  const container = document.getElementById('listaServicosAdmin');
  if (!container) return;

  let servicos = [];

  try {
    const { data: servicosSupa, error } = await supabaseClient
      .from('servicos')
      .select('*')
      .order('id', { ascending: true });

    if (!error && servicosSupa && servicosSupa.length > 0) {
      servicos = servicosSupa;
      localStorage.setItem(DB_KEYS.SERVICOS, JSON.stringify(servicos));
    } else {
      servicos =
        JSON.parse(localStorage.getItem(DB_KEYS.SERVICOS)) || SERVICOS_PADRAO;
    }
  } catch (err) {
    console.error('Erro ao conectar com Supabase:', err);
    servicos =
      JSON.parse(localStorage.getItem(DB_KEYS.SERVICOS)) || SERVICOS_PADRAO;
  }

  container.innerHTML = servicos.map((s, idx) => `
    <div class="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
      <span class="font-bold text-sm text-white">${escaparHTML(s.nome)}</span>
      <div class="flex items-center gap-2">
        <span class="text-xs text-zinc-400">R$</span>
        <input type="number" step="0.5" value="${Number(s.preco)}" id="precoServico_${idx}"
          class="w-20 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-sm text-yellow-500 font-bold outline-none focus:border-red-600">
        <button onclick="salvarPrecoServico(${idx}, '${String(s.nome).replace(/'/g, "\\'")}')"
          class="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1 rounded-lg font-bold transition">
          Salvar
        </button>
      </div>
    </div>
  `).join('');
}

async function salvarPrecoServico(idx, nomeServico) {
  const input = document.getElementById(`precoServico_${idx}`);
  if (!input) return;

  const novoPreco = parseFloat(input.value);

  if (isNaN(novoPreco) || novoPreco <= 0) {
    alert('Por favor, informe um preço válido.');
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('servicos')
      .update({ preco: novoPreco })
      .ilike('nome', nomeServico);

    if (error) {
      console.error('Erro ao salvar no Supabase:', error.message);
      alert('Erro ao atualizar preço no banco de dados: ' + error.message);
      return;
    }

    const servicosLocais =
      JSON.parse(localStorage.getItem(DB_KEYS.SERVICOS)) || [];

    const indexLocal = servicosLocais.findIndex(
      s => s.nome.toLowerCase() === nomeServico.toLowerCase()
    );

    if (indexLocal !== -1) {
      servicosLocais[indexLocal].preco = novoPreco;
      localStorage.setItem(DB_KEYS.SERVICOS, JSON.stringify(servicosLocais));
    }

    alert(
      `Preço do serviço "${nomeServico}" atualizado para R$ ${novoPreco.toFixed(2)} com sucesso!`
    );

    await carregarGerenciadorServicos();
  } catch (err) {
    console.error('Erro de conexão ao salvar preço:', err);
    alert('Ocorreu um erro de conexão ao tentar salvar.');
  }
}

// 5. CARDS DE INDICADORES NO TOPO

async function atualizarIndicadoresTopo() {
  const dataHoje =
    document.getElementById('adminDataFiltro')?.value ||
    (() => {
      const agora = new Date();
      return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
    })();

  try {
    const { data: agendamentos, error: errAgend } = await supabaseClient
      .from('agendamentos')
      .select('*')
      .eq('data', dataHoje);

    if (errAgend) throw errAgend;

    const { data: bloqueios, error: errBloq } = await supabaseClient
      .from('bloqueios')
      .select('*')
      .eq('data', dataHoje);

    if (errBloq) throw errBloq;

    const listaAgendamentos = agendamentos || [];
    const listaBloqueios = bloqueios || [];

    const cortesAtivos = listaAgendamentos.filter(
      a => a.status !== 'cancelado'
    );

    const cortesConcluidos = listaAgendamentos.filter(
      a => a.status === 'concluido' || a.status === 'confirmado'
    );

    const faturamentoTotal = cortesConcluidos.reduce((acc, curr) => {
      const precoLimpo = String(curr.valor || curr.preco || 0)
        .replace('R$', '')
        .replace(',', '.')
        .trim();

      return acc + (parseFloat(precoLimpo) || 0);
    }, 0);

    const elQtd = document.getElementById('qtdAgendamentosHoje');
    const elFat = document.getElementById('faturamentoHoje');
    const elLivres = document.getElementById('horariosLivres');
    const elBloq = document.getElementById('horariosBloqueados');

    if (elQtd) elQtd.innerText = cortesAtivos.length;

    if (elFat) {
      elFat.innerText = faturamentoTotal.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
    }

    if (elBloq) elBloq.innerText = listaBloqueios.length;

    if (elLivres) {
      // Conta os horários de início disponíveis, levando em consideração
      // os agendamentos e bloqueios que ocupam intervalos de 40 minutos.
      const horariosLivres = HORARIOS_PADRAO.filter(horario => {
        const temAgendamento = cortesAtivos.some(a =>
          a.horario &&
          horariosSeSobrepoem(
            horario,
            DURACAO_AGENDAMENTO_MINUTOS,
            a.horario,
            DURACAO_AGENDAMENTO_MINUTOS
          )
        );

        const temBloqueio = listaBloqueios.some(b =>
          b.horario &&
          horariosSeSobrepoem(
            horario,
            DURACAO_AGENDAMENTO_MINUTOS,
            b.horario,
            DURACAO_AGENDAMENTO_MINUTOS
          )
        );

        return !temAgendamento && !temBloqueio;
      });

      elLivres.innerText = horariosLivres.length;
    }
  } catch (err) {
    console.error('Erro ao atualizar indicadores do topo:', err);
  }
}

// 6. UTILITÁRIOS, LOGOUT E WHATSAPP

function fazerLogoutAdmin() {
  localStorage.removeItem(DB_KEYS.USUARIO_LOGADO);
  window.location.href = 'login.html';
}

function abrirWhatsAppCliente(telefone, nomeCliente, data, hora, servico) {
  let numeroAlvo = telefone
    ? telefone.replace(/\D/g, '')
    : NUMERO_BARBEARIA;

  if (numeroAlvo.length <= 11 && !numeroAlvo.startsWith('55')) {
    numeroAlvo = '55' + numeroAlvo;
  }

  const partesData = data ? data.split('-') : [];

  const dataFormatada =
    partesData.length === 3
      ? `${partesData[2]}/${partesData[1]}/${partesData[0]}`
      : data;

  const mensagem =
    `Olá, ${nomeCliente}! 👋\n\n` +
    `Confirmamos o seu agendamento na *Odivelas Barbearia*:\n\n` +
    `✂️ *Serviço:* ${servico}\n` +
    `📅 *Data:* ${dataFormatada}\n` +
    `⏰ *Horário:* ${hora}\n\n` +
    `Te esperamos! Se precisar alterar algo, me avise por aqui.`;

  const urlWhatsApp =
    `https://wa.me/${numeroAlvo}?text=${encodeURIComponent(mensagem)}`;

  window.open(urlWhatsApp, '_blank');
}
