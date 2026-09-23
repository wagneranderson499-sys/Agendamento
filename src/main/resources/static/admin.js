// Grade padrão de 50 em 50 minutos (45 min de corte + 5 min de intervalo)
const todosHorarios = [
  "09:00", "09:50", "10:40", "11:30", "12:20", 
  "13:10", "14:00", "14:50", "15:40", "16:30", 
  "17:20", "18:10", "19:00", "19:50", "20:40", "21:30"
];

// Carrega os bloqueios do localStorage ou inicia um objeto vazio {}
let bloqueiosData = JSON.parse(localStorage.getItem("bloqueiosADM")) || {};

document.addEventListener("DOMContentLoaded", () => {
  const hoje = new Date().toISOString().split("T")[0];
  const inputData = document.getElementById("adminDataFiltro");
  if (inputData) {
    inputData.value = hoje;
    carregarHorariosAdmin();
  }
});

function carregarHorariosAdmin() {
  const dataSelecionada = document.getElementById("adminDataFiltro").value;
  const grid = document.getElementById("gridHorariosAdmin");
  grid.innerHTML = "";

  const bloqueadosHoje = bloqueiosData[dataSelecionada] || [];

  todosHorarios.forEach(horario => {
    const estaBloqueado = bloqueadosHoje.includes(horario);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.onclick = () => alternarBloqueioHorario(dataSelecionada, horario);

    if (estaBloqueado) {
      btn.className = "p-3 rounded-xl border border-red-600/60 bg-red-950/40 text-red-400 font-bold text-sm flex flex-col items-center gap-1 hover:bg-red-900/50 transition";
      btn.innerHTML = `<span>${horario}</span><span class="text-[10px] uppercase tracking-wider text-red-500">Bloqueado</span>`;
    } else {
      btn.className = "p-3 rounded-xl border border-green-600/40 bg-green-950/20 text-green-400 font-bold text-sm flex flex-col items-center gap-1 hover:bg-green-900/40 transition";
      btn.innerHTML = `<span>${horario}</span><span class="text-[10px] uppercase tracking-wider text-green-500">Livre</span>`;
    }

    grid.appendChild(btn);
  });
}

function alternarBloqueioHorario(data, horario) {
  if (!bloqueiosData[data]) {
    bloqueiosData[data] = [];
  }

  const index = bloqueiosData[data].indexOf(horario);

  if (index > -1) {
    // Desbloqueia o horário
    bloqueiosData[data].splice(index, 1);
  } else {
    // Bloqueia o horário
    bloqueiosData[data].push(horario);
  }

  // Salva a alteração no localStorage para a tela do usuário ler
  localStorage.setItem("bloqueiosADM", JSON.stringify(bloqueiosData));

  // Recarrega a grade do Administrador
  carregarHorariosAdmin();
}

function trocarAba(abaId) {
  document.getElementById("abaHorarios").classList.add("hidden");
  document.getElementById("abaAgendamentos").classList.add("hidden");
  document.getElementById("abaServicos").classList.add("hidden");

  document.querySelectorAll(".aba-btn").forEach(btn => {
    btn.classList.remove("bg-red-600", "text-white");
    btn.classList.add("bg-zinc-900", "text-zinc-400");
  });

  document.getElementById(abaId).classList.remove("hidden");

  if (abaId === 'abaHorarios') {
    document.getElementById("btnAbaHorarios").className = "aba-btn bg-red-600 text-white font-bold uppercase text-xs px-4 py-2 rounded-xl transition";
  } else if (abaId === 'abaAgendamentos') {
    document.getElementById("btnAbaAgendamentos").className = "aba-btn bg-red-600 text-white font-bold uppercase text-xs px-4 py-2 rounded-xl transition";
  } else if (abaId === 'abaServicos') {
    document.getElementById("btnAbaServicos").className = "aba-btn bg-red-600 text-white font-bold uppercase text-xs px-4 py-2 rounded-xl transition";
  }
}