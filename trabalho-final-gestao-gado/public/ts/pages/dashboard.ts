/// <reference path="../types.ts" />
/// <reference path="../api.ts" />
/// <reference path="../components.ts" />
/**
 * Página Dashboard (/app/dashboard.html)
 *
 * Em MPA, cada aba tem seu próprio HTML e seu próprio TS. Aqui só vive o
 * Dashboard: cards de resumo + 2 gráficos. Animais, Produções, Relatórios e
 * Usuários têm arquivos próprios e são abertos via navegação real do navegador.
 */

(function () {
  interface DashboardState {
    user: UsuarioLogado | null;
    chartInstances: Record<string, any>;
    toastTimeout?: number;
    init(): void;
    loadUserInfo(): void;
    loadDashboard(): Promise<void>;
    renderCharts(
      producaoDia: { data: string; total: number }[],
      topVacas: { nome: string; producao: number }[]
    ): void;
    logout(): void;
    toast(message: string, type?: string): void;
  }

  function el<T extends HTMLElement = HTMLElement>(id: string): T {
    return document.getElementById(id) as T;
  }

  const app: DashboardState = {
    user: null,
    chartInstances: {},

    init() {
      if (!api.isAuthenticated()) {
        console.log('🔒 Usuário não autenticado, redirecionando...');
        window.location.href = '/';
        return;
      }

      console.log('✅ Usuário autenticado');
      this.loadUserInfo();

      // Recarrega os dados quando a aba volta a ficar visível / ganha foco.
      // Útil para quem deixa o dashboard aberto num monitor.
      window.addEventListener('focus', () => this.loadDashboard());
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this.loadDashboard();
      });

      this.loadDashboard();
    },

    loadUserInfo() {
      try {
        const token = api.token;
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.user = {
            nome: payload.nome || 'Usuário',
            email: payload.email || '',
            role: payload.role || 'Cliente'
          };
          // MODO MPA: cliques na navbar navegam para outra URL (/app/xxx.html),
          // sem SPA. A URL do navegador muda de verdade.
          Components.renderNavbar('dashboard', this.user, 'mpa');
        }
      } catch (e) {
        console.error(e);
      }
    },

    // ============================================
    // DASHBOARD
    // ============================================
    async loadDashboard() {
      const container = el('dashboardContent');
      container.innerHTML = `<div class="loading"><div class="spinner"></div><p>Carregando dashboard...</p></div>`;

      try {
        const [animaisRes, producoesRes] = await Promise.all([api.getAnimais(), api.getProducoes()]);

        const animais: Animal[] = animaisRes.data?.data?.animais || [];
        const producoes: ProducaoLeite[] = producoesRes.data?.data?.producoes || [];

        const totalAnimais = animais.length;
        const totalFemea = animais.filter(a => a.sexo === 'F').length;
        const totalMacho = animais.filter(a => a.sexo === 'M').length;
        const totalLitros = producoes.reduce((sum, p) => sum + (parseFloat(String(p.litros)) || 0), 0);

        // Top 5 vacas (no histórico inteiro — o Dashboard é visão geral).
        const vacasMap = new Map<string, number>();
        producoes.forEach(p => {
          const nome = p.animal?.nome || `Animal ${p.animal_brinco}`;
          vacasMap.set(nome, (vacasMap.get(nome) || 0) + (parseFloat(String(p.litros)) || 0));
        });
        const topVacas = Array.from(vacasMap.entries())
          .map(([nome, producao]) => ({ nome, producao: Number(producao) }))
          .sort((a, b) => b.producao - a.producao)
          .slice(0, 5);

        // Série dos últimos 7 dias (para o gráfico de linha).
        const ultimos7Dias: { data: string; total: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const dataObj = new Date();
          dataObj.setDate(dataObj.getDate() - i);
          const isoStr = Components.dataParaIsoLocal(dataObj);
          const displayDate = isoStr.split('-').reverse().slice(0, 2).join('/');
          const total = producoes
            .filter(p => p.data_coleta?.split('T')[0] === isoStr)
            .reduce((sum, p) => sum + (parseFloat(String(p.litros)) || 0), 0);
          ultimos7Dias.push({ data: displayDate, total });
        }

        container.innerHTML = `
          <div class="stats-grid">
            <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-cow"></i></div><div class="stat-value">${totalAnimais}</div><div class="stat-label">Total de Animais</div></div>
            <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-venus"></i></div><div class="stat-value">${totalFemea}</div><div class="stat-label">Fêmeas</div></div>
            <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-mars"></i></div><div class="stat-value">${totalMacho}</div><div class="stat-label">Machos</div></div>
            <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-droplet"></i></div><div class="stat-value">${totalLitros.toFixed(1)} L</div><div class="stat-label">Produção Total</div></div>
          </div>
          <div class="chart-grid">
            <div class="card chart-card"><h4 class="block-title"><i class="fa-solid fa-chart-line"></i> Produção dos Últimos 7 Dias</h4><div class="chart-container"><canvas id="chartProducaoDia"></canvas></div></div>
            <div class="card chart-card"><h4 class="block-title"><i class="fa-solid fa-trophy"></i> Top 5 Vacas Produtoras</h4><div class="chart-container"><canvas id="chartTopVacas"></canvas></div></div>
          </div>
        `;

        setTimeout(() => this.renderCharts(ultimos7Dias, topVacas), 100);
      } catch (error: any) {
        console.error('❌ Erro ao carregar dashboard:', error);
        container.innerHTML = `<p class="text-muted text-center">Erro ao carregar dashboard: ${error.message}</p>`;
      }
    },

    renderCharts(producaoDia, topVacas) {
      // Destrói gráficos antigos antes de criar novos — sem isso, o Chart.js
      // reclama de canvas reutilizado ao clicar em "Atualizar".
      Object.values(this.chartInstances).forEach((chart: any) => chart && chart.destroy());
      this.chartInstances = {};

      const ctx1 = document.getElementById('chartProducaoDia');
      if (ctx1 && producaoDia.length > 0) {
        this.chartInstances.producaoDia = new Chart(ctx1, {
          type: 'line',
          data: {
            labels: producaoDia.map(d => d.data),
            datasets: [
              {
                label: 'Litros',
                data: producaoDia.map(d => d.total),
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13,110,253,0.1)',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#0d6efd'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Litros' } } }
          }
        });
      }

      const ctx2 = document.getElementById('chartTopVacas');
      if (ctx2 && topVacas.length > 0) {
        const cores = ['#0d6efd', '#28a745', '#ffc107', '#dc3545', '#6c757d'];
        this.chartInstances.topVacas = new Chart(ctx2, {
          type: 'bar',
          data: {
            labels: topVacas.map(v => v.nome),
            datasets: [
              {
                label: 'Litros',
                data: topVacas.map(v => v.producao),
                backgroundColor: cores.slice(0, topVacas.length),
                borderRadius: 8
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Litros' } } }
          }
        });
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
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    (window as any).app = app;
    app.init();
  });
})();