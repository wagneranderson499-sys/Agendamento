/**
 * Arquivo: admin.js
 * Descrição: Painel Administrativo do Barbeiro com sincronização total do localStorage.
 * Odivelas Barbearia
 */

const NUMERO_BARBEARIA = '5591985793959';
const DB_KEYS = {
  USUARIO_LOGADO: 'odivelas_usuario_logado',
  AGENDAMENTOS: 'odivelas_agendamentos',
  BLOQUEIOS: 'odivelas_bloqueIOS',
  HISTORICO: 'odivelas_historico',
  SERVICOS: 'odivelas_servicos'
};

const HORARIOS_PADRAO = [
  '09:00', '09:45', '10:30', '11:15',
  '14:00', '14:45', '15:30', '16:15',
  '17:00', '17:45', '18:30', '19:15'
];

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
  const sessao = JSON.parse(localStorage.getItem(DB_KEYS.USUARIO_LOGADO) || '{}');
  if (sessao.tipo !== 'admin' && sessao.email !== 'admin@odivelas.com') {
    alert('Acesso restrito ao Administrador.');
    window.location.href = 'login.html';
  }
}

function inicializarDataHoje() {
  const inputData = document.getElementById('adminDataFiltro');
  if (inputData && !inputData.value) {
    inputData.value = new Date().toISOString().split('T')[0];
  }
}

// 1. NAVEGAÇÃO DE ABAS
function trocarAba(idAba, elementoBtn) {
  // Esconde todas as seções de abas
  ['abaHorarios', 'abaAgendamentos', 'abaServicos'].forEach(aba => {
    const el = document.getElementById(aba);
    if (el) el.classList.add('hidden');
  });

  // Mostra a aba clicada
  const abaAtiva = document.getElementById(idAba);
  if (abaAtiva) abaAtiva.classList.remove('hidden');

  // Ajusta o estilo visual dos botões
  document.querySelectorAll('.aba-btn').forEach(btn => {
    btn.classList.remove('bg-red-600', 'text-white');
    btn.classList.add('bg-zinc-900', 'text-zinc-400');
  });

  if (elementoBtn) {
    elementoBtn.classList.remove('bg-zinc-900', 'text-zinc-400');
    elementoBtn.classList.add('bg-red-600', 'text-white');
  }

  // GATILHO IMPORTANTE: Recarrega a lista toda vez que entra na aba de serviços!
  if (idAba === 'abaServicos') {
    carregarGerenciadorServicos();
  }
}

// 2. GRADE DE HORÁRIOS E BLOQUEIOS
function carregarGradeHorariosAdmin() {
  const grid = document.getElementById('gridHorariosAdmin');
  const inputData = document.getElementById('adminDataFiltro');
  if (!grid || !inputData) return;

  const dataFiltro = inputData.value;
  const agendamentos = JSON.parse(localStorage.getItem(DB_KEYS.AGENDAMENTOS) || '[]');
  const bloqueios = JSON.parse(localStorage.getItem(DB_KEYS.BLOQUEIOS) || '[]');

  grid.innerHTML = '';

  HORARIOS_PADRAO.forEach(hora => {
    const agendado = agendamentos.find(a => a.data === dataFiltro && (a.horario === hora || a.hora === hora) && a.status !== 'cancelado');
    const bloqueado = bloqueios.some(b => b.data === dataFiltro && b.horario === hora);

    let estiloClass = 'bg-green-950/40 border-green-500/60 text-green-400 hover:bg-green-900/50';
    let statusLabel = 'Livre';

    if (agendado) {
      estiloClass = 'bg-yellow-950/40 border-yellow-500/60 text-yellow-400 cursor-not-allowed';
      statusLabel = agendado.clienteNome || 'Agendado';
    } else if (bloqueado) {
      estiloClass = 'bg-red-950/40 border-red-600/60 text-red-400 hover:bg-red-900/50';
      statusLabel = 'Bloqueado';
    }

    const card = document.createElement('button');
    card.type = 'button';
    card.className = `p-3 border rounded-xl flex flex-col items-center justify-center gap-1 transition ${estiloClass}`;
    card.innerHTML = `
      <span class="font-black text-base">${hora}</span>
      <span class="text-[10px] uppercase font-bold tracking-wider truncate max-w-full">${statusLabel}</span>
    `;

    if (!agendado) {
      card.onclick = () => alternarBloqueioHorario(dataFiltro, hora, bloqueado);
    }

    grid.appendChild(card);
  });

  atualizarIndicadoresTopo();
}

function alternarBloqueioHorario(data, horario, jaBloqueado) {
  let bloqueios = JSON.parse(localStorage.getItem(DB_KEYS.BLOQUEIOS) || '[]');

  if (jaBloqueado) {
    bloqueios = bloqueios.filter(b => !(b.data === data && b.horario === horario));
  } else {
    bloqueios.push({ data, horario });
  }

  localStorage.setItem(DB_KEYS.BLOQUEIOS, JSON.stringify(bloqueios));
  carregarGradeHorariosAdmin();
}

// 3. TABELA DE AGENDAMENTOS E CONCLUSÃO
function carregarTabelaAgendamentosAdmin() {
  const tabela = document.getElementById('tabelaAgendamentosAdmin');
  if (!tabela) return;

  const agendamentos = JSON.parse(localStorage.getItem(DB_KEYS.AGENDAMENTOS) || '[]')
    .filter(a => a.status !== 'cancelado');

  if (agendamentos.length === 0) {
    tabela.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-zinc-500">Nenhum agendamento pendente encontrado.</td></tr>`;
    return;
  }

  tabela.innerHTML = agendamentos.map(a => {
    const horaExibicao = a.horario || a.hora;
    const partesData = a.data ? a.data.split('-') : ['00', '00', '0000'];
    const dataFormatada = partesData.length === 3 ? `${partesData[2]}/${partesData[1]}` : a.data;

    return `
      <tr class="hover:bg-zinc-900/50 transition">
        <td class="py-3 px-2 font-black text-yellow-500">${horaExibicao} <span class="block text-[10px] text-zinc-400 font-normal">${dataFormatada}</span></td>
        <td class="py-3 px-2 font-bold text-white">${a.clienteNome || 'Cliente'} <span class="block text-xs font-normal text-zinc-400">${a.clienteEmail || ''}</span></td>
        <td class="py-3 px-2 text-zinc-300 font-medium">${a.clienteTelefone || 'N/A'}</td>
        <td class="py-3 px-2 font-medium text-zinc-200">${a.servico || 'Corte'}</td>
        <td class="py-3 px-2 font-bold text-green-400">R$ ${Number(a.preco || 0).toFixed(2).replace('.', ',')}</td>
        <td class="py-3 px-2 flex gap-2">
          <button onclick="concluirCorte('${a.id}')" class="bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white border border-green-600/30 px-2.5 py-1 rounded-lg text-xs font-bold transition">Concluir</button>
          <button onclick="cancelarAgendamentoAdmin('${a.id}')" class="bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white border border-red-600/30 px-2.5 py-1 rounded-lg text-xs font-bold transition">Cancelar</button>
        </td>
      </tr>
    `;
  }).join('');
}

function concluirCorte(idAgendamento) {
  let agendamentos = JSON.parse(localStorage.getItem(DB_KEYS.AGENDAMENTOS) || '[]');
  let historico = JSON.parse(localStorage.getItem(DB_KEYS.HISTORICO) || '[]');

  const index = agendamentos.findIndex(a => String(a.id) === String(idAgendamento));

  if (index !== -1) {
    const corteFinalizado = agendamentos[index];
    corteFinalizado.status = 'concluido';
    corteFinalizado.concluidoEm = new Date().toISOString();

    historico.push(corteFinalizado);
    agendamentos.splice(index, 1);

    localStorage.setItem(DB_KEYS.AGENDAMENTOS, JSON.stringify(agendamentos));
    localStorage.setItem(DB_KEYS.HISTORICO, JSON.stringify(historico));

    alert('Corte concluído e adicionado ao faturamento/histórico!');
    carregarTabelaAgendamentosAdmin();
    carregarGradeHorariosAdmin();
  }
}

function cancelarAgendamentoAdmin(idAgendamento) {
  if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;

  let agendamentos = JSON.parse(localStorage.getItem(DB_KEYS.AGENDAMENTOS) || '[]');
  const index = agendamentos.findIndex(a => String(a.id) === String(idAgendamento));

  if (index !== -1) {
    agendamentos[index].status = 'cancelado';
    localStorage.setItem(DB_KEYS.AGENDAMENTOS, JSON.stringify(agendamentos));
    carregarTabelaAgendamentosAdmin();
    carregarGradeHorariosAdmin();
  }
}

// 4. GERENCIADOR DE SERVIÇOS E PREÇOS (CORRIGIDO)
async function carregarGerenciadorServicos() {
  const container = document.getElementById('listaServicosAdmin');
  if (!container) return;

  let servicos = [];

  try {
    // 1. Busca os serviços atualizados direto do Supabase
    const { data: servicosSupa, error } = await supabaseClient
      .from('servicos')
      .select('*')
      .order('id', { ascending: true });

    if (!error && servicosSupa && servicosSupa.length > 0) {
      servicos = servicosSupa;
      // Atualiza a cópia do localStorage para compatibilidade
      localStorage.setItem(DB_KEYS.SERVICOS, JSON.stringify(servicos));
    } else {
      // Fallback para o localStorage se der erro na rede
      servicos = JSON.parse(localStorage.getItem(DB_KEYS.SERVICOS)) || SERVICOS_PADRAO;
    }
  } catch (err) {
    console.error('Erro ao conectar com Supabase:', err);
    servicos = JSON.parse(localStorage.getItem(DB_KEYS.SERVICOS)) || SERVICOS_PADRAO;
  }

  // 2. Monta o HTML exatamente como no seu código original
  container.innerHTML = servicos.map((s, idx) => `
    <div class="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
      <span class="font-bold text-sm text-white">${s.nome}</span>
      <div class="flex items-center gap-2">
        <span class="text-xs text-zinc-400">R$</span>
        <input type="number" step="0.5" value="${s.preco}" id="precoServico_${idx}"
          class="w-20 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-sm text-yellow-500 font-bold outline-none focus:border-red-600">
        <button onclick="salvarPrecoServico(${idx}, '${s.nome}')" class="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1 rounded-lg font-bold transition">
          Salvar
        </button>
      </div>
    </div>
  `).join('');
}

// Função chamada ao clicar no botão "Salvar" de cada serviço
async function salvarPrecoServico(idx, nomeServico) {
  const input = document.getElementById(`precoServico_${idx}`);
  if (!input) return;

  const novoPreco = parseFloat(input.value);

  if (isNaN(novoPreco) || novoPreco <= 0) {
    alert('Por favor, informe um preço válido.');
    return;
  }

  try {
    // 1. Atualiza no Supabase
    const { data, error } = await supabaseClient
      .from('servicos')
      .update({ preco: novoPreco })
      .eq('nome', nomeServico)
      .select();

    if (error) {
      console.error('Erro ao salvar no Supabase:', error.message);
      alert('Erro ao atualizar preço no banco de dados: ' + error.message);
      return;
    }

    // 2. Atualiza no localStorage para o Admin local
    let servicosLocais = JSON.parse(localStorage.getItem(DB_KEYS.SERVICOS)) || [];
    const indexLocal = servicosLocais.findIndex(s => s.nome.toLowerCase() === nomeServico.toLowerCase());
    
    if (indexLocal !== -1) {
      servicosLocais[indexLocal].preco = novoPreco;
      localStorage.setItem(DB_KEYS.SERVICOS, JSON.stringify(servicosLocais));
    }

    alert(`Preço do serviço "${nomeServico}" atualizado para R$ ${novoPreco.toFixed(2)}!`);

  } catch (err) {
    console.error('Erro de conexão ao salvar preço:', err);
    alert('Ocorreu um erro ao conectar com o servidor.');
  }
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
    // 1. Envia o UPDATE direto para o Supabase
    const { data, error } = await supabaseClient
      .from('servicos')
      .update({ preco: novoPreco })
      .ilike('nome', nomeServico) // Compara sem diferenciar maiúsculas/minúsculas
      .select();

    if (error) {
      console.error('Erro ao salvar no Supabase:', error.message);
      alert('Erro ao atualizar preço no banco de dados: ' + error.message);
      return;
    }

    if (!data || data.length === 0) {
      alert('Aviso: Nenhum serviço com esse nome foi encontrado no banco.');
      return;
    }

    // 2. Atualiza a cópia do localStorage para compatibilidade local
    let servicosLocais = JSON.parse(localStorage.getItem(DB_KEYS.SERVICOS)) || [];
    const indexLocal = servicosLocais.findIndex(s => s.nome.toLowerCase() === nomeServico.toLowerCase());
    
    if (indexLocal !== -1) {
      servicosLocais[indexLocal].preco = novoPreco;
      localStorage.setItem(DB_KEYS.SERVICOS, JSON.stringify(servicosLocais));
    }

    alert(`Preço do serviço "${nomeServico}" atualizado para R$ ${novoPreco.toFixed(2)} com sucesso!`);

    // 3. Recarrega o gerenciador para garantir que a tela exiba o dado gravado no Supabase
    if (typeof carregarGerenciadorServicos === 'function') {
      await carregarGerenciadorServicos();
    }

  } catch (err) {
    console.error('Erro de conexão ao salvar preço:', err);
    alert('Ocorreu um erro de conexão ao tentar salvar.');
  }
}

// 5. CARDS DE INDICADORES NO TOPO
function atualizarIndicadoresTopo() {
  const dataHoje = new Date().toISOString().split('T')[0];
  const agendamentos = JSON.parse(localStorage.getItem(DB_KEYS.AGENDAMENTOS) || '[]');
  const historico = JSON.parse(localStorage.getItem(DB_KEYS.HISTORICO) || '[]');
  const bloqueios = JSON.parse(localStorage.getItem(DB_KEYS.BLOQUEIOS) || '[]');

  const agendadosHoje = agendamentos.filter(a => a.data === dataHoje && a.status !== 'cancelado');
  const concluidosHoje = historico.filter(h => h.data === dataHoje || (h.concluidoEm && h.concluidoEm.startsWith(dataHoje)));
  const bloqueadosHoje = bloqueios.filter(b => b.data === dataHoje);

  const faturamentoTotal = concluidosHoje.reduce((acc, curr) => acc + Number(curr.preco || 0), 0);

  const elQtd = document.getElementById('qtdAgendamentosHoje');
  const elFat = document.getElementById('faturamentoHoje');
  const elLivres = document.getElementById('horariosLivres');
  const elBloq = document.getElementById('horariosBloqueados');

  if (elQtd) elQtd.innerText = agendadosHoje.length + concluidosHoje.length;
  if (elFat) elFat.innerText = `R$ ${faturamentoTotal.toFixed(2).replace('.', ',')}`;
  if (elBloq) elBloq.innerText = bloqueadosHoje.length;
  if (elLivres) elLivres.innerText = HORARIOS_PADRAO.length - (agendadosHoje.length + bloqueadosHoje.length);
}

function fazerLogoutAdmin() {
  localStorage.removeItem(DB_KEYS.USUARIO_LOGADO);
  window.location.href = 'login.html';
}

function abrirWhatsAppCliente(telefone, nomeCliente, data, hora, servico) {
  let numeroAlvo = telefone ? telefone.replace(/\D/g, '') : NUMERO_BARBEARIA;

  if (numeroAlvo.length <= 11 && !numeroAlvo.startsWith('55')) {
    numeroAlvo = '55' + numeroAlvo;
  }

  const partesData = data ? data.split('-') : [];
  const dataFormatada = partesData.length === 3 ? `${partesData[2]}/${partesData[1]}/${partesData[0]}` : data;

  const mensagem = `Olá, ${nomeCliente}! 👋\n\nConfirmamos o seu agendamento na *Odivelas Barbearia*:\n\n✂️ *Serviço:* ${servico}\n📅 *Data:* ${dataFormatada}\n⏰ *Horário:* ${hora}\n\nTe esperamos! Se precisar alterar algo, me avise por aqui.`;

  const urlWhatsApp = `https://wa.me/${numeroAlvo}?text=${encodeURIComponent(mensagem)}`;
  window.open(urlWhatsApp, '_blank');
}

// Função para atualizar o preço de um serviço no Supabase
async function atualizarPrecoServicoNoSupabase(nomeServico, novoPreco) {
  try {
    const { data, error } = await supabaseClient
      .from('servicos')
      .update({ preco: parseFloat(novoPreco) })
      .eq('nome', nomeServico);

    if (error) {
      alert('Erro ao atualizar preço: ' + error.message);
      return false;
    }

    alert(`Preço do serviço "${nomeServico}" atualizado com sucesso!`);
    return true;
  } catch (err) {
    console.error('Erro ao conectar com o Supabase:', err);
    return false;
  }
}