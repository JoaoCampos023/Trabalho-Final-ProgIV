import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { RelatorioService, FiltrosProducao, FiltrosRebanho } from '../services/RelatorioService';
import { friendlyMessage } from '../utils/errorMessage';
import { DateUtils } from '../utils/dateUtils';

const relatorioService = new RelatorioService();

/** Normaliza params do Express (string | string[] | undefined → string). */
function getParam(v: unknown): string {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return getParam(v[0]);
  return '';
}

/** Extrai filtros de produção do query string. */
function parseFiltrosProducao(req: Request): FiltrosProducao {
  const f: FiltrosProducao = {};
  const ini = getParam(req.query.dataInicio);
  const fim = getParam(req.query.dataFim);
  const brinco = getParam(req.query.animalBrinco);
  const periodo = getParam(req.query.periodo);
  if (ini) f.dataInicio = new Date(ini);
  if (fim) f.dataFim = new Date(fim);
  if (brinco) f.animalBrinco = parseInt(brinco, 10);
  if (periodo === 'Manha' || periodo === 'Tarde' || periodo === 'Noite') f.periodo = periodo;
  return f;
}

function parseFiltrosRebanho(req: Request): FiltrosRebanho {
  const f: FiltrosRebanho = {};
  const sexo = getParam(req.query.sexo);
  const raca = getParam(req.query.raca);
  if (sexo === 'M' || sexo === 'F') f.sexo = sexo;
  if (raca) f.raca = raca;
  return f;
}

/** Descreve os filtros aplicados — vai no cabeçalho do PDF/Excel. */
function descreverFiltros(f: FiltrosProducao): string {
  const partes: string[] = [];
  if (f.dataInicio && f.dataFim) {
    partes.push(`Período: ${DateUtils.formatarDataBr(f.dataInicio)} a ${DateUtils.formatarDataBr(f.dataFim)}`);
  }
  if (f.animalBrinco) partes.push(`Animal: ${f.animalBrinco}`);
  if (f.periodo) partes.push(`Período do dia: ${f.periodo}`);
  return partes.length > 0 ? partes.join('  |  ') : 'Sem filtros (histórico completo)';
}

export class RelatorioController {
  /** GET /api/relatorios/producao — JSON com KPIs, lista, gráficos. */
  async getRelatorioProducao(req: Request, res: Response): Promise<Response> {
    try {
      const filtros = parseFiltrosProducao(req);
      const dados = await relatorioService.getRelatorioProducao(filtros);
      const serie = await relatorioService.getSerieDiaria(filtros);
      return res.json({ success: true, data: { ...dados, serieDiaria: serie } });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar relatório',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }

  /** GET /api/relatorios/rebanho — JSON com lista + agregados. */
  async getRelatorioRebanho(req: Request, res: Response): Promise<Response> {
    try {
      const filtros = parseFiltrosRebanho(req);
      const dados = await relatorioService.getRelatorioRebanho(filtros);
      return res.json({ success: true, data: dados });
    } catch (error) {
      console.error('Erro ao gerar relatório do rebanho:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar relatório do rebanho',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }

  /** GET /api/relatorios/graficos/producao — série diária. */
  async getDadosGraficoProducao(req: Request, res: Response): Promise<Response> {
    try {
      const filtros = parseFiltrosProducao(req);
      const dias = parseInt(getParam(req.query.dias), 10) || 7;
      const serie = await relatorioService.getSerieDiaria(filtros, dias);
      return res.json({ success: true, data: serie });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar dados do gráfico',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }

  // ============================================================
  // PDF
  // ============================================================

  /**
   * PDF do relatório de produção.
   *
   * Por que pdfkit: gera direto no servidor, sem headless browser. As tabelas
   * são simples (texto + números), então não vale o peso de HTML→PDF.
   */
  async exportarProducaoPDF(req: Request, res: Response): Promise<void> {
    try {
      const filtros = parseFiltrosProducao(req);
      const { producoes, stats, topAnimais } = await relatorioService.getRelatorioProducao(filtros);
      const serie = await relatorioService.getSerieDiaria(filtros);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio-producao-${DateUtils.hojeIso()}.pdf`);

      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      doc.pipe(res);

      // ---- Cabeçalho ----
      doc.fontSize(18).fillColor('#0d6efd').text('Gestão de Gado');
      doc.fontSize(14).fillColor('#333').text('Relatório de Produção de Leite');
      doc.fontSize(9).fillColor('#666').text(`Filtros: ${descreverFiltros(filtros)}`);
      doc.text(`Gerado em: ${DateUtils.formatarDataBr(new Date())}`);
      doc.moveDown();

      // ---- Resumo ----
      doc.fontSize(12).fillColor('#0d6efd').text('Resumo');
      doc.fontSize(10).fillColor('#333');
      doc.text(`Total de litros: ${stats.totalLitros.toFixed(1)} L`);
      doc.text(`Registros: ${stats.totalRegistros}`);
      doc.text(`Média por ordenha: ${stats.mediaPorOrdenha.toFixed(2)} L`);
      doc.text(`Média por vaca: ${stats.mediaPorVaca.toFixed(2)} L`);
      doc.text(`Vacas em produção: ${stats.vacasEmProducao}`);
      doc.text(`Dias com produção: ${stats.diasComProducao}`);
      if (stats.picoDia) {
        const [a, m, d] = stats.picoDia.split('-');
        doc.text(`Pico: ${stats.picoLitros.toFixed(1)} L em ${d}/${m}/${a}`);
      }
      doc.moveDown();

      // ---- Top 5 ----
      doc.fontSize(12).fillColor('#0d6efd').text('Top 5 Vacas Produtoras');
      doc.fontSize(10).fillColor('#333');
      topAnimais.forEach((v, i) => doc.text(`${i + 1}. ${v.nome} — ${v.total.toFixed(1)} L`));
      doc.moveDown();

      // ---- Série diária ----
      doc.fontSize(12).fillColor('#0d6efd').text('Produção por Dia');
      doc.fontSize(9).fillColor('#333');
      serie.forEach(d => {
        const [a, m, dia] = d.data.split('-');
        doc.text(`${dia}/${m}/${a}: ${d.total.toFixed(1)} L`);
      });
      doc.moveDown();

      // ---- Tabela ----
      doc.fontSize(12).fillColor('#0d6efd').text(`Produções (${producoes.length})`);
      doc.moveDown(0.5);

      const colX = [40, 130, 230, 310, 400];
      doc.fontSize(9).fillColor('#666');
      doc.text('ID', colX[0], doc.y, { width: 80 });
      doc.text('Animal', colX[1], doc.y, { width: 90 });
      doc.text('Data', colX[2], doc.y, { width: 80 });
      doc.text('Período', colX[3], doc.y, { width: 80 });
      doc.text('Litros', colX[4], doc.y, { width: 80 });
      doc.moveDown(0.3);
      doc.fillColor('#333');

      producoes.slice(0, 300).forEach(p => {
        const y = doc.y;
        doc.text(String(p.id), colX[0], y, { width: 80 });
        doc.text(p.animal?.nome || String(p.animal_brinco), colX[1], y, { width: 90 });
        doc.text(DateUtils.formatarDataBr(p.data_coleta), colX[2], y, { width: 80 });
        doc.text(p.periodo, colX[3], y, { width: 80 });
        doc.text(Number(p.litros).toFixed(1), colX[4], y, { width: 80 });
      });

      if (producoes.length > 300) {
        doc.moveDown();
        doc
          .fontSize(8)
          .fillColor('#999')
          .text(
            `Mostrando as 300 primeiras linhas de ${producoes.length}. Use a exportação Excel para a lista completa.`
          );
      }

      doc.end();
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erro ao exportar PDF',
          error: friendlyMessage(error, 'Erro desconhecido')
        });
      }
    }
  }

  /** PDF do rebanho: cabeçalho, resumo, distribuição por raça e lista. */
  async exportarRebanhoPDF(req: Request, res: Response): Promise<void> {
    try {
      const filtros = parseFiltrosRebanho(req);
      const { animais, stats, porRaca } = await relatorioService.getRelatorioRebanho(filtros);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio-rebanho-${DateUtils.hojeIso()}.pdf`);

      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      doc.pipe(res);

      doc.fontSize(18).fillColor('#0d6efd').text('Gestão de Gado');
      doc.fontSize(14).fillColor('#333').text('Relatório do Rebanho');

      const descFiltros: string[] = [];
      if (filtros.sexo) descFiltros.push(`Sexo: ${filtros.sexo === 'F' ? 'Fêmea' : 'Macho'}`);
      if (filtros.raca) descFiltros.push(`Raça: ${filtros.raca}`);

      doc
        .fontSize(9)
        .fillColor('#666')
        .text(`Filtros: ${descFiltros.length ? descFiltros.join('  |  ') : 'Sem filtros'}`);
      doc.text(`Gerado em: ${DateUtils.formatarDataBr(new Date())}`);
      doc.moveDown();

      doc.fontSize(12).fillColor('#0d6efd').text('Resumo');
      doc.fontSize(10).fillColor('#333');
      doc.text(`Total de animais: ${stats.total}`);
      doc.text(`Fêmeas: ${stats.totalFemea}`);
      doc.text(`Machos: ${stats.totalMacho}`);
      doc.text(`Peso médio: ${stats.pesoMedio.toFixed(1)} kg`);
      doc.moveDown();

      doc.fontSize(12).fillColor('#0d6efd').text('Distribuição por Raça');
      doc.fontSize(10).fillColor('#333');
      porRaca.forEach(r => doc.text(`${r.raca}: ${r.quantidade}`));
      doc.moveDown();

      doc.fontSize(12).fillColor('#0d6efd').text(`Animais (${animais.length})`);
      doc.moveDown(0.5);

      const colX = [40, 120, 220, 300, 380, 460];
      doc.fontSize(9).fillColor('#666');
      doc.text('Brinco', colX[0], doc.y, { width: 80 });
      doc.text('Nome', colX[1], doc.y, { width: 100 });
      doc.text('Sexo', colX[2], doc.y, { width: 80 });
      doc.text('Raça', colX[3], doc.y, { width: 80 });
      doc.text('Peso', colX[4], doc.y, { width: 80 });
      doc.text('Idade', colX[5], doc.y, { width: 80 });
      doc.moveDown(0.3);
      doc.fillColor('#333');

      animais.forEach(a => {
        const y = doc.y;
        const idade = DateUtils.calcularIdade(a.data_nascimento);
        doc.text(String(a.brinco), colX[0], y, { width: 80 });
        doc.text(a.nome, colX[1], y, { width: 100 });
        doc.text(a.sexo === 'F' ? 'Fêmea' : 'Macho', colX[2], y, { width: 80 });
        doc.text(a.raca || 'N/A', colX[3], y, { width: 80 });
        doc.text(`${Number(a.peso).toFixed(0)} kg`, colX[4], y, { width: 80 });
        doc.text(`${idade}`, colX[5], y, { width: 80 });
      });

      doc.end();
    } catch (error) {
      console.error('Erro ao exportar PDF do rebanho:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erro ao exportar PDF do rebanho',
          error: friendlyMessage(error, 'Erro desconhecido')
        });
      }
    }
  }

  // ============================================================
  // EXCEL
  // ============================================================

  /**
   * Excel do relatório de produção.
   *
   * Por que exceljs: gera .xlsx real, com múltiplas abas e cabeçalho
   * estilizado. O usuário abre no Excel/Sheets e já filtra direto.
   */
  async exportarProducaoExcel(req: Request, res: Response): Promise<void> {
    try {
      const filtros = parseFiltrosProducao(req);
      const { producoes, stats, topAnimais } = await relatorioService.getRelatorioProducao(filtros);
      const serie = await relatorioService.getSerieDiaria(filtros);

      const wb = new ExcelJS.Workbook();
      wb.creator = 'Gestão de Gado';
      wb.created = new Date();

      // ---- Aba Resumo ----
      const wsResumo = wb.addWorksheet('Resumo');
      wsResumo.columns = [
        { header: 'Indicador', key: 'k', width: 30 },
        { header: 'Valor', key: 'v', width: 25 }
      ];
      wsResumo.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      wsResumo.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0D6EFD' }
      };
      wsResumo.addRows([
        { k: 'Filtros', v: descreverFiltros(filtros) },
        { k: 'Total de litros', v: stats.totalLitros },
        { k: 'Registros', v: stats.totalRegistros },
        { k: 'Média por ordenha (L)', v: stats.mediaPorOrdenha },
        { k: 'Média por vaca (L)', v: stats.mediaPorVaca },
        { k: 'Vacas em produção', v: stats.vacasEmProducao },
        { k: 'Dias com produção', v: stats.diasComProducao },
        { k: 'Pico (L)', v: stats.picoLitros },
        { k: 'Dia do pico', v: stats.picoDia }
      ]);

      // ---- Aba Produções ----
      const wsProd = wb.addWorksheet('Produções');
      wsProd.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Brinco', key: 'brinco', width: 10 },
        { header: 'Animal', key: 'animal', width: 20 },
        { header: 'Data', key: 'data', width: 12 },
        { header: 'Período', key: 'periodo', width: 10 },
        { header: 'Litros', key: 'litros', width: 10 }
      ];
      wsProd.getRow(1).font = { bold: true };
      producoes.forEach(p => {
        wsProd.addRow({
          id: p.id,
          brinco: p.animal_brinco,
          animal: p.animal?.nome || '',
          data: DateUtils.formatarDataIso(p.data_coleta),
          periodo: p.periodo,
          litros: Number(p.litros)
        });
      });

      // ---- Aba Top Vacas ----
      const wsTop = wb.addWorksheet('Top Vacas');
      wsTop.columns = [
        { header: 'Posição', key: 'pos', width: 10 },
        { header: 'Animal', key: 'nome', width: 25 },
        { header: 'Litros', key: 'total', width: 12 }
      ];
      wsTop.getRow(1).font = { bold: true };
      topAnimais.forEach((v, i) => wsTop.addRow({ pos: i + 1, nome: v.nome, total: v.total }));

      // ---- Aba Série Diária ----
      const wsSerie = wb.addWorksheet('Série Diária');
      wsSerie.columns = [
        { header: 'Data', key: 'data', width: 12 },
        { header: 'Litros', key: 'total', width: 12 }
      ];
      wsSerie.getRow(1).font = { bold: true };
      serie.forEach(d => wsSerie.addRow({ data: d.data, total: d.total }));

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio-producao-${DateUtils.hojeIso()}.xlsx`);
      await wb.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erro ao exportar Excel',
          error: friendlyMessage(error, 'Erro desconhecido')
        });
      }
    }
  }

  /** Excel do rebanho: abas Resumo / Animais / Por Raça. */
  async exportarRebanhoExcel(req: Request, res: Response): Promise<void> {
    try {
      const filtros = parseFiltrosRebanho(req);
      const { animais, stats, porRaca } = await relatorioService.getRelatorioRebanho(filtros);

      const wb = new ExcelJS.Workbook();
      wb.creator = 'Gestão de Gado';

      const wsResumo = wb.addWorksheet('Resumo');
      wsResumo.columns = [
        { header: 'Indicador', key: 'k', width: 30 },
        { header: 'Valor', key: 'v', width: 20 }
      ];
      wsResumo.getRow(1).font = { bold: true };
      wsResumo.addRows([
        { k: 'Total de animais', v: stats.total },
        { k: 'Fêmeas', v: stats.totalFemea },
        { k: 'Machos', v: stats.totalMacho },
        { k: 'Peso médio (kg)', v: Number(stats.pesoMedio.toFixed(1)) }
      ]);

      const wsAnimais = wb.addWorksheet('Animais');
      wsAnimais.columns = [
        { header: 'Brinco', key: 'brinco', width: 10 },
        { header: 'Nome', key: 'nome', width: 20 },
        { header: 'Sexo', key: 'sexo', width: 8 },
        { header: 'Raça', key: 'raca', width: 18 },
        { header: 'Peso (kg)', key: 'peso', width: 12 },
        { header: 'Nascimento', key: 'nasc', width: 14 },
        { header: 'Idade', key: 'idade', width: 8 }
      ];
      wsAnimais.getRow(1).font = { bold: true };
      animais.forEach(a => {
        wsAnimais.addRow({
          brinco: a.brinco,
          nome: a.nome,
          sexo: a.sexo,
          raca: a.raca || '',
          peso: Number(a.peso),
          nasc: DateUtils.formatarDataIso(a.data_nascimento),
          idade: DateUtils.calcularIdade(a.data_nascimento)
        });
      });

      const wsRaca = wb.addWorksheet('Por Raça');
      wsRaca.columns = [
        { header: 'Raça', key: 'raca', width: 25 },
        { header: 'Quantidade', key: 'qtd', width: 12 }
      ];
      wsRaca.getRow(1).font = { bold: true };
      porRaca.forEach(r => wsRaca.addRow({ raca: r.raca, qtd: r.quantidade }));

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio-rebanho-${DateUtils.hojeIso()}.xlsx`);
      await wb.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Erro ao exportar Excel do rebanho:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erro ao exportar Excel do rebanho',
          error: friendlyMessage(error, 'Erro desconhecido')
        });
      }
    }
  }
}