/**
 * Components - Funções para renderizar componentes
 */

const Components = {
    // ============================================
    // ESTATÍSTICAS
    // ============================================
    statsGrid(stats) {
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">🐄</div>
                    <div class="stat-value">${stats.total || 0}</div>
                    <div class="stat-label">Total de Animais</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">♀️</div>
                    <div class="stat-value">${stats.totalFemea || 0}</div>
                    <div class="stat-label">Fêmeas</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">♂️</div>
                    <div class="stat-value">${stats.totalMacho || 0}</div>
                    <div class="stat-label">Machos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⚖️</div>
                    <div class="stat-value">${(stats.pesoMedio || 0).toFixed(0)} kg</div>
                    <div class="stat-label">Peso Médio</div>
                </div>
            </div>
        `;
    },

    // ============================================
    // TABELA DE ANIMAIS
    // ============================================
    animalTable(animais) {
        if (!animais || animais.length === 0) {
            return `<p class="text-muted text-center">Nenhum animal cadastrado.</p>`;
        }

        let html = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Brinco</th>
                            <th>Nome</th>
                            <th>Sexo</th>
                            <th>Raça</th>
                            <th>Peso</th>
                            <th>Idade</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        animais.forEach(a => {
            const sexo = a.sexo === 'F' ? '♀️ Fêmea' : '♂️ Macho';
            const status = a.ativo ? '<span class="badge badge-success">Ativo</span>' :
                '<span class="badge badge-danger">Inativo</span>';

            html += `
                <tr>
                    <td><strong>${a.brinco}</strong></td>
                    <td>${a.nome}</td>
                    <td>${sexo}</td>
                    <td>${a.raca || 'N/A'}</td>
                    <td>${a.peso.toFixed(1)} kg</td>
                    <td>${a.idade || 0} anos</td>
                    <td>${status}</td>
                    <td>
                        <div class="actions">
                            <button class="btn btn-sm btn-primary" onclick="app.editarAnimal(${a.brinco})">✏️</button>
                            <button class="btn btn-sm btn-danger" onclick="app.deletarAnimal(${a.brinco})">🗑️</button>
                            <button class="btn btn-sm btn-info" onclick="app.verArvore(${a.brinco})">🌳</button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        return html;
    },

    // ============================================
    // TABELA DE PRODUÇÕES
    // ============================================
    producaoTable(producoes) {
        if (!producoes || producoes.length === 0) {
            return `<p class="text-muted text-center">Nenhuma produção registrada.</p>`;
        }

        const totalLitros = producoes.reduce((sum, p) => sum + p.litros, 0);

        let html = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Animal</th>
                            <th>Data</th>
                            <th>Período</th>
                            <th>Litros</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        producoes.forEach(p => {
            const periodo = {
                'Manha': '🌅 Manhã',
                'Tarde': '☀️ Tarde',
                'Noite': '🌙 Noite'
            } [p.periodo] || p.periodo;

            html += `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.animal?.nome || p.animal_brinco}</td>
                    <td>${new Date(p.data_coleta).toLocaleDateString()}</td>
                    <td>${periodo}</td>
                    <td><strong>${p.litros.toFixed(1)} L</strong></td>
                    <td>
                        <div class="actions">
                            <button class="btn btn-sm btn-primary" onclick="app.editarProducao(${p.id})">✏️</button>
                            <button class="btn btn-sm btn-danger" onclick="app.deletarProducao(${p.id})">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="4" style="text-align:right;font-weight:600;">Total:</td>
                            <td style="font-weight:700;color:var(--primary);">${totalLitros.toFixed(1)} L</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

        return html;
    },

    // ============================================
    // TABELA DE USUÁRIOS
    // ============================================
    userTable(users) {
        if (!users || users.length === 0) {
            return `<p class="text-muted text-center">Nenhum usuário cadastrado.</p>`;
        }

        let html = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Perfil</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        users.forEach(u => {
            const role = u.role === 'Admin' ?
                '<span class="badge badge-danger">Admin</span>' :
                '<span class="badge badge-info">Cliente</span>';

            const status = u.ativo ?
                '<span class="badge badge-success">Ativo</span>' :
                '<span class="badge badge-danger">Inativo</span>';

            html += `
                <tr>
                    <td><strong>${u.nome}</strong></td>
                    <td>${u.email}</td>
                    <td>${role}</td>
                    <td>${status}</td>
                    <td>
                        <div class="actions">
                            <button class="btn btn-sm btn-warning" onclick="app.toggleUserStatus('${u.id}')">🔄</button>
                            <button class="btn btn-sm btn-danger" onclick="app.deletarUsuario('${u.id}')">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        return html;
    },

    // ============================================
    // ÁRVORE GENEALÓGICA
    // ============================================
    arvoreGenealogica(data) {
        if (!data) return '<p class="text-muted">Dados não disponíveis.</p>';

        const animal = data.animal;
        const pai = data.pai;
        const mae = data.mae;
        const filhos = data.filhos || [];

        let html = `
            <div class="card">
                <h3>🌳 Árvore Genealógica - ${animal.nome} (Brinco: ${animal.brinco})</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:16px;">
                    <div class="card" style="text-align:center;">
                        <h4>${pai ? `👨 ${pai.nome}` : '❓ Pai não informado'}</h4>
                        ${pai ? `<p><small>Brinco: ${pai.brinco}</small></p>` : ''}
                        ${pai?.pai ? `<p><small>Avô: ${pai.pai.nome}</small></p>` : ''}
                        ${pai?.mae ? `<p><small>Avó: ${pai.mae.nome}</small></p>` : ''}
                    </div>
                    <div class="card" style="text-align:center;border:3px solid var(--primary);">
                        <h4>🐄 ${animal.nome}</h4>
                        <p><small>Brinco: ${animal.brinco}</small></p>
                        <p><small>${animal.sexo === 'F' ? '♀️ Fêmea' : '♂️ Macho'}</small></p>
                        <p><small>${new Date(animal.data_nascimento).toLocaleDateString()}</small></p>
                    </div>
                    <div class="card" style="text-align:center;">
                        <h4>${mae ? `👩 ${mae.nome}` : '❓ Mãe não informada'}</h4>
                        ${mae ? `<p><small>Brinco: ${mae.brinco}</small></p>` : ''}
                        ${mae?.pai ? `<p><small>Avô: ${mae.pai.nome}</small></p>` : ''}
                        ${mae?.mae ? `<p><small>Avó: ${mae.mae.nome}</small></p>` : ''}
                    </div>
                </div>
                ${filhos.length > 0 ? `
                    <div style="margin-top:20px;">
                        <h4>👶 Filhos (${filhos.length})</h4>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
                            ${filhos.map(f => `
                                <span class="badge badge-primary">${f.nome} (${f.brinco})</span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        return html;
    },

    // ============================================
    // DASHBOARD
    // ============================================
    dashboard(stats, topVacas, producaoDia) {
        let html = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">🐄</div>
                    <div class="stat-value">${stats.total || 0}</div>
                    <div class="stat-label">Total de Animais</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">♀️</div>
                    <div class="stat-value">${stats.totalFemea || 0}</div>
                    <div class="stat-label">Fêmeas</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">♂️</div>
                    <div class="stat-value">${stats.totalMacho || 0}</div>
                    <div class="stat-label">Machos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🥛</div>
                    <div class="stat-value">${(stats.producaoTotal || 0).toFixed(0)} L</div>
                    <div class="stat-label">Produção Total</div>
                </div>
            </div>
        `;

        // Top 5 vacas
        if (topVacas && topVacas.length > 0) {
            html += `
                <div class="card">
                    <div class="card-header">
                        <h2>🏆 Top 5 Vacas Produtoras</h2>
                    </div>
                    <ul style="list-style:none;padding:0;">
            `;
            topVacas.forEach((v, i) => {
                const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i] || '•';
                html += `
                    <li style="display:flex;justify-content:space-between;padding:8px 12px;border-bottom:1px solid #f0f0f0;">
                        <span>${medal} <strong>${v.nome}</strong></span>
                        <span style="font-weight:700;color:var(--primary);">${v.producao.toFixed(1)} L</span>
                    </li>
                `;
            });
            html += `
                    </ul>
                </div>
            `;
        }

        // Produção por dia
        if (producaoDia && producaoDia.length > 0) {
            html += `
                <div class="card">
                    <div class="card-header">
                        <h2>📈 Produção dos Últimos 7 Dias</h2>
                    </div>
                    <div style="display:flex;gap:8px;align-items:flex-end;height:150px;padding:8px 0;">
            `;
            const max = Math.max(...producaoDia.map(d => d.total), 1);
            producaoDia.forEach(d => {
                const height = (d.total / max) * 100;
                html += `
                    <div style="flex:1;display:flex;flex-direction:column;align-items:center;">
                        <div style="width:100%;background:var(--primary);border-radius:4px 4px 0 0;height:${Math.max(height, 5)}%;min-height:10px;"></div>
                        <span style="font-size:0.7rem;margin-top:4px;">${d.data}</span>
                        <span style="font-size:0.7rem;font-weight:600;">${d.total.toFixed(1)}</span>
                    </div>
                `;
            });
            html += `
                    </div>
                </div>
            `;
        }

        return html;
    }
};