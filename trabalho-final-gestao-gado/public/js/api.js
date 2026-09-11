/// <reference path="./types.ts" />
/**
 * API - Comunicação com o backend
 *
 * Fonte única da camada HTTP: todas as páginas MPA carregam este mesmo
 * arquivo compilado (public/js/api.js).
 */
// Em MPA, o front é servido pelo próprio Express, então um caminho relativo
// ("/api") resolve para o mesmo host/porta do front. Antes estava hardcoded
// como "http://localhost:3000/api", o que quebraria ao rodar em outra porta
// ou atrás de proxy.
const API_URL = '/api';
class Api {
    constructor() {
        this.token = localStorage.getItem('token');
    }
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }
    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }
    isAuthenticated() {
        return !!this.token;
    }
    async request(method, endpoint, body = null) {
        const url = `${API_URL}${endpoint}`;
        const options = { method, headers: this.getHeaders() };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(url, options);
        let data;
        try {
            data = await response.json();
        }
        catch {
            data = { error: 'Resposta inválida' };
        }
        return { data, status: response.status };
    }
    cleanParams(filters) {
        const clean = {};
        for (const key in filters) {
            const value = filters[key];
            if (value !== undefined && value !== null && value !== '') {
                clean[key] = String(value);
            }
        }
        return new URLSearchParams(clean).toString();
    }
    // ============================================
    // AUTH
    // ============================================
    async register(data) {
        return this.request('POST', '/auth/register', data);
    }
    async login(data) {
        return this.request('POST', '/auth/login', data);
    }
    // ============================================
    // USERS (Admin)
    // ============================================
    async getUsers() {
        return this.request('GET', '/users');
    }
    async getUser(id) {
        return this.request('GET', `/users/${id}`);
    }
    async createUser(data) {
        return this.request('POST', '/users', data);
    }
    async updateUser(id, data) {
        return this.request('PUT', `/users/${id}`, data);
    }
    async deleteUser(id) {
        return this.request('DELETE', `/users/${id}`);
    }
    async toggleUserStatus(id) {
        return this.request('PATCH', `/users/${id}/toggle-status`);
    }
    async resetUserPassword(id) {
        return this.request('POST', `/users/${id}/reset-password`);
    }
    // ============================================
    // ANIMAIS
    // ============================================
    async getAnimais(filters = {}) {
        const params = this.cleanParams(filters);
        const endpoint = params ? `/animais?${params}` : '/animais';
        return this.request('GET', endpoint);
    }
    async getAnimal(brinco) {
        return this.request('GET', `/animais/${brinco}`);
    }
    async getAnimalTree(brinco) {
        return this.request('GET', `/animais/${brinco}/tree`);
    }
    async createAnimal(data) {
        return this.request('POST', '/animais', data);
    }
    async updateAnimal(brinco, data) {
        return this.request('PUT', `/animais/${brinco}`, data);
    }
    async deleteAnimal(brinco) {
        return this.request('DELETE', `/animais/${brinco}`);
    }
    async getAnimalStats() {
        return this.request('GET', '/animais/stats');
    }
    async getMachosParaSelecao(excluirBrinco) {
        const endpoint = excluirBrinco ? `/animais/machos/selecao?excluir=${excluirBrinco}` : '/animais/machos/selecao';
        return this.request('GET', endpoint);
    }
    async getFemeasParaSelecao(excluirBrinco) {
        const endpoint = excluirBrinco ? `/animais/femeas/selecao?excluir=${excluirBrinco}` : '/animais/femeas/selecao';
        return this.request('GET', endpoint);
    }
    // ============================================
    // PRODUÇÕES
    // ============================================
    async getProducoes(filters = {}) {
        const params = this.cleanParams(filters);
        const endpoint = params ? `/producoes?${params}` : '/producoes';
        return this.request('GET', endpoint);
    }
    async getProducao(id) {
        return this.request('GET', `/producoes/${id}`);
    }
    async getProducoesByAnimal(brinco) {
        return this.request('GET', `/producoes/animal/${brinco}`);
    }
    async getUltimasProducoes(quantidade = 10) {
        return this.request('GET', `/producoes/ultimas/${quantidade}`);
    }
    async createProducao(data) {
        return this.request('POST', '/producoes', data);
    }
    async updateProducao(id, data) {
        return this.request('PUT', `/producoes/${id}`, data);
    }
    async deleteProducao(id) {
        return this.request('DELETE', `/producoes/${id}`);
    }
    async getProducaoStats() {
        return this.request('GET', '/producoes/stats');
    }
    async getTopVacas(limit = 5) {
        return this.request('GET', `/producoes/top-vacas?limit=${limit}`);
    }
    async getProducaoPorDia(dias = 7) {
        return this.request('GET', `/producoes/producao-dia?dias=${dias}`);
    }
    async getRelatorio(filters = {}) {
        const params = this.cleanParams(filters);
        const endpoint = params ? `/producoes/relatorio?${params}` : '/producoes/relatorio';
        return this.request('GET', endpoint);
    }
    // ============================================
    // RELATÓRIOS
    // ============================================
    async getRelatorioProducao(filters = {}) {
        const params = this.cleanParams(filters);
        const endpoint = params ? `/relatorios/producao?${params}` : '/relatorios/producao';
        return this.request('GET', endpoint);
    }
    async getRelatorioRebanho(filters = {}) {
        const params = this.cleanParams(filters);
        const endpoint = params ? `/relatorios/rebanho?${params}` : '/relatorios/rebanho';
        return this.request('GET', endpoint);
    }
    async getGraficosProducao(dias = 7, filters = {}) {
        const merged = { ...filters, dias };
        const params = this.cleanParams(merged);
        return this.request('GET', `/relatorios/graficos/producao?${params}`);
    }
    /**
     * Dispara o download de um relatório (PDF ou Excel) já autenticado.
     *
     * Por que não usar <a href> direto: a rota é protegida por Bearer token,
     * então não dá para simplesmente abrir numa nova aba. Aqui fazemos o fetch
     * com o header de auth, recebemos o blob e criamos um link temporário.
     */
    async baixarRelatorio(tipo, formato, filtros = {}) {
        const params = this.cleanParams(filtros);
        const url = `${API_URL}/relatorios/${tipo}/${formato}${params ? `?${params}` : ''}`;
        const response = await fetch(url, { headers: this.getHeaders() });
        if (!response.ok) {
            let msg = 'Falha ao exportar relatório';
            try {
                const body = await response.json();
                msg = body?.message || msg;
            }
            catch {
                /* resposta não era JSON */
            }
            throw new Error(msg);
        }
        const blob = await response.blob();
        const cd = response.headers.get('Content-Disposition') || '';
        const match = /filename=([^;]+)/.exec(cd);
        const filename = match ? match[1].replace(/"/g, '') : `relatorio.${formato === 'excel' ? 'xlsx' : 'pdf'}`;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(link.href);
    }
}
const api = new Api();
//# sourceMappingURL=api.js.map