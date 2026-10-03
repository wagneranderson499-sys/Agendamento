/**
 * Arquivo: agendamento.js
 * Descrição: Regras de agendamento, seleção de data/horário e integração com Admin.
 * Odivelas Barbearia
 */
// Adicione esta linha logo no topo do admin.js:
// const NUMERO_BARBEARIA = '5591985793959';
let barbeiroSelecionado = 'HS Barbeiro';
let servicoSelecionado = null;
let dataSelecionada = '';
let horarioSelecionado = '';
let usuarioLogado = null;

document.addEventListener('DOMContentLoaded', () => {
  verificarSessao();
  carregarServicosDinâmicos();
  gerarCardsDias();
});

// 0. Verifica se o cliente está logado
function verificarSessao() {
  const sessao = localStorage.getItem('odivelas_usuario_logado');
  if (!sessao) {
    alert('Por favor, faça login para realizar um agendamento.');
    window.location.href = 'login.html';
    return;
  }
  usuarioLogado = JSON.parse(sessao);
}

// 1. Atualiza Preços/Serviços se o Admin tiver editado na chave 'odivelas_servicos'
function carregarServicosDinâmicos() {
  const servicosSalvos = JSON.parse(localStorage.getItem('odivelas_servicos'));
  if (!servicosSalvos || !Array.isArray(servicosSalvos)) return;

  // Atualiza os preços nos botões da tela que tiverem o attribute data-nome correspondente
  servicosSalvos.forEach(s => {
    const btn = document.querySelector(`.servico-btn[data-nome="${s.nome}"]`);
    if (btn) {
      btn.setAttribute('data-preco', s.preco);
      const spanPreco = btn.querySelector('.preco-servico');
      if (spanPreco) {
        spanPreco.innerText = `R$ ${parseFloat(s.preco).toFixed(2).replace('.', ',')}`;
      }
    }
  });
}

// 2. Seleciona o Barbeiro
function selecionarBarbeiro(btn, nome) {
  document.querySelectorAll('.barbeiro-btn').forEach(b => {
    b.classList.remove('border-yellow-500', 'bg-zinc-800/90');
    b.classList.add('border-zinc-800', 'bg-zinc-950/60');
  });
  btn.classList.remove('border-zinc-800', 'bg-zinc-950/60');
  btn.classList.add('border-yellow-500', 'bg-zinc-800/90');
  barbeiroSelecionado = nome;
}

// 3. Seleciona o Serviço
function selecionarServico(btn) {
  document.querySelectorAll('.servico-btn').forEach(b => {
    b.classList.remove('border-red-600', 'bg-red-950/20', 'ring-2', 'ring-red-600');
    b.classList.add('border-zinc-800', 'bg-zinc-950/60');
  });

  btn.classList.remove('border-zinc-800', 'bg-zinc-950/60');
  btn.classList.add('border-red-600', 'bg-red-950/20', 'ring-2', 'ring-red-600');

  servicoSelecionado = {
    nome: btn.getAttribute('data-nome'),
    preco: parseFloat(btn.getAttribute('data-preco'))
  };
}

// 4. Gerador dos Cards dos Próximos 7 Dias
function gerarCardsDias() {
  const container = document.getElementById('containerDias');
  if (!container) return;

  container.innerHTML = '';
  const hoje = new Date();
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  for (let i = 0; i < 7; i++) {
    const dataAtual = new Date();
    dataAtual.setDate(hoje.getDate() + i);

    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const dataISO = `${ano}-${mes}-${dia}`;

    const nomeDiaSemana = i === 0 ? 'Hoje' : (i === 1 ? 'Amanhã' : diasSemana[dataAtual.getDay()]);
    const diaNumero = dataAtual.getDate();
    const mesNome = meses[dataAtual.getMonth()];

    const btnDia = document.createElement('button');
    btnDia.type = 'button';
    btnDia.className = `dia-card flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-xl border transition-all duration-200 p-2 cursor-pointer
      ${i === 0 ? 'border-red-600 bg-red-600/20 text-white font-bold' : 'border-zinc-800 bg-zinc-950/80 text-zinc-400 hover:border-zinc-700 hover:text-white'}`;
    
    btnDia.onclick = () => selecionarDia(btnDia, dataISO, `${nomeDiaSemana}, ${diaNumero} de ${mesNome}`);

    btnDia.innerHTML = `
      <span class="text-[10px] uppercase font-semibold tracking-wider ${i === 0 ? 'text-red-400' : 'text-zinc-500'}">${nomeDiaSemana}</span>
      <span class="text-xl font-black my-0.5 text-white">${diaNumero}</span>
      <span class="text-[10px] uppercase text-zinc-400">${mesNome}</span>
    `;

    container.appendChild(btnDia);

    if (i === 0) {
      selecionarDia(btnDia, dataISO, `${nomeDiaSemana}, ${diaNumero} de ${mesNome}`);
    }
  }
}

function selecionarDia(elemento, dataISO, textoExibicao) {
  document.querySelectorAll('.dia-card').forEach(btn => {
    btn.classList.remove('border-red-600', 'bg-red-600/20', 'text-white', 'shadow-lg', 'shadow-red-950/40');
    btn.classList.add('border-zinc-800', 'bg-zinc-950/80', 'text-zinc-400');
  });

  elemento.classList.remove('border-zinc-800', 'bg-zinc-950/80', 'text-zinc-400');
  elemento.classList.add('border-red-600', 'bg-red-600/20', 'text-white', 'shadow-lg', 'shadow-red-950/40');

  dataSelecionada = dataISO;
  
  const inputData = document.getElementById('inputData');
  if (inputData) inputData.value = dataISO;
  
  const elTexto = document.getElementById('dataSelecionadaTexto');
  if (elTexto) elTexto.innerText = textoExibicao;

  carregarHorarios(dataISO);
}

// 5. Carrega os horários (verificando agendamentos ocupados E bloqueios do Admin)
function carregarHorarios(dataISO) {
  const container = document.getElementById('containerHorarios');
  if (!container) return;
  
  container.innerHTML = '';
  horarioSelecionado = '';
  
  const selectHorario = document.getElementById('selectHorario');
  if (selectHorario) selectHorario.value = '';

  const horariosConfigurados = JSON.parse(localStorage.getItem('admin_horarios')) || [
    '09:00', '09:45', '10:30', '11:15',
    '14:00', '14:45', '15:30', '16:15',
    '17:00', '17:45', '18:30', '19:15'
  ];

  // 1. Agendamentos Ocupados por Clientes
  const agendamentosExistentes = JSON.parse(localStorage.getItem('odivelas_agendamentos')) || [];
  const ocupadosNoDia = agendamentosExistentes
    .filter(a => a.data === dataISO && a.status !== 'cancelado')
    .map(a => a.horario);

  // 2. Horários Bloqueados pelo Admin
  const bloqueiosAdmin = JSON.parse(localStorage.getItem('odivelas_bloqueIOS')) || [];
  const bloqueadosNoDia = bloqueiosAdmin
    .filter(b => b.data === dataISO)
    .map(b => b.horario);

  horariosConfigurados.forEach(hora => {
    const isOcupado = ocupadosNoDia.includes(hora);
    const isBloqueado = bloqueadosNoDia.includes(hora);
    const indisponivel = isOcupado || isBloqueado;

    const btnHora = document.createElement('button');
    btnHora.type = 'button';

    if (indisponivel) {
      btnHora.disabled = true;
      btnHora.className = 'hora-card border border-zinc-900 bg-zinc-900/40 text-zinc-600 py-2.5 rounded-lg text-xs font-semibold cursor-not-allowed line-through';
      btnHora.innerText = hora;
    } else {
      btnHora.className = 'hora-card border border-zinc-800 bg-zinc-950/80 hover:border-red-600 hover:text-white text-zinc-300 py-2.5 rounded-lg text-xs font-bold transition';
      btnHora.onclick = () => selecionarHorario(btnHora, hora);
      btnHora.innerText = hora;
    }

    container.appendChild(btnHora);
  });
}

function selecionarHorario(elemento, hora) {
  document.querySelectorAll('.hora-card').forEach(btn => {
    if (!btn.disabled) {
      btn.classList.remove('border-red-600', 'bg-red-600', 'text-white');
      btn.classList.add('border-zinc-800', 'bg-zinc-950/80', 'text-zinc-300');
    }
  });

  elemento.classList.remove('border-zinc-800', 'bg-zinc-950/80', 'text-zinc-300');
  elemento.classList.add('border-red-600', 'bg-red-600', 'text-white');

  horarioSelecionado = hora;
  
  const selectHorario = document.getElementById('selectHorario');
  if (selectHorario) selectHorario.value = hora;
}
// O seu número fixo da barbearia com DDI (55)
const SEU_WHATSAPP_BARBEARIA = '5591985793959';async function confirmarAgendamento() {
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

  // 1. Recupera os dados do usuário logado
  let user = null;
  try {
    const { data } = await supabaseClient.auth.getUser();
    user = data?.user;
  } catch (err) {
    console.log('Sessão do Supabase Auth não encontrada, verificando localStorage...');
  }

  const usuarioLocal = JSON.parse(localStorage.getItem('odivelas_usuario_logado')) || usuarioLogado;

  if (!user && !usuarioLocal) {
    alert('Sua sessão expirou ou você não está logado. Por favor, faça login para agendar.');
    window.location.href = 'login.html';
    return;
  }

  const clienteAtual = {
    id: user ? user.id : (usuarioLocal?.id || 'USR-' + Date.now()),
    nome: user?.user_metadata?.nome || usuarioLocal?.nome || 'Cliente',
    telefone: user?.user_metadata?.telefone || usuarioLocal?.telefone || usuarioLocal?.whatsapp || '(00) 00000-0000',
    email: user?.email || usuarioLocal?.email || 'cliente@odivelas.com'
  };

  // 2. GRAVA NO SUPABASE (Com o número de telefone/WhatsApp incluído)
  try {
    const { data: agendamentoSalvo, error: erroSupa } = await supabaseClient
      .from('agendamentos')
      .insert([
        {
          usuario_id: clienteAtual.id,
          cliente_nome: clienteAtual.nome,
          cliente_telefone: clienteAtual.telefone, // Envia o número de WhatsApp
          servico_nome: servicoSelecionado.nome,
          preco: parseFloat(servicoSelecionado.preco),
          data: dataSelecionada,
          horario: horarioSelecionado,
          status: 'confirmado'
        }
      ]);

    if (erroSupa) {
      console.error('Erro ao gravar no Supabase:', erroSupa.message);
    }
  } catch (err) {
    console.error('Erro de conexão ao salvar no Supabase:', err);
  }

  // 3. GRAVA NO LOCALSTORAGE (Para manter histórico local atualizado)
  const novoAgendamentoLocal = {
    id: 'AGN-' + Date.now(),
    clienteId: clienteAtual.id,
    clienteNome: clienteAtual.nome,
    clienteTelefone: clienteAtual.telefone,
    clienteEmail: clienteAtual.email,
    barbeiro: barbeiroSelecionado || 'Odivelas',
    servico: servicoSelecionado.nome,
    preco: servicoSelecionado.preco,
    data: dataSelecionada,
    horario: horarioSelecionado,
    status: 'confirmado',
    criadoEm: new Date().toISOString()
  };

  const agendamentosLocais = JSON.parse(localStorage.getItem('odivelas_agendamentos')) || [];
  agendamentosLocais.push(novoAgendamentoLocal);
  localStorage.setItem('odivelas_agendamentos', JSON.stringify(agendamentosLocais));

  // 4. MONTA A MENSAGEM DO WHATSAPP
  const partesData = dataSelecionada.split('-');
  const dataFormatada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;
  const precoFormatado = Number(servicoSelecionado.preco).toFixed(2).replace('.', ',');

  const numeroBarbeiro = typeof SEU_WHATSAPP_BARBEARIA !== 'undefined' ? SEU_WHATSAPP_BARBEARIA : "5591985793959"; // Seu número com DDD (ex: 5591980000000)

  const mensagemWhatsApp = `Olá! Acabei de fazer um agendamento na *Odivelas Barbearia, você cliente pode voltar ao sistema para ver seus agendamentos*:\n\n` +
    `👤 *Cliente:* ${clienteAtual.nome}\n` +
    `📱 *Contato:* ${clienteAtual.telefone}\n` +
    `✂️ *Serviço:* ${servicoSelecionado.nome} (R$ ${precoFormatado})\n` +
    `📅 *Data:* ${dataFormatada}\n` +
    `⏰ *Horário:* ${horarioSelecionado}\n` +
    `💈 *Barbeiro:* ${barbeiroSelecionado || 'Odivelas'}`;

  const linkZap = `https://wa.me/${numeroBarbeiro}?text=${encodeURIComponent(mensagemWhatsApp)}`;

  // 5. REDIRECIONA PARA O MEUS-AGENDAMENTOS E ABRE O WHATSAPP IMEDIATAMENTE
  // Primeiro mudamos a aba atual para o histórico do cliente
  window.location.href = 'meus-agendamentos.html';

  // Em seguida (no mesmo instante), acionamos a abertura do WhatsApp
  window.open(linkZap, '_blank') || (window.location.href = linkZap);
}
// Busca os servicos e preços atualizados direto da tabela do Supabase
async function obterServicosDoSupabase() {
  try {
    const { data: servicos, error } = await supabaseClient
      .from('servicos')
      .select('nome, preco');

    if (error) {
      console.error('Erro ao buscar serviços do Supabase:', error.message);
      return [];
    }

    return servicos;
  } catch (err) {
    console.error('Erro inesperado na conexão:', err);
    return [];
  }
}

// Atualiza a interface com os preços em tempo real vindos do banco
async function atualizarPrecosServicosNaTela() {
  const servicosSalvos = await obterServicosDoSupabase();
  if (!servicosSalvos || servicosSalvos.length === 0) return;

  // Busca todos os botões de serviço na tela
  const botoesServico = document.querySelectorAll('.servico-btn');

  botoesServico.forEach(btn => {
    const nomeAtributo = btn.getAttribute('data-nome');
    if (!nomeAtributo) return;

    // Normaliza os nomes tirando espaços nas pontas e ignorando maiúsculas/minúsculas
    const servicoAtualizado = servicosSalvos.find(
      s => s.nome.trim().toLowerCase() === nomeAtributo.trim().toLowerCase()
    );

    if (servicoAtualizado) {
      // 1. Atualiza o atributo data-preco do botão
      btn.setAttribute('data-preco', servicoAtualizado.preco);

      // 2. Procura a tag que exibe o preço (ex: R$ 20,00)
      const elPreco = btn.querySelector('.text-yellow-500');
      if (elPreco) {
        const precoFormatado = Number(servicoAtualizado.preco).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        });
        elPreco.innerText = precoFormatado;
      }
    }
  });
}

// Executa automaticamente quando o HTML estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  atualizarPrecosServicosNaTela();
});

// Executa também imediatamente caso o DOM já tenha carregado
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  atualizarPrecosServicosNaTela();
}