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
 * - Tabela de produções detalhada.
 * - Exportação para PDF e Excel com os MESMOS filtros da tela.
 */
(function () {
    function el(id) {
        return document.getElementById(id);
    }
    const app = {
        user: null,
        charts: {},
        filtros: { dataInicio: '', dataFim: '', animalBrinco: '', periodo: '' },
        animais: [],
        init() {
            if (!api.isAuthenticated()) {
                window.location.href = '/';
                return;
            }
            this.loadUserInfo();
            // Pré-popula o filtro de data com os últimos 7 dias.
            el('filtroDataInicio').value = Components.dataLocalIso(-6);
            el('filtroDataFim').value = Components.dataLocalIso();
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
            }
            catch (e) {
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
                dataInicio: el('filtroDataInicio').value,
                dataFim: el('filtroDataFim').value,
                animalBrinco: el('filtroAnimal').value,
                periodo: el('filtroPeriodo').value
            };
        },
        /** Atalhos "7 dias", "30 dias", "Este mês" — só mexem nos campos de data. */
        aplicarAtalho(atalho) {
            const fim = new Date();
            const ini = new Date();
            if (atalho === '7d')
                ini.setDate(fim.getDate() - 6);
            else if (atalho === '30d')
                ini.setDate(fim.getDate() - 29);
            else if (atalho === 'mes')
                ini.setDate(1);
            el('filtroDataInicio').value = Components.dataParaIsoLocal(ini);
            el('filtroDataFim').value = Components.dataParaIsoLocal(fim);
            this.loadRelatorios();
        },
        limparFiltros() {
            el('filtroDataInicio').value = '';
            el('filtroDataFim').value = '';
            el('filtroAnimal').value = '';
            el('filtroPeriodo').value = '';
            this.loadRelatorios();
        },
        /** Popula o select de animais com as fêmeas ativas — só elas produzem. */
        async carregarAnimaisSelect() {
            try {
                const res = await api.getAnimais({ status: 'ativos', sexo: 'F' });
                const animais = res.data?.data?.animais || [];
                this.animais = animais.map((a) => ({ brinco: a.brinco, nome: a.nome }));
                const select = el('filtroAnimal');
                select.innerHTML =
                    '<option value="">Todas</option>' +
                        this.animais.map(a => `<option value="${a.brinco}">${a.brinco} - ${a.nome}</option>`).join('');
            }
            catch {
                // Silencioso: se falhar, o select fica só com "Todas".
            }
        },
        /** Carrega relatório de produção + rebanho em paralelo. */
        async loadRelatorios() {
            this.lerFiltrosDaTela();
            const container = el('relatoriosContent');
            container.innerHTML = `<div class="loading"><div class="spinner"></div><p>Carregando relatórios...</p></div>`;
            try {
                const filtrosProd = {};
                if (this.filtros.dataInicio)
                    filtrosProd.dataInicio = this.filtros.dataInicio;
                if (this.filtros.dataFim)
                    filtrosProd.dataFim = this.filtros.dataFim;
                if (this.filtros.animalBrinco)
                    filtrosProd.animalBrinco = this.filtros.animalBrinco;
                if (this.filtros.periodo)
                    filtrosProd.periodo = this.filtros.periodo;
                const [prodRes, rebRes] = await Promise.all([
                    api.getRelatorioProducao(filtrosProd),
                    api.getRelatorioRebanho({})
                ]);
                const prod = prodRes.data?.data || {};
                const reb = rebRes.data?.data || {};
                const stats = prod.stats || {};
                const serie = prod.serieDiaria || [];
                const porPeriodo = prod.porPeriodo || { Manha: 0, Tarde: 0, Noite: 0 };
                const topAnimais = prod.topAnimais || [];
                const producoes = prod.producoes || [];
                const porRaca = reb.porRaca || [];
                const labelsSerie = serie.map((d) => {
                    const [, m, dia] = d.data.split('-');
                    return `${dia}/${m}`;
                });
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
                ${topAnimais.length > 0
                    ? topAnimais
                        .map((v, i) => `
                    <div class="mini-stat-card">
                      <div class="mini-stat-medal">${[
                        '<i class="fa-solid fa-trophy medal-gold"></i>',
                        '<i class="fa-solid fa-medal medal-silver"></i>',
                        '<i class="fa-solid fa-medal medal-bronze"></i>',
                        '<i class="fa-solid fa-award"></i>',
                        '<i class="fa-solid fa-award"></i>'
                    ][i] || ''}</div>
                      <div><strong>${v.nome}</strong></div>
                      <div class="mini-stat-value">${(v.total || 0).toFixed(1)} L</div>
                    </div>`)
                        .join('')
                    : '<p class="text-muted text-center">Sem produção no período.</p>'}
              </div>
            </div>
            <div class="card mini-stats-block">
              <h4 class="block-title"><i class="fa-solid fa-cow"></i> Rebanho por Raça</h4>
              <div class="mini-stats-grid">
                ${porRaca.length > 0
                    ? porRaca
                        .slice(0, 5)
                        .map((r) => `
                    <div class="mini-stat-card">
                      <div><strong>${r.raca}</strong></div>
                      <div class="mini-stat-value">${r.quantidade} ${r.quantidade === 1 ? 'animal' : 'animais'}</div>
                    </div>`)
                        .join('')
                    : '<p class="text-muted text-center">Sem dados de rebanho.</p>'}
              </div>
            </div>
          </div>

          <div class="card">
            <h4 class="block-title"><i class="fa-solid fa-list"></i> Produções no Período (${producoes.length})</h4>
            ${producoes.length === 0
                    ? '<p class="text-muted text-center">Nenhuma produção no período/filtros selecionados.</p>'
                    : `<div class="table-responsive"><table>
                    <thead><tr>
                      <th>ID</th><th>Animal</th><th>Data</th><th>Período</th><th>Litros</th>
                    </tr></thead>
                    <tbody>
                      ${producoes
                        .slice(0, 50)
                        .map((p) => `<tr>
                          <td>${p.id}</td>
                          <td>${p.animal?.nome || p.animal_brinco}</td>
                          <td>${new Date(p.data_coleta).toLocaleDateString()}</td>
                          <td>${p.periodo}</td>
                          <td><strong>${Number(p.litros).toFixed(1)} L</strong></td>
                        </tr>`)
                        .join('')}
                    </tbody>
                  </table>
                  ${producoes.length > 50
                        ? `<p class="text-muted mt-10">Mostrando as 50 primeiras de ${producoes.length}. Use a exportação para a lista completa.</p>`
                        : ''}
                </div>`}
          </div>
        `;
                container.innerHTML = html;
                setTimeout(() => this.renderCharts(labelsSerie, serie, porPeriodo), 100);
            }
            catch (error) {
                container.innerHTML = `<p class="text-muted text-center">Erro ao carregar relatórios: ${error.message}</p>`;
            }
        },
        /** Recria os gráficos destruindo instâncias antigas. */
        renderCharts(labels, serie, porPeriodo) {
            Object.values(this.charts).forEach((c) => c && c.destroy());
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
                                data: serie.map((d) => d.total),
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
        /** Baixa o relatório em PDF/Excel com os filtros aplicados na tela. */
        async exportar(formato) {
            this.lerFiltrosDaTela();
            const filtros = {};
            if (this.filtros.dataInicio)
                filtros.dataInicio = this.filtros.dataInicio;
            if (this.filtros.dataFim)
                filtros.dataFim = this.filtros.dataFim;
            if (this.filtros.animalBrinco)
                filtros.animalBrinco = this.filtros.animalBrinco;
            if (this.filtros.periodo)
                filtros.periodo = this.filtros.periodo;
            try {
                this.toast(`Gerando ${formato === 'pdf' ? 'PDF' : 'Excel'}...`, 'info');
                await api.baixarRelatorio('producao', formato, filtros);
                this.toast('Download iniciado!', 'success');
            }
            catch (e) {
                this.toast(e.message || 'Erro ao exportar', 'error');
            }
        }
    };
    document.addEventListener('DOMContentLoaded', () => app.init());
    window.app = app;
})();
//# sourceMappingURL=relatorios.js.map