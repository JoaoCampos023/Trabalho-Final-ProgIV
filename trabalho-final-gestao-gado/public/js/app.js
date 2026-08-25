/**
 * App - Lógica principal da aplicação
 */

const app = {
    // ============================================
    // ESTADO
    // ============================================
    currentPage: 'dashboard',
    animais: [],
    producoes: [],
    users: [],
    user: null,

    // ============================================
    // INICIALIZAÇÃO
    // ============================================
    init() {
        console.log('🐄 App inicializado');

        // Verificar autenticação
        if (api.isAuthenticated()) {
            this.loadUserInfo();
        }

        // Event listeners
        document.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateTo(page);
            });
        });

        // Mobile toggle
        document.getElementById('mobileToggle').addEventListener('click', () => {
            document.getElementById('navMenu').classList.toggle('open');
        });

        // Forms
        document.getElementById('animalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAnimal();
        });

        document.getElementById('producaoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProducao();
        });

        // Load initial page
        this.navigateTo('dashboard');

        // Toast auto-hide
        this.toastTimeout = null;
    },

    // ============================================
    // NAVEGAÇÃO
    // ============================================
    async navigateTo(page) {
        this.currentPage = page;

        // Update nav
        document.querySelectorAll('[data-page]').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });

        // Show page
        document.querySelectorAll('.page').forEach(p => {
            p.classList.toggle('active', p.id === `page-${page}`);
        });

        // Load content
        switch (page) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'animais':
                await this.loadAnimais();
                break;
            case 'producoes':
                await this.loadProducoes();
                break;
            case 'usuarios':
                await this.loadUsuarios();
                break;
        }

        // Close mobile menu
        document.getElementById('navMenu').classList.remove('open');
    },

    // ============================================
    // DASHBOARD
    // ============================================
    async loadDashboard() {
        const container = document.getElementById('page-dashboard');
        container.innerHTML = '<p>Carregando dashboard...</p>';

        try {
            const [statsRes, topRes, diaRes] = await Promise.all([
                api.getAnimalStats(),
                api.getTopVacas(5),
                api.getProducaoPorDia(7)
            ]);

            const stats = statsRes.data?.data || {};
            const topVacas = topRes.data?.data || [];
            const producaoDia = diaRes.data?.data || [];

            container.innerHTML = Components.dashboard(stats, topVacas, producaoDia);
        } catch (error) {
            container.innerHTML = `<p class="text-muted text-center">Erro ao carregar dashboard: ${error.message}</p>`;
        }
    },

    // ============================================
    // ANIMAIS
    // ============================================
    async loadAnimais() {
        const container = document.getElementById('page-animais');
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2>🐮 Rebanho</h2>
                    <div class="card-actions">
                        <button class="btn btn-primary" onclick="app.novoAnimal()">➕ Novo Animal</button>
                        <button class="btn btn-success" onclick="app.loadAnimais()">🔄 Atualizar</button>
                    </div>
                </div>
                <div id="animaisContent">Carregando...</div>
            </div>
        `;

        try {
            const response = await api.getAnimais();
            const data = response.data?.data;
            const animais = data?.animais || [];

            // Store para uso posterior
            this.animais = animais;

            // Stats
            const stats = {
                total: data?.total || 0,
                totalFemea: data?.totalFemea || 0,
                totalMacho: data?.totalMacho || 0,
                pesoMedio: data?.pesoMedio || 0
            };

            const content = document.getElementById('animaisContent');
            content.innerHTML = Components.statsGrid(stats) + Components.animalTable(animais);

        } catch (error) {
            document.getElementById('animaisContent').innerHTML =
                `<p class="text-muted text-center">Erro ao carregar animais: ${error.message}</p>`;
        }
    },

    async novoAnimal() {
        document.getElementById('modalAnimalTitle').textContent = '🐮 Novo Animal';
        document.getElementById('animalSubmitBtn').textContent = 'Salvar';
        document.getElementById('animalEditBrinco').value = '';
        document.getElementById('animalForm').reset();
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

            document.getElementById('modalAnimalTitle').textContent = `✏️ Editando ${animal.nome}`;
            document.getElementById('animalSubmitBtn').textContent = 'Atualizar';
            document.getElementById('animalEditBrinco').value = animal.brinco;
            document.getElementById('animalBrinco').value = animal.brinco;
            document.getElementById('animalBrinco').disabled = true;
            document.getElementById('animalNome').value = animal.nome;
            document.getElementById('animalSexo').value = animal.sexo;
            document.getElementById('animalRaca').value = animal.raca || '';
            document.getElementById('animalPeso').value = animal.peso;
            document.getElementById('animalDataNascimento').value = animal.data_nascimento?.split('T')[0] || '';
            document.getElementById('animalBrincoPai').value = animal.brinco_pai || '';
            document.getElementById('animalBrincoMae').value = animal.brinco_mae || '';

            this.showModal('animal');
        } catch (error) {
            this.toast('Erro ao carregar animal', 'error');
        }
    },

    async saveAnimal() {
        const isEdit = !!document.getElementById('animalEditBrinco').value;

        const data = {
            brinco: parseInt(document.getElementById('animalBrinco').value),
            nome: document.getElementById('animalNome').value,
            sexo: document.getElementById('animalSexo').value,
            raca: document.getElementById('animalRaca').value || undefined,
            peso: parseFloat(document.getElementById('animalPeso').value),
            data_nascimento: document.getElementById('animalDataNascimento').value,
            brinco_pai: document.getElementById('animalBrincoPai').value ? parseInt(document.getElementById('animalBrincoPai').value) : undefined,
            brinco_mae: document.getElementById('animalBrincoMae').value ? parseInt(document.getElementById('animalBrincoMae').value) : undefined
        };

        try {
            let response;
            if (isEdit) {
                response = await api.updateAnimal(data.brinco, data);
            } else {
                response = await api.createAnimal(data);
            }

            if (response.status >= 200 && response.status < 300) {
                this.toast(isEdit ? 'Animal atualizado com sucesso!' : 'Animal cadastrado com sucesso!', 'success');
                this.closeModal('animal');
                this.loadAnimais();
            } else {
                this.toast(response.data?.message || 'Erro ao salvar animal', 'error');
            }
        } catch (error) {
            this.toast('Erro ao salvar animal', 'error');
        }
    },

    async deletarAnimal(brinco) {
        if (!confirm(`Tem certeza que deseja excluir o animal ${brinco}?`)) return;

        try {
            const response = await api.deleteAnimal(brinco);
            if (response.status >= 200 && response.status < 300) {
                this.toast('Animal excluído com sucesso!', 'success');
                this.loadAnimais();
            } else {
                this.toast(response.data?.message || 'Erro ao excluir animal', 'error');
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
                this.toast('Árvore genealógica não encontrada', 'error');
                return;
            }

            const container = document.getElementById('page-animais');
            const content = document.getElementById('animaisContent');
            content.innerHTML = Components.arvoreGenealogica(data) +
                `<div class="mt-10"><button class="btn btn-secondary" onclick="app.loadAnimais()">⬅️ Voltar</button></div>`;

            // Atualizar o card header
            const header = container.querySelector('.card-header h2');
            if (header) {
                header.textContent = `🌳 Árvore Genealógica - Brinco ${brinco}`;
            }
            container.querySelector('.card-actions').innerHTML = '';

        } catch (error) {
            this.toast('Erro ao carregar árvore genealógica', 'error');
        }
    },

    // ============================================
    // PRODUÇÕES
    // ============================================
    async loadProducoes() {
        const container = document.getElementById('page-producoes');
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2>🥛 Produções de Leite</h2>
                    <div class="card-actions">
                        <button class="btn btn-primary" onclick="app.novaProducao()">➕ Nova Produção</button>
                        <button class="btn btn-success" onclick="app.loadProducoes()">🔄 Atualizar</button>
                    </div>
                </div>
                <div id="producoesContent">Carregando...</div>
            </div>
        `;

        try {
            const response = await api.getProducoes();
            const producoes = response.data?.data?.producoes || [];

            this.producoes = producoes;

            const content = document.getElementById('producoesContent');
            content.innerHTML = Components.producaoTable(producoes);

        } catch (error) {
            document.getElementById('producoesContent').innerHTML =
                `<p class="text-muted text-center">Erro ao carregar produções: ${error.message}</p>`;
        }
    },

    async novaProducao() {
        // Carregar lista de animais para o select
        try {
            const response = await api.getAnimais();
            const animais = response.data?.data?.animais || [];
            const femeas = animais.filter(a => a.sexo === 'F' && a.ativo);

            const select = document.getElementById('producaoAnimal');
            select.innerHTML = '<option value="">Selecione um animal...</option>' +
                femeas.map(a => `<option value="${a.brinco}">${a.brinco} - ${a.nome}</option>`).join('');

            document.getElementById('modalProducaoTitle').textContent = '🥛 Nova Produção';
            document.getElementById('producaoSubmitBtn').textContent = 'Salvar';
            document.getElementById('producaoEditId').value = '';
            document.getElementById('producaoForm').reset();
            document.getElementById('producaoData').value = new Date().toISOString().split('T')[0];

            this.showModal('producao');
        } catch (error) {
            this.toast('Erro ao carregar lista de animais', 'error');
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

            // Carregar lista de animais
            const resAnimais = await api.getAnimais();
            const animais = resAnimais.data?.data?.animais || [];
            const femeas = animais.filter(a => a.sexo === 'F' && a.ativo);

            const select = document.getElementById('producaoAnimal');
            select.innerHTML = '<option value="">Selecione um animal...</option>' +
                femeas.map(a =>
                    `<option value="${a.brinco}" ${a.brinco === producao.animal_brinco ? 'selected' : ''}>${a.brinco} - ${a.nome}</option>`
                ).join('');

            document.getElementById('modalProducaoTitle').textContent = `✏️ Editando Produção #${id}`;
            document.getElementById('producaoSubmitBtn').textContent = 'Atualizar';
            document.getElementById('producaoEditId').value = id;
            document.getElementById('producaoData').value = producao.data_coleta?.split('T')[0] || '';
            document.getElementById('producaoLitros').value = producao.litros;
            document.getElementById('producaoPeriodo').value = producao.periodo;

            this.showModal('producao');
        } catch (error) {
            this.toast('Erro ao carregar produção', 'error');
        }
    },

    async saveProducao() {
        const isEdit = !!document.getElementById('producaoEditId').value;
        const id = document.getElementById('producaoEditId').value;

        const data = {
            animal_brinco: parseInt(document.getElementById('producaoAnimal').value),
            data_coleta: document.getElementById('producaoData').value,
            litros: parseFloat(document.getElementById('producaoLitros').value),
            periodo: document.getElementById('producaoPeriodo').value
        };

        if (!data.animal_brinco) {
            this.toast('Selecione um animal', 'error');
            return;
        }

        try {
            let response;
            if (isEdit) {
                response = await api.updateProducao(parseInt(id), data);
            } else {
                response = await api.createProducao(data);
            }

            if (response.status >= 200 && response.status < 300) {
                this.toast(isEdit ? 'Produção atualizada com sucesso!' : 'Produção registrada com sucesso!', 'success');
                this.closeModal('producao');
                this.loadProducoes();
            } else {
                this.toast(response.data?.message || 'Erro ao salvar produção', 'error');
            }
        } catch (error) {
            this.toast('Erro ao salvar produção', 'error');
        }
    },

    async deletarProducao(id) {
        if (!confirm(`Tem certeza que deseja excluir a produção ${id}?`)) return;

        try {
            const response = await api.deleteProducao(id);
            if (response.status >= 200 && response.status < 300) {
                this.toast('Produção excluída com sucesso!', 'success');
                this.loadProducoes();
            } else {
                this.toast(response.data?.message || 'Erro ao excluir produção', 'error');
            }
        } catch (error) {
            this.toast('Erro ao excluir produção', 'error');
        }
    },

    // ============================================
    // USUÁRIOS (Admin)
    // ============================================
    async loadUsuarios() {
        const container = document.getElementById('page-usuarios');
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2>👤 Usuários</h2>
                    <div class="card-actions">
                        <button class="btn btn-success" onclick="app.loadUsuarios()">🔄 Atualizar</button>
                    </div>
                </div>
                <div id="usuariosContent">Carregando...</div>
            </div>
        `;

        try {
            const response = await api.getUsers();
            const users = response.data?.data || [];

            this.users = users;

            const content = document.getElementById('usuariosContent');
            content.innerHTML = Components.userTable(users);

        } catch (error) {
            document.getElementById('usuariosContent').innerHTML =
                `<p class="text-muted text-center">Erro ao carregar usuários: ${error.message}</p>`;
        }
    },

    async toggleUserStatus(id) {
        try {
            const response = await api.toggleUserStatus(id);
            if (response.status >= 200 && response.status < 300) {
                this.toast('Status do usuário alterado!', 'success');
                this.loadUsuarios();
            } else {
                this.toast(response.data?.message || 'Erro ao alterar status', 'error');
            }
        } catch (error) {
            this.toast('Erro ao alterar status', 'error');
        }
    },

    async deletarUsuario(id) {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

        try {
            const response = await api.deleteUser(id);
            if (response.status >= 200 && response.status < 300) {
                this.toast('Usuário excluído com sucesso!', 'success');
                this.loadUsuarios();
            } else {
                this.toast(response.data?.message || 'Erro ao excluir usuário', 'error');
            }
        } catch (error) {
            this.toast('Erro ao excluir usuário', 'error');
        }
    },

    // ============================================
    // AUTENTICAÇÃO
    // ============================================
    async login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.toast('Preencha todos os campos', 'error');
            return;
        }

        try {
            const response = await api.login({ email, password });

            if (response.status === 200) {
                const token = response.data?.data?.token;
                const user = response.data?.data?.user;

                if (token) {
                    api.setToken(token);
                    this.user = user;
                    this.loadUserInfo();
                    this.closeModal('login');
                    this.toast(`Bem-vindo, ${user.nome}!`, 'success');
                    this.navigateTo('dashboard');
                }
            } else {
                this.toast(response.data?.message || 'Erro ao fazer login', 'error');
            }
        } catch (error) {
            this.toast('Erro ao fazer login', 'error');
        }
    },

    async register() {
        const nome = document.getElementById('regNome').value;
        const email = document.getElementById('regEmail').value;
        const cpf = document.getElementById('regCpf').value;
        const password = document.getElementById('regPassword').value;
        const confirm = document.getElementById('regConfirmPassword').value;

        if (!nome || !email || !cpf || !password) {
            this.toast('Preencha todos os campos', 'error');
            return;
        }

        if (password !== confirm) {
            this.toast('As senhas não coincidem', 'error');
            return;
        }

        try {
            const response = await api.register({ nome, email, password, cpf });

            if (response.status === 201) {
                const token = response.data?.data?.token;
                const user = response.data?.data?.user;

                if (token) {
                    api.setToken(token);
                    this.user = user;
                    this.loadUserInfo();
                    this.closeModal('register');
                    this.toast(`Conta criada com sucesso! Bem-vindo, ${user.nome}!`, 'success');
                    this.navigateTo('dashboard');
                }
            } else {
                this.toast(response.data?.message || 'Erro ao criar conta', 'error');
            }
        } catch (error) {
            this.toast('Erro ao criar conta', 'error');
        }
    },

    logout() {
        api.clearToken();
        this.user = null;
        document.getElementById('userInfo').style.display = 'none';
        document.getElementById('authButtons').style.display = 'flex';
        document.getElementById('navUsuarios').style.display = 'none';
        this.toast('Desconectado com sucesso', 'warning');
        this.navigateTo('dashboard');
    },

    loadUserInfo() {
        const user = this.user;
        if (user) {
            document.getElementById('userInfo').style.display = 'flex';
            document.getElementById('authButtons').style.display = 'none';
            document.getElementById('userName').textContent = user.nome || 'Usuário';
            document.getElementById('userAvatar').textContent = user.nome?.charAt(0) || '👤';

            // Mostrar menu de usuários apenas para Admin
            if (user.role === 'Admin') {
                document.getElementById('navUsuarios').style.display = 'block';
            }
        }
    },

    // ============================================
    // MODAL
    // ============================================
    showModal(name) {
        document.getElementById(`modal${name.charAt(0).toUpperCase() + name.slice(1)}`).classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeModal(name) {
        document.getElementById(`modal${name.charAt(0).toUpperCase() + name.slice(1)}`).classList.remove('active');
        document.body.style.overflow = '';
    },

    // ============================================
    // TOAST
    // ============================================
    toast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;

        // Clear previous timeout
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }

        // Show
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto hide after 3s
        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
};

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', () => app.init());