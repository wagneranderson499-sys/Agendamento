
/**
 * Arquivo: meus-agendamento.js
 * Descrição: Exibição e cancelamento dos agendamentos do cliente.
 * Odivelas Barbearia
 *
 * Os agendamentos são exibidos a partir do localStorage.
 * O Supabase continua sendo usado para atualizar cancelamentos.
 */

const DB_KEY_AGENDAMENTOS = 'odivelas_agendamentos';

document.addEventListener('DOMContentLoaded', () => {
  carregarMeusAgendamentos();
});

// Obtém os agendamentos salvos neste navegador.
function obterAgendamentosLocais() {
  try {
    const dados = JSON.parse(
      localStorage.getItem(DB_KEY_AGENDAMENTOS) || '[]'
    );

    return Array.isArray(dados) ? dados : [];
  } catch (erro) {
    console.error('Erro ao ler os agendamentos locais:', erro);
    return [];
  }
}

// Evita que dados inseridos pelo usuário sejam interpretados como HTML.
function escaparHTML(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, caractere => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[caractere]);
}

// Formata a data sem depender do fuso horário do navegador.
function formatarData(data) {
  if (!data) return 'Data não informada';

  const partes = String(data).split('-');

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return escaparHTML(data);
}

// Formata o preço em reais.
function formatarPreco(preco) {
  const valor = Number(preco);

  if (!Number.isFinite(valor)) return 'A consultar';

  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

// Carrega todos os agendamentos deste navegador.
function carregarMeusAgendamentos() {
  const container = document.getElementById('listaAgendamentos');

  if (!container) return;

  const agendamentos = obterAgendamentosLocais();

  if (agendamentos.length === 0) {
    container.innerHTML = `
      <div class="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-8 text-center">
        <i class="fa-regular fa-calendar-xmark text-3xl text-zinc-600 mb-4"></i>

        <h3 class="text-white font-bold mb-2">
          Nenhum agendamento encontrado
        </h3>

        <p class="text-zinc-400 text-sm mb-5">
          Quando você fizer um agendamento, as informações aparecerão aqui.
        </p>

        <a
          href="agendamento.html"
          class="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm px-5 py-3 rounded-xl transition"
        >
          <i class="fa-solid fa-plus"></i>
          Fazer agendamento
        </a>
      </div>
    `;
    return;
  }

  // Ordena do mais recente para o mais antigo.
  agendamentos.sort((a, b) => {
    const dataA = `${a.data || ''} ${a.horario || a.hora || ''}`;
    const dataB = `${b.data || ''} ${b.horario || b.hora || ''}`;

    return dataB.localeCompare(dataA);
  });

  container.innerHTML = agendamentos
    .map(renderizarAgendamento)
    .join('');
}

// Monta cada cartão de agendamento.
function renderizarAgendamento(a) {
  const status = String(a.status || 'confirmado').toLowerCase();

  const cancelado = status === 'cancelado';
  const concluido = status === 'concluido' || status === 'concluído';

  let textoStatus = 'Confirmado';
  let classeStatus =
    'bg-blue-950/50 text-blue-400 border-blue-900/50';

  if (cancelado) {
    textoStatus = 'Cancelado';
    classeStatus = 'bg-red-950/40 text-red-400 border-red-900/50';
  } else if (concluido) {
    textoStatus = 'Concluído';
    classeStatus =
      'bg-emerald-950/80 text-emerald-400 border-emerald-500/50';
  }

  const nomeServico = escaparHTML(
    a.servico || a.servico_nome || 'Serviço não informado'
  );

  const barbeiro = escaparHTML(
    a.barbeiro || 'HS Barbeiro'
  );

  const nomeCliente = escaparHTML(
    a.clienteNome || a.cliente_nome || a.nome || ''
  );

  const telefone = escaparHTML(
    a.clienteTelefone || a.cliente_telefone || a.telefone || ''
  );

  const data = formatarData(a.data);
  const horario = escaparHTML(
    a.horario || a.hora || 'Não informado'
  );

  const preco = formatarPreco(a.preco ?? a.valor);

  // O ID real do banco será necessário para cancelar no Supabase.
  const idBanco = a.idSupabase ?? a.id_supabase ?? null;

  const podeCancelar =
    status === 'confirmado' &&
    idBanco !== null &&
    idBanco !== undefined &&
    String(idBanco).trim() !== '';

  return `
    <article class="bg-zinc-900/80 border ${
      cancelado
        ? 'border-zinc-800 opacity-75'
        : concluido
          ? 'border-emerald-900/40'
          : 'border-zinc-800'
    } rounded-2xl p-5 md:p-6 transition">

      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">

        <div>
          <span class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider border px-3 py-1 rounded-full ${classeStatus}">
            <i class="fa-solid ${
              cancelado
                ? 'fa-xmark'
                : concluido
                  ? 'fa-check'
                  : 'fa-calendar-check'
            }"></i>
            ${textoStatus}
          </span>

          <h3 class="text-lg font-bold text-white mt-3">
            ${nomeServico}
          </h3>

          <p class="text-sm text-zinc-400 mt-1">
            <i class="fa-solid fa-scissors text-red-500 mr-2"></i>
            ${barbeiro}
          </p>
        </div>

        <p class="text-amber-400 font-bold text-lg">
          ${preco}
        </p>

      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">

        <div class="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3">
          <p class="text-zinc-500 text-xs uppercase tracking-wider mb-1">
            Data
          </p>
          <p class="text-sm text-zinc-200">
            <i class="fa-regular fa-calendar text-red-500 mr-2"></i>
            ${data}
          </p>
        </div>

        <div class="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3">
          <p class="text-zinc-500 text-xs uppercase tracking-wider mb-1">
            Horário
          </p>
          <p class="text-sm text-zinc-200">
            <i class="fa-regular fa-clock text-red-500 mr-2"></i>
            ${horario}
          </p>
        </div>

      </div>

      ${
        nomeCliente || telefone
          ? `
            <div class="mt-4 text-xs text-zinc-400 space-y-1">
              ${
                nomeCliente
                  ? `<p><i class="fa-regular fa-user mr-2"></i>${nomeCliente}</p>`
                  : ''
              }
              ${
                telefone
                  ? `<p><i class="fa-brands fa-whatsapp mr-2"></i>${telefone}</p>`
                  : ''
              }
            </div>
          `
          : ''
      }

      ${
        podeCancelar
          ? `
            <div class="mt-5 pt-4 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onclick="cancelarAgendamento('${escaparHTML(idBanco)}')"
                class="px-4 py-2.5 text-xs font-bold text-red-400 hover:text-white border border-red-900/60 hover:bg-red-700 hover:border-red-600 rounded-xl transition"
              >
                <i class="fa-solid fa-xmark mr-1"></i>
                Cancelar agendamento
              </button>
            </div>
          `
          : ''
      }

    </article>
  `;
}

// Cancela o agendamento no Supabase e sincroniza a cópia local.
async function cancelarAgendamento(idAgendamento) {
  const confirmado = confirm(
    'Deseja realmente cancelar este agendamento?'
  );

  if (!confirmado) return;

  if (typeof supabaseClient === 'undefined' || !supabaseClient) {
    alert('Não foi possível conectar ao sistema. Tente novamente.');
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('agendamentos')
      .update({ status: 'cancelado' })
      .eq('id', idAgendamento)
      .eq('status', 'confirmado')
      .select('id');

    if (error) {
      console.error('Erro ao cancelar no Supabase:', error);
      alert(
        'Não foi possível cancelar. Verifique as permissões do banco de dados e tente novamente.'
      );
      return;
    }

    if (!data || data.length === 0) {
      alert(
        'O agendamento não foi atualizado. Ele pode já estar cancelado ou o banco não autorizou a operação.'
      );
      return;
    }

    const agendamentos = obterAgendamentosLocais();

    const atualizados = agendamentos.map(a => {
      const idLocal = a.idSupabase ?? a.id_supabase;

      if (String(idLocal) === String(idAgendamento)) {
        return { ...a, status: 'cancelado' };
      }

      return a;
    });

    localStorage.setItem(
      DB_KEY_AGENDAMENTOS,
      JSON.stringify(atualizados)
    );

    alert('Agendamento cancelado com sucesso!');
    carregarMeusAgendamentos();

  } catch (erro) {
    console.error('Erro ao processar cancelamento:', erro);
    alert('Erro de conexão ao tentar cancelar. Tente novamente.');
  }
}
