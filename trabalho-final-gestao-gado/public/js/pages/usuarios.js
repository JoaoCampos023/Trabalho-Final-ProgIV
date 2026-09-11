/// <reference path="../types.ts" />
/// <reference path="../api.ts" />
/// <reference path="../components.ts" />
/**
 * Página Usuários (/app/usuarios.html) — acesso Admin.
 *
 * Funcionalidades:
 * - Lista, ordena e filtra usuários.
 * - Edita nome, CPF, perfil (Admin/Cliente) e status.
 * - Alterna status (ativar/desativar), reseta senha e exclui.
 * - Bloqueia ações perigosas na UI (excluir/desativar a si mesmo,
 *   mexer no admin principal), espelhando as regras do backend.
 *
 * IMPORTANTE: `(window as any).app = app` no final é o que expõe os métodos
 * para os `onclick="app.xxx()"` inline do HTML. Sem isso, nenhum botão
 * funciona (foi exatamente o bug anterior).
 */
(function () {
    function el(id) {
        return document.getElementById(id);
    }
    const app = {
        user: null,
        userFull: null,
        sortCampo: 'nome',
        sortDir: 'asc',
        ultimoResultado: null,
        init() {
            if (!api.isAuthenticated()) {
                window.location.href = '/';
                return;
            }
            this.loadUserInfo().then(() => this.loadUsuarios());
        },
        /**
         * Decodifica o JWT para saber quem está logado (nome, email, role, id).
         * Precisamos do `id` para bloquear auto-exclusão na UI — o backend
         * também bloqueia, mas mostrar o botão vermelho desabilitado é UX melhor
         * do que deixar clicar e receber erro.
         */
        async loadUserInfo() {
            try {
                const token = api.token;
                if (!token)
                    return;
                const payload = JSON.parse(atob(token.split('.')[1]));
                this.user = {
                    nome: payload.nome || 'Usuário',
                    email: payload.email || '',
                    role: payload.role || 'Cliente'
                };
                // Guardamos o payload completo para ter acesso ao `id`.
                this.userFull = payload;
                Components.renderNavbar('usuarios', this.user, 'mpa');
            }
            catch (e) {
                console.error(e);
            }
        },
        toast(message, type = 'info') {
            const toast = el('toast');
            toast.textContent = message;
            toast.className = `toast ${type}`;
            setTimeout(() => toast.classList.add('show'), 10);
            clearTimeout(this.toastTimeout);
            this.toastTimeout = window.setTimeout(() => toast.classList.remove('show'), 3000);
        },
        /** True se o usuário é o admin principal (e-mail do seed). */
        ehAdminPrincipal(u) {
            return u.email.toLowerCase() === 'admin@gmail.com';
        },
        /** True se o usuário da linha é o admin logado. */
        ehEuMesmo(u) {
            return !!this.userFull && u.id === this.userFull.id;
        },
        ordenarPor(campo) {
            if (this.sortCampo === campo) {
                this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
            }
            else {
                this.sortCampo = campo;
                this.sortDir = 'asc';
            }
            this.renderUsuarios();
        },
        renderUsuarios() {
            // Anotação explícita em `resultado` e no `u` do forEach: sem isso, com
            // strict:false no tsconfig.frontend.json, o TS infere `unknown[]` do
            // retorno de ordenarLista e o forEach recebe `u: unknown`. Anotar é
            // mais barato que caçar a raiz da inferência em código de front.
            const resultado = this.ultimoResultado;
            if (!resultado)
                return;
            const container = el('usuariosContent');
            if (resultado.length === 0) {
                container.innerHTML = '<p class="text-muted text-center">Nenhum usuário cadastrado.</p>';
                return;
            }
            const users = Components.ordenarLista(resultado, this.sortCampo, this.sortDir);
            const th = (label, campo) => Components.thOrdenavel(label, campo, this.sortCampo, this.sortDir, `app.ordenarPor('${campo}')`);
            let html = `<div class="table-responsive"><table><thead><tr>${th('Nome', 'nome')}${th('Email', 'email')}${th('Perfil', 'role')}${th('Status', 'ativo')}<th>Ações</th></tr></thead><tbody>`;
            users.forEach((u) => {
                const role = u.role === 'Admin'
                    ? '<span class="badge badge-danger">Admin</span>'
                    : '<span class="badge badge-info">Cliente</span>';
                const status = u.ativo
                    ? '<span class="badge badge-success">Ativo</span>'
                    : '<span class="badge badge-danger">Inativo</span>';
                // Regras de UI espelhando o backend:
                // - Admin principal: nada de editar role, desativar, excluir ou resetar.
                // - Eu mesmo: nada de desativar ou excluir.
                // - Demais: tudo liberado.
                const ehPrincipal = this.ehAdminPrincipal(u);
                const ehEu = this.ehEuMesmo(u);
                const podeEditar = !ehPrincipal || ehEu;
                const podeToggle = !ehPrincipal && !ehEu;
                const podeExcluir = !ehPrincipal && !ehEu;
                const podeResetar = !ehPrincipal;
                const btn = (habilitado, classes, titulo, onclick, icone) => habilitado
                    ? `<button class="btn btn-sm ${classes}" title="${titulo}" onclick="${onclick}"><i class="fa-solid ${icone}"></i></button>`
                    : `<button class="btn btn-sm ${classes}" title="${titulo} (bloqueado)" disabled style="opacity:.4;cursor:not-allowed"><i class="fa-solid ${icone}"></i></button>`;
                html += `<tr>
          <td><strong>${u.nome}</strong>${ehEu ? ' <span class="badge badge-primary" title="Você">você</span>' : ''}</td>
          <td>${u.email}</td>
          <td>${role}</td>
          <td>${status}</td>
          <td><div class="actions">
            ${btn(podeEditar, 'btn-primary', 'Editar usuário', `app.abrirEdicao('${u.id}')`, 'fa-pen')}
            ${btn(podeToggle, 'btn-warning', u.ativo ? 'Desativar' : 'Ativar', `app.toggleUserStatus('${u.id}')`, 'fa-arrows-rotate')}
            ${btn(podeResetar, 'btn-info', 'Resetar senha', `app.resetarSenha('${u.id}')`, 'fa-key')}
            ${btn(podeExcluir, 'btn-danger', 'Excluir usuário', `app.deletarUsuario('${u.id}')`, 'fa-trash')}
          </div></td>
        </tr>`;
            });
            html += `</tbody></table></div>`;
            container.innerHTML = html;
        },
        async loadUsuarios() {
            const container = el('usuariosContent');
            container.innerHTML = `<div class="loading"><div class="spinner"></div><p>Carregando usuários...</p></div>`;
            try {
                const response = await api.getUsers();
                const users = response.data?.data || [];
                this.ultimoResultado = users;
                this.renderUsuarios();
            }
            catch (error) {
                container.innerHTML = `<p class="text-muted text-center">Erro ao carregar usuários: ${error.message}</p>`;
            }
        },
        // ============================================
        // EDIÇÃO
        // ============================================
        async abrirEdicao(id) {
            try {
                const response = await api.getUser(id);
                const u = response.data?.data;
                if (!u) {
                    this.toast('Usuário não encontrado', 'error');
                    return;
                }
                const ehPrincipal = this.ehAdminPrincipal(u);
                el('modalUsuarioTitle').innerHTML = '<i class="fa-solid fa-pen"></i> Editar Usuário';
                el('usuarioEditId').value = u.id;
                el('usuarioNome').value = u.nome;
                el('usuarioEmail').value = u.email;
                el('usuarioCpf').value = u.cpf || '';
                el('usuarioRole').value = u.role;
                el('usuarioAtivo').checked = !!u.ativo;
                // Trava os campos do admin principal: a role não pode sair de Admin
                // e o status não pode virar Inativo. É a mesma regra do backend.
                if (ehPrincipal) {
                    el('usuarioRole').disabled = true;
                    el('usuarioAtivo').disabled = true;
                    el('usuarioAvisoPrincipal').style.display = 'block';
                }
                else {
                    el('usuarioRole').disabled = false;
                    el('usuarioAtivo').disabled = false;
                    el('usuarioAvisoPrincipal').style.display = 'none';
                }
                // E-mail não é editável (é o login) — desabilita sempre.
                el('usuarioEmail').disabled = true;
                this.showModal('usuario');
            }
            catch (error) {
                this.toast(error.message || 'Erro ao abrir edição', 'error');
            }
        },
        async salvarEdicao() {
            const id = el('usuarioEditId').value;
            if (!id)
                return;
            const data = {
                nome: el('usuarioNome').value.trim(),
                cpf: el('usuarioCpf').value.trim() || undefined
            };
            // Só manda role/ativo se os campos estiverem habilitados — assim o
            // admin principal (que tem os campos travados) não tenta alterá-los.
            if (!el('usuarioRole').disabled) {
                data.role = el('usuarioRole').value;
            }
            if (!el('usuarioAtivo').disabled) {
                data.ativo = el('usuarioAtivo').checked;
            }
            if (!data.nome) {
                this.toast('O nome é obrigatório', 'error');
                return;
            }
            try {
                const response = await api.updateUser(id, data);
                if (response.status >= 200 && response.status < 300) {
                    this.toast('Usuário atualizado!', 'success');
                    this.closeModal('usuario');
                    this.loadUsuarios();
                }
                else {
                    this.toast(response.data?.message || 'Erro ao atualizar', 'error');
                }
            }
            catch (error) {
                this.toast(error.message || 'Erro ao atualizar usuário', 'error');
            }
        },
        // ============================================
        // AÇÕES
        // ============================================
        async toggleUserStatus(id) {
            try {
                const response = await api.toggleUserStatus(id);
                if (response.status >= 200 && response.status < 300) {
                    this.toast('Status alterado!', 'success');
                    this.loadUsuarios();
                }
                else {
                    this.toast(response.data?.message || 'Erro ao alterar', 'error');
                }
            }
            catch (error) {
                this.toast(error.message || 'Erro ao alterar status', 'error');
            }
        },
        async deletarUsuario(id) {
            if (!confirm('Excluir este usuário? Esta ação não pode ser desfeita.'))
                return;
            try {
                const response = await api.deleteUser(id);
                if (response.status >= 200 && response.status < 300) {
                    this.toast('Usuário excluído!', 'success');
                    this.loadUsuarios();
                }
                else {
                    this.toast(response.data?.message || 'Erro ao excluir', 'error');
                }
            }
            catch (error) {
                this.toast(error.message || 'Erro ao excluir usuário', 'error');
            }
        },
        async resetarSenha(id) {
            if (!confirm('Resetar a senha deste usuário? Uma nova senha será gerada.'))
                return;
            try {
                const response = await api.resetUserPassword(id);
                if (response.status >= 200 && response.status < 300) {
                    const nova = response.data?.data?.novaSenha;
                    if (nova) {
                        alert(`Nova senha gerada:\n\n${nova}\n\nCopie e envie ao usuário.`);
                    }
                    this.toast('Senha resetada!', 'success');
                    this.loadUsuarios();
                }
                else {
                    this.toast(response.data?.message || 'Erro ao resetar senha', 'error');
                }
            }
            catch (error) {
                this.toast(error.message || 'Erro ao resetar senha', 'error');
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
    document.addEventListener('DOMContentLoaded', () => {
        window.app = app;
        app.init();
    });
})();
//# sourceMappingURL=usuarios.js.map