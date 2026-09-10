/**
 * Landing Page - Lógica
 */

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ============================================
// MOBILE TOGGLE
// ============================================
document.getElementById('mobileToggle').addEventListener('click', () => {
    document.querySelector('.navbar-menu').classList.toggle('open');
});

// ============================================
// MODALS
// ============================================
function openModal(name) {
    document.getElementById(`modal${name.charAt(0).toUpperCase() + name.slice(1)}`).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(name) {
    document.getElementById(`modal${name.charAt(0).toUpperCase() + name.slice(1)}`).classList.remove('active');
    document.body.style.overflow = '';
}

function switchModal(from, to) {
    closeModal(from);
    openModal(to);
}

// Fechar modal clicando fora
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});

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

            if (token) {
                api.setToken(token);
                toast(`Bem-vindo, ${user.nome}!`, 'success');
                closeModal('login');

                // Redirecionar para o dashboard
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
async function handleRegister() {
    const nome = document.getElementById('regNome').value;
    const email = document.getElementById('regEmail').value;
    const cpf = document.getElementById('regCpf').value;
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirmPassword').value;

    if (!nome || !email || !cpf || !password) {
        toast('Preencha todos os campos', 'error');
        return;
    }

    if (password !== confirm) {
        toast('As senhas não coincidem', 'error');
        return;
    }

    try {
        const response = await api.register({ nome, email, password, cpf });

        if (response.status === 201) {
            const token = response.data?.data?.token;
            const user = response.data?.data?.user;

            if (token) {
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
// TOAST
// ============================================
function toast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;

    // Show
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto hide after 3s
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
    // Escape para fechar modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
});

// ============================================
// MASCARAR CPF — máximo 11 dígitos (14 com máscara)
// ============================================
document.getElementById('regCpf').addEventListener('input', function(e) {
    // Remove tudo que não for dígito e limita a 11
    let value = e.target.value.replace(/\D/g, '').slice(0, 11);
    // Aplicar máscara: 000.000.000-00
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3}\.\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3}\.\d{3}\.\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = value;
});

// ============================================
// SMOOTH SCROLL — âncoras da landing
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});