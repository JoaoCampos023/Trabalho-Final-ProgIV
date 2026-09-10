/// <reference path="../types.ts" />
/// <reference path="../api.ts" />
/// <reference path="../components.ts" />
/**
 * Página Usuários (/app/usuarios.html) — acesso Admin
 */

(function () {
    interface UsuariosAppState {
        user: UsuarioLogado | null;
        toastTimeout?: number;
        init(): void;
        loadUserInfo(): void;
        logout(): void;
        toast(message: string, type?: string): void;
        loadUsuarios(): Promise<void>;
        toggleUserStatus(id: string): Promise<void>;
        deletarUsuario(id: string): Promise<void>;
    }

    function el<T extends HTMLElement = HTMLElement>(id: string): T {
        return document.getElementById(id) as T;
    }

    const app: UsuariosAppState = {
        user: null,

        init() {
            if (!api.isAuthenticated()) {
                window.location.href = '/';
                return;
            }
            this.loadUserInfo();
            this.loadUsuarios();
        },

        loadUserInfo() {
            try {
                const token = api.token;
                if (token) {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    this.user = { nome: payload.nome || 'Usuário', email: payload.email || '', role: payload.role || 'Cliente' };
                    Components.renderNavbar('usuarios', this.user, 'mpa');
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
                    html += `<tr><td><strong>${u.nome}</strong></td><td>${u.email}</td><td>${role}</td><td>${status}</td><td><div class="actions"><button class="btn btn-sm btn-warning" onclick="app.toggleUserStatus('${u.id}')"><i class="fa-solid fa-arrows-rotate"></i></button><button class="btn btn-sm btn-danger" onclick="app.deletarUsuario('${u.id}')"><i class="fa-solid fa-trash"></i></button></div></td></tr>`;
                });
                html += `</tbody></table></div>`;
                container.innerHTML = html;
            } catch (error: any) {
                container.innerHTML = `<p class="text-muted text-center">Erro ao carregar usuários: ${error.message}</p>`;
            }
        },

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
        }
    };

    document.addEventListener('DOMContentLoaded', () => app.init());
})();
