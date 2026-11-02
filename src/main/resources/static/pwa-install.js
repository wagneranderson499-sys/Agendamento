/**
 * pwa-install.js
 * Gerenciador de Instalação PWA para Android e iOS (iPhone)
 * Odivelas Barbearia
 */

(function () {
  // 1. Registro do Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js')
        .then((reg) => console.log('PWA Service Worker registrado com sucesso:', reg.scope))
        .catch((err) => console.warn('Falha ao registrar Service Worker:', err));
    });
  }

  // Verifica se já está rodando como App instalado
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isStandalone) {
    // Já está instalado e rodando em modo tela cheia de app
    return;
  }

  let deferredPrompt = null;
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // Cria e estiliza os banners de instalação
  function criarBannerAndroid() {
    if (document.getElementById('pwa-android-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-android-banner';
    banner.className =
      'fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-neutral-900/95 border border-red-600/40 backdrop-blur-md rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 text-white transition-all transform translate-y-0';

    banner.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="barbearia (1).png" alt="Odivelas" class="w-12 h-12 rounded-xl object-cover border border-zinc-700 shadow">
        <div>
          <h4 class="font-bold text-sm text-zinc-100">Instalar Aplicativo</h4>
          <p class="text-xs text-zinc-400">Acesse direto da sua tela inicial</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button id="pwa-install-btn" class="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow">
          Instalar
        </button>
        <button id="pwa-close-btn" class="text-zinc-500 hover:text-zinc-300 p-1.5 text-lg leading-none">
          &times;
        </button>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('pwa-install-btn').addEventListener('click', async () => {
      if (!deferredPrompt) return;
      banner.style.display = 'none';
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuário aceitou instalar o PWA');
      }
      deferredPrompt = null;
    });

    document.getElementById('pwa-close-btn').addEventListener('click', () => {
      banner.style.display = 'none';
      sessionStorage.setItem('odivelas_pwa_dismissed', 'true');
    });
  }

  function criarBannerIOS() {
    if (document.getElementById('pwa-ios-banner')) return;
    if (sessionStorage.getItem('odivelas_ios_dismissed') === 'true') return;

    const banner = document.createElement('div');
    banner.id = 'pwa-ios-banner';
    banner.className =
      'fixed bottom-4 left-4 right-4 z-50 bg-neutral-900/95 border border-red-600/40 backdrop-blur-md rounded-2xl p-4 shadow-2xl text-white transition-all';

    banner.innerHTML = `
      <div class="flex items-start justify-between gap-3 mb-2">
        <div class="flex items-center gap-3">
          <img src="barbearia (1).png" alt="Odivelas" class="w-10 h-10 rounded-xl object-cover border border-zinc-700">
          <div>
            <h4 class="font-bold text-sm text-zinc-100">Instalar no iPhone (iOS)</h4>
            <p class="text-xs text-zinc-400">Tenha o app na tela de início</p>
          </div>
        </div>
        <button id="pwa-ios-close-btn" class="text-zinc-400 hover:text-white text-xl leading-none p-1">&times;</button>
      </div>
      <div class="bg-zinc-800/80 rounded-xl p-3 text-xs text-zinc-300 border border-zinc-700/50 flex flex-col gap-1.5">
        <div class="flex items-center gap-2">
          <span>1. Toque no botão de compartilhar</span>
          <span class="inline-flex items-center justify-center bg-zinc-700 px-2 py-0.5 rounded text-white text-[11px] font-semibold">
            <svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
            Compartilhar
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span>2. Role para baixo e selecione:</span>
          <span class="text-red-400 font-bold">"Adicionar à Tela de Início" ➕</span>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('pwa-ios-close-btn').addEventListener('click', () => {
      banner.style.display = 'none';
      sessionStorage.setItem('odivelas_ios_dismissed', 'true');
    });
  }

  // 2. Captura o evento nativo do Android / Chrome
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (sessionStorage.getItem('odivelas_pwa_dismissed') !== 'true') {
      criarBannerAndroid();
    }
  });

  // 3. Se for iOS Safari e não estiver instalado, mostra a instrução após carregar
  if (isIOS) {
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(criarBannerIOS, 1500);
    });
  }
})();

