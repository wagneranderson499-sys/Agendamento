
/**
 * Arquivo: agendamento.js
 * Descrição: Regras de agendamento, seleção de data/horário
 * e integração com Admin - Odivelas Barbearia.
 *
 * Duração de cada serviço: 40 minutos.
 */

const DURACAO_AGENDAMENTO_MINUTOS = 40;

let barbeiroSelecionado = 'HS Barbeiro';
let servicoSelecionado = null;
let dataSelecionada = '';
let horarioSelecionado = '';
let usuarioLogado = null;

const SEU_WHATSAPP_BARBEARIA = '5591991905836';

document.addEventListener('DOMContentLoaded', () => {
  // Não exige login para realizar um agendamento.
  carregarServicosDinâmicos();
  gerarCardsDias();
  atualizarPrecosServicosNaTela();

 // Se o cliente voltar do WhatsApp, mostra a confirmação.
window.addEventListener('pageshow', () => {
  if (
    sessionStorage.getItem('odivelas_agendamento_confirmado') === 'true'
  ) {
    mostrarModalSucesso();
  }
});
});
// 1. FUNÇÕES DE HORÁRIO

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

// 2. VERIFICA SE O CLIENTE ESTÁ LOGADO

function verificarSessao() {
  const sessao = localStorage.getItem('odivelas_usuario_logado');

  if (!sessao) {
    alert('Por favor, faça login para realizar um agendamento.');
    window.location.href = 'login.html';
    return;
  }

  usuarioLogado = JSON.parse(sessao);
}

// 3. ATUALIZA OS PREÇOS SALVOS PELO ADMIN

function carregarServicosDinâmicos() {
  const servicosSalvos = JSON.parse(
    localStorage.getItem('odivelas_servicos')
  );

  if (!servicosSalvos || !Array.isArray(servicosSalvos)) return;

  servicosSalvos.forEach(s => {
    const btn = [...document.querySelectorAll('.servico-btn')].find(
      elemento => elemento.getAttribute('data-nome') === s.nome
    );

    if (btn) {
      btn.setAttribute('data-preco', s.preco);

      const spanPreco = btn.querySelector('.preco-servico');

      if (spanPreco) {
        spanPreco.innerText =
          `R$ ${parseFloat(s.preco).toFixed(2).replace('.', ',')}`;
      }
    }
  });
}

// 4. SELECIONA O BARBEIRO

function selecionarBarbeiro(btn, nome) {
  document.querySelectorAll('.barbeiro-btn').forEach(b => {
    b.classList.remove('border-yellow-500', 'bg-zinc-800/90');
    b.classList.add('border-zinc-800', 'bg-zinc-950/60');
  });

  btn.classList.remove('border-zinc-800', 'bg-zinc-950/60');
  btn.classList.add('border-yellow-500', 'bg-zinc-800/90');

  barbeiroSelecionado = nome;
}

// 5. SELECIONA O SERVIÇO

function selecionarServico(btn) {
  document.querySelectorAll('.servico-btn').forEach(b => {
    b.classList.remove(
      'border-red-600',
      'bg-red-950/20',
      'ring-2',
      'ring-red-600'
    );

    b.classList.add('border-zinc-800', 'bg-zinc-950/60');
  });

  btn.classList.remove('border-zinc-800', 'bg-zinc-950/60');
  btn.classList.add(
    'border-red-600',
    'bg-red-950/20',
    'ring-2',
    'ring-red-600'
  );

  servicoSelecionado = {
    nome: btn.getAttribute('data-nome'),
    preco: parseFloat(btn.getAttribute('data-preco'))
  };
}

// 6. GERA OS CARDS DOS PRÓXIMOS 7 DIAS

function gerarCardsDias() {
  const container = document.getElementById('containerDias');
  if (!container) return;

  container.innerHTML = '';

  const hoje = new Date();
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const meses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  for (let i = 0; i < 7; i++) {
    const dataAtual = new Date();
    dataAtual.setDate(hoje.getDate() + i);

    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const dia = String(dataAtual.getDate()).padStart(2, '0');

    const dataISO = `${ano}-${mes}-${dia}`;

    const nomeDiaSemana =
      i === 0
        ? 'Hoje'
        : i === 1
          ? 'Amanhã'
          : diasSemana[dataAtual.getDay()];

    const diaNumero = dataAtual.getDate();
    const mesNome = meses[dataAtual.getMonth()];

    const btnDia = document.createElement('button');

    btnDia.type = 'button';

    btnDia.className = `dia-card flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-xl border transition-all duration-200 p-2 cursor-pointer
      ${i === 0
        ? 'border-red-600 bg-red-600/20 text-white font-bold'
        : 'border-zinc-800 bg-zinc-950/80 text-zinc-400 hover:border-zinc-700 hover:text-white'}`;

    btnDia.onclick = () =>
      selecionarDia(
        btnDia,
        dataISO,
        `${nomeDiaSemana}, ${diaNumero} de ${mesNome}`
      );

    btnDia.innerHTML = `
      <span class="text-[10px] uppercase font-semibold tracking-wider ${i === 0 ? 'text-red-400' : 'text-zinc-500'}">${nomeDiaSemana}</span>
      <span class="text-xl font-black my-0.5 text-white">${diaNumero}</span>
      <span class="text-[10px] uppercase text-zinc-400">${mesNome}</span>
    `;

    container.appendChild(btnDia);

    if (i === 0) {
      selecionarDia(
        btnDia,
        dataISO,
        `${nomeDiaSemana}, ${diaNumero} de ${mesNome}`
      );
    }
  }
}

// 7. SELECIONA A DATA

function selecionarDia(elemento, dataISO, textoExibicao) {
  document.querySelectorAll('.dia-card').forEach(btn => {
    btn.classList.remove(
      'border-red-600',
      'bg-red-600/20',
      'text-white',
      'shadow-lg',
      'shadow-red-950/40'
    );

    btn.classList.add(
      'border-zinc-800',
      'bg-zinc-950/80',
      'text-zinc-400'
    );
  });

  elemento.classList.remove(
    'border-zinc-800',
    'bg-zinc-950/80',
    'text-zinc-400'
  );

  elemento.classList.add(
    'border-red-600',
    'bg-red-600/20',
    'text-white',
    'shadow-lg',
    'shadow-red-950/40'
  );

  dataSelecionada = dataISO;
  horarioSelecionado = '';

  const inputData = document.getElementById('inputData');
  if (inputData) inputData.value = dataISO;

  const elTexto = document.getElementById('dataSelecionadaTexto');
  if (elTexto) elTexto.innerText = textoExibicao;

  const selectHorario = document.getElementById('selectHorario');
  if (selectHorario) selectHorario.value = '';

  carregarHorarios(dataISO);
}

// 8. CARREGA OS HORÁRIOS DISPONÍVEIS

async function carregarHorarios(dataISO) {
  const container = document.getElementById('containerHorarios');
  if (!container) return;

  container.innerHTML =
    '<p class="text-xs text-zinc-500 col-span-full text-center py-2">Buscando horários disponíveis...</p>';

  horarioSelecionado = '';

  const selectHorario = document.getElementById('selectHorario');
  if (selectHorario) selectHorario.value = '';

  const horariosConfigurados =
    JSON.parse(localStorage.getItem('admin_horarios')) ||
    gerarHorariosPadrao();

  let agendamentosDoDia = [];
  let bloqueiosDoDia = [];

  try {
    const { data: agendamentosDb, error: erroAgendamentos } =
      await supabaseClient
        .from('agendamentos')
        .select('horario, status')
        .eq('data', dataISO)
        .neq('status', 'cancelado');

    if (erroAgendamentos) throw erroAgendamentos;

    agendamentosDoDia = agendamentosDb || [];

    const { data: bloqueiosDb, error: erroBloqueios } =
      await supabaseClient
        .from('bloqueios')
        .select('horario')
        .eq('data', dataISO);

    if (erroBloqueios) throw erroBloqueios;

    bloqueiosDoDia = bloqueiosDb || [];
  } catch (err) {
    console.error('Erro ao carregar horários do Supabase:', err);

    container.innerHTML =
      '<p class="text-xs text-red-400 col-span-full text-center py-2">Não foi possível consultar os horários. Atualize a página e tente novamente.</p>';

    return;
  }

  container.innerHTML = '';

  horariosConfigurados.forEach(hora => {
    const agendamentoConflitante = agendamentosDoDia.some(a =>
      a.horario &&
      horariosSeSobrepoem(
        hora,
        DURACAO_AGENDAMENTO_MINUTOS,
        a.horario,
        DURACAO_AGENDAMENTO_MINUTOS
      )
    );

    const bloqueioConflitante = bloqueiosDoDia.some(b =>
      b.horario &&
      horariosSeSobrepoem(
        hora,
        DURACAO_AGENDAMENTO_MINUTOS,
        b.horario,
        DURACAO_AGENDAMENTO_MINUTOS
      )
    );

    const indisponivel =
      agendamentoConflitante || bloqueioConflitante;

    const btnHora = document.createElement('button');
    btnHora.type = 'button';

    if (indisponivel) {
      btnHora.disabled = true;

      btnHora.className =
        'hora-card border border-zinc-900 bg-zinc-900/40 text-zinc-600 py-2.5 rounded-lg text-xs font-semibold cursor-not-allowed line-through';

      btnHora.innerText = hora;
    } else {
      btnHora.className =
        'hora-card border border-zinc-800 bg-zinc-950/80 hover:border-red-600 hover:text-white text-zinc-300 py-2.5 rounded-lg text-xs font-bold transition';

      btnHora.onclick = () => selecionarHorario(btnHora, hora);

      btnHora.innerText = hora;
    }

    container.appendChild(btnHora);
  });
}

// 9. SELECIONA O HORÁRIO

function selecionarHorario(elemento, hora) {
  document.querySelectorAll('.hora-card').forEach(btn => {
    if (!btn.disabled) {
      btn.classList.remove(
        'border-red-600',
        'bg-red-600',
        'text-white'
      );

      btn.classList.add(
        'border-zinc-800',
        'bg-zinc-950/80',
        'text-zinc-300'
      );
    }
  });

  elemento.classList.remove(
    'border-zinc-800',
    'bg-zinc-950/80',
    'text-zinc-300'
  );

  elemento.classList.add(
    'border-red-600',
    'bg-red-600',
    'text-white'
  );

  horarioSelecionado = hora;

  const selectHorario = document.getElementById('selectHorario');
  if (selectHorario) selectHorario.value = hora;
}

// 10. CONFIRMA O AGENDAMENTO

let confirmacaoEmAndamento = false;
let dadosParaConfirmacao = null;
let agendamentoJaSalvo = false;
function mostrarModalSucesso() {
  const modal = document.getElementById('modalSucesso');

  if (!modal) {
    console.error('Modal de sucesso não encontrado no HTML.');
    return;
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function confirmarAgendamento() {
  if (confirmacaoEmAndamento || agendamentoJaSalvo) return;

  if (!servicoSelecionado) {
    alert('Por favor, selecione um serviço/corte.');
    return;
  }

  if (!dataSelecionada) {
    alert('Por favor, selecione uma data.');
    return;
  }

  if (!horarioSelecionado) {
    alert('Por favor, selecione um horário disponível.');
    return;
  }

  const nome = document.getElementById('clienteNome')?.value.trim() || '';
  const telefoneInformado =
    document.getElementById('clienteTelefone')?.value.trim() || '';
  const telefone = telefoneInformado.replace(/\D/g, '');

  if (nome.length < 2) {
    alert('Informe seu nome para continuar.');
    document.getElementById('clienteNome')?.focus();
    return;
  }

  if (telefone.length < 10 || telefone.length > 13) {
    alert('Informe um telefone/WhatsApp válido com DDD.');
    document.getElementById('clienteTelefone')?.focus();
    return;
  }

  const partesData = dataSelecionada.split('-');

  dadosParaConfirmacao = {
    barbeiro: barbeiroSelecionado,
    servico: servicoSelecionado.nome,
    preco: Number(servicoSelecionado.preco),
    data: dataSelecionada,
    dataFormatada: `${partesData[2]}/${partesData[1]}/${partesData[0]}`,
    horario: horarioSelecionado,
    nome,
    telefone: telefoneInformado
  };

  const campos = {
    revisaoBarbeiro: dadosParaConfirmacao.barbeiro,
    revisaoServico: dadosParaConfirmacao.servico,
    revisaoData: dadosParaConfirmacao.dataFormatada,
    revisaoHorario: dadosParaConfirmacao.horario,
    revisaoNome: dadosParaConfirmacao.nome,
    revisaoTelefone: dadosParaConfirmacao.telefone,
    revisaoPreco: Number(dadosParaConfirmacao.preco).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  };

  Object.entries(campos).forEach(([id, valor]) => {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor;
  });

  const modal = document.getElementById('modalRevisao');

  if (!modal) {
    alert('Não foi possível abrir a revisão do agendamento. Confira o HTML.');
    return;
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function fecharModalRevisao() {
  const modal = document.getElementById('modalRevisao');

  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

async function confirmarAgendamentoDefinitivo() {
  if (confirmacaoEmAndamento || agendamentoJaSalvo) return;

  if (!dadosParaConfirmacao) {
    alert('Revise os dados do agendamento antes de confirmar.');
    fecharModalRevisao();
    return;
  }

  confirmacaoEmAndamento = true;
  const abaWhatsApp = window.open('about:blank', '_blank');
  console.log('Aba do WhatsApp:', abaWhatsApp);

  const botao = document.querySelector(
    '#modalRevisao button[onclick="confirmarAgendamentoDefinitivo()"]'
  );
  const textoOriginal = botao?.textContent;

  if (botao) {
    botao.disabled = true;
    botao.textContent = 'Confirmando...';
  }

  try {
    const dados = dadosParaConfirmacao;

    // Verifica novamente se o horário continua disponível.
    const { data: agendamentosDb, error: erroAgendamentos } =
      await supabaseClient
        .from('agendamentos')
        .select('horario, status')
        .eq('data', dados.data)
        .neq('status', 'cancelado');

    if (erroAgendamentos) throw erroAgendamentos;

    const { data: bloqueiosDb, error: erroBloqueios } =
      await supabaseClient
        .from('bloqueios')
        .select('horario')
        .eq('data', dados.data);

    if (erroBloqueios) throw erroBloqueios;

    const conflitoAgendamento = (agendamentosDb || []).some(a =>
      a.horario &&
      horariosSeSobrepoem(
        dados.horario,
        DURACAO_AGENDAMENTO_MINUTOS,
        a.horario,
        DURACAO_AGENDAMENTO_MINUTOS
      )
    );

    const conflitoBloqueio = (bloqueiosDb || []).some(b =>
      b.horario &&
      horariosSeSobrepoem(
        dados.horario,
        DURACAO_AGENDAMENTO_MINUTOS,
        b.horario,
        DURACAO_AGENDAMENTO_MINUTOS
      )
    );

    if (conflitoAgendamento || conflitoBloqueio) {
      fecharModalRevisao();
      alert('Esse horário acabou de ficar indisponível. Escolha outro horário.');

      await carregarHorarios(dados.data);
      return;
    }

    // O cliente não precisa estar autenticado.
    // A coluna usuario_id precisa aceitar NULL para esta inserção.
  const { error: erroSupa } = await supabaseClient
  .from('agendamentos')
  .insert([{
    usuario_id: null,
    cliente_nome: dados.nome,
    cliente_telefone: dados.telefone.replace(/\D/g, ''),
    barbeiro: dados.barbeiro,
    servico_nome: dados.servico,
    preco: dados.preco,
    data: dados.data,
    horario: dados.horario,
    status: 'confirmado'
  }]);

if (erroSupa) throw erroSupa;

    // Marca como salvo para evitar duplicidade por cliques repetidos.
    agendamentoJaSalvo = true;

    // Preserva o histórico local usado pelo restante do site.
    try {
      const agendamentosLocais = JSON.parse(
        localStorage.getItem('odivelas_agendamentos') || '[]'
      );

      agendamentosLocais.push({
        id: 'AGN-' + Date.now(),
        clienteId: null,
        clienteNome: dados.nome,
        clienteTelefone: dados.telefone,
        barbeiro: dados.barbeiro,
        servico: dados.servico,
        preco: dados.preco,
        data: dados.data,
        horario: dados.horario,
        status: 'confirmado',
        criadoEm: new Date().toISOString()
      });

      localStorage.setItem(
        'odivelas_agendamentos',
        JSON.stringify(agendamentosLocais)
      );
    } catch (erroLocal) {
      console.warn('Não foi possível atualizar o histórico local:', erroLocal);
    }

    sessionStorage.setItem('odivelas_agendamento_confirmado', 'true');

    fecharModalRevisao();

    const mensagem =
      `Olá! Meu agendamento já foi registrado na Odivelas Barbearia.\n\n` +
      `👤 Cliente: ${dados.nome}\n` +
      `📱 Contato: ${dados.telefone}\n` +
      `✂️ Serviço: ${dados.servico}\n` +
      `💰 Preço: ${Number(dados.preco).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })}\n` +
      `📅 Data: ${dados.dataFormatada}\n` +
      `⏰ Horário: ${dados.horario}\n` +
      `💈 Barbeiro: ${dados.barbeiro}`;

    const linkZap =
      `https://wa.me/${SEU_WHATSAPP_BARBEARIA}?text=${encodeURIComponent(mensagem)}`;

// Abre o WhatsApp em outra aba e mantém o site aberto.
if (abaWhatsApp && !abaWhatsApp.closed) {
  abaWhatsApp.location.href = linkZap;
} else {
  alert(
    'Seu agendamento foi registrado, mas o navegador bloqueou a abertura do WhatsApp. ' +
    'Permita pop-ups para este site e tente novamente, ou abra o WhatsApp manualmente.'
  );
}

    if (!abaWhatsApp) {
      alert(
        'Seu agendamento foi registrado! O navegador bloqueou o WhatsApp. Abra o WhatsApp manualmente para entrar em contato com a barbearia.'
      );
    }



    await carregarHorarios(dados.data);

  } catch (err) {
    console.error('Erro ao confirmar agendamento:', err);
    console.error('Detalhes do erro:', {
      message: err?.message,
      code: err?.code,
      details: err?.details,
      hint: err?.hint
    });

    alert(
      `Não foi possível registrar o agendamento.\n\nMotivo: ${
        err?.message || 'Erro desconhecido. Consulte o Console (F12).'
      }`
    );
  } finally {
    confirmacaoEmAndamento = false;

    if (botao) {
      botao.disabled = false;
      botao.textContent = textoOriginal || 'Confirmar agendamento';
    }
  }
}




// 11. BUSCA OS SERVIÇOS E PREÇOS DO SUPABASE

async function obterServicosDoSupabase() {
  try {
    const { data: servicos, error } = await supabaseClient
      .from('servicos')
      .select('nome, preco');

    if (error) {
      console.error(
        'Erro ao buscar serviços do Supabase:',
        error.message
      );

      return [];
    }

    return servicos || [];
  } catch (err) {
    console.error('Erro inesperado na conexão:', err);
    return [];
  }
}

// 12. ATUALIZA OS PREÇOS NA TELA

async function atualizarPrecosServicosNaTela() {
  const servicosSalvos = await obterServicosDoSupabase();

  if (!servicosSalvos || servicosSalvos.length === 0) return;

  const botoesServico = document.querySelectorAll('.servico-btn');

  botoesServico.forEach(btn => {
    const nomeAtributo = btn.getAttribute('data-nome');
    if (!nomeAtributo) return;

    const servicoAtualizado = servicosSalvos.find(
      s =>
        s.nome.trim().toLowerCase() ===
        nomeAtributo.trim().toLowerCase()
    );

    if (servicoAtualizado) {
      btn.setAttribute('data-preco', servicoAtualizado.preco);

      const elPreco = btn.querySelector('.text-yellow-500');

      if (elPreco) {
        elPreco.innerText = Number(
          servicoAtualizado.preco
        ).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        });
      }
    }
  });
}