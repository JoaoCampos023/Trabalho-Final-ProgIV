/// <reference path="./types.ts" />
/// <reference path="./api.ts" />
/**
 * Landing Page (/index.html) - Lógica
 */
// ============================================
// NAVBAR SCROLL EFFECT
// ============================================
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (!navbar)
        return;
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    }
    else {
        navbar.classList.remove('scrolled');
    }
});
// ============================================
// MOBILE TOGGLE
// ============================================
// Não clonamos mais os botões de auth aqui — eles já existem dentro do
// menu desde o HTML (ver `index.html`, bloco `.navbar-menu > .mobile-auth-group`).
// O CSS decide se aparecem (mobile com menu aberto) ou não (desktop).
document.getElementById('mobileToggle')?.addEventListener('click', () => {
    document.getElementById('navMenu')?.classList.toggle('open');
});
// ============================================
// MODALS
// ============================================
function openModal(name) {
    document.getElementById(`modal${name.charAt(0).toUpperCase() + name.slice(1)}`)?.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeModal(name) {
    document.getElementById(`modal${name.charAt(0).toUpperCase() + name.slice(1)}`)?.classList.remove('active');
    document.body.style.overflow = '';
}
function switchModal(from, to) {
    closeModal(from);
    openModal(to);
}
// Fechar modal clicando fora
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});
// Fechar com ESC
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
});
// ============================================
// TOAST
// ============================================
function toast(message, type = 'info') {
    const toastEl = document.getElementById('toast');
    if (!toastEl)
        return;
    toastEl.textContent = message;
    toastEl.className = `toast ${type}`;
    setTimeout(() => toastEl.classList.add('show'), 10);
    setTimeout(() => toastEl.classList.remove('show'), 3000);
}
// ============================================
// LOGIN
// ============================================
async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) {
        toast('Preencha todos os campos', 'error');
        return;
    }
    try {
        const response = await api.login({ email, password });
        if (response.status === 200) {
            const token = response.data?.data?.token;
            const user = response.data?.data?.user;
            if (token && user) {
                api.setToken(token);
                toast(`Bem-vindo, ${user.nome}!`, 'success');
                closeModal('login');
                setTimeout(() => {
                    window.location.href = '/app/dashboard.html';
                }, 500);
            }
        }
        else {
            toast(response.data?.message || 'Erro ao fazer login', 'error');
        }
    }
    catch (error) {
        toast('Erro ao fazer login', 'error');
    }
}
// ============================================
// REGISTER
// ============================================
async function handleRegister() {
    const nome = document.getElementById('regNome').value;
    const email = document.getElementById('regEmail').value;
    const cpf = document.getElementById('regCpf').value;
    const password = document.getElementById('regPassword').value;
    const confirm2 = document.getElementById('regConfirmPassword').value;
    if (!nome || !email || !cpf || !password) {
        toast('Preencha todos os campos', 'error');
        return;
    }
    if (password !== confirm2) {
        toast('As senhas não coincidem', 'error');
        return;
    }
    try {
        const response = await api.register({ nome, email, password, cpf });
        if (response.status === 201) {
            const token = response.data?.data?.token;
            const user = response.data?.data?.user;
            if (token && user) {
                api.setToken(token);
                toast(`Conta criada com sucesso! Bem-vindo, ${user.nome}!`, 'success');
                closeModal('register');
                setTimeout(() => {
                    window.location.href = '/app/dashboard.html';
                }, 500);
            }
        }
        else {
            toast(response.data?.message || 'Erro ao criar conta', 'error');
        }
    }
    catch (error) {
        toast('Erro ao criar conta', 'error');
    }
}
// ============================================
// MASCARAR CPF
// ============================================
document.getElementById('regCpf')?.addEventListener('input', function (e) {
    const target = e.target;
    let value = target.value.replace(/\D/g, '');
    if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        target.value = value;
    }
});
// ============================================
// EXPORTA FUNÇÕES PARA O ESCOPO GLOBAL
// ============================================
// Os onclick inline do index.html (ex.: onclick="handleLogin()") precisam
// dessas funções em window. Sem isso, os botões do modal não funcionam.
window.openModal = openModal;
window.closeModal = closeModal;
window.switchModal = switchModal;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
// ============================================
// VERIFICAR SE JÁ ESTÁ LOGADO
// ============================================
(function initLanding() {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = '/app/dashboard.html';
    }
})();
//# sourceMappingURL=landing.js.map