// Função para trocar as exibições no front-end
function mudarTela(tela) {
  document.getElementById("cardLogin").classList.add("hidden");
  document.getElementById("cardCadastro").classList.add("hidden");
  document.getElementById("cardConfirmacao").classList.add("hidden");

  if (tela === "login") {
    document.getElementById("cardLogin").classList.remove("hidden");
  } else if (tela === "cadastro") {
    document.getElementById("cardCadastro").classList.remove("hidden");
  } else if (tela === "confirmacao") {
    document.getElementById("cardConfirmacao").classList.remove("hidden");
  }
}

// Ao enviar o formulário de Cadastro
function enviarCodigoConfirmacao(event) {
  event.preventDefault();
  
  const emailInput = document.getElementById("emailCadastro").value;
  document.getElementById("exibirEmailConfirmacao").innerText = emailInput;

  // FUTURO BACKEND:
  // Aqui faremos a requisição POST para enviar o e-mail de verificação ao usuário.
  
  // Muda o front para a tela do código de confirmação
  mudarTela("confirmacao");
}

// Ao validar o código digitado
function validarCodigo(event) {
  event.preventDefault();

  // FUTURO BACKEND:
  // Aqui enviaremos o código para o backend validar se está correto.

  alert("Conta ativada com sucesso!");
  window.location.href = "agendamento.html";
}

// Ao fazer login
function handleLogin(event) {
  event.preventDefault();

  // FUTURO BACKEND:
  // Validação de login e token JWT.

  window.location.href = "agendamento.html";
}