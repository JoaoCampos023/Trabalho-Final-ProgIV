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
    if (!navbar) return;
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ============================================
// MOBILE TOGGLE
// ============================================
document.getElementById('mobileToggle')?.addEventListener('click', () => {
    document.getElementById('navMenu')?.classList.toggle('open');
});

// ============================================
// MODALS
// ============================================
function openModal(name: string): void {
    document.getElementById(`modal${name.charAt(0).toUpperCase() + name.slice(1)}`)?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(name: string): void {
    document.getElementById(`modal${name.charAt(0).toUpperCase() + name.slice(1)}`)?.classList.remove('active');
    document.body.style.overflow = '';
}

function switchModal(from: string, to: string): void {
    closeModal(from);
    openModal(to);
}

// Fechar modal clicando fora
document.querySelectorAll<HTMLElement>('.modal-overlay').forEach(overlay => {
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
        document.querySelectorAll<HTMLElement>('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
});

// ============================================
// TOAST
// ============================================
function toast(message: string, type = 'info'): void {
    const toastEl = document.getElementById('toast');
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.className = `toast ${type}`;

    setTimeout(() => toastEl.classList.add('show'), 10);
    setTimeout(() => toastEl.classList.remove('show'), 3000);
}

// ============================================
// LOGIN
// ============================================
async function handleLogin(): Promise<void> {
    const email = (document.getElementById('loginEmail') as HTMLInputElement).value;
    const password = (document.getElementById('loginPassword') as HTMLInputElement).value;

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
        } else {
            toast(response.data?.message || 'Erro ao fazer login', 'error');
        }
    } catch (error) {
        toast('Erro ao fazer login', 'error');
    }
}

// ============================================
// REGISTER
// ============================================
async function handleRegister(): Promise<void> {
    const nome = (document.getElementById('regNome') as HTMLInputElement).value;
    const email = (document.getElementById('regEmail') as HTMLInputElement).value;
    const cpf = (document.getElementById('regCpf') as HTMLInputElement).value;
    const password = (document.getElementById('regPassword') as HTMLInputElement).value;
    const confirm2 = (document.getElementById('regConfirmPassword') as HTMLInputElement).value;

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
        } else {
            toast(response.data?.message || 'Erro ao criar conta', 'error');
        }
    } catch (error) {
        toast('Erro ao criar conta', 'error');
    }
}

// ============================================
// MASCARAR CPF
// ============================================
document.getElementById('regCpf')?.addEventListener('input', function (e) {
    const target = e.target as HTMLInputElement;
    let value = target.value.replace(/\D/g, '');
    if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        target.value = value;
    }
});

// ============================================
// VERIFICAR SE JÁ ESTÁ LOGADO
// ============================================
(function initLanding() {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = '/app/dashboard.html';
    }
})();
