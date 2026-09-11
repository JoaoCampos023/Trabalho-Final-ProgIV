/// <reference path="../types.ts" />
/// <reference path="../api.ts" />
/// <reference path="../components.ts" />
/**
 * Página Relatórios (/app/relatorios.html)
 */

(function () {
  interface RelatoriosAppState {
    user: UsuarioLogado | null;
    chartInstances: Record<string, any>;
    toastTimeout?: number;
    init(): void;
    loadUserInfo(): void;
    logout(): void;
    toast(message: string, type?: string): void;
    loadRelatorios(): Promise<void>;
  }

  function el<T extends HTMLElement = HTMLElement>(id: string): T {
    return document.getElementById(id) as T;
  }

  const app: RelatoriosAppState = {
    user: null,
    chartInstances: {},

    init() {
      if (!api.isAuthenticated()) {
        window.location.href = '/';
        return;
      }
      this.loadUserInfo();
      this.loadRelatorios();
    },

    loadUserInfo() {
      try {
        const token = api.token;
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.user = { nome: payload.nome || 'Usuário', email: payload.email || '', role: payload.role || 'Cliente' };
          Components.renderNavbar('relatorios', this.user, 'mpa');
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

    async loadRelatorios() {
      const container = el('relatoriosContent');
      container.innerHTML = `<div class="loading"><div class="spinner"></div><p>Carregando relatórios...</p></div>`;

      try {
        const [producaoRes, rebanhoRes, graficosRes, animaisRes, topRes] = await Promise.all([
          api.getRelatorioProducao(),
          api.getRelatorioRebanho(),
          api.getGraficosProducao(7),
          api.getAnimais(),
          api.getTopVacas(5)
        ]);

        const producaoData: { stats?: { totalLitros: number } } = producaoRes.data?.data || {};
        const graficosData = graficosRes.data?.data || [];
        const animais = animaisRes.data?.data?.animais || [];
        const topVacas = topRes.data?.data || [];

        const totalAnimais = animais.length;
        const totalFemea = animais.filter(a => a.sexo === 'F').length;
        const totalMacho = animais.filter(a => a.sexo === 'M').length;
        const totalLitros = producaoData.stats?.totalLitros || 0;

        const medalIcon = [
          '<i class="fa-solid fa-trophy medal-gold"></i>',
          '<i class="fa-solid fa-medal medal-silver"></i>',
          '<i class="fa-solid fa-medal medal-bronze"></i>',
          '<i class="fa-solid fa-award"></i>',
          '<i class="fa-solid fa-award"></i>'
        ];
        const html = `
                    <div class="stats-grid">
                        <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-cow"></i></div><div class="stat-value">${totalAnimais}</div><div class="stat-label">Total de Animais</div></div>
                        <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-venus"></i></div><div class="stat-value">${totalFemea}</div><div class="stat-label">Fêmeas</div></div>
                        <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-mars"></i></div><div class="stat-value">${totalMacho}</div><div class="stat-label">Machos</div></div>
                        <div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-droplet"></i></div><div class="stat-value">${totalLitros.toFixed(1)} L</div><div class="stat-label">Total Produzido</div></div>
                    </div>

                    <div class="card mini-stats-block">
                        <h4 class="block-title"><i class="fa-solid fa-chart-line"></i> Produção dos Últimos 7 Dias</h4>
                        <div class="chart-container"><canvas id="chartRelatorioProducao"></canvas></div>
                    </div>

                    <div class="card mini-stats-block">
                        <h4 class="block-title"><i class="fa-solid fa-trophy"></i> Top 5 Vacas Produtoras</h4>
                        <div class="mini-stats-grid">
                            ${
                              topVacas.length > 0
                                ? topVacas
                                    .map(
                                      (v, i) => `
                                <div class="mini-stat-card">
                                    <div class="mini-stat-medal">${medalIcon[i] || '<i class="fa-solid fa-circle"></i>'}</div>
                                    <div><strong>${v.nome}</strong></div>
                                    <div class="mini-stat-value">${(v.producao ?? v.total ?? 0).toFixed(1)} L</div>
                                </div>
                            `
                                    )
                                    .join('')
                                : '<p class="text-muted text-center">Nenhuma produção registrada.</p>'
                            }
                        </div>
                    </div>
                `;

        container.innerHTML = html;

        // Renderizar gráfico
        setTimeout(() => {
          const ctx = document.getElementById('chartRelatorioProducao');
          if (ctx && graficosData && graficosData.length > 0) {
            // Evita erro de canvas reutilizado ao recarregar o relatório mais de uma vez.
            if (this.chartInstances.relatorio) {
              this.chartInstances.relatorio.destroy();
            }
            const labelsFormatted = graficosData.map(d => {
              if (!d.data) return '';
              const parts = d.data.split('T')[0].split('-');
              return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d.data;
            });
            this.chartInstances.relatorio = new Chart(ctx, {
              type: 'line',
              data: {
                labels: labelsFormatted,
                datasets: [
                  {
                    label: 'Litros',
                    data: graficosData.map(d => d.total),
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    tension: 0.3,
                    fill: true
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
        }, 100);
      } catch (error: any) {
        container.innerHTML = `<p class="text-muted text-center">Erro ao carregar relatórios: ${error.message}</p>`;
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => app.init());
})();
