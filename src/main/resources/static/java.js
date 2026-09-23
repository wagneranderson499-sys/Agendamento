let indiceAtual = 0
let notaSelecionada = 0

// --- FUNÇÕES DO MODAL ---
function abrirModal() {
  const modal = document.getElementById("modalAvaliacao")
  if (!modal) return

  modal.classList.remove("hidden")
  modal.classList.add("flex")
}

function fecharModal() {
  const modal = document.getElementById("modalAvaliacao")
  if (!modal) return

  modal.classList.remove("flex")
  modal.classList.add("hidden")
}

function avaliar(nota) {
  notaSelecionada = nota
  const estrelas = document.querySelectorAll(".estrela")

  estrelas.forEach((estrela, index) => {
    if (index < nota) {
      estrela.classList.remove("text-zinc-700")
      estrela.classList.add("text-yellow-500")
    } else {
      estrela.classList.remove("text-yellow-500")
      estrela.classList.add("text-zinc-700")
    }
  })
}

// --- PERSISTÊNCIA NO LOCALSTORAGE ---
function pegarAvaliacoes() {
  return JSON.parse(localStorage.getItem("avaliacoesBarbearia")) || []
}

function salvarAvaliacoes(avaliacoes) {
  localStorage.setItem("avaliacoesBarbearia", JSON.stringify(avaliacoes))
}

// --- ENVIO DA AVALIAÇÃO ---
function enviarAvaliacao(event) {
  event.preventDefault()

  const nomeInput = document.getElementById("nomeCliente")
  const comentarioInput = document.getElementById("comentarioCliente")

  if (!nomeInput || !comentarioInput) return

  const nome = nomeInput.value.trim()
  const comentario = comentarioInput.value.trim()

  if (nome === "" || comentario === "" || notaSelecionada === 0) {
    alert("Por favor, preencha seu nome, comentário e selecione uma nota nas estrelas!")
    return
  }

  const novaAvaliacao = {
    nome: nome,
    nota: notaSelecionada,
    comentario: comentario
  }

  const avaliacoes = pegarAvaliacoes()
  avaliacoes.unshift(novaAvaliacao)
  salvarAvaliacoes(avaliacoes)

  // Reseta os campos do formulário
  nomeInput.value = ""
  comentarioInput.value = ""
  notaSelecionada = 0
  avaliar(0)

  // Atualiza as telas e exibe o novo comentário no carrossel
  indiceAtual = 0
  atualizarCarrossel()
  mostrarAvaliacoesNoModal()
  fecharModal()
}

// --- EXIBIÇÃO NO MODAL DE AVALIAÇÕES ---
function mostrarAvaliacoesNoModal() {
  const lista = document.getElementById("listaAvaliacoes")
  if (!lista) return

  const avaliacoes = pegarAvaliacoes()
  lista.innerHTML = ""

  if (avaliacoes.length === 0) {
    lista.innerHTML = `
      <div class="bg-black border border-zinc-800 rounded-xl p-4">
        <p class="text-zinc-400 text-sm">
          Nenhuma avaliação ainda.
        </p>
      </div>
    `
    return
  }

  avaliacoes.forEach((avaliacao) => {
    const card = document.createElement("div")
    card.className = "bg-black border border-zinc-800 border-l-4 border-red-600 rounded-xl p-4 mb-3"

    card.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-white font-bold uppercase">${avaliacao.nome}</h4>
        <span class="text-yellow-500 text-lg">
          ${"★".repeat(avaliacao.nota)}${"☆".repeat(5 - avaliacao.nota)}
        </span>
      </div>
      <p class="text-zinc-400 text-sm leading-relaxed">${avaliacao.comentario}</p>
    `
    lista.appendChild(card)
  })
}

// --- CARROSSEL PRINCIPAL ---
function atualizarCarrossel() {
  const avaliacoes = pegarAvaliacoes()

  const nome = document.getElementById("carouselNome")
  const comentario = document.getElementById("carouselComentario")
  const estrelas = document.getElementById("carouselEstrelas")

  if (!nome || !comentario || !estrelas) return

  if (avaliacoes.length === 0) {
    nome.textContent = "Nenhuma avaliação ainda"
    comentario.textContent = "Seja o primeiro cliente a avaliar a Odivelas Barbearia."
    estrelas.textContent = "☆☆☆☆☆"

    atualizarIndicadores()
    return
  }

  if (indiceAtual >= avaliacoes.length) {
    indiceAtual = 0
  }

  const avaliacao = avaliacoes[indiceAtual]

  nome.textContent = avaliacao.nome
  comentario.textContent = `"${avaliacao.comentario}"`
  estrelas.textContent = "★".repeat(avaliacao.nota) + "☆".repeat(5 - avaliacao.nota)

  atualizarIndicadores()
}

function atualizarIndicadores() {
  const container = document.getElementById("carouselIndicadores")
  if (!container) return

  const avaliacoes = pegarAvaliacoes()
  container.innerHTML = ""

  if (avaliacoes.length === 0) {
    const dot = document.createElement("div")
    dot.className = "w-6 h-2 bg-red-600 rounded-full"
    container.appendChild(dot)
    return
  }

  avaliacoes.forEach((_, index) => {
    const dot = document.createElement("button")

    dot.onclick = () => {
      indiceAtual = index
      atualizarCarrossel()
    }

    dot.className =
      index === indiceAtual
        ? "w-6 h-2 bg-red-600 rounded-full transition-all duration-300"
        : "w-2 h-2 bg-zinc-700 rounded-full transition-all duration-300"

    container.appendChild(dot)
  })
}

function proximaAvaliacao() {
  const avaliacoes = pegarAvaliacoes()
  if (avaliacoes.length === 0) return

  indiceAtual++
  if (indiceAtual >= avaliacoes.length) {
    indiceAtual = 0
  }

  atualizarCarrossel()
}

function voltarAvaliacao() {
  const avaliacoes = pegarAvaliacoes()
  if (avaliacoes.length === 0) return

  indiceAtual--
  if (indiceAtual < 0) {
    indiceAtual = avaliacoes.length - 1
  }

  atualizarCarrossel()
}

// Troca automática do carrossel a cada 5 segundos
setInterval(() => {
  proximaAvaliacao()
}, 5000)

// --- INICIALIZAÇÃO SEGURA DO JS ---
document.addEventListener("DOMContentLoaded", () => {
  // Inicializa o carrossel e as avaliações no modal
  atualizarCarrossel()
  mostrarAvaliacoesNoModal()

  // Gerenciamento dos formulários de Login/Cadastro (se existirem na página)
  const abaEntrar = document.getElementById("abaEntrar")
  const abaCadastrar = document.getElementById("abaCadastrar")
  const formLogin = document.getElementById("formLogin")
  const formCadastro = document.getElementById("formCadastro")
  const btnIrParaCadastro = document.getElementById("btnIrParaCadastro")
  const mensagemAlerta = document.getElementById("mensagemAlerta")

  if (abaEntrar && abaCadastrar && formLogin && formCadastro) {
    function mostrarLogin() {
      formLogin.classList.remove("hidden")
      formLogin.classList.add("block")
      formCadastro.classList.remove("block")
      formCadastro.classList.add("hidden")

      abaEntrar.classList.add("aba-ativa")
      abaEntrar.classList.remove("aba-inativa")
      abaCadastrar.classList.add("aba-inativa")
      abaCadastrar.classList.remove("aba-ativa")

      esconderMensagem()
    }

    function mostrarCadastro() {
      formCadastro.classList.remove("hidden")
      formCadastro.classList.add("block")
      formLogin.classList.remove("block")
      formLogin.classList.add("hidden")

      abaCadastrar.classList.add("aba-ativa")
      abaCadastrar.classList.remove("aba-inativa")
      abaEntrar.classList.add("aba-inativa")
      abaEntrar.classList.remove("aba-ativa")

      esconderMensagem()
    }

    function exibirMensagem(texto, tipo = "erro") {
      if (!mensagemAlerta) return
      mensagemAlerta.innerText = texto
      mensagemAlerta.classList.remove("hidden")

      if (tipo === "erro") {
        mensagemAlerta.className = "bg-red-900/50 border border-red-500 text-red-200 text-xs text-center p-3 rounded-lg mt-4 font-semibold block"
      } else {
        mensagemAlerta.className = "bg-emerald-900/50 border border-emerald-500 text-emerald-200 text-xs text-center p-3 rounded-lg mt-4 font-semibold block"
      }
    }

    function esconderMensagem() {
      if (mensagemAlerta) mensagemAlerta.classList.add("hidden")
    }

    abaEntrar.addEventListener("click", mostrarLogin)
    abaCadastrar.addEventListener("click", mostrarCadastro)
    if (btnIrParaCadastro) btnIrParaCadastro.addEventListener("click", mostrarCadastro)

    formLogin.addEventListener("submit", (e) => {
      e.preventDefault()
      const email = document.getElementById("email")?.value
      const password = document.getElementById("password")?.value

      if (!email || !password) {
        exibirMensagem("Preencha todos os campos.")
        return
      }

      console.log("Tentando logar com:", { email, password })
      exibirMensagem("Login realizado com sucesso!", "sucesso")
    })

    formCadastro.addEventListener("submit", (e) => {
      e.preventDefault()
      const senha = document.getElementById("senhaCadastro")?.value
      const confirmarSenha = document.getElementById("confirmarSenha")?.value

      if (senha !== confirmarSenha) {
        exibirMensagem("As senhas não coincidem!")
        return
      }

      console.log("Cadastrando usuário...")
      exibirMensagem("Cadastro efetuado com sucesso!", "sucesso")
    })
  }
})

// Horários calculados de 50 em 50 minutos (45 min do corte + 5 min de margem)
// Grade padrão de 50 em 50 minutos
const todosHorarios = [
  "09:00", "09:50", "10:40", "11:30", "12:20", 
  "13:10", "14:00", "14:50", "15:40", "16:30", 
  "17:20", "18:10", "19:00", "19:50", "20:40", "21:30"
];

function renderizarHorarios(dataSelecionada) {
  const container = document.getElementById("containerHorarios");
  if (!container) return;
  
  container.innerHTML = "";

  // Busca os bloqueios salvos pelo Administrador no localStorage
  const bloqueiosData = JSON.parse(localStorage.getItem("bloqueiosADM")) || {};
  const bloqueadosNaData = bloqueiosData[dataSelecionada] || [];

  // Busca agendamentos feitos por outros clientes (simulação)
  const agendamentosExistentes = JSON.parse(localStorage.getItem("agendamentosExistentes")) || [];

  todosHorarios.forEach((horario) => {
    // 1. Checa se o Administrador bloqueou este horário na data selecionada
    const estaBloqueadoADM = bloqueadosNaData.includes(horario);

    // 2. Checa se outro cliente já agendou esse horário nessa data
    const estaAgendado = agendamentosExistentes.some(
      (ag) => ag.data === dataSelecionada && ag.horario === horario
    );

    const indisponivel = estaBloqueadoADM || estaAgendado;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerText = horario;
    btn.disabled = indisponivel;

    if (indisponivel) {
      btn.className = "py-2 px-3 text-xs md:text-sm font-bold rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-600 cursor-not-allowed line-through";
      btn.title = estaBloqueadoADM ? "Horário indisponível (Bloqueado)" : "Horário já reservado";
    } else {
      btn.className = "horario-btn py-2 px-3 text-xs md:text-sm font-bold rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-red-600 transition-all";
      btn.onclick = () => selecionarHorario(btn, horario);
    }

    container.appendChild(btn);
  });
}

function selecionarHorario(elemento, horario) {
  document.querySelectorAll(".horario-btn").forEach((b) => {
    b.classList.remove("border-red-600", "bg-red-600", "text-white");
    b.classList.add("bg-zinc-900", "text-zinc-300");
  });

  elemento.classList.remove("bg-zinc-900", "text-zinc-300");
  elemento.classList.add("border-red-600", "bg-red-600", "text-white");

  document.getElementById("selectHorario").value = horario;
}

// Evento ao alterar a data no agendamento do cliente
document.addEventListener("DOMContentLoaded", () => {
  const inputData = document.getElementById("inputData");
  if (inputData) {
    inputData.addEventListener("change", (e) => {
      renderizarHorarios(e.target.value);
    });
  }
});