/// <reference path="../types.ts" />
/// <reference path="../api.ts" />
/// <reference path="../components.ts" />
/**
 * Página Dashboard (/app/dashboard.html) — SPA com todas as seções
 * (Dashboard, Rebanho, Produções, Relatórios, Usuários) em uma página só.
 */

(function () {
    type PageName = 'dashboard' | 'animais' | 'producoes' | 'relatorios' | 'usuarios';

    interface DashboardAppState {
        currentPage: PageName;
        user: UsuarioLogado | null;
        chartInstances: Record<string, any>;
        IDADE_MAXIMA_ANOS: number;
        toastTimeout?: number;
        filterNomeDebounce?: number;
        todasRacas?: string[];

        init(): void;
        limitarDataNascimento(): void;
        validarDataNascimento(dataStr: string): string | null;
        navigateTo(page: PageName): void;
        loadUserInfo(): void;

        loadDashboard(): Promise<void>;
        renderCharts(producaoDia: { data: string; total: number }[], topVacas: { nome: string; producao: number }[]): void;

        calcularIdade(dataNasc?: string): number;
        debouncedLoadAnimais(): void;
        loadAnimais(): Promise<void>;

        loadProducoes(): Promise<void>;
        loadRelatorios(): Promise<void>;
        loadUsuarios(): Promise<void>;

        novoAnimal(): void;
        editarAnimal(brinco: number): Promise<void>;
        saveAnimal(): Promise<void>;
        deletarAnimal(brinco: number): Promise<void>;
        verArvore(brinco: number): Promise<void>;

        novaProducao(): Promise<void>;
        editarProducao(id: number): Promise<void>;
        saveProducao(): Promise<void>;
        deletarProducao(id: number): Promise<void>;

        toggleUserStatus(id: string): Promise<void>;
        deletarUsuario(id: string): Promise<void>;

        logout(): void;
        showModal(name: string): void;
        closeModal(name: string): void;
        toast(message: string, type?: string): void;
    }

    function el<T extends HTMLElement = HTMLElement>(id: string): T {
        return document.getElementById(id) as T;
    }

    const app: DashboardAppState = {
        currentPage: 'dashboard',
        user: null,
        chartInstances: {},
        IDADE_MAXIMA_ANOS: 50,

        init() {
            if (!api.isAuthenticated()) {
                console.log('🔒 Usuário não autenticado, redirecionando...');
                window.location.href = '/';
                return;
            }

            console.log('✅ Usuário autenticado');
            this.loadUserInfo();

            // ✅ RECARREGAR DADOS QUANDO A ABA GANHAR FOCO
            window.addEventListener('focus', () => {
                console.log('🔄 Aba recuperou foco');
                if (this.currentPage === 'dashboard') {
                    this.loadDashboard();
                }
            });

            // ✅ RECARREGAR DADOS QUANDO A PÁGINA FICAR VISÍVEL
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && this.currentPage === 'dashboard') {
                    console.log('🔄 Página visível novamente');
                    this.loadDashboard();
                }
            });

            el<HTMLFormElement>('animalForm').addEventListener('submit', e => {
                e.preventDefault();
                this.saveAnimal();
            });

            el<HTMLFormElement>('producaoForm').addEventListener('submit', e => {
                e.preventDefault();
                this.saveProducao();
            });

            this.limitarDataNascimento();

            this.navigateTo('dashboard');
        },

        // Limita o seletor de calendário: não permite data futura nem uma
        // idade acima de IDADE_MAXIMA_ANOS (feedback imediato na UI).
        limitarDataNascimento() {
            const input = document.getElementById('animalDataNascimento') as HTMLInputElement | null;
            if (!input) return;
            const hoje = new Date();
            const limite = new Date();
            limite.setFullYear(limite.getFullYear() - this.IDADE_MAXIMA_ANOS);
            input.max = hoje.toISOString().split('T')[0];
            input.min = limite.toISOString().split('T')[0];
        },

        // Retorna uma mensagem de erro se a data de nascimento for inválida, ou null se estiver ok.
        validarDataNascimento(dataStr) {
            if (!dataStr) return 'A data de nascimento é obrigatória.';
            const dataNascimento = new Date(`${dataStr}T00:00:00`);
            const hoje = new Date();
            if (dataNascimento > hoje) return 'A data de nascimento não pode ser no futuro.';
            const limite = new Date();
            limite.setFullYear(limite.getFullYear() - this.IDADE_MAXIMA_ANOS);
            if (dataNascimento < limite) {
                return `A data de nascimento não pode resultar em uma idade maior que ${this.IDADE_MAXIMA_ANOS} anos.`;
            }
            return null;
        },

        navigateTo(page) {
            this.currentPage = page;

            // Atualiza item ativo na navbar centralizada
            Components.setNavbarActivePage(page);

            document.querySelectorAll('.page-content').forEach(p => {
                p.classList.toggle('active', p.id === `page-${page}`);
            });

            switch (page) {
                case 'dashboard':
                    this.loadDashboard();
                    break;
                case 'animais':
                    this.loadAnimais();
                    break;
                case 'producoes':
                    this.loadProducoes();
                    break;
                case 'relatorios':
                    this.loadRelatorios();
                    break;
                case 'usuarios':
                    this.loadUsuarios();
                    break;
            }

            const navMenu = document.querySelector('#navbar #navMenu');
            if (navMenu) navMenu.classList.remove('open');
        },

        loadUserInfo() {
            try {
                const token = api.token;
                if (token) {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    this.user = { nome: payload.nome || 'Usuário', email: payload.email || '', role: payload.role || 'Cliente' };
                    // Renderiza navbar via componente centralizado (modo SPA)
                    Components.renderNavbar('dashboard', this.user, 'spa');
                }
            } catch (e) {
                console.error(e);
            }
        },

        // ============================================
        // DASHBOARD
        // ============================================
        async loadDashboard() {
            console.log('🔄 Carregando dashboard...');
            const container = el('dashboardContent');
            container.innerHTML = `<div class="loading"><div class="spinner"></div><p>Carregando dashboard...</p></div>`;

            try {
                const [animaisRes, producoesRes] = await Promise.all([api.getAnimais(), api.getProducoes(), api.getAnimalStats()]);

                const animais: Animal[] = animaisRes.data?.data?.animais || [];
                const producoes: ProducaoLeite[] = producoesRes.data?.data?.producoes || [];

                const totalAnimais = animais.length;
                const totalFemea = animais.filter(a => a.sexo === 'F').length;
                const totalMacho = animais.filter(a => a.sexo === 'M').length;
                const totalLitros = producoes.reduce((sum, p) => sum + (parseFloat(String(p.litros)) || 0), 0);

                const vacasMap = new Map<string, number>();
                producoes.forEach(p => {
                    const nome = p.animal?.nome || `Animal ${p.animal_brinco}`;
                    vacasMap.set(nome, (vacasMap.get(nome) || 0) + (parseFloat(String(p.litros)) || 0));
                });
                const topVacas = Array.from(vacasMap.entries())
                    .map(([nome, producao]) => ({ nome, producao: Number(producao) }))
                    .sort((a, b) => b.producao - a.producao)
                    .slice(0, 5);

                const ultimos7Dias: { data: string; total: number }[] = [];
                for (let i = 6; i >= 0; i--) {
                    const dataObj = new Date();
                    dataObj.setDate(dataObj.getDate() - i);
                    const isoStr = dataObj.toISOString().split('T')[0];
                    const displayDate = isoStr.split('-').reverse().slice(0, 2).join('/');
                    const total = producoes
                        .filter(p => p.data_coleta?.split('T')[0] === isoStr)
                        .reduce((sum, p) => sum + (parseFloat(String(p.litros)) || 0), 0);
                    ultimos7Dias.push({ data: displayDate, total });
                }

                let html = `
                    <div class="stats-grid">
                        <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-cow"></i></div><div class="stat-value">${totalAnimais}</div><div class="stat-label">Total de Animais</div></div>
                        <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-venus"></i></div><div class="stat-value">${totalFemea}</div><div class="stat-label">Fêmeas</div></div>
                        <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-mars"></i></div><div class="stat-value">${totalMacho}</div><div class="stat-label">Machos</div></div>
                        <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-droplet"></i></div><div class="stat-value">${totalLitros.toFixed(1)} L</div><div class="stat-label">Produção Total</div></div>
                    </div>
                    <div class="chart-grid">
                        <div class="card chart-card"><h4 class="block-title"><i class="fa-solid fa-chart-line"></i> Produção dos Últimos 7 Dias</h4><div class="chart-container"><canvas id="chartProducaoDia"></canvas></div></div>
                        <div class="card chart-card"><h4 class="block-title"><i class="fa-solid fa-trophy"></i> Top 5 Vacas Produtoras</h4><div class="chart-container"><canvas id="chartTopVacas"></canvas></div></div>
                    </div>
                `;

                container.innerHTML = html;

                setTimeout(() => {
                    this.renderCharts(ultimos7Dias, topVacas);
                }, 100);
            } catch (error: any) {
                console.error('❌ Erro ao carregar dashboard:', error);
                container.innerHTML = `<p class="text-muted text-center">Erro ao carregar dashboard: ${error.message}</p>`;
            }
        },

        renderCharts(producaoDia, topVacas) {
            Object.values(this.chartInstances).forEach((chart: any) => {
                if (chart) chart.destroy();
            });
            this.chartInstances = {};

            const ctx1 = document.getElementById('chartProducaoDia');
            if (ctx1 && producaoDia && producaoDia.length > 0) {
                this.chartInstances.producaoDia = new Chart(ctx1, {
                    type: 'line',
                    data: {
                        labels: producaoDia.map(d => d.data),
                        datasets: [
                            {
                                label: 'Litros',
                                data: producaoDia.map(d => d.total),
                                borderColor: '#0d6efd',
                                backgroundColor: 'rgba(13,110,253,0.1)',
                                tension: 0.3,
                                fill: true,
                                pointBackgroundColor: '#0d6efd'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, title: { display: true, text: 'Litros' } } }
                    }
                });
            }

            const ctx2 = document.getElementById('chartTopVacas');
            if (ctx2 && topVacas && topVacas.length > 0) {
                const cores = ['#0d6efd', '#28a745', '#ffc107', '#dc3545', '#6c757d'];
                this.chartInstances.topVacas = new Chart(ctx2, {
                    type: 'bar',
                    data: {
                        labels: topVacas.map(v => v.nome),
                        datasets: [
                            {
                                label: 'Litros',
                                data: topVacas.map(v => v.producao),
                                backgroundColor: cores.slice(0, topVacas.length),
                                borderRadius: 8
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, title: { display: true, text: 'Litros' } } }
                    }
                });
            }
        },

        // ============================================
        // ANIMAIS
        // ============================================
        calcularIdade(dataNasc) {
            if (!dataNasc) return 0;
            const nasc = new Date(dataNasc);
            const hoje = new Date();
            let idade = hoje.getFullYear() - nasc.getFullYear();
            const m = hoje.getMonth() - nasc.getMonth();
            if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
                idade--;
            }
            return Math.max(0, idade);
        },

        debouncedLoadAnimais() {
            clearTimeout(this.filterNomeDebounce);
            this.filterNomeDebounce = window.setTimeout(() => this.loadAnimais(), 400);
        },

        async loadAnimais() {
            const searchNome = (document.getElementById('filterNome') as HTMLInputElement | null)?.value || '';
            const sexo = (document.getElementById('filterSexo') as HTMLSelectElement | null)?.value || '';
            const raca = (document.getElementById('filterRaca') as HTMLSelectElement | null)?.value || '';

            const container = el('animaisContent');

            if (!this.todasRacas || this.todasRacas.length === 0) {
                const allRes = await api.getAnimais();
                const todosAnimais = allRes.data?.data?.animais || [];
                this.todasRacas = [...new Set(todosAnimais.map(a => a.raca).filter((r): r is string => !!r))];
            }

            // Preserva o foco e a posição do cursor no campo de nome, já que o filtro
            // dispara a cada digitação (com debounce).
            const nomeInputAtual = document.getElementById('filterNome') as HTMLInputElement | null;
            const mantendoFocoNome = document.activeElement === nomeInputAtual;
            const cursorPos = mantendoFocoNome ? nomeInputAtual!.selectionStart : null;

            container.innerHTML = `<div class="loading"><div class="spinner"></div><p>Carregando animais...</p></div>`;
            try {
                const response = await api.getAnimais({ searchNome, sexo, raca });
                const data = response.data?.data;
                let animais: Animal[] = data?.animais || [];

                animais = animais.map(a => {
                    const brinco = typeof a.brinco === 'number' ? a.brinco : parseInt(String(a.brinco)) || 0;
                    const peso = typeof a.peso === 'number' ? a.peso : parseFloat(String(a.peso)) || 0;
                    const idadeVal = typeof a.idade === 'number' && a.idade > 0 ? a.idade : this.calcularIdade(a.data_nascimento);
                    return { ...a, brinco, peso, idade: idadeVal };
                });

                const stats = {
                    total: data?.total || 0,
                    totalFemea: data?.totalFemea || 0,
                    totalMacho: data?.totalMacho || 0,
                    pesoMedio: data?.pesoMedio || 0
                };
                const racas = this.todasRacas || [];

                let html = `
                    <div class="stats-grid">
                        <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-cow"></i></div><div class="stat-value">${stats.total}</div><div class="stat-label">Total</div></div>
                        <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-venus"></i></div><div class="stat-value">${stats.totalFemea}</div><div class="stat-label">Fêmeas</div></div>
                        <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-mars"></i></div><div class="stat-value">${stats.totalMacho}</div><div class="stat-label">Machos</div></div>
                        <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-weight-scale"></i></div><div class="stat-value">${(stats.pesoMedio || 0).toFixed(0)} kg</div><div class="stat-label">Peso Médio</div></div>
                    </div>
                    <div class="filters">
                        <div class="filter-group"><label>Nome</label><input type="text" id="filterNome" placeholder="Buscar por nome..." value="${searchNome}" oninput="app.debouncedLoadAnimais()" /></div>
                        <div class="filter-group"><label>Sexo</label><select id="filterSexo" onchange="app.loadAnimais()"><option value="">Todos</option><option value="F" ${sexo === 'F' ? 'selected' : ''}>Fêmea</option><option value="M" ${sexo === 'M' ? 'selected' : ''}>Macho</option></select></div>
                        <div class="filter-group"><label>Raça</label><select id="filterRaca" onchange="app.loadAnimais()"><option value="">Todas</option>${racas.map(r => `<option value="${r}" ${raca === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
                        <div class="filter-actions"><button class="btn btn-secondary btn-sm" title="Limpar filtros" onclick="clearTimeout(app.filterNomeDebounce);document.getElementById('filterNome').value='';document.getElementById('filterSexo').value='';document.getElementById('filterRaca').value='';app.loadAnimais();"><i class="fa-solid fa-xmark"></i> Limpar</button></div>
                    </div>
                `;
                if (!animais || animais.length === 0) {
                    html += `<p class="text-muted text-center">Nenhum animal cadastrado.</p>`;
                } else {
                    html += `<div class="table-responsive"><table><thead><tr><th>Brinco</th><th>Nome</th><th>Sexo</th><th>Raça</th><th>Peso</th><th>Idade</th><th>Status</th><th>Ações</th></tr></thead><tbody>`;
                    animais.forEach(a => {
                        const sexoLabel = a.sexo === 'F' ? '<i class="fa-solid fa-venus"></i> Fêmea' : '<i class="fa-solid fa-mars"></i> Macho';
                        const status = a.ativo
                            ? '<span class="badge badge-success">Ativo</span>'
                            : '<span class="badge badge-danger">Inativo</span>';
                        html += `<tr><td><strong>${a.brinco}</strong></td><td>${a.nome}</td><td>${sexoLabel}</td><td>${a.raca || 'N/A'}</td><td>${a.peso.toFixed(1)} kg</td><td>${a.idade} ${a.idade === 1 ? 'ano' : 'anos'}</td><td>${status}</td><td><div class="actions"><button class="btn btn-sm btn-primary" data-tooltip="Editar Animal" onclick="app.editarAnimal(${a.brinco})"><i class="fa-solid fa-pen"></i></button><button class="btn btn-sm btn-danger" data-tooltip="Excluir Animal" onclick="app.deletarAnimal(${a.brinco})"><i class="fa-solid fa-trash"></i></button><button class="btn btn-sm btn-info" data-tooltip="Ver Árvore" onclick="app.verArvore(${a.brinco})"><i class="fa-solid fa-sitemap"></i></button></div></td></tr>`;
                    });
                    html += `</tbody></table></div>`;
                }
                container.innerHTML = html;

                if (mantendoFocoNome) {
                    const novoInputNome = document.getElementById('filterNome') as HTMLInputElement | null;
                    if (novoInputNome) {
                        novoInputNome.focus();
                        novoInputNome.setSelectionRange(cursorPos, cursorPos);
                    }
                }
            } catch (error: any) {
                container.innerHTML = `<p class="text-muted text-center">Erro ao carregar animais: ${error.message}</p>`;
            }
        },

        // ============================================
        // PRODUÇÕES
        // ============================================
        async loadProducoes() {
            const container = el('producoesContent');
            container.innerHTML = `<div class="loading"><div class="spinner"></div><p>Carregando produções...</p></div>`;
            try {
                const response = await api.getProducoes();
                let producoes: ProducaoLeite[] = response.data?.data?.producoes || [];
                producoes = producoes.map(p => ({
                    ...p,
                    litros: typeof p.litros === 'number' ? p.litros : parseFloat(String(p.litros)) || 0
                }));
                if (!producoes || producoes.length === 0) {
                    container.innerHTML = '<p class="text-muted text-center">Nenhuma produção registrada.</p>';
                    return;
                }
                const totalLitros = producoes.reduce((sum, p) => sum + p.litros, 0);
                const periodoLabel: Record<Periodo, string> = {
                    Manha: '<i class="fa-solid fa-cloud-sun"></i> Manhã',
                    Tarde: '<i class="fa-solid fa-sun"></i> Tarde',
                    Noite: '<i class="fa-solid fa-moon"></i> Noite'
                };
                let html = `<div class="table-responsive"><table><thead><tr><th>ID</th><th>Animal</th><th>Data</th><th>Período</th><th>Litros</th><th>Ações</th></tr></thead><tbody>`;
                producoes.forEach(p => {
                    const periodo = periodoLabel[p.periodo] || p.periodo;
                    html += `<tr><td>${p.id}</td><td>${p.animal?.nome || p.animal_brinco}</td><td>${new Date(p.data_coleta).toLocaleDateString()}</td><td>${periodo}</td><td><strong>${p.litros.toFixed(1)} L</strong></td><td><div class="actions"><button class="btn btn-sm btn-primary" data-tooltip="Editar Produção" onclick="app.editarProducao(${p.id})"><i class="fa-solid fa-pen"></i></button><button class="btn btn-sm btn-danger" data-tooltip="Excluir Produção" onclick="app.deletarProducao(${p.id})"><i class="fa-solid fa-trash"></i></button></div></td></tr>`;
                });
                html += `</tbody><tfoot><tr><td colspan="4" class="table-footer-label">Total:</td><td class="table-footer-value">${totalLitros.toFixed(1)} L</td><td></td></tr></tfoot></table></div>`;
                container.innerHTML = html;
            } catch (error: any) {
                container.innerHTML = `<p class="text-muted text-center">Erro ao carregar produções: ${error.message}</p>`;
            }
        },

        // ============================================
        // RELATÓRIOS
        // ============================================
        async loadRelatorios() {
            const container = el('relatoriosContent');
            container.innerHTML = `<div class="loading"><div class="spinner"></div><p>Carregando relatórios...</p></div>`;
            try {
                const [producaoRes, , graficosRes, animaisRes, topRes] = await Promise.all([
                    api.getRelatorioProducao(),
                    api.getRelatorioRebanho(),
                    api.getGraficosProducao(7),
                    api.getAnimais(),
                    api.getTopVacas(5)
                ]);
                const producaoData = producaoRes.data?.data || {};
                const graficosData = graficosRes.data?.data || [];
                const animais = animaisRes.data?.data?.animais || [];
                const topVacas = topRes.data?.data || [];
                const totalAnimais = animais.length;
                const totalFemea = animais.filter(a => a.sexo === 'F').length;
                const totalMacho = animais.filter(a => a.sexo === 'M').length;
                const totalLitros = producaoData.stats?.totalLitros || 0;
                const medalIcon = [
                    '<i class="fa-solid fa-trophy medal-gold"></i>',
                    '<i class="fa-solid fa-medal medal-silver"></i>',
                    '<i class="fa-solid fa-medal medal-bronze"></i>',
                    '<i class="fa-solid fa-award"></i>',
                    '<i class="fa-solid fa-award"></i>'
                ];
                let html = `
                    <div class="stats-grid">
                        <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-cow"></i></div><div class="stat-value">${totalAnimais}</div><div class="stat-label">Total de Animais</div></div>
                        <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-venus"></i></div><div class="stat-value">${totalFemea}</div><div class="stat-label">Fêmeas</div></div>
                        <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-mars"></i></div><div class="stat-value">${totalMacho}</div><div class="stat-label">Machos</div></div>
                        <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-droplet"></i></div><div class="stat-value">${totalLitros.toFixed(1)} L</div><div class="stat-label">Total Produzido</div></div>
                    </div>
                    <div class="card mini-stats-block"><h4 class="block-title"><i class="fa-solid fa-chart-line"></i> Produção dos Últimos 7 Dias</h4><div class="chart-container"><canvas id="chartRelatorioProducao"></canvas></div></div>
                    <div class="card mini-stats-block"><h4 class="block-title"><i class="fa-solid fa-trophy"></i> Top 5 Vacas Produtoras</h4><div class="mini-stats-grid">
                    ${
                        topVacas.length > 0
                            ? topVacas
                                  .map(
                                      (v, i) =>
                                          `<div class="mini-stat-card"><div class="mini-stat-medal">${medalIcon[i] || '<i class="fa-solid fa-circle"></i>'}</div><div><strong>${v.nome}</strong></div><div class="mini-stat-value">${(v.producao || v.total || 0).toFixed(1)} L</div></div>`
                                  )
                                  .join('')
                            : '<p class="text-muted text-center">Nenhuma produção registrada.</p>'
                    }
                    </div></div>
                `;
                container.innerHTML = html;
                setTimeout(() => {
                    const ctx = document.getElementById('chartRelatorioProducao');
                    if (ctx && graficosData && graficosData.length > 0) {
                        if (this.chartInstances.relatorioProducao) {
                            this.chartInstances.relatorioProducao.destroy();
                        }
                        const labelsFormatted = graficosData.map(d => {
                            if (!d.data) return '';
                            const parts = d.data.split('T')[0].split('-');
                            return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d.data;
                        });
                        this.chartInstances.relatorioProducao = new Chart(ctx, {
                            type: 'line',
                            data: {
                                labels: labelsFormatted,
                                datasets: [
                                    {
                                        label: 'Litros',
                                        data: graficosData.map(d => d.total),
                                        borderColor: '#0d6efd',
                                        backgroundColor: 'rgba(13,110,253,0.1)',
                                        tension: 0.3,
                                        fill: true
                                    }
                                ]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: { y: { beginAtZero: true, title: { display: true, text: 'Litros' } } }
                            }
                        });
                    }
                }, 100);
            } catch (error: any) {
                container.innerHTML = `<p class="text-muted text-center">Erro ao carregar relatórios: ${error.message}</p>`;
            }
        },

        // ============================================
        // USUÁRIOS
        // ============================================
        async loadUsuarios() {
            const container = el('usuariosContent');
            container.innerHTML = `<div class="loading"><div class="spinner"></div><p>Carregando usuários...</p></div>`;
            try {
                const response = await api.getUsers();
                const users: Usuario[] = response.data?.data || [];
                if (!users || users.length === 0) {
                    container.innerHTML = '<p class="text-muted text-center">Nenhum usuário cadastrado.</p>';
                    return;
                }
                let html = `<div class="table-responsive"><table><thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Status</th><th>Ações</th></tr></thead><tbody>`;
                users.forEach(u => {
                    const role =
                        u.role === 'Admin'
                            ? '<span class="badge badge-danger">Admin</span>'
                            : '<span class="badge badge-info">Cliente</span>';
                    const status = u.ativo
                        ? '<span class="badge badge-success">Ativo</span>'
                        : '<span class="badge badge-danger">Inativo</span>';
                    html += `<tr><td><strong>${u.nome}</strong></td><td>${u.email}</td><td>${role}</td><td>${status}</td><td><div class="actions"><button class="btn btn-sm btn-warning" data-tooltip="Alternar Status" onclick="app.toggleUserStatus('${u.id}')"><i class="fa-solid fa-arrows-rotate"></i></button><button class="btn btn-sm btn-danger" data-tooltip="Excluir Usuário" onclick="app.deletarUsuario('${u.id}')"><i class="fa-solid fa-trash"></i></button></div></td></tr>`;
                });
                html += `</tbody></table></div>`;
                container.innerHTML = html;
            } catch (error: any) {
                container.innerHTML = `<p class="text-muted text-center">Erro ao carregar usuários: ${error.message}</p>`;
            }
        },

        // ============================================
        // ANIMAIS - CRUD
        // ============================================
        novoAnimal() {
            el('modalAnimalTitle').innerHTML = '<i class="fa-solid fa-cow"></i> Novo Animal';
            el('animalSubmitBtn').textContent = 'Salvar';
            el<HTMLInputElement>('animalEditBrinco').value = '';
            el<HTMLInputElement>('animalBrinco').disabled = false;
            el<HTMLFormElement>('animalForm').reset();
            this.showModal('animal');
        },

        async editarAnimal(brinco) {
            try {
                const response = await api.getAnimal(brinco);
                const animal = response.data?.data;
                if (!animal) {
                    this.toast('Animal não encontrado', 'error');
                    return;
                }
                el('modalAnimalTitle').innerHTML = `<i class="fa-solid fa-pen"></i> Editando ${animal.nome}`;
                el('animalSubmitBtn').textContent = 'Atualizar';
                el<HTMLInputElement>('animalEditBrinco').value = String(animal.brinco);
                el<HTMLInputElement>('animalBrinco').value = String(animal.brinco);
                el<HTMLInputElement>('animalBrinco').disabled = true;
                el<HTMLInputElement>('animalNome').value = animal.nome;
                el<HTMLSelectElement>('animalSexo').value = animal.sexo;
                el<HTMLInputElement>('animalRaca').value = animal.raca || '';
                el<HTMLInputElement>('animalPeso').value = String(animal.peso);
                el<HTMLInputElement>('animalDataNascimento').value = animal.data_nascimento?.split('T')[0] || '';
                el<HTMLInputElement>('animalBrincoPai').value = animal.brinco_pai ? String(animal.brinco_pai) : '';
                el<HTMLInputElement>('animalBrincoMae').value = animal.brinco_mae ? String(animal.brinco_mae) : '';
                this.showModal('animal');
            } catch (error) {
                this.toast('Erro ao carregar animal', 'error');
            }
        },

        async saveAnimal() {
            const isEdit = !!el<HTMLInputElement>('animalEditBrinco').value;
            const data: Partial<Animal> = {
                brinco: parseInt(el<HTMLInputElement>('animalBrinco').value),
                nome: el<HTMLInputElement>('animalNome').value,
                sexo: el<HTMLSelectElement>('animalSexo').value as Sexo,
                raca: el<HTMLInputElement>('animalRaca').value || undefined,
                peso: parseFloat(el<HTMLInputElement>('animalPeso').value),
                data_nascimento: el<HTMLInputElement>('animalDataNascimento').value,
                brinco_pai: el<HTMLInputElement>('animalBrincoPai').value
                    ? parseInt(el<HTMLInputElement>('animalBrincoPai').value)
                    : undefined,
                brinco_mae: el<HTMLInputElement>('animalBrincoMae').value
                    ? parseInt(el<HTMLInputElement>('animalBrincoMae').value)
                    : undefined
            };
            const erroData = this.validarDataNascimento(data.data_nascimento as string);
            if (erroData) {
                this.toast(erroData, 'error');
                return;
            }
            try {
                const response = isEdit ? await api.updateAnimal(data.brinco as number, data) : await api.createAnimal(data);
                if (response.status >= 200 && response.status < 300) {
                    this.toast(isEdit ? 'Animal atualizado!' : 'Animal cadastrado!', 'success');
                    this.closeModal('animal');
                    this.loadAnimais();
                    if (this.currentPage === 'dashboard') this.loadDashboard();
                } else {
                    this.toast(response.data?.message || 'Erro ao salvar', 'error');
                }
            } catch (error) {
                this.toast('Erro ao salvar animal', 'error');
            }
        },

        async deletarAnimal(brinco) {
            if (!confirm(`Excluir animal ${brinco}?`)) return;
            try {
                const response = await api.deleteAnimal(brinco);
                if (response.status >= 200 && response.status < 300) {
                    this.toast('Animal excluído!', 'success');
                    this.loadAnimais();
                    if (this.currentPage === 'dashboard') this.loadDashboard();
                } else {
                    this.toast(response.data?.message || 'Erro ao excluir', 'error');
                }
            } catch (error) {
                this.toast('Erro ao excluir animal', 'error');
            }
        },

        async verArvore(brinco) {
            try {
                const response = await api.getAnimalTree(brinco);
                const data = response.data?.data;
                if (!data) {
                    this.toast('Árvore não encontrada', 'error');
                    return;
                }
                const animal = data.animal,
                    pai = data.pai,
                    mae = data.mae,
                    filhos = data.filhos || [];
                let html = `
                    <div class="tree-grid">
                        <div class="tree-card"><h4>${pai ? `<i class="fa-solid fa-person"></i> ${pai.nome}` : '<i class="fa-solid fa-circle-question"></i> Pai não informado'}</h4>${pai ? `<p><small>Brinco: ${pai.brinco}</small></p>` : ''}${pai?.pai ? `<p><small>Avô: ${pai.pai.nome}</small></p>` : ''}${pai?.mae ? `<p><small>Avó: ${pai.mae.nome}</small></p>` : ''}</div>
                        <div class="tree-card-center"><h4><i class="fa-solid fa-cow"></i> ${animal.nome}</h4><p><small>Brinco: ${animal.brinco}</small></p><p><small>${animal.sexo === 'F' ? '<i class="fa-solid fa-venus"></i> Fêmea' : '<i class="fa-solid fa-mars"></i> Macho'}</small></p></div>
                        <div class="tree-card"><h4>${mae ? `<i class="fa-solid fa-person-dress"></i> ${mae.nome}` : '<i class="fa-solid fa-circle-question"></i> Mãe não informada'}</h4>${mae ? `<p><small>Brinco: ${mae.brinco}</small></p>` : ''}${mae?.pai ? `<p><small>Avô: ${mae.pai.nome}</small></p>` : ''}${mae?.mae ? `<p><small>Avó: ${mae.mae.nome}</small></p>` : ''}</div>
                    </div>
                    ${
                        filhos.length > 0
                            ? `<div class="tree-children-block"><h4><i class="fa-solid fa-child"></i> Filhos (${filhos.length})</h4><div class="tree-children-list">${filhos.map(f => `<span class="badge badge-primary">${f.nome} (${f.brinco})</span>`).join('')}</div></div>`
                            : ''
                    }
                    <div class="tree-back-action"><button class="btn btn-secondary btn-sm" onclick="app.loadAnimais()"><i class="fa-solid fa-arrow-left"></i> Voltar</button></div>
                `;
                el('animaisContent').innerHTML = html;
            } catch (error) {
                this.toast('Erro ao carregar árvore', 'error');
            }
        },

        // ============================================
        // PRODUÇÕES - CRUD
        // ============================================
        async novaProducao() {
            try {
                const response = await api.getAnimais();
                const animais = response.data?.data?.animais || [];
                const femeas = animais.filter(a => a.sexo === 'F' && a.ativo);
                const select = el<HTMLSelectElement>('producaoAnimal');
                select.innerHTML =
                    '<option value="">Selecione...</option>' +
                    femeas.map(a => `<option value="${a.brinco}">${a.brinco} - ${a.nome}</option>`).join('');
                el('modalProducaoTitle').innerHTML = '<i class="fa-solid fa-droplet"></i> Nova Produção';
                el('producaoSubmitBtn').textContent = 'Salvar';
                el<HTMLInputElement>('producaoEditId').value = '';
                el<HTMLFormElement>('producaoForm').reset();
                el<HTMLInputElement>('producaoData').value = new Date().toISOString().split('T')[0];
                this.showModal('producao');
            } catch (error) {
                this.toast('Erro ao carregar animais', 'error');
            }
        },

        async editarProducao(id) {
            try {
                const response = await api.getProducao(id);
                const producao = response.data?.data;
                if (!producao) {
                    this.toast('Produção não encontrada', 'error');
                    return;
                }
                const resAnimais = await api.getAnimais();
                const animais = resAnimais.data?.data?.animais || [];
                const femeas = animais.filter(a => a.sexo === 'F' && a.ativo);
                const select = el<HTMLSelectElement>('producaoAnimal');
                select.innerHTML =
                    '<option value="">Selecione...</option>' +
                    femeas
                        .map(
                            a =>
                                `<option value="${a.brinco}" ${a.brinco === producao.animal_brinco ? 'selected' : ''}>${a.brinco} - ${a.nome}</option>`
                        )
                        .join('');
                el('modalProducaoTitle').innerHTML = `<i class="fa-solid fa-pen"></i> Editando #${id}`;
                el('producaoSubmitBtn').textContent = 'Atualizar';
                el<HTMLInputElement>('producaoEditId').value = String(id);
                el<HTMLInputElement>('producaoData').value = producao.data_coleta?.split('T')[0] || '';
                el<HTMLInputElement>('producaoLitros').value = String(producao.litros);
                el<HTMLSelectElement>('producaoPeriodo').value = producao.periodo;
                this.showModal('producao');
            } catch (error) {
                this.toast('Erro ao carregar produção', 'error');
            }
        },

        async saveProducao() {
            const isEdit = !!el<HTMLInputElement>('producaoEditId').value;
            const id = el<HTMLInputElement>('producaoEditId').value;
            const data: Partial<ProducaoLeite> = {
                animal_brinco: parseInt(el<HTMLSelectElement>('producaoAnimal').value),
                data_coleta: el<HTMLInputElement>('producaoData').value,
                litros: parseFloat(el<HTMLInputElement>('producaoLitros').value),
                periodo: el<HTMLSelectElement>('producaoPeriodo').value as Periodo
            };
            if (!data.animal_brinco) {
                this.toast('Selecione um animal', 'error');
                return;
            }
            if (isNaN(data.litros as number) || (data.litros as number) < 0) {
                this.toast('A quantidade de litros não pode ser negativa', 'error');
                return;
            }
            try {
                const response = isEdit ? await api.updateProducao(parseInt(id), data) : await api.createProducao(data);
                if (response.status >= 200 && response.status < 300) {
                    this.toast(isEdit ? 'Produção atualizada!' : 'Produção registrada!', 'success');
                    this.closeModal('producao');
                    this.loadProducoes();
                    if (this.currentPage === 'dashboard') this.loadDashboard();
                } else {
                    this.toast(response.data?.message || 'Erro ao salvar', 'error');
                }
            } catch (error) {
                this.toast('Erro ao salvar produção', 'error');
            }
        },

        async deletarProducao(id) {
            if (!confirm(`Excluir produção ${id}?`)) return;
            try {
                const response = await api.deleteProducao(id);
                if (response.status >= 200 && response.status < 300) {
                    this.toast('Produção excluída!', 'success');
                    this.loadProducoes();
                    if (this.currentPage === 'dashboard') this.loadDashboard();
                } else {
                    this.toast(response.data?.message || 'Erro ao excluir', 'error');
                }
            } catch (error) {
                this.toast('Erro ao excluir produção', 'error');
            }
        },

        // ============================================
        // USUÁRIOS - Admin
        // ============================================
        async toggleUserStatus(id) {
            try {
                const response = await api.toggleUserStatus(id);
                if (response.status >= 200 && response.status < 300) {
                    this.toast('Status alterado!', 'success');
                    this.loadUsuarios();
                } else {
                    this.toast(response.data?.message || 'Erro ao alterar', 'error');
                }
            } catch (error) {
                this.toast('Erro ao alterar status', 'error');
            }
        },

        async deletarUsuario(id) {
            if (!confirm('Excluir usuário?')) return;
            try {
                const response = await api.deleteUser(id);
                if (response.status >= 200 && response.status < 300) {
                    this.toast('Usuário excluído!', 'success');
                    this.loadUsuarios();
                } else {
                    this.toast(response.data?.message || 'Erro ao excluir', 'error');
                }
            } catch (error) {
                this.toast('Erro ao excluir usuário', 'error');
            }
        },

        // ============================================
        // LOGOUT
        // ============================================
        logout() {
            api.clearToken();
            this.toast('Desconectado!', 'warning');
            setTimeout(() => (window.location.href = '/'), 500);
        },

        // ============================================
        // MODAL
        // ============================================
        showModal(name) {
            el(`modal${name.charAt(0).toUpperCase() + name.slice(1)}`).classList.add('active');
            document.body.style.overflow = 'hidden';
        },
        closeModal(name) {
            el(`modal${name.charAt(0).toUpperCase() + name.slice(1)}`).classList.remove('active');
            document.body.style.overflow = '';
        },

        // ============================================
        // TOAST
        // ============================================
        toast(message, type = 'info') {
            const toast = el('toast');
            toast.textContent = message;
            toast.className = `toast ${type}`;
            setTimeout(() => toast.classList.add('show'), 10);
            clearTimeout(this.toastTimeout);
            this.toastTimeout = window.setTimeout(() => toast.classList.remove('show'), 3000);
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 Inicializando aplicação...');
        (window as any).app = app;
        app.init();
    });
})();
