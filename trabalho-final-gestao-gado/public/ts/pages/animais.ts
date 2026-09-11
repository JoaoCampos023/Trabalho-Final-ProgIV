/// <reference path="../types.ts" />
/// <reference path="../api.ts" />
/// <reference path="../components.ts" />
/**
 * Página Rebanho (/app/animais.html)
 */

(function () {
  interface AnimaisAppState {
    IDADE_MAXIMA_ANOS: number;
    user: UsuarioLogado | null;
    toastTimeout?: number;
    filterNomeDebounce?: number;
    init(): void;
    limitarDataNascimento(): void;
    validarDataNascimento(dataStr: string): string | null;
    loadUserInfo(): void;
    logout(): void;
    toast(message: string, type?: string): void;
    debouncedLoadAnimais(): void;
    sortCampo: string;
    sortDir: SortDir;
    ultimoResultado: {
      animais: Animal[];
      stats: any;
      racas: string[];
      searchNome: string;
      sexo: string;
      raca: string;
      status: string;
    } | null;
    ordenarPor(campo: string): void;
    renderAnimais(): void;
    loadAnimais(): Promise<void>;
    carregarSelectsPaiMae(
      excluirBrinco?: number,
      paiSelecionado?: number | null,
      maeSelecionado?: number | null
    ): Promise<void>;
    novoAnimal(): void;
    atualizarLabelStatusAnimal(): void;
    editarAnimal(brinco: number): Promise<void>;
    saveAnimal(): Promise<void>;
    deletarAnimal(brinco: number): Promise<void>;
    verArvore(brinco: number): Promise<void>;
    showModal(name: string): void;
    closeModal(name: string): void;
  }

  function el<T extends HTMLElement = HTMLElement>(id: string): T {
    return document.getElementById(id) as T;
  }

  const app: AnimaisAppState = {
    IDADE_MAXIMA_ANOS: 50,
    user: null,
    sortCampo: 'brinco',
    sortDir: 'asc',
    ultimoResultado: null,

    init() {
      if (!api.isAuthenticated()) {
        window.location.href = '/';
        return;
      }
      this.loadUserInfo();
      el<HTMLFormElement>('animalForm').addEventListener('submit', e => {
        e.preventDefault();
        this.saveAnimal();
      });
      this.limitarDataNascimento();
      this.loadAnimais();
    },

    // Limita o seletor de calendário: não permite data futura nem uma
    // idade acima de IDADE_MAXIMA_ANOS (feedback imediato na UI).
    limitarDataNascimento() {
      const input = document.getElementById('animalDataNascimento') as HTMLInputElement | null;
      if (!input) return;
      const limite = new Date();
      limite.setFullYear(limite.getFullYear() - this.IDADE_MAXIMA_ANOS);
      input.max = Components.dataLocalIso();
      input.min = Components.dataParaIsoLocal(limite);
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

    loadUserInfo() {
      try {
        const token = api.token;
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.user = { nome: payload.nome || 'Usuário', email: payload.email || '', role: payload.role || 'Cliente' };
          Components.renderNavbar('animais', this.user, 'mpa');
        }
      } catch (e) {
        console.error(e);
      }
    },

    logout() {
      api.clearToken();
      this.toast('Desconectado!', 'warning');
      setTimeout(() => (window.location.href = '/'), 500);
    },

    toast(message, type = 'info') {
      const toast = el('toast');
      toast.textContent = message;
      toast.className = `toast ${type}`;
      setTimeout(() => toast.classList.add('show'), 10);
      clearTimeout(this.toastTimeout);
      this.toastTimeout = window.setTimeout(() => toast.classList.remove('show'), 3000);
    },

    debouncedLoadAnimais() {
      clearTimeout(this.filterNomeDebounce);
      this.filterNomeDebounce = window.setTimeout(() => this.loadAnimais(), 400);
    },

    // Clicar no título de uma coluna ordena por ela; clicar de novo inverte a ordem.
    // Reordena a partir dos dados já carregados (sem novo fetch nem spinner),
    // evitando a "piscada" na tela que acontecia ao recarregar tudo do zero.
    ordenarPor(campo) {
      if (this.sortCampo === campo) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortCampo = campo;
        this.sortDir = 'asc';
      }
      this.renderAnimais();
    },

    // Renderiza a tabela a partir do último resultado buscado da API (this.ultimoResultado),
    // sem refazer a requisição — usado pela ordenação, que só precisa reordenar em memória.
    renderAnimais() {
      const resultado: AnimaisAppState['ultimoResultado'] = this.ultimoResultado;
      if (!resultado) return;
      const { animais: animaisOriginais, stats, racas, searchNome, sexo, raca, status } = resultado;
      const container = el('animaisContent');
      const animais = Components.ordenarLista(animaisOriginais, this.sortCampo, this.sortDir);

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
                    <div class="filter-group"><label>Raça</label><select id="filterRaca" onchange="app.loadAnimais()"><option value="">Todas</option>${racas.map((r: string) => `<option value="${r}" ${raca === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
                    <div class="filter-group"><label>Status</label><select id="filterStatus" onchange="app.loadAnimais()"><option value="ativos" ${status === 'ativos' ? 'selected' : ''}>Ativos</option><option value="inativos" ${status === 'inativos' ? 'selected' : ''}>Inativos</option><option value="todos" ${status === 'todos' ? 'selected' : ''}>Todos</option></select></div>
                    <div class="filter-actions"><button class="btn btn-secondary btn-sm btn-square" title="Limpar filtros" onclick="clearTimeout(app.filterNomeDebounce);document.getElementById('filterNome').value='';document.getElementById('filterSexo').value='';document.getElementById('filterRaca').value='';document.getElementById('filterStatus').value='ativos';app.loadAnimais();"><i class="fa-solid fa-xmark"></i></button></div>
                </div>
            `;
      if (!animais || animais.length === 0) {
        html += `<p class="text-muted text-center">Nenhum animal cadastrado.</p>`;
      } else {
        const th = (label: string, campo: string) =>
          Components.thOrdenavel(label, campo, this.sortCampo, this.sortDir, `app.ordenarPor('${campo}')`);
        html += `<div class="table-responsive"><table><thead><tr>${th('Brinco', 'brinco')}${th('Nome', 'nome')}${th('Sexo', 'sexo')}${th('Raça', 'raca')}${th('Peso', 'peso')}${th('Idade', 'idade')}${th('Status', 'ativo')}<th>Ações</th></tr></thead><tbody>`;
        animais.forEach(a => {
          const sexoLabel =
            a.sexo === 'F' ? '<i class="fa-solid fa-venus"></i> Fêmea' : '<i class="fa-solid fa-mars"></i> Macho';
          const statusBadge = a.ativo
            ? '<span class="badge badge-success">Ativo</span>'
            : '<span class="badge badge-danger">Inativo</span>';
          html += `<tr><td><strong>${a.brinco}</strong></td><td>${a.nome}</td><td>${sexoLabel}</td><td>${a.raca || 'N/A'}</td><td>${a.peso.toFixed(1)} kg</td><td>${a.idade || 0} anos</td><td>${statusBadge}</td><td><div class="actions"><button class="btn btn-sm btn-primary" onclick="app.editarAnimal(${a.brinco})"><i class="fa-solid fa-pen"></i></button><button class="btn btn-sm btn-danger" onclick="app.deletarAnimal(${a.brinco})"><i class="fa-solid fa-trash"></i></button><button class="btn btn-sm btn-info" onclick="app.verArvore(${a.brinco})"><i class="fa-solid fa-sitemap"></i></button></div></td></tr>`;
        });
        html += `</tbody></table></div>`;
      }
      container.innerHTML = html;

      // Restaura o foco no campo de nome após o filtro automático re-renderizar a tabela.
      const nomeInputAtual = document.getElementById('filterNome') as HTMLInputElement | null;
      if (nomeInputAtual && (this as any)._mantendoFocoNome) {
        nomeInputAtual.focus();
        nomeInputAtual.setSelectionRange((this as any)._cursorPos, (this as any)._cursorPos);
      }
    },

    async loadAnimais() {
      // IMPORTANTE: ler os valores dos filtros ANTES de sobrescrever o container
      // com o spinner de carregamento (os inputs de filtro vivem dentro dele e
      // seriam destruídos antes de serem lidos).
      const searchNome = (document.getElementById('filterNome') as HTMLInputElement | null)?.value || '';
      const sexo = (document.getElementById('filterSexo') as HTMLSelectElement | null)?.value || '';
      const raca = (document.getElementById('filterRaca') as HTMLSelectElement | null)?.value || '';
      const status = (document.getElementById('filterStatus') as HTMLSelectElement | null)?.value || 'ativos';

      // Preserva o foco e a posição do cursor no campo de nome,
      // já que o filtro agora dispara a cada digitação (com debounce).
      const nomeInputAtual = document.getElementById('filterNome') as HTMLInputElement | null;
      (this as any)._mantendoFocoNome = document.activeElement === nomeInputAtual;
      (this as any)._cursorPos = (this as any)._mantendoFocoNome ? nomeInputAtual!.selectionStart : null;

      const container = el('animaisContent');
      container.innerHTML = `<div class="loading"><div class="spinner"></div><p>Carregando animais...</p></div>`;
      try {
        const response = await api.getAnimais({ searchNome, sexo, raca, status });
        const data = response.data?.data;
        let animais: Animal[] = data?.animais || [];

        animais = animais.map(a => ({
          ...a,
          brinco: typeof a.brinco === 'number' ? a.brinco : parseInt(String(a.brinco)) || 0,
          peso: typeof a.peso === 'number' ? a.peso : parseFloat(String(a.peso)) || 0,
          idade: typeof a.idade === 'number' ? a.idade : parseInt(String(a.idade)) || 0
        }));

        const stats = {
          total: data?.total || 0,
          totalFemea: data?.totalFemea || 0,
          totalMacho: data?.totalMacho || 0,
          pesoMedio: data?.pesoMedio || 0
        };
        const racas = [...new Set(animais.map(a => a.raca).filter((r): r is string => !!r))];

        this.ultimoResultado = { animais, stats, racas, searchNome, sexo, raca, status };
        this.renderAnimais();
      } catch (error: any) {
        container.innerHTML = `<p class="text-muted text-center">Erro ao carregar animais: ${error.message}</p>`;
      }
    },

    // Popula os <select> de brinco do pai/mãe com os machos/fêmeas disponíveis
    // (excluindo o próprio animal, no caso de edição) e pré-seleciona o valor atual.
    async carregarSelectsPaiMae(excluirBrinco, paiSelecionado, maeSelecionado) {
      try {
        const [resMachos, resFemeas] = await Promise.all([
          api.getMachosParaSelecao(excluirBrinco),
          api.getFemeasParaSelecao(excluirBrinco)
        ]);
        const machos = resMachos.data?.data || [];
        const femeas = resFemeas.data?.data || [];

        const selectPai = el<HTMLSelectElement>('animalBrincoPai');
        selectPai.innerHTML =
          '<option value="">Nenhum</option>' +
          machos
            .map(
              m =>
                `<option value="${m.brinco}" ${m.brinco === paiSelecionado ? 'selected' : ''}>${m.brinco} - ${m.nome}</option>`
            )
            .join('');

        const selectMae = el<HTMLSelectElement>('animalBrincoMae');
        selectMae.innerHTML =
          '<option value="">Nenhuma</option>' +
          femeas
            .map(
              f =>
                `<option value="${f.brinco}" ${f.brinco === maeSelecionado ? 'selected' : ''}>${f.brinco} - ${f.nome}</option>`
            )
            .join('');
      } catch (error) {
        this.toast('Erro ao carregar lista de pai/mãe', 'error');
      }
    },

    // Atualiza o texto ao lado do switch conforme o estado marcado/desmarcado.
    atualizarLabelStatusAnimal() {
      const checkbox = document.getElementById('animalAtivo') as HTMLInputElement | null;
      const label = document.getElementById('animalAtivoLabel');
      if (checkbox && label) {
        label.textContent = checkbox.checked ? 'Ativo' : 'Inativo';
      }
    },

    async novoAnimal() {
      el('modalAnimalTitle').innerHTML = '<i class="fa-solid fa-cow"></i> Novo Animal';
      el('animalSubmitBtn').textContent = 'Salvar';
      el<HTMLInputElement>('animalEditBrinco').value = '';
      el<HTMLInputElement>('animalBrinco').disabled = false;
      el<HTMLFormElement>('animalForm').reset();
      el<HTMLInputElement>('animalAtivo').checked = true;
      this.atualizarLabelStatusAnimal();
      await this.carregarSelectsPaiMae();
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
        el<HTMLInputElement>('animalAtivo').checked = !!animal.ativo;
        this.atualizarLabelStatusAnimal();
        await this.carregarSelectsPaiMae(animal.brinco, animal.brinco_pai, animal.brinco_mae);
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
        ativo: el<HTMLInputElement>('animalAtivo').checked,
        brinco_pai: el<HTMLSelectElement>('animalBrincoPai').value
          ? parseInt(el<HTMLSelectElement>('animalBrincoPai').value)
          : undefined,
        brinco_mae: el<HTMLSelectElement>('animalBrincoMae').value
          ? parseInt(el<HTMLSelectElement>('animalBrincoMae').value)
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
        const html = `
                    ${Components.renderArvoreGenealogica(data)}
                    <div class="tree-back-action"><button class="btn btn-secondary btn-sm" onclick="app.loadAnimais()"><i class="fa-solid fa-arrow-left"></i> Voltar para a lista</button></div>
                `;
        el('animaisContent').innerHTML = html;
      } catch (error) {
        this.toast('Erro ao carregar árvore', 'error');
      }
    },

    showModal(name) {
      el(`modal${name.charAt(0).toUpperCase() + name.slice(1)}`).classList.add('active');
      document.body.style.overflow = 'hidden';
    },

    closeModal(name) {
      el(`modal${name.charAt(0).toUpperCase() + name.slice(1)}`).classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  document.addEventListener('DOMContentLoaded', () => app.init());
})();
