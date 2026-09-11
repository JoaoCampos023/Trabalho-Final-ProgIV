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
type SortDir = 'asc' | 'desc';

interface NavItem {
  id: string;
  label: string;
  title: string;
  adminOnly?: boolean;
}

const Components = {
  /**
   * Formata uma data no formato ISO (yyyy-mm-dd) usando o horário LOCAL do
   * navegador — não `toISOString()`, que sempre converte para UTC. Isso
   * importa porque o Brasil está atrás de UTC (UTC-3): entre ~21h e 23h59,
   * o UTC já virou o dia seguinte enquanto aqui ainda é "hoje", então
   * `data.toISOString().split('T')[0]` devolveria amanhã em vez de hoje
   * nesse intervalo.
   */
  dataParaIsoLocal(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  },

  /** Data de hoje (ou hoje +/- `offsetDias`) no formato ISO local — ver `dataParaIsoLocal`.
   *  Usado para limites de `<input type="date">` e para preencher "hoje" como valor padrão. */
  dataLocalIso(offsetDias = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDias);
    return this.dataParaIsoLocal(d);
  },

  /**
   * Ordena uma lista sem alterar o array original — usado pelas tabelas
   * clicáveis (clicar no título da coluna muda a ordem). `acessor` deixa
   * ordenar por um campo "calculado" (ex.: nome do animal dentro de uma
   * produção), por padrão lê `item[campo]` direto.
   */
  ordenarLista<T>(lista: T[], campo: string, dir: SortDir, acessor?: (item: T, campo: string) => any): T[] {
    const getVal = acessor || ((item: any, c: string) => item[c]);
    return [...lista].sort((a, b) => {
      let va = getVal(a, campo);
      let vb = getVal(b, campo);
      if (va === null || va === undefined) va = '';
      if (vb === null || vb === undefined) vb = '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  },

  /** Gera um <th> clicável que chama `onclick` e mostra uma setinha indicando a ordenação ativa. */
  thOrdenavel(label: string, campo: string, sortCampo: string, sortDir: SortDir, onclick: string): string {
    const ativo = campo === sortCampo;
    const icone = ativo ? (sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort';
    return `<th class="th-sortable" onclick="${onclick}" title="Ordenar por ${label}">${label} <i class="fa-solid ${icone}"></i></th>`;
  },
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
      {
        id: 'dashboard',
        label: '<i class="fa-solid fa-chart-column"></i> Dashboard',
        title: 'Visualizar resumo e estatísticas'
      },
      { id: 'animais', label: '<i class="fa-solid fa-cow"></i> Rebanho', title: 'Gerenciar rebanho de animais' },
      {
        id: 'producoes',
        label: '<i class="fa-solid fa-droplet"></i> Produções',
        title: 'Registros de produção de leite'
      },
      {
        id: 'relatorios',
        label: '<i class="fa-solid fa-clipboard-list"></i> Relatórios',
        title: 'Relatórios e gráficos estatísticos'
      },
      {
        id: 'usuarios',
        label: '<i class="fa-solid fa-user"></i> Usuários',
        title: 'Gerenciar usuários do sistema',
        adminOnly: true
      }
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
  },

  /**
   * Renderiza a árvore genealógica em posições fixas — avós (se existirem)
   * e pais sempre ACIMA do animal atual, filhos sempre abaixo — com uma
   * linha conectando cada nível ao seguinte. Cada card de um parente
   * cadastrado é clicável e chama `app.verArvore(brinco)`, ou seja,
   * clicar em alguém da família recentraliza a árvore nele.
   */
  renderArvoreGenealogica(data: ArvoreGenealogica): string {
    const animal = data.animal;
    const pai = data.pai || null;
    const mae = data.mae || null;
    const filhos = data.filhos || [];

    const card = (opts: {
      titulo: string;
      animal?: Animal | null;
      tamanho?: 'sm' | 'md' | 'lg';
      destaque?: boolean;
    }): string => {
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

    // Linha vertical que liga um nível ao de baixo (o "tronco" da forquilha).
    const tronco = '<div class="tree-stem"></div>';

    // Um casal (2 cards lado a lado). O CSS desenha a forquilha: cada card
    // solta uma perna vertical que se junta na barra horizontal, e do meio
    // dela sai o tronco que desce até o filho — em vez de um traço único
    // saindo do meio do nada.
    const casal = (esquerda: string, direita: string): string =>
      `<div class="tree-couple">
                <div class="tree-slot">${esquerda}</div>
                <div class="tree-slot">${direita}</div>
            </div>`;

    // Casal de avós de um dos lados. Só aparece se aquele pai/mãe existir e
    // tiver ao menos um progenitor cadastrado (limite de gerações: avós).
    const casalAvos = (progenitor: Animal | null, tituloAvo: string, tituloAva: string): string => {
      if (!progenitor || (!progenitor.pai && !progenitor.mae)) return '';
      return (
        casal(
          card({ titulo: tituloAvo, animal: progenitor.pai, tamanho: 'sm' }),
          card({ titulo: tituloAva, animal: progenitor.mae, tamanho: 'sm' })
        ) + tronco
      );
    };

    // Um lado da família: os avós daquele lado (quando houver) ligados por
    // forquilha ao card do Pai ou da Mãe. É o mesmo padrão do nível de baixo,
    // só que aninhado — dá pra repetir para mais gerações se um dia precisar.
    const ladoFamilia = (titulo: string, progenitor: Animal | null, tituloAvo: string, tituloAva: string): string =>
      `${casalAvos(progenitor, tituloAvo, tituloAva)}${card({ titulo, animal: progenitor })}`;

    // ---------- Ascendentes: pais (com os avós acima de cada um) ----------
    const ascendentes =
      casal(
        ladoFamilia('Pai', pai, 'Avô paterno', 'Avó paterna'),
        ladoFamilia('Mãe', mae, 'Avô materno', 'Avó materna')
      ) + tronco;

    // ---------- Descendentes: filhos — "Filho" se macho, "Filha" se fêmea ----------
    const descendentes =
      filhos.length > 0
        ? `${tronco}
                   <div class="tree-children">
                        ${filhos
                          .map(
                            f =>
                              `<div class="tree-child">${card({
                                titulo: f.sexo === 'F' ? 'Filha' : 'Filho',
                                animal: f,
                                tamanho: 'sm'
                              })}</div>`
                          )
                          .join('')}
                   </div>`
        : '';

    // O wrapper interno (width: max-content + margin auto) mantém a árvore
    // centralizada quando cabe na tela e totalmente rolável quando não cabe.
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
