/* ==========================================================================
   TunnelX — comportamento da pagina

   Sem dependencia externa. Tudo aqui degrada: se o script nao rodar, a pagina
   continua legivel, os links continuam funcionando e nenhuma secao fica vazia.
   ========================================================================== */
(() => {
    'use strict';

    /* ====================================================================
       ENDERECOS DA LOJA — o unico lugar para mexer

       A loja e a porta de entrada do produto: todo botao principal leva para ca.

       IOS esta vazio de proposito. O aplicativo ainda esta em analise na Apple
       (a API de busca deles devolve zero resultados para com.tunnelxapp), e um
       link para um id que nao existe leva a pessoa a uma pagina de erro da App
       Store — pior do que dizer que ainda nao chegou. Enquanto estiver vazio, o
       botao de iPhone abre um aviso em vez de navegar.

       Quando o app for aprovado, cole aqui o endereco da ficha na App Store e o
       botao vira link sozinho, nos tres lugares da pagina.
       ==================================================================== */
    const LOJAS = {
        android: 'https://play.google.com/store/apps/details?id=com.tunnelxapp',
        ios: ''   // exemplo: 'https://apps.apple.com/br/app/tunnel-x/id0000000000'
    };

    const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ------------------------------------------------------------ lojas -- */
    function ligarLojas() {
        document.querySelectorAll('a[data-loja]').forEach((el) => {
            const destino = LOJAS[el.dataset.loja];
            if (!destino) return;

            el.setAttribute('href', destino);
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener');
        });

        // O botao de iPhone: vira link se houver endereco, senao abre o aviso.
        document.querySelectorAll('[data-loja-ios]').forEach((botao) => {
            if (LOJAS.ios) {
                const link = document.createElement('a');
                link.className = botao.className.replace('loja--ios', '').trim();
                link.href = LOJAS.ios;
                link.target = '_blank';
                link.rel = 'noopener';
                link.innerHTML = botao.innerHTML;

                const cima = link.querySelector('.loja-cima');
                if (cima) cima.textContent = 'Baixar na';

                botao.replaceWith(link);
                return;
            }

            const aviso = document.getElementById(botao.getAttribute('aria-controls'));
            if (!aviso) return;

            botao.addEventListener('click', () => {
                const aberto = botao.getAttribute('aria-expanded') === 'true';
                botao.setAttribute('aria-expanded', String(!aberto));
                aviso.hidden = aberto;
            });
        });
    }

    /* -------------------------------------------------------- cabecalho -- */
    function ligarCabecalho() {
        const cabecalho = document.querySelector('.cabecalho');
        if (!cabecalho) return;

        const aoRolar = () => cabecalho.classList.toggle('rolou', window.scrollY > 16);
        aoRolar();
        window.addEventListener('scroll', aoRolar, { passive: true });
    }

    /* -------------------------------------------------------- revelacao -- */
    function ligarRevelacao() {
        const alvos = document.querySelectorAll('.revela');
        if (!alvos.length) return;

        if (semMovimento || !('IntersectionObserver' in window)) {
            alvos.forEach((el) => el.classList.add('visivel'));
            return;
        }

        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach((entrada) => {
                if (!entrada.isIntersecting) return;
                entrada.target.classList.add('visivel');
                observador.unobserve(entrada.target);   // anima uma vez so
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

        alvos.forEach((el) => observador.observe(el));
    }

    /* --------------------------------------------------------- aparelho -- */
    /*
       O aparelho conecta sozinho, poucos segundos depois de a pagina abrir.
       E a unica animacao que roda sem ninguem pedir, e ela existe para a pessoa
       entender o produto inteiro antes de rolar a primeira tela.
    */
    function ligarFone() {
        const fone = document.getElementById('fone');
        const estado = document.getElementById('app-estado');
        const tunel = document.getElementById('app-tunel');
        if (!fone || !estado || !tunel) return;

        const ligar = () => {
            fone.classList.add('ligado');
            estado.textContent = 'Conectado';
            tunel.textContent = 'Casa · Plano Família';
        };

        if (semMovimento) { ligar(); return; }

        setTimeout(ligar, 2200);
    }

    /* -------------------------------------------------------------- QR -- */
    /*
       Desenhado celula a celula, e nao como imagem. Um QR de verdade apontaria
       para um convite que nao existe, e um PNG seria mais um arquivo para
       baixar num 4G.

       O padrao e FIXO, e nao sorteado: assim a imagem e a mesma em toda visita
       e nao muda a cada recarregamento.
    */
    function desenharQr() {
        const qr = document.getElementById('qr');
        if (!qr) return;

        const MAPA = [
            '11111011111',
            '10001001001',
            '10111010111',
            '10111001101',
            '10001011001',
            '11111010101',
            '00000011000',
            '11011001011',
            '10101110101',
            '11001001001',
            '10111011111'
        ];

        const fragmento = document.createDocumentFragment();

        MAPA.forEach((linha, y) => {
            [...linha].forEach((celula, x) => {
                const i = document.createElement('i');
                if (celula === '0') i.className = 'vazio';
                if (semMovimento) i.style.opacity = '1';
                else i.style.animationDelay = ((x + y) * 22) + 'ms';
                fragmento.appendChild(i);
            });
        });

        qr.appendChild(fragmento);
    }

    /* ----------------------------------------------------------- prazos -- */
    /*
       O contador conta de verdade. E o detalhe que faz o visitante perceber que
       aquilo nao e uma figura — e a interface do aplicativo.
    */
    function ligarPrazos() {
        const chips = document.querySelectorAll('.chip[data-horas]');
        const relogio = document.getElementById('relogio');
        if (!chips.length || !relogio) return;

        let restante = 0;
        let tique = null;

        const escrever = () => {
            if (restante <= 0) { relogio.textContent = 'Sem prazo'; return; }

            const h = Math.floor(restante / 3600);
            const m = Math.floor((restante % 3600) / 60);
            const s = restante % 60;

            const dois = (n) => String(n).padStart(2, '0');

            // Acima de um dia, contar segundos nao diz nada a ninguem.
            relogio.textContent = h >= 24
                ? Math.floor(h / 24) + (Math.floor(h / 24) === 1 ? ' dia' : ' dias')
                : dois(h) + ':' + dois(m) + ':' + dois(s);
        };

        const escolher = (chip) => {
            chips.forEach((c) => c.classList.toggle('ativo', c === chip));

            restante = Number(chip.dataset.horas) * 3600;
            escrever();

            clearInterval(tique);
            if (restante <= 0 || semMovimento) return;

            tique = setInterval(() => {
                restante = Math.max(0, restante - 1);
                escrever();
                if (restante === 0) clearInterval(tique);
            }, 1000);
        };

        chips.forEach((chip) => chip.addEventListener('click', () => escolher(chip)));

        const inicial = document.querySelector('.chip.ativo') || chips[0];
        escolher(inicial);

        // Parar de contar quando a aba sai de vista: nao ha motivo para gastar
        // bateria num relogio que ninguem esta olhando.
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) return;
            clearInterval(tique);
        });
    }

    /* ------------------------------------------------------------ vagas -- */
    function ligarVagas() {
        const barra = document.getElementById('vagas-barra');
        const conta = document.getElementById('vagas-conta');
        if (!barra) return;

        const casas = [...barra.querySelectorAll('i')];

        const encher = () => {
            casas.forEach((casa, i) => {
                if (semMovimento) { casa.classList.add('cheia'); return; }
                setTimeout(() => casa.classList.add('cheia'), i * 110);
            });

            if (!conta) return;

            const fim = Number(conta.dataset.contar || casas.length);

            if (semMovimento) { conta.textContent = String(fim); return; }

            let n = 0;
            const passo = setInterval(() => {
                n += 1;
                conta.textContent = String(n);
                if (n >= fim) clearInterval(passo);
            }, 110);
        };

        if (!('IntersectionObserver' in window)) { encher(); return; }

        const observador = new IntersectionObserver((e) => {
            if (!e[0].isIntersecting) return;
            observador.disconnect();
            encher();
        }, { threshold: 0.45 });

        observador.observe(barra);
    }

    /* -------------------------------------------------------------- ano -- */
    function ligarAno() {
        const el = document.getElementById('ano');
        if (el) el.textContent = String(new Date().getFullYear());
    }

    /* ----------------------------------------------------------- inicio -- */
    function iniciar() {
        ligarLojas();
        ligarCabecalho();
        ligarRevelacao();
        ligarFone();
        desenharQr();
        ligarPrazos();
        ligarVagas();
        ligarAno();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
