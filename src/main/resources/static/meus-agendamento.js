/**
 * Arquivo: meus-agendamentos.js
 * Descrição: Exibição e cancelamento dos agendamentos do cliente logado.
 * Odivelas Barbearia
 */

let usuarioLogado = null;

document.addEventListener('DOMContentLoaded', () => {
  verificarSessao();
  carregarMeusAgendamentos();
});

/**
 * 1. Verifica se o cliente está logado
 */
function verificarSessao() {
  const sessao = localStorage.getItem('odivelas_usuario_logado');
  
  if (!sessao) {
    // Se não houver sessão ativa, usa um perfil genérico em vez de travar
    usuarioLogado = {
      id: 'USR-GUEST',
      nome: 'Cliente',
      email: ''
    };
  } else {
    try {
      usuarioLogado = JSON.parse(sessao);
    } catch (e) {
      console.error('Erro ao ler usuario_logado:', e);
      usuarioLogado = { id: 'USR-GUEST', nome: 'Cliente', email: '' };
    }
  }

  // Atualiza o header com o nome do cliente
  const elNome = document.getElementById('nomeClienteHeader');
  if (elNome) {
    elNome.textContent = usuarioLogado.nome || 'Cliente';
  }
}

/**
 * 2. Carrega e exibe os agendamentos do usuário logado
 */
function carregarMeusAgendamentos() {
  const containerProximos = document.getElementById('containerProximosAgendamentos');
  const containerHistorico = document.getElementById('containerHistoricoAgendamentos');

  if (!containerProximos && !containerHistorico) return;

  // Busca todos os agendamentos salvos no localStorage
  const todosAgendamentos = JSON.parse(localStorage.getItem('odivelas_agendamentos') || '[]');

  // Se o usuário estiver logado com e-mail, filtra os dele. Se for recém-agendado sem e-mail, mostra os mais recentes.
  let meusAgendamentos = [];
  if (usuarioLogado && usuarioLogado.email) {
    meusAgendamentos = todosAgendamentos.filter(
      a => a.clienteEmail === usuarioLogado.email || a.clienteId === usuarioLogado.id
    );
  } else {
    // Caso de fallback: exibe todos os agendamentos guardados localmente
    meusAgendamentos = todosAgendamentos;
  }

  // Obter data atual no formato YYYY-MM-DD
  const hoje = new Date().toISOString().split('T')[0];

  const proximos = meusAgendamentos.filter(
    a => a.data >= hoje && a.status !== 'cancelado'
  );

  const historico = meusAgendamentos.filter(
    a => a.data < hoje || a.status === 'cancelado'
  );

  // Renderiza no HTML
  if (containerProximos) {
    renderizarLista(containerProximos, proximos, true);
  }

  if (containerHistorico) {
    renderizarLista(containerHistorico, historico, false);
  }
}

/**
 * 3. Renderiza os cards de agendamento no container correto
 */
function renderizarLista(container, lista, eProximo) {
  if (!lista || lista.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-zinc-500 border border-zinc-900 rounded-xl bg-zinc-950/40">
        <i class="fa-regular fa-calendar-xmark text-2xl mb-2 opacity-50"></i>
        <p class="text-sm">Nenhum agendamento encontrado.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = lista
    .map((a) => {
      // Formatação da data (AAAA-MM-DD -> DD/MM/AAAA)
      const partesData = a.data ? a.data.split('-') : [];
      const dataFormatada = partesData.length === 3 ? `${partesData[2]}/${partesData[1]}/${partesData[0]}` : (a.data || 'Data N/A');
      const precoFormatado = Number(a.preco || a.valor || 0).toFixed(2).replace('.', ',');
      const horaExibicao = a.horario || a.hora || 'Horário N/A';

      const isCancelado = a.status === 'cancelado';
      const isConcluido = a.status === 'concluido';

      // Definição das cores e textos da tag de status
      let badgeHtml = '';
      if (isConcluido) {
        badgeHtml = `<span class="text-xs font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <i class="fa-solid fa-check text-[10px]"></i> Corte Concluído
        </span>`;
      } else if (isCancelado) {
        badgeHtml = `<span class="text-xs font-bold uppercase tracking-wider bg-red-950/40 text-red-400 border border-red-900/50 px-2.5 py-0.5 rounded-full">
          Cancelado
        </span>`;
      } else {
        badgeHtml = `<span class="text-xs font-bold uppercase tracking-wider bg-blue-950/50 text-blue-400 border border-blue-900/50 px-2.5 py-0.5 rounded-full">
          Confirmado
        </span>`;
      }

      // Estilo da caixa principal
      let cardEstilo = 'border-zinc-800 bg-zinc-950/80 text-white';
      if (isCancelado) cardEstilo = 'border-zinc-900 bg-zinc-950/30 text-zinc-500';
      if (isConcluido) cardEstilo = 'border-emerald-900/40 bg-zinc-950/90 text-white';

      return `
        <div class="border ${cardEstilo} rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              ${badgeHtml}
              <span class="text-xs text-zinc-400"><i class="fa-solid fa-scissors text-red-500 mr-1"></i> ${a.barbeiro || 'HS Barbeiro'}</span>
            </div>
            <h4 class="font-bold text-base text-zinc-100">${a.servico || a.servico_nome || 'Corte'}</h4>
            <div class="flex items-center gap-4 text-xs text-zinc-400 pt-1">
              <span><i class="fa-regular fa-calendar mr-1 text-red-500"></i> ${dataFormatada}</span>
              <span><i class="fa-regular fa-clock mr-1 text-red-500"></i> ${horaExibicao}</span>
              <span class="text-amber-500 font-bold">R$ ${precoFormatado}</span>
            </div>
          </div>

          ${
            eProximo && !isCancelado && !isConcluido
              ? `
            <button 
              type="button" 
              onclick="cancelarAgendamento('${a.id}')" 
              class="self-start md:self-center px-3 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 border border-red-900/60 hover:border-red-600 bg-red-950/20 rounded-lg transition duration-200">
              <i class="fa-solid fa-xmark mr-1"></i> Cancelar
            </button>
          `
              : ''
          }
        </div>
      `;
    })
    .join('');
}
/**
 * 4. Cancela um agendamento (Conectado ao Supabase)
 */
async function cancelarAgendamento(idAgendamento) {
  if (!confirm('Deseja realmente cancelar este agendamento?')) return;

  try {
    // 1. Atualiza o status para 'cancelado' no Supabase
    const { error } = await supabaseClient
      .from('agendamentos')
      .update({ status: 'cancelado' })
      .eq('id', idAgendamento);

    if (error) {
      console.error('Erro ao cancelar no Supabase:', error.message);
    }

    // 2. Atualiza o localStorage do cliente para manter a consistência
    const todosAgendamentos = JSON.parse(localStorage.getItem('odivelas_agendamentos') || '[]');
    const index = todosAgendamentos.findIndex((a) => String(a.id) === String(idAgendamento));

    if (index !== -1) {
      todosAgendamentos[index].status = 'cancelado';
      localStorage.setItem('odivelas_agendamentos', JSON.stringify(todosAgendamentos));
    }

    alert('Agendamento cancelado com sucesso! O horário foi liberado.');
    
    // 3. Atualiza a tela de Meus Agendamentos
    if (typeof carregarMeusAgendamentos === 'function') {
      carregarMeusAgendamentos();
    } else {
      window.location.reload();
    }

  } catch (err) {
    console.error('Erro ao processar cancelamento:', err);
    alert('Erro de conexão ao tentar cancelar. Tente novamente.');
  }
}

/**
 * 5. Fazer Logout da Conta
 */
function fazerLogout() {
  localStorage.removeItem('odivelas_usuario_logado');
  window.location.href = 'login.html';
}