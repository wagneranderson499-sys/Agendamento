
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
  verificarSessao();
  carregarServicosDinâmicos();
  gerarCardsDias();
  atualizarPrecosServicosNaTela();
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

async function confirmarAgendamento() {
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

  // Abre uma aba imediatamente para evitar o bloqueio de pop-ups.
  const abaWhatsApp = window.open('about:blank', '_blank');

  let user = null;

  try {
    const { data } = await supabaseClient.auth.getUser();
    user = data?.user || null;
  } catch (err) {
    console.log(
      'Sessão do Supabase Auth não encontrada; verificando localStorage.'
    );
  }

  const usuarioLocal =
    JSON.parse(localStorage.getItem('odivelas_usuario_logado')) ||
    usuarioLogado;

  if (!user && !usuarioLocal) {
    if (abaWhatsApp) abaWhatsApp.close();

    alert(
      'Sua sessão expirou ou você não está logado. Por favor, faça login para agendar.'
    );

    window.location.href = 'login.html';
    return;
  }

  const meta = user?.user_metadata || {};

  const telefoneDoCadastro =
    meta.telefone ||
    meta.whatsapp ||
    meta.celular ||
    usuarioLocal?.telefone ||
    usuarioLocal?.whatsapp ||
    usuarioLocal?.celular ||
    '(00) 00000-0000';

  const nomeDoCadastro =
    meta.nome ||
    meta.full_name ||
    usuarioLocal?.nome ||
    'Cliente';

  const clienteAtual = {
    id: user ? user.id : (usuarioLocal?.id || 'USR-' + Date.now()),
    nome: nomeDoCadastro,
    telefone: telefoneDoCadastro,
    email: user?.email || usuarioLocal?.email || 'cliente@odivelas.com'
  };

  // Confere novamente a disponibilidade.
  try {
    const { data: agendamentosDb, error: erroAgendamentos } =
      await supabaseClient
        .from('agendamentos')
        .select('horario, status')
        .eq('data', dataSelecionada)
        .neq('status', 'cancelado');

    if (erroAgendamentos) throw erroAgendamentos;

    const conflitoAgendamento = (agendamentosDb || []).some(a =>
      a.horario &&
      horariosSeSobrepoem(
        horarioSelecionado,
        DURACAO_AGENDAMENTO_MINUTOS,
        a.horario,
        DURACAO_AGENDAMENTO_MINUTOS
      )
    );

    const { data: bloqueiosDb, error: erroBloqueios } =
      await supabaseClient
        .from('bloqueios')
        .select('horario')
        .eq('data', dataSelecionada);

    if (erroBloqueios) throw erroBloqueios;

    const conflitoBloqueio = (bloqueiosDb || []).some(b =>
      b.horario &&
      horariosSeSobrepoem(
        horarioSelecionado,
        DURACAO_AGENDAMENTO_MINUTOS,
        b.horario,
        DURACAO_AGENDAMENTO_MINUTOS
      )
    );

    if (conflitoAgendamento || conflitoBloqueio) {
      if (abaWhatsApp) abaWhatsApp.close();

      alert(
        'Esse horário acabou de ficar indisponível. Escolha outro horário, por favor.'
      );

      await carregarHorarios(dataSelecionada);
      return;
    }
  } catch (err) {
    console.error('Erro ao validar disponibilidade:', err);

    if (abaWhatsApp) abaWhatsApp.close();

    alert(
      'Não foi possível confirmar a disponibilidade. Tente novamente.'
    );

    return;
  }

  // Salva o agendamento no Supabase.
  try {
    const { error: erroSupa } = await supabaseClient
      .from('agendamentos')
      .insert([
        {
          usuario_id: clienteAtual.id,
          cliente_nome: clienteAtual.nome,
          cliente_telefone: clienteAtual.telefone,
          servico_nome: servicoSelecionado.nome,
          preco: parseFloat(servicoSelecionado.preco),
          data: dataSelecionada,
          horario: horarioSelecionado,
          status: 'confirmado'
        }
      ]);

    if (erroSupa) {
      console.error('Erro ao gravar no Supabase:', erroSupa.message);

      if (abaWhatsApp) abaWhatsApp.close();

      alert('Não foi possível salvar o agendamento: ' + erroSupa.message);
      return;
    }
  } catch (err) {
    console.error('Erro de conexão ao salvar no Supabase:', err);

    if (abaWhatsApp) abaWhatsApp.close();

    alert('Erro de conexão ao salvar o agendamento. Tente novamente.');
    return;
  }

  // Mantém o histórico local.
  const novoAgendamentoLocal = {
    id: 'AGN-' + Date.now(),
    clienteId: clienteAtual.id,
    clienteNome: clienteAtual.nome,
    clienteTelefone: clienteAtual.telefone,
    clienteEmail: clienteAtual.email,
    barbeiro: barbeiroSelecionado,
    servico: servicoSelecionado.nome,
    preco: servicoSelecionado.preco,
    data: dataSelecionada,
    horario: horarioSelecionado,
    status: 'confirmado',
    criadoEm: new Date().toISOString()
  };

  const agendamentosLocais =
    JSON.parse(localStorage.getItem('odivelas_agendamentos')) || [];

  agendamentosLocais.push(novoAgendamentoLocal);

  localStorage.setItem(
    'odivelas_agendamentos',
    JSON.stringify(agendamentosLocais)
  );

  // Formata os dados para a mensagem.
  const partesData = dataSelecionada.split('-');

  const dataFormatada =
    `${partesData[2]}/${partesData[1]}/${partesData[0]}`;

  const precoFormatado =
    Number(servicoSelecionado.preco).toFixed(2).replace('.', ',');

  const mensagemWhatsApp =
    `Olá! Acabei de fazer um agendamento na *Odivelas Barbearia*:\n\n` +
    `👤 *Cliente:* ${clienteAtual.nome}\n` +
    `📱 *Contato:* ${clienteAtual.telefone}\n` +
    `✂️ *Serviço:* ${servicoSelecionado.nome} (R$ ${precoFormatado})\n` +
    `📅 *Data:* ${dataFormatada}\n` +
    `⏰ *Horário:* ${horarioSelecionado}\n` +
    `💈 *Barbeiro:* ${barbeiroSelecionado}\n\n` +
    `✅ Para consultar seu agendamento, volte ao sistema ` +
    `Odivelas Barbearia e acesse a página "Meus Agendamentos".`;

  const linkZap =
    `https://wa.me/${SEU_WHATSAPP_BARBEARIA}?text=${encodeURIComponent(mensagemWhatsApp)}`;

  // Abre o WhatsApp na aba preparada anteriormente.
  if (abaWhatsApp) {
    abaWhatsApp.location.href = linkZap;
  } else {
    // Alternativa caso o navegador tenha bloqueado a nova aba.
    alert(
      'Seu agendamento foi salvo! Se o WhatsApp não abrir automaticamente, ' +
      'permita pop-ups para este site e tente novamente.'
    );
  }

  // Retorna a página original ao histórico.
  window.location.href = 'meus-agendamentos.html';
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
