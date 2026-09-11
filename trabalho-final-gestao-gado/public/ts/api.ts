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
  token: string | null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  async request<T = any>(method: string, endpoint: string, body: unknown = null): Promise<ApiResult<T>> {
    const url = `${API_URL}${endpoint}`;
    const options: RequestInit = { method, headers: this.getHeaders() };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    let data: ApiEnvelope<T>;
    try {
      data = await response.json();
    } catch {
      data = { error: 'Resposta inválida' };
    }

    return { data, status: response.status };
  }

  cleanParams(filters: Record<string, unknown>): string {
    const clean: Record<string, string> = {};
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
  async register(data: { nome: string; email: string; password: string; cpf: string; role?: Role }) {
    return this.request<{ user: Usuario; token: string }>('POST', '/auth/register', data);
  }

  async login(data: { email: string; password: string }) {
    return this.request<{ user: Usuario; token: string }>('POST', '/auth/login', data);
  }

  // ============================================
  // USERS (Admin)
  // ============================================
  async getUsers() {
    return this.request<Usuario[]>('GET', '/users');
  }

  async getUser(id: string) {
    return this.request<Usuario>('GET', `/users/${id}`);
  }

  async createUser(data: { nome: string; email: string; password: string; cpf: string; role?: Role }) {
    return this.request<Usuario>('POST', '/users', data);
  }

  async updateUser(id: string, data: Partial<Pick<Usuario, 'nome' | 'cpf' | 'role' | 'ativo'>>) {
    return this.request<Usuario>('PUT', `/users/${id}`, data);
  }

  async deleteUser(id: string) {
    return this.request<void>('DELETE', `/users/${id}`);
  }

  async toggleUserStatus(id: string) {
    return this.request<Usuario>('PATCH', `/users/${id}/toggle-status`);
  }

  async resetUserPassword(id: string) {
    return this.request<{ novaSenha: string; usuario: Usuario }>('POST', `/users/${id}/reset-password`);
  }

  // ============================================
  // ANIMAIS
  // ============================================
  async getAnimais(filters: Record<string, unknown> = {}) {
    const params = this.cleanParams(filters);
    const endpoint = params ? `/animais?${params}` : '/animais';
    return this.request<{
      animais: Animal[];
      total: number;
      totalFemea: number;
      totalMacho: number;
      pesoMedio: number;
    }>('GET', endpoint);
  }

  async getAnimal(brinco: number) {
    return this.request<Animal>('GET', `/animais/${brinco}`);
  }

  async getAnimalTree(brinco: number) {
    return this.request<ArvoreGenealogica>('GET', `/animais/${brinco}/tree`);
  }

  async createAnimal(data: Partial<Animal>) {
    return this.request<Animal>('POST', '/animais', data);
  }

  async updateAnimal(brinco: number, data: Partial<Animal>) {
    return this.request<Animal>('PUT', `/animais/${brinco}`, data);
  }

  async deleteAnimal(brinco: number) {
    return this.request<void>('DELETE', `/animais/${brinco}`);
  }

  async getAnimalStats() {
    return this.request('GET', '/animais/stats');
  }

  async getMachosParaSelecao(excluirBrinco?: number) {
    const endpoint = excluirBrinco ? `/animais/machos/selecao?excluir=${excluirBrinco}` : '/animais/machos/selecao';
    return this.request<Pick<Animal, 'brinco' | 'nome' | 'sexo'>[]>('GET', endpoint);
  }

  async getFemeasParaSelecao(excluirBrinco?: number) {
    const endpoint = excluirBrinco ? `/animais/femeas/selecao?excluir=${excluirBrinco}` : '/animais/femeas/selecao';
    return this.request<Pick<Animal, 'brinco' | 'nome' | 'sexo'>[]>('GET', endpoint);
  }

  // ============================================
  // PRODUÇÕES
  // ============================================
  async getProducoes(filters: Record<string, unknown> = {}) {
    const params = this.cleanParams(filters);
    const endpoint = params ? `/producoes?${params}` : '/producoes';
    return this.request<{ producoes: ProducaoLeite[] }>('GET', endpoint);
  }

  async getProducao(id: number) {
    return this.request<ProducaoLeite>('GET', `/producoes/${id}`);
  }

  async getProducoesByAnimal(brinco: number) {
    return this.request<ProducaoLeite[]>('GET', `/producoes/animal/${brinco}`);
  }

  async getUltimasProducoes(quantidade = 10) {
    return this.request<ProducaoLeite[]>('GET', `/producoes/ultimas/${quantidade}`);
  }

  async createProducao(data: Partial<ProducaoLeite>) {
    return this.request<ProducaoLeite>('POST', '/producoes', data);
  }

  async updateProducao(id: number, data: Partial<ProducaoLeite>) {
    return this.request<ProducaoLeite>('PUT', `/producoes/${id}`, data);
  }

  async deleteProducao(id: number) {
    return this.request<void>('DELETE', `/producoes/${id}`);
  }

  async getProducaoStats() {
    return this.request('GET', '/producoes/stats');
  }

  async getTopVacas(limit = 5) {
    return this.request<{ nome: string; producao: number; total?: number }[]>(
      'GET',
      `/producoes/top-vacas?limit=${limit}`
    );
  }

  async getProducaoPorDia(dias = 7) {
    return this.request<{ data: string; total: number }[]>('GET', `/producoes/producao-dia?dias=${dias}`);
  }

  async getRelatorio(filters: Record<string, unknown> = {}) {
    const params = this.cleanParams(filters);
    const endpoint = params ? `/producoes/relatorio?${params}` : '/producoes/relatorio';
    return this.request('GET', endpoint);
  }

  // ============================================
  // RELATÓRIOS
  // ============================================
  async getRelatorioProducao(filters: Record<string, unknown> = {}) {
    const params = this.cleanParams(filters);
    const endpoint = params ? `/relatorios/producao?${params}` : '/relatorios/producao';
    return this.request<{ producoes: ProducaoLeite[]; stats?: { totalLitros: number } }>('GET', endpoint);
  }

  async getRelatorioRebanho(filters: Record<string, unknown> = {}) {
    const params = this.cleanParams(filters);
    const endpoint = params ? `/relatorios/rebanho?${params}` : '/relatorios/rebanho';
    return this.request('GET', endpoint);
  }

  async getGraficosProducao(dias = 7) {
    return this.request<{ data: string; total: number }[]>('GET', `/relatorios/graficos/producao?dias=${dias}`);
  }
}

const api = new Api();
