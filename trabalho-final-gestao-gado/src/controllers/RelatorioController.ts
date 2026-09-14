import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { RelatorioService, FiltrosProducao, FiltrosRebanho } from '../services/RelatorioService';
import { friendlyMessage } from '../utils/errorMessage';
import { DateUtils } from '../utils/dateUtils';

const relatorioService = new RelatorioService();

// ---------------------------------------------------------------------------
// Constantes de layout do PDF (em pontos; 1 pt = 1/72 pol).
// Centralizar aqui evita "número mágico" espalhado pelo código quando
// alguém precisar ajustar o layout depois.
// ---------------------------------------------------------------------------
const PAGE_MARGIN = 40;
const LINE_HEIGHT = 16;      // altura padrão de uma linha de tabela
const HEADER_FONT_SIZE = 9;
const BODY_FONT_SIZE = 9;

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

/**
 * Desenha o cabeçalho de uma seção (título azul em negrito).
 * Devolve o Y depois do cabeçalho, para o chamador continuar de onde parou.
 */
function desenharTituloSecao(doc: PDFKit.PDFDocument, titulo: string): number {
  doc.fontSize(12).fillColor('#0d6efd').text(titulo, PAGE_MARGIN, doc.y);
  doc.moveDown(0.4);
  doc.fillColor('#333');
  return doc.y;
}

/**
 * Desenha uma linha de tabela com colunas em X fixo.
 *
 * Por que assim: `pdfkit` não tem "tabela" nativa. O jeito correto de alinhar
 * colunas é chamar `doc.text()` passando a posição X de cada célula, e depois
 * avançar o Y manualmente. Sem isso, as células ficam empilhadas na mesma Y e
 * o texto sai grudado ("IDAnimalDataPeríodoLitros...").
 *
 * Devolve o novo Y para o chamador continuar de onde parou.
 */
function desenharLinhaTabela(
  doc: PDFKit.PDFDocument,
  valores: string[],
  colunas: { x: number; width: number }[]
): number {
  const y = doc.y;
  valores.forEach((valor, i) => {
    // O parâmetro `lineBreak: false` impede o pdfkit de quebrar o texto em
    // múltiplas linhas — queremos uma linha só por célula, com o texto
    // truncado se não couber (raro, mas seguro).
    doc.text(valor, colunas[i].x, y, { width: colunas[i].width, lineBreak: false });
  });
  return y + LINE_HEIGHT;
}

/**
 * Verifica se ainda cabe uma linha de altura `altura` na página atual.
 * Se não couber, cria nova página e devolve `true` (indicando que o chamador
 * precisa reimprimir o cabeçalho da tabela).
 *
 * Por que existe: sem isso, o pdfkit corta no meio da linha quando o texto
 * passa da margem inferior — foi o que produziu as páginas 2-6 do PDF
 * quebrado (com fragmentos como "87", "Bonita", "07/09/2026").
 */
function precisaNovaPagina(doc: PDFKit.PDFDocument, altura = LINE_HEIGHT): boolean {
  const limite = doc.page.height - PAGE_MARGIN;
  if (doc.y + altura > limite) {
    doc.addPage();
    return true;
  }
  return false;
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

  /** PDF do relatório de produção — reescrito com tabela alinhada e paginação. */
  async exportarProducaoPDF(req: Request, res: Response): Promise<void> {
    try {
      const filtros = parseFiltrosProducao(req);
      const { producoes, stats, topAnimais } = await relatorioService.getRelatorioProducao(filtros);
      const serie = await relatorioService.getSerieDiaria(filtros);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio-producao-${DateUtils.hojeIso()}.pdf`);

      const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN });
      doc.pipe(res);

      // Fonte base. Fixar explicitamente evita que o pdfkit use fonte
      // diferente para caracteres especiais e gere aquela linha de lixo
      // Unicode que apareceu na primeira página do PDF quebrado.
      doc.font('Helvetica');

      // ---------- Cabeçalho ----------
      doc.fontSize(18).fillColor('#0d6efd').text('Gestão de Gado', PAGE_MARGIN, PAGE_MARGIN);
      doc.fontSize(14).fillColor('#333').text('Relatório de Produção de Leite');
      doc.fontSize(9).fillColor('#666').text(`Filtros: ${descreverFiltros(filtros)}`);
      doc.text(`Gerado em: ${DateUtils.formatarDataBr(new Date())}`);
      doc.moveDown(1);

      // ---------- Resumo ----------
      desenharTituloSecao(doc, 'Resumo');
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
      doc.moveDown(1);

      // ---------- Top 5 ----------
      desenharTituloSecao(doc, 'Top 5 Vacas Produtoras');
      doc.fontSize(10).fillColor('#333');
      topAnimais.forEach((v, i) => doc.text(`${i + 1}. ${v.nome} — ${v.total.toFixed(1)} L`));
      doc.moveDown(1);

      // ---------- Série diária ----------
      desenharTituloSecao(doc, 'Produção por Dia');
      doc.fontSize(9).fillColor('#333');
      serie.forEach(d => {
        const [a, m, dia] = d.data.split('-');
        doc.text(`${dia}/${m}/${a}: ${d.total.toFixed(1)} L`);
      });
      doc.moveDown(1);

      // ---------- Tabela de produções ----------
      desenharTituloSecao(doc, `Produções (${producoes.length})`);

      // X e largura de cada coluna (em pontos, a partir da margem esquerda).
      // 40 = margem | 40+70=110 | 110+90=200 | 200+70=270 | 270+70=340
      const colunas = [
        { x: PAGE_MARGIN + 0, width: 60 },   // ID
        { x: PAGE_MARGIN + 70, width: 90 },  // Animal
        { x: PAGE_MARGIN + 170, width: 80 }, // Data
        { x: PAGE_MARGIN + 260, width: 70 }, // Período
        { x: PAGE_MARGIN + 340, width: 60 }  // Litros
      ];

      // Desenha o cabeçalho da tabela. `reimprimirCabecalho` é chamada
      // sempre que uma nova página é criada, para a tabela continuar
      // legível em PDFs com muitas linhas.
      const reimprimirCabecalho = () => {
        doc.fontSize(HEADER_FONT_SIZE).fillColor('#666').font('Helvetica-Bold');
        doc.y = desenharLinhaTabela(doc, ['ID', 'Animal', 'Data', 'Período', 'Litros'], colunas);
        doc.font('Helvetica').fillColor('#333').fontSize(BODY_FONT_SIZE);
      };
      reimprimirCabecalho();

      // Limite de 300 linhas para o PDF não virar 100 páginas. A lista
      // completa fica disponível no Excel.
      const MAX_LINHAS = 300;
      const linhas = producoes.slice(0, MAX_LINHAS);

      linhas.forEach(p => {
        // Se não couber mais uma linha, cria página nova e reimprime o
        // cabeçalho — aí a tabela continua legível em vez de quebrar no meio.
        if (precisaNovaPagina(doc)) reimprimirCabecalho();

        const linha = [
          String(p.id),
          (p.animal?.nome || String(p.animal_brinco)).slice(0, 14),
          DateUtils.formatarDataBr(p.data_coleta),
          p.periodo,
          Number(p.litros).toFixed(1)
        ];
        doc.y = desenharLinhaTabela(doc, linha, colunas);
      });

      if (producoes.length > MAX_LINHAS) {
        doc.moveDown(1);
        doc
          .fontSize(8)
          .fillColor('#999')
          .text(
            `Mostrando as ${MAX_LINHAS} primeiras linhas de ${producoes.length}. Use a exportação Excel para a lista completa.`
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

  /** PDF do rebanho — mesma correção de tabela alinhada. */
  async exportarRebanhoPDF(req: Request, res: Response): Promise<void> {
    try {
      const filtros = parseFiltrosRebanho(req);
      const { animais, stats, porRaca } = await relatorioService.getRelatorioRebanho(filtros);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio-rebanho-${DateUtils.hojeIso()}.pdf`);

      const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN });
      doc.pipe(res);
      doc.font('Helvetica');

      doc.fontSize(18).fillColor('#0d6efd').text('Gestão de Gado', PAGE_MARGIN, PAGE_MARGIN);
      doc.fontSize(14).fillColor('#333').text('Relatório do Rebanho');

      const descFiltros: string[] = [];
      if (filtros.sexo) descFiltros.push(`Sexo: ${filtros.sexo === 'F' ? 'Fêmea' : 'Macho'}`);
      if (filtros.raca) descFiltros.push(`Raça: ${filtros.raca}`);

      doc
        .fontSize(9)
        .fillColor('#666')
        .text(`Filtros: ${descFiltros.length ? descFiltros.join('  |  ') : 'Sem filtros'}`);
      doc.text(`Gerado em: ${DateUtils.formatarDataBr(new Date())}`);
      doc.moveDown(1);

      desenharTituloSecao(doc, 'Resumo');
      doc.fontSize(10).fillColor('#333');
      doc.text(`Total de animais: ${stats.total}`);
      doc.text(`Fêmeas: ${stats.totalFemea}`);
      doc.text(`Machos: ${stats.totalMacho}`);
      doc.text(`Peso médio: ${stats.pesoMedio.toFixed(1)} kg`);
      doc.moveDown(1);

      desenharTituloSecao(doc, 'Distribuição por Raça');
      doc.fontSize(10).fillColor('#333');
      porRaca.forEach(r => doc.text(`${r.raca}: ${r.quantidade}`));
      doc.moveDown(1);

      desenharTituloSecao(doc, `Animais (${animais.length})`);

      const colunas = [
        { x: PAGE_MARGIN + 0, width: 60 },   // Brinco
        { x: PAGE_MARGIN + 70, width: 120 }, // Nome
        { x: PAGE_MARGIN + 200, width: 60 }, // Sexo
        { x: PAGE_MARGIN + 270, width: 90 }, // Raça
        { x: PAGE_MARGIN + 370, width: 60 }, // Peso
        { x: PAGE_MARGIN + 440, width: 60 }  // Idade
      ];

      const reimprimirCabecalho = () => {
        doc.fontSize(HEADER_FONT_SIZE).fillColor('#666').font('Helvetica-Bold');
        doc.y = desenharLinhaTabela(doc, ['Brinco', 'Nome', 'Sexo', 'Raça', 'Peso', 'Idade'], colunas);
        doc.font('Helvetica').fillColor('#333').fontSize(BODY_FONT_SIZE);
      };
      reimprimirCabecalho();

      animais.forEach(a => {
        if (precisaNovaPagina(doc)) reimprimirCabecalho();
        const idade = DateUtils.calcularIdade(a.data_nascimento);
        doc.y = desenharLinhaTabela(
          doc,
          [
            String(a.brinco),
            a.nome.slice(0, 18),
            a.sexo === 'F' ? 'Fêmea' : 'Macho',
            (a.raca || 'N/A').slice(0, 14),
            `${Number(a.peso).toFixed(0)} kg`,
            `${idade}`
          ],
          colunas
        );
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

  /** Excel do relatório de produção (inalterado). */
  async exportarProducaoExcel(req: Request, res: Response): Promise<void> {
    try {
      const filtros = parseFiltrosProducao(req);
      const { producoes, stats, topAnimais } = await relatorioService.getRelatorioProducao(filtros);
      const serie = await relatorioService.getSerieDiaria(filtros);

      const wb = new ExcelJS.Workbook();
      wb.creator = 'Gestão de Gado';
      wb.created = new Date();

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

      const wsTop = wb.addWorksheet('Top Vacas');
      wsTop.columns = [
        { header: 'Posição', key: 'pos', width: 10 },
        { header: 'Animal', key: 'nome', width: 25 },
        { header: 'Litros', key: 'total', width: 12 }
      ];
      wsTop.getRow(1).font = { bold: true };
      topAnimais.forEach((v, i) => wsTop.addRow({ pos: i + 1, nome: v.nome, total: v.total }));

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

  /** Excel do rebanho (inalterado). */
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