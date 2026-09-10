/// <reference path="./types.ts" />
/**
 * Components - navbar compartilhada entre todas as páginas.
 *
 * Nota de migração: o antigo components.js também tinha funções
 * (statsGrid, animalTable, producaoTable, userTable, arvoreGenealogica,
 * dashboard) que nunca eram chamadas por nenhuma página — cada página
 * monta seu próprio HTML diretamente. Foram removidas nesta migração
 * por serem código morto; only renderNavbar/setNavbarActivePage são
 * usadas de fato.
 */

type NavMode = 'spa' | 'mpa';

interface NavItem {
    id: string;
    label: string;
    title: string;
    adminOnly?: boolean;
}

const Components = {
    /**
     * Renderiza a navbar e a injeta no elemento #navbar da página.
     * @param activePage - nome da página ativa ('dashboard'|'animais'|'producoes'|'relatorios'|'usuarios')
     * @param user - dados do usuário logado (ou null)
     * @param mode - 'spa': navegação interna (data-page); 'mpa': redireciona para /app/<page>.html
     */
    renderNavbar(activePage: string, user: UsuarioLogado | null, mode?: NavMode): void {
        const container = document.getElementById('navbar');
        if (!container) return;

        const navMode: NavMode = mode || 'mpa';
        const isAdmin = !!user && user.role === 'Admin';
        const userInitial = user ? (user.nome ? user.nome.charAt(0).toUpperCase() : '?') : '?';
        const userName = user ? user.nome : 'Usuário';

        const items: NavItem[] = [
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
        const brandClick =
            navMode === 'spa' ? 'onclick="event.preventDefault(); window.app && window.app.navigateTo(\'dashboard\');"' : '';

        container.innerHTML = `
            <nav class="navbar">
                <div class="container">
                    <a href="${brandHref}" ${brandClick} class="navbar-brand" title="Página Inicial da Gestão de Gado"><span class="navbar-brand-icon"><i class="fa-solid fa-cow"></i></span> Gestão<span>Gado</span></a>
                    <div class="navbar-menu" id="navMenu">
                        ${navLinks}
                    </div>
                    <div class="navbar-auth">
                        <div class="user-info" id="userInfo"${user ? '' : ' hidden'}>
                            <span class="user-avatar" id="userAvatar">${userInitial}</span>
                            <span class="user-name" id="userName">${userName}</span>
                            <button class="btn btn-sm btn-danger" title="Encerrar sessão" onclick="app.logout()">Sair</button>
                        </div>
                    </div>
                    <button class="mobile-toggle" id="mobileToggle" title="Menu principal"><i class="fa-solid fa-bars"></i></button>
                </div>
            </nav>
        `;

        // Eventos de navegação
        container.querySelectorAll<HTMLButtonElement>('[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page as string;
                if (navMode === 'spa' && (window as any).app && typeof (window as any).app.navigateTo === 'function') {
                    (window as any).app.navigateTo(page);
                } else {
                    window.location.href = `/app/${page}.html`;
                }
            });
        });

        // Toggle mobile
        const toggle = container.querySelector<HTMLButtonElement>('#mobileToggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                container.querySelector('#navMenu')?.classList.toggle('open');
            });
        }
    },

    /**
     * Atualiza o item ativo da navbar (usado pela SPA ao navegar).
     */
    setNavbarActivePage(activePage: string): void {
        document.querySelectorAll<HTMLButtonElement>('#navbar [data-page]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === activePage);
        });
    }
};
