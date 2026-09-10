/// <reference path="./types.ts" />
/**
 * API - Comunicação com o backend
 *
 * Fonte única da camada HTTP: antes desta migração cada página tinha sua
 * própria cópia (parcial) desta classe declarada inline. Agora todas as
 * páginas carregam este mesmo arquivo compilado (public/js/api.js).
 */
const API_URL = 'http://localhost:3000/api';
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
    async getGraficosProducao(dias = 7) {
        return this.request('GET', `/relatorios/graficos/producao?dias=${dias}`);
    }
}
const api = new Api();
//# sourceMappingURL=api.js.map