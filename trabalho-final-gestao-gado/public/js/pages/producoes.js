/// <reference path="../types.ts" />
/// <reference path="../api.ts" />
/// <reference path="../components.ts" />
/**
 * Página Produções (/app/producoes.html)
 */
(function () {
    function el(id) {
        return document.getElementById(id);
    }
    const app = {
        user: null,
        init() {
            if (!api.isAuthenticated()) {
                window.location.href = '/';
                return;
            }
            this.loadUserInfo();
            el('producaoForm').addEventListener('submit', e => {
                e.preventDefault();
                this.saveProducao();
            });
            this.loadProducoes();
        },
        loadUserInfo() {
            try {
                const token = api.token;
                if (token) {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    this.user = { nome: payload.nome || 'Usuário', email: payload.email || '', role: payload.role || 'Cliente' };
                    Components.renderNavbar('producoes', this.user, 'mpa');
                }
            }
            catch (e) {
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
        async loadProducoes() {
            const container = el('producoesContent');
            container.innerHTML = `<div class="loading"><div class="spinner"></div><p>Carregando produções...</p></div>`;
            try {
                const response = await api.getProducoes();
                let producoes = response.data?.data?.producoes || [];
                producoes = producoes.map(p => ({
                    ...p,
                    litros: typeof p.litros === 'number' ? p.litros : parseFloat(String(p.litros)) || 0
                }));
                if (!producoes || producoes.length === 0) {
                    container.innerHTML = '<p class="text-muted text-center">Nenhuma produção registrada.</p>';
                    return;
                }
                const totalLitros = producoes.reduce((sum, p) => sum + p.litros, 0);
                const periodoLabel = {
                    Manha: '<i class="fa-solid fa-cloud-sun"></i> Manhã',
                    Tarde: '<i class="fa-solid fa-sun"></i> Tarde',
                    Noite: '<i class="fa-solid fa-moon"></i> Noite'
                };
                let html = `<div class="table-responsive"><table><thead><tr><th>ID</th><th>Animal</th><th>Data</th><th>Período</th><th>Litros</th><th>Ações</th></tr></thead><tbody>`;
                producoes.forEach(p => {
                    const periodo = periodoLabel[p.periodo] || p.periodo;
                    html += `<tr><td>${p.id}</td><td>${p.animal?.nome || p.animal_brinco}</td><td>${new Date(p.data_coleta).toLocaleDateString()}</td><td>${periodo}</td><td><strong>${p.litros.toFixed(1)} L</strong></td><td><div class="actions"><button class="btn btn-sm btn-primary" onclick="app.editarProducao(${p.id})"><i class="fa-solid fa-pen"></i></button><button class="btn btn-sm btn-danger" onclick="app.deletarProducao(${p.id})"><i class="fa-solid fa-trash"></i></button></div></td></tr>`;
                });
                html += `</tbody><tfoot><tr><td colspan="4" class="table-footer-label">Total:</td><td class="table-footer-value">${totalLitros.toFixed(1)} L</td><td></td></tr></tfoot></table></div>`;
                container.innerHTML = html;
            }
            catch (error) {
                container.innerHTML = `<p class="text-muted text-center">Erro ao carregar produções: ${error.message}</p>`;
            }
        },
        async novaProducao() {
            try {
                const response = await api.getAnimais();
                const animais = response.data?.data?.animais || [];
                const femeas = animais.filter(a => a.sexo === 'F' && a.ativo);
                const select = el('producaoAnimal');
                select.innerHTML =
                    '<option value="">Selecione...</option>' +
                        femeas.map(a => `<option value="${a.brinco}">${a.brinco} - ${a.nome}</option>`).join('');
                el('modalProducaoTitle').innerHTML = '<i class="fa-solid fa-droplet"></i> Nova Produção';
                el('producaoSubmitBtn').textContent = 'Salvar';
                el('producaoEditId').value = '';
                el('producaoForm').reset();
                el('producaoData').value = new Date().toISOString().split('T')[0];
                this.showModal('producao');
            }
            catch (error) {
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
                const select = el('producaoAnimal');
                select.innerHTML =
                    '<option value="">Selecione...</option>' +
                        femeas
                            .map(a => `<option value="${a.brinco}" ${a.brinco === producao.animal_brinco ? 'selected' : ''}>${a.brinco} - ${a.nome}</option>`)
                            .join('');
                el('modalProducaoTitle').innerHTML = `<i class="fa-solid fa-pen"></i> Editando #${id}`;
                el('producaoSubmitBtn').textContent = 'Atualizar';
                el('producaoEditId').value = String(id);
                el('producaoData').value = producao.data_coleta?.split('T')[0] || '';
                el('producaoLitros').value = String(producao.litros);
                el('producaoPeriodo').value = producao.periodo;
                this.showModal('producao');
            }
            catch (error) {
                this.toast('Erro ao carregar produção', 'error');
            }
        },
        async saveProducao() {
            const isEdit = !!el('producaoEditId').value;
            const id = el('producaoEditId').value;
            const data = {
                animal_brinco: parseInt(el('producaoAnimal').value),
                data_coleta: el('producaoData').value,
                litros: parseFloat(el('producaoLitros').value),
                periodo: el('producaoPeriodo').value
            };
            if (!data.animal_brinco) {
                this.toast('Selecione um animal', 'error');
                return;
            }
            if (isNaN(data.litros) || data.litros < 0) {
                this.toast('A quantidade de litros não pode ser negativa', 'error');
                return;
            }
            try {
                const response = isEdit ? await api.updateProducao(parseInt(id), data) : await api.createProducao(data);
                if (response.status >= 200 && response.status < 300) {
                    this.toast(isEdit ? 'Produção atualizada!' : 'Produção registrada!', 'success');
                    this.closeModal('producao');
                    this.loadProducoes();
                }
                else {
                    this.toast(response.data?.message || 'Erro ao salvar', 'error');
                }
            }
            catch (error) {
                this.toast('Erro ao salvar produção', 'error');
            }
        },
        async deletarProducao(id) {
            if (!confirm(`Excluir produção ${id}?`))
                return;
            try {
                const response = await api.deleteProducao(id);
                if (response.status >= 200 && response.status < 300) {
                    this.toast('Produção excluída!', 'success');
                    this.loadProducoes();
                }
                else {
                    this.toast(response.data?.message || 'Erro ao excluir', 'error');
                }
            }
            catch (error) {
                this.toast('Erro ao excluir produção', 'error');
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
//# sourceMappingURL=producoes.js.map