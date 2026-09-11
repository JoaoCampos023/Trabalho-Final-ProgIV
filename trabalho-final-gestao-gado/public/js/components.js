/// <reference path="./types.ts" />
/**
 * Components - navbar compartilhada entre todas as páginas (MPA).
 *
 * Nota de migração: em MPA cada aba é um .html próprio e a navbar é injetada
 * aqui via renderNavbar(). O botão "Sair" chama uma função global
 * (logoutGlobal) definida neste arquivo, em vez de depender do `app.logout()`
 * de cada página — assim ele funciona em qualquer aba sem precisar que cada
 * .ts lembre de expor o próprio `app`.
 */
/**
 * Encerra a sessão em qualquer página.
 *
 * Por que global: o botão "Sair" vive na navbar, que é injetada em todas as
 * páginas. Se cada página tivesse que definir `app.logout`, qualquer página
 * que esquecesse deixaria o botão inerte (foi o que acontecia em Usuários).
 */
function logoutGlobal() {
    localStorage.removeItem('token');
    // Redireciona para a landing. O hard reload garante que qualquer estado
    // em memória (token em api.ts, caches de módulo) seja descartado.
    window.location.href = '/';
}
// Exposto em window para o onclick inline do botão "Sair" funcionar.
window.logoutGlobal = logoutGlobal;
/**
 * Calcula as iniciais a partir do nome.
 *
 * Regra: pega a primeira letra do primeiro nome e a primeira letra do último
 * nome (ex.: "Maria Souza" → "MS"; "admin" → "A"; "João Pedro Silva" → "JS").
 * Se só tiver um nome, usa só a primeira letra.
 */
function iniciaisDoNome(nome) {
    const partes = nome.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0)
        return '?';
    if (partes.length === 1)
        return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}
const Components = {
    /**
     * Formata uma data no formato ISO (yyyy-mm-dd) usando o horário LOCAL do
     * navegador — não `toISOString()`, que sempre converte para UTC.
     */
    dataParaIsoLocal(data) {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    },
    /** Data de hoje (ou hoje +/- `offsetDias`) no formato ISO local. */
    dataLocalIso(offsetDias = 0) {
        const d = new Date();
        d.setDate(d.getDate() + offsetDias);
        return this.dataParaIsoLocal(d);
    },
    /** Ordena uma lista sem alterar o array original. */
    ordenarLista(lista, campo, dir, acessor) {
        const getVal = acessor || ((item, c) => item[c]);
        return [...lista].sort((a, b) => {
            let va = getVal(a, campo);
            let vb = getVal(b, campo);
            if (va === null || va === undefined)
                va = '';
            if (vb === null || vb === undefined)
                vb = '';
            if (typeof va === 'string')
                va = va.toLowerCase();
            if (typeof vb === 'string')
                vb = vb.toLowerCase();
            if (va < vb)
                return dir === 'asc' ? -1 : 1;
            if (va > vb)
                return dir === 'asc' ? 1 : -1;
            return 0;
        });
    },
    /** Gera um <th> clicável com setinha indicando a ordenação ativa. */
    thOrdenavel(label, campo, sortCampo, sortDir, onclick) {
        const ativo = campo === sortCampo;
        const icone = ativo ? (sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort';
        return `<th class="th-sortable" onclick="${onclick}" title="Ordenar por ${label}">${label} <i class="fa-solid ${icone}"></i></th>`;
    },
    /** Renderiza a navbar e a injeta no elemento #navbar da página. */
    renderNavbar(activePage, user, mode) {
        const container = document.getElementById('navbar');
        if (!container)
            return;
        const navMode = mode || 'mpa';
        const isAdmin = !!user && user.role === 'Admin';
        const userInitial = user ? (user.nome ? user.nome.charAt(0).toUpperCase() : '?') : '?';
        const userName = user ? user.nome : 'Usuário';
        const items = [
            { id: 'dashboard', label: '<i class="fa-solid fa-chart-column"></i> Dashboard', title: 'Visualizar resumo e estatísticas' },
            { id: 'animais', label: '<i class="fa-solid fa-cow"></i> Rebanho', title: 'Gerenciar rebanho de animais' },
            { id: 'producoes', label: '<i class="fa-solid fa-droplet"></i> Produções', title: 'Registros de produção de leite' },
            { id: 'relatorios', label: '<i class="fa-solid fa-clipboard-list"></i> Relatórios', title: 'Relatórios e gráficos estatísticos' },
            { id: 'usuarios', label: '<i class="fa-solid fa-user"></i> Usuários', title: 'Gerenciar usuários do sistema', adminOnly: true }
        ];
        const navLinks = items
            .filter(item => !item.adminOnly || isAdmin)
            .map(item => {
            const isActive = item.id === activePage ? 'active' : '';
            const id = item.id === 'usuarios' ? ' id="navUsuarios"' : '';
            return `<button class="nav-link ${isActive}" data-page="${item.id}"${id} title="${item.title}">${item.label}</button>`;
        })
            .join('\n                ');
        const brandHref = navMode === 'spa' ? '#' : '/app/dashboard.html';
        const brandClick = navMode === 'spa' ? 'onclick="event.preventDefault(); window.app && window.app.navigateTo(\'dashboard\');"' : '';
        // Bloco de autenticação: avatar + nome + badge de papel + caret, tudo
        // clicável para abrir o menu. O botão Sair vive DENTRO do menu (não mais
        // solto na navbar), seguindo o padrão de GitHub/Google. Assim ganha-se
        // espaço horizontal e o menu pode mostrar mais info (nome, email, papel).
        const authBlock = user
            ? `
        <div class="user-menu" id="userMenu">
          <button class="user-menu-trigger" id="userMenuTrigger" type="button" title="Menu do usuário">
            <span class="user-avatar role-${user.role.toLowerCase()}" id="userAvatar">${iniciaisDoNome(user.nome)}</span>
            <span class="user-name" id="userName">${userName}</span>
            <span class="user-role-badge role-${user.role.toLowerCase()}" id="userRoleBadge">${user.role}</span>
            <i class="fa-solid fa-chevron-down user-menu-caret" id="userMenuCaret"></i>
          </button>

          <div class="user-menu-dropdown" id="userMenuDropdown">
            <div class="user-menu-header">
              <span class="user-avatar user-avatar-lg role-${user.role.toLowerCase()}">${iniciaisDoNome(user.nome)}</span>
              <div class="user-menu-header-info">
                <strong class="user-menu-nome">${userName}</strong>
                <span class="user-menu-email">${user.email || ''}</span>
                <span class="user-role-badge role-${user.role.toLowerCase()}">${user.role}</span>
              </div>
            </div>
            <div class="user-menu-separator"></div>
            <button class="user-menu-item user-menu-item-danger" type="button" onclick="logoutGlobal()">
              <i class="fa-solid fa-right-from-bracket"></i> Sair
            </button>
          </div>
        </div>
      `
            : '';
        container.innerHTML = `
            <nav class="navbar">
                <div class="container">
                    <a href="${brandHref}" ${brandClick} class="navbar-brand" title="Página Inicial da Gestão de Gado"><span class="navbar-brand-icon"><i class="fa-solid fa-cow"></i></span> Gestão<span>Gado</span></a>
                    <div class="navbar-menu" id="navMenu">
                        ${navLinks}
                    </div>
                    <div class="navbar-auth">
                        ${authBlock}
                    </div>
                    <button class="mobile-toggle" id="mobileToggle" title="Menu principal"><i class="fa-solid fa-bars"></i></button>
                </div>
            </nav>
        `;
        // Eventos de navegação
        container.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                if (navMode === 'spa' && window.app && typeof window.app.navigateTo === 'function') {
                    window.app.navigateTo(page);
                }
                else {
                    window.location.href = `/app/${page}.html`;
                }
            });
        });
        // Toggle mobile
        const toggle = container.querySelector('#mobileToggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                container.querySelector('#navMenu')?.classList.toggle('open');
            });
        }
        // ---- Menu do usuário ----
        const menu = container.querySelector('#userMenu');
        const trigger = container.querySelector('#userMenuTrigger');
        const dropdown = container.querySelector('#userMenuDropdown');
        if (menu && trigger && dropdown) {
            // Abre/fecha ao clicar no bloco. `stopPropagation` evita que o mesmo
            // clique que abre seja pego pelo listener global de "clicar fora".
            const toggleMenu = (e) => {
                e.stopPropagation();
                menu.classList.toggle('open');
            };
            trigger.addEventListener('click', toggleMenu);
            // Fecha ao clicar em qualquer lugar fora do menu.
            document.addEventListener('click', (e) => {
                if (menu.classList.contains('open') && !menu.contains(e.target)) {
                    menu.classList.remove('open');
                }
            });
            // Fecha com ESC.
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && menu.classList.contains('open')) {
                    menu.classList.remove('open');
                }
            });
        }
    },
    /** Atualiza o item ativo da navbar (usado pela SPA, se um dia voltar a ter). */
    setNavbarActivePage(activePage) {
        document.querySelectorAll('#navbar [data-page]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === activePage);
        });
    },
    /**
     * Renderiza a árvore genealógica em posições fixas — avós e pais acima do
     * animal atual, filhos abaixo, com uma linha conectando cada nível.
     */
    renderArvoreGenealogica(data) {
        const animal = data.animal;
        const pai = data.pai || null;
        const mae = data.mae || null;
        const filhos = data.filhos || [];
        const card = (opts) => {
            const tamanho = opts.tamanho || 'md';
            if (!opts.animal) {
                return `<div class="tree-card tree-card-${tamanho} tree-card-vazio"><span class="tree-card-titulo">${opts.titulo}</span><i class="fa-solid fa-circle-question"></i><span class="tree-card-nome">Não informado</span></div>`;
            }
            const a = opts.animal;
            const sexoIcon = a.sexo === 'F' ? 'fa-venus' : 'fa-mars';
            const classes = [
                'tree-card',
                `tree-card-${tamanho}`,
                opts.destaque ? 'tree-card-atual' : 'tree-card-clicavel'
            ].join(' ');
            const onclick = opts.destaque ? '' : ` onclick="app.verArvore(${a.brinco})"`;
            return `<div class="${classes}"${onclick} title="${opts.destaque ? '' : 'Ver árvore deste animal'}">
                <span class="tree-card-titulo">${opts.titulo}</span>
                <i class="fa-solid ${sexoIcon}"></i>
                <span class="tree-card-nome">${a.nome}</span>
                <span class="tree-card-brinco">Brinco: ${a.brinco}</span>
            </div>`;
        };
        const tronco = '<div class="tree-stem"></div>';
        const casal = (esquerda, direita) => `<div class="tree-couple">
                <div class="tree-slot">${esquerda}</div>
                <div class="tree-slot">${direita}</div>
            </div>`;
        const casalAvos = (progenitor, tituloAvo, tituloAva) => {
            if (!progenitor || (!progenitor.pai && !progenitor.mae))
                return '';
            return (casal(card({ titulo: tituloAvo, animal: progenitor.pai, tamanho: 'sm' }), card({ titulo: tituloAva, animal: progenitor.mae, tamanho: 'sm' })) + tronco);
        };
        const ladoFamilia = (titulo, progenitor, tituloAvo, tituloAva) => `${casalAvos(progenitor, tituloAvo, tituloAva)}${card({ titulo, animal: progenitor })}`;
        const ascendentes = casal(ladoFamilia('Pai', pai, 'Avô paterno', 'Avó paterna'), ladoFamilia('Mãe', mae, 'Avô materno', 'Avó materna')) + tronco;
        const descendentes = filhos.length > 0
            ? `${tronco}
                   <div class="tree-children">
                        ${filhos
                .map(f => `<div class="tree-child">${card({
                titulo: f.sexo === 'F' ? 'Filha' : 'Filho',
                animal: f,
                tamanho: 'sm'
            })}</div>`)
                .join('')}
                   </div>`
            : '';
        return `
            <div class="genealogy-tree">
                <div class="genealogy-tree-inner">
                    ${ascendentes}
                    ${card({ titulo: 'Animal atual', animal, destaque: true })}
                    ${descendentes}
                </div>
            </div>
        `;
    }
};
//# sourceMappingURL=components.js.map