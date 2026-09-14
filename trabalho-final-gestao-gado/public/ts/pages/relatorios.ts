/// <reference path="../types.ts" />
/// <reference path="../api.ts" />
/// <reference path="../components.ts" />
/**
 * Página Relatórios (/app/relatorios.html)
 *
 * Objetivo: ser um "relatório analítico" e não um espelho do Dashboard.
 * Diferenças em relação ao Dashboard:
 * - Filtros (período, animal, período do dia).
 * - KPIs analíticos (média por ordenha/vaca, pico, dias com produção).
 * - Gráfico de linha (produção diária) + gráfico de barras por turno.
 * - Tabela de produções com ordenação por clique no cabeçalho.
 * - Exportação para PDF e Excel com os MESMOS filtros da tela.
 */

(function () {
  interface RelatoriosState {
    user: UsuarioLogado | null;
    toastTimeout?: number;
    charts: Record<string, any>;
    filtros: {
      dataInicio: string;
      dataFim: string;
      animalBrinco: string;
      periodo: string;
    };
    animais: { brinco: number; nome: string }[];
    // Estado da ordenação da tabela de produções (mesmo padrão do Rebanho).
    sortCampo: string;
    sortDir: SortDir;
    // Guarda o último resultado para reordenar sem refetch.
    ultimoResultado: { producoes: any[]; stats: any; porPeriodo: any; topAnimais: any[]; serie: any[]; porRaca: any[] } | null;
    init(): void;
    loadUserInfo(): void;
    logout(): void;
    toast(message: string, type?: string): void;
    lerFiltrosDaTela(): void;
    aplicarAtalho(atalho: '7d' | '30d' | 'mes'): void;
    limparFiltros(): void;
    carregarAnimaisSelect(): Promise<void>;
    loadRelatorios(): Promise<void>;
    renderRelatorios(): void;
    renderCharts(labels: string[], serie: any[], porPeriodo: any): void;
    ordenarProducoesPor(campo: string): void;
    exportar(formato: 'pdf' | 'excel'): Promise<void>;
  }

  function el<T extends HTMLElement = HTMLElement>(id: string): T {
    return document.getElementById(id) as T;
  }

  const app: RelatoriosState = {
    user: null,
    charts: {},
    filtros: { dataInicio: '', dataFim: '', animalBrinco: '', periodo: '' },
    animais: [],
    sortCampo: 'data_coleta',
    sortDir: 'desc',
    ultimoResultado: null,

    init() {
      if (!api.isAuthenticated()) {
        window.location.href = '/';
        return;
      }
      this.loadUserInfo();

      // Pré-popula o filtro de data com os últimos 7 dias.
      el<HTMLInputElement>('filtroDataInicio').value = Components.dataLocalIso(-6);
      el<HTMLInputElement>('filtroDataFim').value = Components.dataLocalIso();

      this.carregarAnimaisSelect();
      this.loadRelatorios();
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

    /** Lê os campos de filtro para `this.filtros`. */
    lerFiltrosDaTela() {
      this.filtros = {
        dataInicio: el<HTMLInputElement>('filtroDataInicio').value,
        dataFim: el<HTMLInputElement>('filtroDataFim').value,
        animalBrinco: el<HTMLSelectElement>('filtroAnimal').value,
        periodo: el<HTMLSelectElement>('filtroPeriodo').value
      };
    },

    aplicarAtalho(atalho) {
      const fim = new Date();
      const ini = new Date();
      if (atalho === '7d') ini.setDate(fim.getDate() - 6);
      else if (atalho === '30d') ini.setDate(fim.getDate() - 29);
      else if (atalho === 'mes') ini.setDate(1);
      el<HTMLInputElement>('filtroDataInicio').value = Components.dataParaIsoLocal(ini);
      el<HTMLInputElement>('filtroDataFim').value = Components.dataParaIsoLocal(fim);
      this.loadRelatorios();
    },

    limparFiltros() {
      el<HTMLInputElement>('filtroDataInicio').value = '';
      el<HTMLInputElement>('filtroDataFim').value = '';
      el<HTMLSelectElement>('filtroAnimal').value = '';
      el<HTMLSelectElement>('filtroPeriodo').value = '';
      this.loadRelatorios();
    },

    async carregarAnimaisSelect() {
      try {
        const res = await api.getAnimais({ status: 'ativos', sexo: 'F' });
        const animais = res.data?.data?.animais || [];
        this.animais = animais.map((a: any) => ({ brinco: a.brinco, nome: a.nome }));
        const select = el<HTMLSelectElement>('filtroAnimal');
        select.innerHTML =
          '<option value="">Todas</option>' +
          this.animais.map(a => `<option value="${a.brinco}">${a.brinco} - ${a.nome}</option>`).join('');
      } catch {
        // Silencioso: se falhar, o select fica só com "Todas".
      }
    },

    /** Carrega os dados e guarda em `ultimoResultado` para permitir reordenar sem refetch. */
    async loadRelatorios() {
      this.lerFiltrosDaTela();
      const container = el('relatoriosContent');
      container.innerHTML = `<div class="loading"><div class="spinner"></div><p>Carregando relatórios...</p></div>`;

      try {
        const filtrosProd: Record<string, string> = {};
        if (this.filtros.dataInicio) filtrosProd.dataInicio = this.filtros.dataInicio;
        if (this.filtros.dataFim) filtrosProd.dataFim = this.filtros.dataFim;
        if (this.filtros.animalBrinco) filtrosProd.animalBrinco = this.filtros.animalBrinco;
        if (this.filtros.periodo) filtrosProd.periodo = this.filtros.periodo;

        const [prodRes, rebRes] = await Promise.all([
          api.getRelatorioProducao(filtrosProd),
          api.getRelatorioRebanho({})
        ]);

        const prod = prodRes.data?.data || {};
        const reb = rebRes.data?.data || {};

        this.ultimoResultado = {
          producoes: prod.producoes || [],
          stats: prod.stats || {},
          porPeriodo: prod.porPeriodo || { Manha: 0, Tarde: 0, Noite: 0 },
          topAnimais: prod.topAnimais || [],
          serie: prod.serieDiaria || [],
          porRaca: reb.porRaca || []
        };

        this.renderRelatorios();
      } catch (error: any) {
        container.innerHTML = `<p class="text-muted text-center">Erro ao carregar relatórios: ${error.message}</p>`;
      }
    },

    /**
     * Renderiza a página inteira a partir de `this.ultimoResultado`.
     * Separado de `loadRelatorios` para permitir reordenar a tabela sem
     * refazer o fetch (mesmo padrão do Rebanho).
     */
    renderRelatorios() {
      const container = el('relatoriosContent');
      const r = this.ultimoResultado;
      if (!r) return;

      const { producoes, stats, porPeriodo, topAnimais, serie, porRaca } = r;

      const labelsSerie = serie.map((d: any) => {
        const [, m, dia] = d.data.split('-');
        return `${dia}/${m}`;
      });

      // Ordena as produções conforme estado atual (mesmo padrão do Rebanho).
      // O acessor resolve o nome do animal quando o campo é "animal".
      const producoesOrdenadas = Components.ordenarLista(
        producoes,
        this.sortCampo,
        this.sortDir,
        (p: any, campo: string) => (campo === 'animal' ? p.animal?.nome || p.animal_brinco : p[campo])
      );

      // Cabeçalhos clicáveis com setinha (reusa Components.thOrdenavel).
      const th = (label: string, campo: string) =>
        Components.thOrdenavel(label, campo, this.sortCampo, this.sortDir, `app.ordenarProducoesPor('${campo}')`);

      const html = `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon"><i class="fa-solid fa-droplet"></i></div>
            <div class="stat-value">${(stats.totalLitros || 0).toFixed(1)} L</div>
            <div class="stat-label">Total no período</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="fa-solid fa-calculator"></i></div>
            <div class="stat-value">${(stats.mediaPorOrdenha || 0).toFixed(2)} L</div>
            <div class="stat-label">Média por ordenha</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="fa-solid fa-cow"></i></div>
            <div class="stat-value">${(stats.mediaPorVaca || 0).toFixed(2)} L</div>
            <div class="stat-label">Média por vaca</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="fa-solid fa-calendar-check"></i></div>
            <div class="stat-value">${stats.diasComProducao || 0}</div>
            <div class="stat-label">Dias com produção</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="fa-solid fa-arrow-trend-up"></i></div>
            <div class="stat-value">${(stats.picoLitros || 0).toFixed(1)} L</div>
            <div class="stat-label">Pico diário</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="fa-solid fa-list-ol"></i></div>
            <div class="stat-value">${stats.totalRegistros || 0}</div>
            <div class="stat-label">Registros no período</div>
          </div>
        </div>

        <div class="chart-grid">
          <div class="card chart-card">
            <h4 class="block-title"><i class="fa-solid fa-chart-line"></i> Produção Diária</h4>
            <div class="chart-container"><canvas id="chartRelatorioLinha"></canvas></div>
          </div>
          <div class="card chart-card">
            <h4 class="block-title"><i class="fa-solid fa-chart-column"></i> Distribuição por Período do Dia</h4>
            <div class="chart-container"><canvas id="chartRelatorioPeriodo"></canvas></div>
          </div>
        </div>

        <div class="chart-grid">
          <div class="card mini-stats-block">
            <h4 class="block-title"><i class="fa-solid fa-trophy"></i> Top 5 Vacas no Período</h4>
            <div class="mini-stats-grid">
              ${
                topAnimais.length > 0
                  ? topAnimais
                      .map(
                        (v: any, i: number) => `
                  <div class="mini-stat-card">
                    <div class="mini-stat-medal">${
                      [
                        '<i class="fa-solid fa-trophy medal-gold"></i>',
                        '<i class="fa-solid fa-medal medal-silver"></i>',
                        '<i class="fa-solid fa-medal medal-bronze"></i>',
                        '<i class="fa-solid fa-award"></i>',
                        '<i class="fa-solid fa-award"></i>'
                      ][i] || ''
                    }</div>
                    <div><strong>${v.nome}</strong></div>
                    <div class="mini-stat-value">${(v.total || 0).toFixed(1)} L</div>
                  </div>`
                      )
                      .join('')
                  : '<p class="text-muted text-center">Sem produção no período.</p>'
              }
            </div>
          </div>
          <div class="card mini-stats-block">
            <h4 class="block-title"><i class="fa-solid fa-cow"></i> Rebanho por Raça</h4>
            <div class="mini-stats-grid">
              ${
                porRaca.length > 0
                  ? porRaca
                      .slice(0, 5)
                      .map(
                        (r: any) => `
                  <div class="mini-stat-card">
                    <div><strong>${r.raca}</strong></div>
                    <div class="mini-stat-value">${r.quantidade} ${r.quantidade === 1 ? 'animal' : 'animais'}</div>
                  </div>`
                      )
                      .join('')
                  : '<p class="text-muted text-center">Sem dados de rebanho.</p>'
              }
            </div>
          </div>
        </div>

        <div class="card">
          <h4 class="block-title"><i class="fa-solid fa-list"></i> Produções no Período (${producoes.length})</h4>
          ${
            producoes.length === 0
              ? '<p class="text-muted text-center">Nenhuma produção no período/filtros selecionados.</p>'
              : `<div class="table-responsive"><table>
                  <thead><tr>
                    ${th('ID', 'id')}
                    ${th('Animal', 'animal')}
                    ${th('Data', 'data_coleta')}
                    ${th('Período', 'periodo')}
                    ${th('Litros', 'litros')}
                  </tr></thead>
                  <tbody>
                    ${producoesOrdenadas
                      .slice(0, 50)
                      .map(
                        (p: any) => `<tr>
                        <td>${p.id}</td>
                        <td>${p.animal?.nome || p.animal_brinco}</td>
                        <td>${new Date(p.data_coleta).toLocaleDateString()}</td>
                        <td>${p.periodo}</td>
                        <td><strong>${Number(p.litros).toFixed(1)} L</strong></td>
                      </tr>`
                      )
                      .join('')}
                  </tbody>
                </table>
                ${
                  producoes.length > 50
                    ? `<p class="text-muted mt-10">Mostrando as 50 primeiras de ${producoes.length}. Use a exportação para a lista completa.</p>`
                    : ''
                }
              </div>`
          }
        </div>
      `;

      container.innerHTML = html;
      setTimeout(() => this.renderCharts(labelsSerie, serie, porPeriodo), 100);
    },

    /**
     * Alterna a ordenação da tabela de produções.
     * Reordena a partir de `ultimoResultado` (sem refetch), igual ao Rebanho.
     */
    ordenarProducoesPor(campo) {
      if (this.sortCampo === campo) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortCampo = campo;
        this.sortDir = 'asc';
      }
      this.renderRelatorios();
    },

    renderCharts(labels: string[], serie: any[], porPeriodo: any) {
      Object.values(this.charts).forEach((c: any) => c && c.destroy());
      this.charts = {};

      const ctxLinha = document.getElementById('chartRelatorioLinha');
      if (ctxLinha) {
        this.charts.linha = new Chart(ctxLinha, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Litros',
                data: serie.map((d: any) => d.total),
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13,110,253,0.1)',
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

      const ctxPeriodo = document.getElementById('chartRelatorioPeriodo');
      if (ctxPeriodo) {
        this.charts.periodo = new Chart(ctxPeriodo, {
          type: 'bar',
          data: {
            labels: ['🌅 Manhã', '☀️ Tarde', '🌙 Noite'],
            datasets: [
              {
                label: 'Litros',
                data: [porPeriodo.Manha || 0, porPeriodo.Tarde || 0, porPeriodo.Noite || 0],
                backgroundColor: ['#0dcaf0', '#ffc107', '#0d6efd'],
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

    async exportar(formato) {
      this.lerFiltrosDaTela();
      const filtros: Record<string, string> = {};
      if (this.filtros.dataInicio) filtros.dataInicio = this.filtros.dataInicio;
      if (this.filtros.dataFim) filtros.dataFim = this.filtros.dataFim;
      if (this.filtros.animalBrinco) filtros.animalBrinco = this.filtros.animalBrinco;
      if (this.filtros.periodo) filtros.periodo = this.filtros.periodo;

      try {
        this.toast(`Gerando ${formato === 'pdf' ? 'PDF' : 'Excel'}...`, 'info');
        await api.baixarRelatorio('producao', formato, filtros);
        this.toast('Download iniciado!', 'success');
      } catch (e: any) {
        this.toast(e.message || 'Erro ao exportar', 'error');
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    (window as any).app = app;
    app.init();
  });
})();