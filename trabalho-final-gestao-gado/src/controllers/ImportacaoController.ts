import { Request, Response } from 'express';
import prisma from '../config/database';
import fs from 'fs';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { friendlyMessage } from '../utils/errorMessage';
import { DateUtils } from '../utils/dateUtils';

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export class ImportacaoController {
  async exportarAnimais(_req: Request, res: Response): Promise<Response> {
    try {
      const animais = await prisma.animal.findMany({
        where: { ativo: true },
        orderBy: { brinco: 'asc' }
      });

      const csvData = animais.map(a => ({
        brinco: a.brinco,
        nome: a.nome,
        sexo: a.sexo,
        raca: a.raca || '',
        peso: Number(a.peso),
        data_nascimento: a.data_nascimento.toISOString().split('T')[0],
        ativo: a.ativo ? 'Sim' : 'Não'
      }));

      const csv = await new Promise<string>((resolve, reject) => {
        stringify(csvData, { header: true }, (err, output) => {
          if (err) reject(err);
          else resolve(output);
        });
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=animais_${DateUtils.formatarDataIso(new Date())}.csv`);
      return res.send(csv);
    } catch (error) {
      console.error('Erro ao exportar animais:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao exportar animais',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }

  async exportarProducoes(_req: Request, res: Response): Promise<Response> {
    try {
      const producoes = await prisma.producaoLeite.findMany({
        include: { animal: true },
        orderBy: { data_coleta: 'desc' }
      });

      const csvData = producoes.map(p => ({
        id: p.id,
        animal_brinco: p.animal_brinco,
        animal_nome: p.animal?.nome || 'Desconhecido',
        data_coleta: p.data_coleta.toISOString().split('T')[0],
        litros: Number(p.litros),
        periodo: p.periodo
      }));

      const csv = await new Promise<string>((resolve, reject) => {
        stringify(csvData, { header: true }, (err, output) => {
          if (err) reject(err);
          else resolve(output);
        });
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=producoes_${DateUtils.formatarDataIso(new Date())}.csv`
      );
      return res.send(csv);
    } catch (error) {
      console.error('Erro ao exportar produções:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao exportar produções',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }

  async exportarRebanho(req: Request, res: Response): Promise<Response> {
    return this.exportarAnimais(req, res);
  }

  async importarAnimais(req: MulterRequest, res: Response): Promise<Response> {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });
      }

      const fileContent = fs.readFileSync(req.file.path, 'utf-8');

      const records = await new Promise<any[]>((resolve, reject) => {
        parse(fileContent, { columns: true, skip_empty_lines: true, trim: true }, (err, records) => {
          if (err) reject(err);
          else resolve(records);
        });
      });

      const resultados = { sucesso: 0, erro: 0, erros: [] as string[] };

      for (const record of records) {
        try {
          await prisma.animal.create({
            data: {
              brinco: parseInt(record.brinco),
              nome: record.nome,
              sexo: record.sexo,
              raca: record.raca || null,
              peso: parseFloat(record.peso) || 0,
              data_nascimento: new Date(record.data_nascimento),
              ativo: record.ativo === 'Sim' || record.ativo === 'true'
            }
          });
          resultados.sucesso++;
        } catch (error) {
          resultados.erro++;
          resultados.erros.push(
            `Erro ao importar brinco ${record.brinco}: ${friendlyMessage(error, 'Erro desconhecido')}`
          );
        }
      }

      fs.unlinkSync(req.file.path);

      return res.json({ success: true, data: resultados });
    } catch (error) {
      console.error('Erro ao importar animais:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao importar animais',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }

  async importarProducoes(req: MulterRequest, res: Response): Promise<Response> {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });
      }

      const fileContent = fs.readFileSync(req.file.path, 'utf-8');

      const records = await new Promise<any[]>((resolve, reject) => {
        parse(fileContent, { columns: true, skip_empty_lines: true, trim: true }, (err, records) => {
          if (err) reject(err);
          else resolve(records);
        });
      });

      const resultados = { sucesso: 0, erro: 0, erros: [] as string[] };

      for (const record of records) {
        try {
          await prisma.producaoLeite.create({
            data: {
              animal_brinco: parseInt(record.animal_brinco),
              data_coleta: new Date(record.data_coleta),
              litros: parseFloat(record.litros) || 0,
              periodo: record.periodo || 'Manha'
            }
          });
          resultados.sucesso++;
        } catch (error) {
          resultados.erro++;
          resultados.erros.push(`Erro ao importar produção: ${friendlyMessage(error, 'Erro desconhecido')}`);
        }
      }

      fs.unlinkSync(req.file.path);

      return res.json({ success: true, data: resultados });
    } catch (error) {
      console.error('Erro ao importar produções:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao importar produções',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }

  async downloadModeloAnimais(_req: Request, res: Response): Promise<Response> {
    try {
      const headers = ['brinco', 'nome', 'sexo', 'raca', 'peso', 'data_nascimento', 'ativo'];
      const sample = [['1', 'Exemplo', 'F', 'Holandesa', '450', '2020-05-15', 'Sim']];

      const csv = await new Promise<string>((resolve, reject) => {
        stringify(sample, { header: true, columns: headers }, (err, output) => {
          if (err) reject(err);
          else resolve(output);
        });
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=modelo_animais.csv');
      return res.send(csv);
    } catch (error) {
      console.error('Erro ao baixar modelo:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao baixar modelo',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }

  async downloadModeloProducoes(_req: Request, res: Response): Promise<Response> {
    try {
      const headers = ['animal_brinco', 'data_coleta', 'litros', 'periodo'];
      const sample = [['1', '2026-09-08', '15.5', 'Manha']];

      const csv = await new Promise<string>((resolve, reject) => {
        stringify(sample, { header: true, columns: headers }, (err, output) => {
          if (err) reject(err);
          else resolve(output);
        });
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=modelo_producoes.csv');
      return res.send(csv);
    } catch (error) {
      console.error('Erro ao baixar modelo:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao baixar modelo',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }
}
