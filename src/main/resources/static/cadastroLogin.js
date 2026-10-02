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

  box.classList.remove("hidden", "bg-red-950/80", "border-red-600", "text-red-200", "bg-emerald-950/80", "border-emerald-500", "text-emerald-200");

  if (tipo === "erro") {
    box.classList.add("bg-red-950/80", "border-red-600", "text-red-200");
    box.innerHTML = `<i class="fa-solid fa-circle-exclamation mr-2"></i> ${sanitizarHTML(mensagem)}`;
  } else {
    box.classList.add("bg-emerald-950/80", "border-emerald-500", "text-emerald-200");
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
  
  if (valor.length > 11) valor = valor.slice(0, 11);

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

function solicitarRecuperacao() {
  const email = prompt("Informe seu e-mail cadastrado para redefinição de senha:");
  if (email && validarEmail(email)) {
    alert("Caso o e-mail esteja cadastrado, você receberá instruções de redefinição de senha em instantes.");
  } else if (email) {
    alert("Por favor, digite um e-mail válido.");
  }
}

/* ==========================================================================
   3. HANDLERS DE FORMULÁRIO (PADRONIZADO COM LOCALSTORAGE)
   ========================================================================== */

/**
 * Processa o LOGIN do usuário e salva a sessão em 'odivelas_usuario_logado'
 */async function handleLogin(event) {
  event.preventDefault();
  ocultarAlerta();

  const email = document.getElementById("loginEmail").value.trim();
  const senha = document.getElementById("loginSenha").value;
  const btnSubmit = document.getElementById("btnSubmitLogin");

  if (!email || !senha) {
    exibirAlerta("Por favor, informe seu e-mail e sua senha.");
    return;
  }

  setLoading(btnSubmit, true, "Entrando...");

  try {
    // 1. Tenta autenticar diretamente no Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: senha
    });

    if (authError) {
      // Se falhar no Supabase, exibe mensagem amigável
      throw new Error("E-mail ou senha incorretos.");
    }

    const user = authData.user;

    // 2. Busca o perfil completo do usuário na tabela 'profiles'
   // Define o perfil do usuário
    let perfilUsuario = {
      id: user.id,
      email: user.email.toLowerCase().trim(),
      nome: user.user_metadata?.nome || 'Administrador',
      whatsapp: user.user_metadata?.telefone || '',
      tipo: (user.email.toLowerCase().trim() === 'admin@odivelas.com') ? 'admin' : 'cliente'
    };

    // Tenta buscar da tabela profiles
    const { data: profileDb } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileDb) {
      perfilUsuario.nome = profileDb.nome || perfilUsuario.nome;
      perfilUsuario.whatsapp = profileDb.telefone || perfilUsuario.whatsapp;
      if (profileDb.tipo) perfilUsuario.tipo = profileDb.tipo;
    }

    // Salva na chave esperada pelo verificarAcessoAdmin
    localStorage.setItem(DB_KEYS.USUARIO_LOGADO, JSON.stringify(perfilUsuario));

    // Se for admin, redireciona para o painel do admin, senão para agendamento
    if (perfilUsuario.tipo === 'admin' || perfilUsuario.email === 'admin@odivelas.com') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'agendamento.html';
    }

  } catch (error) {
    exibirAlerta(error.message || "Erro ao realizar login. Tente novamente.");
  } finally {
    setLoading(
      btnSubmit,
      false,
      '<span class="font-title font-black uppercase tracking-wider text-sm">Entrar</span> <i class="fa-solid fa-right-to-bracket text-sm"></i>'
    );
  }
}
/**
 * Processa o CADASTRO salvando em 'odivelas_usuarios'
 */
async function handleCadastro(event) {
  event.preventDefault();
  ocultarAlerta();

  const nome = document.getElementById("cadNome").value.trim();
  const whatsapp = document.getElementById("cadWhatsapp").value.trim();
  const email = document.getElementById("cadEmail").value.trim();
  const senha = document.getElementById("cadSenha").value;
  const btnSubmit = document.getElementById("btnSubmitCadastro");

  // Validações originais mantidas
  if (nome.length < 3) {
    exibirAlerta("Digite seu nome completo.");
    return;
  }

  if (whatsapp.replace(/\D/g, "").length < 10) {
    exibirAlerta("Informe um número de WhatsApp válido com DDD.");
    return;
  }

  if (!validarEmail(email)) {
    exibirAlerta("Informe um endereço de e-mail válido.");
    return;
  }

  if (senha.length < 6) {
    exibirAlerta("A senha deve conter no mínimo 6 caracteres.");
    return;
  }

  setLoading(btnSubmit, true, "Criando conta...");

  try {
    // 1. Criar a conta no Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
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
      if (authError.message.includes("already registered") || authError.message.includes("User already registered")) {
        throw new Error("Este e-mail já está cadastrado.");
      }
      throw new Error(authError.message);
    }

    const userId = authData.user?.id;

    // 2. Inserir o perfil estendido na tabela 'profiles' do Supabase
    if (userId) {
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .upsert([
          {
            id: userId,
            nome: nome,
            telefone: whatsapp,
            email: email
          }
        ]);

      if (profileError) {
        console.error("Erro ao salvar perfil no Supabase:", profileError.message);
      }
    }

    // 3. Mantém sincronização local no localStorage para suporte legado
    const usuariosLocais = JSON.parse(localStorage.getItem("odivelas_usuarios") || "[]");
    const novoUsuarioLocal = {
      id: userId || "USR-" + Date.now(),
      nome: nome,
      whatsapp: whatsapp,
      email: email
    };
    usuariosLocais.push(novoUsuarioLocal);
    localStorage.setItem("odivelas_usuarios", JSON.stringify(usuariosLocais));

    // Preenche o e-mail no login e muda a tela
    const loginEmailInput = document.getElementById("loginEmail");
    if (loginEmailInput) {
      loginEmailInput.value = email;
    }

    exibirAlerta("Conta criada com sucesso! Redirecionando...", "sucesso");

    setTimeout(() => {
      mudarTela("login");
      exibirAlerta("Sua conta foi criada! Digite sua senha para entrar.", "sucesso");
    }, 1200);

  } catch (error) {
    exibirAlerta(error.message || "Erro ao criar conta. Tente novamente.");
  } finally {
    setLoading(
      btnSubmit,
      false,
      '<span class="font-title font-black uppercase tracking-wider text-sm">Criar Minha Conta</span> <i class="fa-solid fa-user-plus text-sm"></i>'
    );
  }
}