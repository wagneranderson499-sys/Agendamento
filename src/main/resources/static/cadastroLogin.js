/**
 * Arquivo: cadastroLogin.js
 * Descrição: Lógica de Login e Cadastro com persistência no localStorage.
 * Odivelas Barbearia
 */

/* ==========================================================================
   1. NAVEGAÇÃO E UTILS DE INTERFACE
   ========================================================================== */

function mudarTela(tela) {
  ocultarAlerta();

  const cardLogin = document.getElementById("cardLogin");
  const cardCadastro = document.getElementById("cardCadastro");

  if (!cardLogin || !cardCadastro) return;

  cardLogin.classList.add("hidden");
  cardCadastro.classList.add("hidden");

  if (tela === "login") {
    cardLogin.classList.remove("hidden");
  } else if (tela === "cadastro") {
    cardCadastro.classList.remove("hidden");
  }
}

function toggleSenha(inputId, btn) {
  const input = document.getElementById(inputId);
  const icone = btn.querySelector("i");

  if (input.type === "password") {
    input.type = "text";
    icone.classList.replace("fa-eye", "fa-eye-slash");
  } else {
    input.type = "password";
    icone.classList.replace("fa-eye-slash", "fa-eye");
  }
}

function exibirAlerta(mensagem, tipo = "erro") {
  const box = document.getElementById("alertBox");

  if (!box) return;

  box.classList.remove(
    "hidden",
    "bg-red-950/80",
    "border-red-600",
    "text-red-200",
    "bg-emerald-950/80",
    "border-emerald-500",
    "text-emerald-200"
  );

  if (tipo === "erro") {
    box.classList.add(
      "bg-red-950/80",
      "border-red-600",
      "text-red-200"
    );

    box.innerHTML = `<i class="fa-solid fa-circle-exclamation mr-2"></i> ${sanitizarHTML(mensagem)}`;
  } else {
    box.classList.add(
      "bg-emerald-950/80",
      "border-emerald-500",
      "text-emerald-200"
    );

    box.innerHTML = `<i class="fa-solid fa-circle-check mr-2"></i> ${sanitizarHTML(mensagem)}`;
  }
}

function ocultarAlerta() {
  const box = document.getElementById("alertBox");

  if (box) box.classList.add("hidden");
}


/* ==========================================================================
   2. SEGURANÇA E VALIDAÇÃO DE DADOS
   ========================================================================== */

function sanitizarHTML(str) {
  const temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
}

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function aplicarMascaraTelefone(input) {
  let valor = input.value.replace(/\D/g, "");

  if (valor.length > 11) {
    valor = valor.slice(0, 11);
  }

  if (valor.length > 6) {
    valor = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7)}`;
  } else if (valor.length > 2) {
    valor = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
  } else if (valor.length > 0) {
    valor = `(${valor}`;
  }

  input.value = valor;
}

function setLoading(button, isLoading, contentDefault) {
  if (isLoading) {
    button.disabled = true;
    button.classList.add("opacity-80", "cursor-not-allowed");

    button.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> ${contentDefault}`;
  } else {
    button.disabled = false;
    button.classList.remove("opacity-80", "cursor-not-allowed");

    button.innerHTML = contentDefault;
  }
}


/* ==========================================================================
   3. RECUPERAÇÃO DE SENHA
   ========================================================================== */

function solicitarRecuperacao() {
  const modal = document.getElementById("modalRecuperacao");

  if (!modal) {
    console.error("Modal de recuperação de senha não encontrado.");
    return;
  }

  const form = document.getElementById("formRecuperacao");

  if (form) {
    form.reset();
  }

  modal.classList.remove("hidden");

  const emailInput = document.getElementById("recuperacaoEmail");

  if (emailInput) {
    setTimeout(() => {
      emailInput.focus();
    }, 100);
  }
}

function fecharModalRecuperacao() {
  const modal = document.getElementById("modalRecuperacao");

  if (modal) {
    modal.classList.add("hidden");
  }
}

async function handleRecuperacao(event) {
  event.preventDefault();

  const emailInput = document.getElementById("recuperacaoEmail");
  const senhaAtualInput = document.getElementById("recuperacaoSenhaAtual");
  const novaSenhaInput = document.getElementById("recuperacaoNovaSenha");
  const confirmarSenhaInput = document.getElementById("recuperacaoConfirmarSenha");
  const btnSubmit = document.getElementById("btnSubmitRecuperacao");

  if (
    !emailInput ||
    !senhaAtualInput ||
    !novaSenhaInput ||
    !confirmarSenhaInput ||
    !btnSubmit
  ) {
    alert("Não foi possível carregar o formulário de recuperação.");
    return;
  }

  const email = emailInput.value.trim().toLowerCase();
  const senhaAtual = senhaAtualInput.value;
  const novaSenha = novaSenhaInput.value;
  const confirmarSenha = confirmarSenhaInput.value;

  /* ---------------------------
     Validações
     --------------------------- */

  if (!email) {
    alert("Informe seu e-mail cadastrado.");
    emailInput.focus();
    return;
  }

  if (!validarEmail(email)) {
    alert("Informe um endereço de e-mail válido.");
    emailInput.focus();
    return;
  }

  if (!senhaAtual) {
    alert("Informe sua senha atual.");
    senhaAtualInput.focus();
    return;
  }

  if (!novaSenha) {
    alert("Informe sua nova senha.");
    novaSenhaInput.focus();
    return;
  }

  if (novaSenha.length < 6) {
    alert("A nova senha deve conter no mínimo 6 caracteres.");
    novaSenhaInput.focus();
    return;
  }

  if (novaSenha !== confirmarSenha) {
    alert("A confirmação da nova senha não confere.");
    confirmarSenhaInput.focus();
    return;
  }

  if (novaSenha === senhaAtual) {
    alert("A nova senha precisa ser diferente da senha atual.");
    novaSenhaInput.focus();
    return;
  }

  setLoading(btnSubmit, true, "Alterando senha...");

  try {

    /* ---------------------------------------------------------
       1. Confirma se o e-mail e a senha atual pertencem à conta
       --------------------------------------------------------- */

    const { data: authData, error: loginError } =
      await supabaseClient.auth.signInWithPassword({
        email: email,
        password: senhaAtual
      });

    if (loginError || !authData?.user) {
      throw new Error("E-mail ou senha atual incorretos.");
    }

    const user = authData.user;

    /* ---------------------------------------------------------
       2. Confirma que o e-mail retornado pelo Supabase é o mesmo
       --------------------------------------------------------- */

    const emailConfirmado = user.email
      ? user.email.toLowerCase().trim()
      : "";

    if (emailConfirmado !== email) {
      throw new Error("O e-mail informado não corresponde à conta.");
    }

    /* ---------------------------------------------------------
       3. Altera a senha no Supabase Auth
       --------------------------------------------------------- */

    const { error: updateError } =
      await supabaseClient.auth.updateUser({
        password: novaSenha
      });

    if (updateError) {
      throw new Error(
        updateError.message || "Não foi possível alterar a senha."
      );
    }

    /* ---------------------------------------------------------
       4. Limpa os campos
       --------------------------------------------------------- */

    emailInput.value = "";
    senhaAtualInput.value = "";
    novaSenhaInput.value = "";
    confirmarSenhaInput.value = "";

    /* ---------------------------------------------------------
       5. Fecha o modal
       --------------------------------------------------------- */

    fecharModalRecuperacao();

    /* ---------------------------------------------------------
       6. Mostra mensagem de sucesso na tela de login
       --------------------------------------------------------- */

    exibirAlerta(
      "Senha alterada com sucesso! Agora você pode entrar com sua nova senha.",
      "sucesso"
    );

  } catch (error) {

    console.error("Erro na recuperação de senha:", error);

    exibirAlerta(
      error.message || "Não foi possível alterar sua senha."
    );

  } finally {

    setLoading(
      btnSubmit,
      false,
      '<span class="font-title font-black uppercase tracking-wider text-sm">Alterar senha</span>'
    );
  }
}


/* ==========================================================================
   4. LOGIN
   ========================================================================== */

async function handleLogin(event) {
  event.preventDefault();

  ocultarAlerta();

  const emailInput = document
    .getElementById("loginEmail")
    .value
    .trim()
    .toLowerCase();

  const senhaInput = document.getElementById("loginSenha").value;

  const btnSubmit = document.getElementById("btnSubmitLogin");

  if (!emailInput || !senhaInput) {
    exibirAlerta("Por favor, informe seu e-mail e sua senha.");
    return;
  }

  setLoading(btnSubmit, true, "Entrando...");

  try {

    /* 1. Login no Supabase Auth */

    const { data: authData, error: authError } =
      await supabaseClient.auth.signInWithPassword({
        email: emailInput,
        password: senhaInput
      });

    if (authError) {
      throw new Error("E-mail ou senha incorretos.");
    }

    const user = authData.user;

    const userEmail = user.email
      ? user.email.toLowerCase().trim()
      : emailInput;

    /* 2. Monta o perfil identificando se é admin */

    let perfilUsuario = {
      id: user.id,
      email: userEmail,
      nome:
        userEmail === "admin@odivelas.com"
          ? "Administrador"
          : (user.user_metadata?.nome || "Cliente"),
      whatsapp: user.user_metadata?.telefone || "",
      tipo:
        userEmail === "admin@odivelas.com"
          ? "admin"
          : "cliente"
    };

    /* 3. Tenta buscar dados extras da tabela profiles */

    const { data: profileDb } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileDb) {
      perfilUsuario.nome =
        profileDb.nome || perfilUsuario.nome;

      perfilUsuario.whatsapp =
        profileDb.telefone || perfilUsuario.whatsapp;

      if (profileDb.tipo) {
        perfilUsuario.tipo = profileDb.tipo;
      }
    }

    /* 4. Salva no localStorage na chave correta */

    const dbKey =
      typeof DB_KEYS !== "undefined" &&
      DB_KEYS.USUARIO_LOGADO
        ? DB_KEYS.USUARIO_LOGADO
        : "odivelas_usuario_logado";

    localStorage.setItem(
      dbKey,
      JSON.stringify(perfilUsuario)
    );

    exibirAlerta(
      "Login realizado com sucesso! Redirecionando...",
      "sucesso"
    );

    /* 5. Redirecionamento por tipo de conta */

    setTimeout(() => {

      if (
        perfilUsuario.tipo === "admin" ||
        perfilUsuario.email === "admin@odivelas.com"
      ) {
        window.location.href = "admin.html";
      } else {
        window.location.href = "agendamento.html";
      }

    }, 1000);

  } catch (error) {

    exibirAlerta(
      error.message ||
      "Erro ao realizar login. Tente novamente."
    );

  } finally {

    setLoading(
      btnSubmit,
      false,
      '<span class="font-title font-black uppercase tracking-wider text-sm">Entrar</span> <i class="fa-solid fa-right-to-bracket text-sm"></i>'
    );
  }
}


/* ==========================================================================
   5. CADASTRO
   ========================================================================== */

/**
 * Processa o CADASTRO salvando em 'odivelas_usuarios'
 */

async function handleCadastro(event) {

  event.preventDefault();

  ocultarAlerta();

  const nome = document
    .getElementById("cadNome")
    .value
    .trim();

  const whatsapp = document
    .getElementById("cadWhatsapp")
    .value
    .trim();

  const email = document
    .getElementById("cadEmail")
    .value
    .trim();

  const senha = document
    .getElementById("cadSenha")
    .value;

  const btnSubmit =
    document.getElementById("btnSubmitCadastro");

  /* Validações originais mantidas */

  if (nome.length < 3) {
    exibirAlerta("Digite seu nome completo.");
    return;
  }

  if (whatsapp.replace(/\D/g, "").length < 10) {
    exibirAlerta(
      "Informe um número de WhatsApp válido com DDD."
    );
    return;
  }

  if (!validarEmail(email)) {
    exibirAlerta(
      "Informe um endereço de e-mail válido."
    );
    return;
  }

  if (senha.length < 6) {
    exibirAlerta(
      "A senha deve conter no mínimo 6 caracteres."
    );
    return;
  }

  setLoading(
    btnSubmit,
    true,
    "Criando conta..."
  );

  try {

    /* 1. Criar a conta no Supabase Auth */

    const { data: authData, error: authError } =
      await supabaseClient.auth.signUp({
        email: email,
        password: senha,
        options: {
          data: {
            nome: nome,
            telefone: whatsapp
          }
        }
      });

    if (authError) {

      if (
        authError.message.includes("already registered") ||
        authError.message.includes("User already registered")
      ) {
        throw new Error(
          "Este e-mail já está cadastrado."
        );
      }

      throw new Error(authError.message);
    }

    const userId = authData.user?.id;

    /* 2. Inserir o perfil estendido na tabela profiles */

    if (userId) {

      const { error: profileError } =
        await supabaseClient
          .from("profiles")
          .upsert([
            {
              id: userId,
              nome: nome,
              telefone: whatsapp,
              email: email
            }
          ]);

      if (profileError) {
        console.error(
          "Erro ao salvar perfil no Supabase:",
          profileError.message
        );
      }
    }

    /* 3. Mantém sincronização local no localStorage */

    const usuariosLocais =
      JSON.parse(
        localStorage.getItem("odivelas_usuarios") ||
        "[]"
      );

    const novoUsuarioLocal = {
      id: userId || "USR-" + Date.now(),
      nome: nome,
      whatsapp: whatsapp,
      email: email
    };

    usuariosLocais.push(novoUsuarioLocal);

    localStorage.setItem(
      "odivelas_usuarios",
      JSON.stringify(usuariosLocais)
    );

    /* Preenche o e-mail no login */

    const loginEmailInput =
      document.getElementById("loginEmail");

    if (loginEmailInput) {
      loginEmailInput.value = email;
    }

    exibirAlerta(
      "Conta criada com sucesso! Redirecionando...",
      "sucesso"
    );

    setTimeout(() => {

      mudarTela("login");

      exibirAlerta(
        "Sua conta foi criada! Digite sua senha para entrar.",
        "sucesso"
      );

    }, 1200);

  } catch (error) {

    exibirAlerta(
      error.message ||
      "Erro ao criar conta. Tente novamente."
    );

  } finally {

    setLoading(
      btnSubmit,
      false,
      '<span class="font-title font-black uppercase tracking-wider text-sm">Criar Minha Conta</span> <i class="fa-solid fa-user-plus text-sm"></i>'
    );
  }
}