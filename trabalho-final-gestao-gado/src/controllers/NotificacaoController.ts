import { Request, Response } from 'express';
import { friendlyMessage } from '../utils/errorMessage';

export class NotificacaoController {
  async getAlertas(_req: Request, res: Response): Promise<Response> {
    try {
      const alertas = [
        { id: 1, tipo: 'peso', mensagem: 'Animal 101 está com peso baixo', lido: false, criado_em: new Date() },
        { id: 2, tipo: 'producao', mensagem: 'Vaca 205 não produz há 3 dias', lido: false, criado_em: new Date() }
      ];

      return res.json({ success: true, data: alertas });
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar alertas',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }

  async marcarComoLido(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      return res.json({ success: true, message: `Alerta ${id} marcado como lido` });
    } catch (error) {
      console.error('Erro ao marcar alerta como lido:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao marcar alerta como lido',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }

  async enviarEmail(req: Request, res: Response): Promise<Response> {
    try {
      const { to, subject, message } = req.body;
      if (!to || !subject || !message) {
        return res.status(400).json({ success: false, message: 'Campos obrigatórios faltando' });
      }
      console.log(`📧 Enviando email para ${to}: ${subject}`);
      return res.json({ success: true, message: 'Email enviado com sucesso' });
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar email',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }

  async enviarWhatsApp(req: Request, res: Response): Promise<Response> {
    try {
      const { to, message } = req.body;
      if (!to || !message) {
        return res.status(400).json({ success: false, message: 'Campos obrigatórios faltando' });
      }
      console.log(`💬 Enviando WhatsApp para ${to}: ${message}`);
      return res.json({ success: true, message: 'WhatsApp enviado com sucesso' });
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar WhatsApp',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }

  async getConfig(_req: Request, res: Response): Promise<Response> {
    return res.json({
      success: true,
      data: {
        email: { enabled: true, smtp_host: 'smtp.gmail.com', smtp_port: 587 },
        whatsapp: { enabled: false }
      }
    });
  }

  async updateConfig(_req: Request, res: Response): Promise<Response> {
    try {
      return res.json({ success: true, message: 'Configurações atualizadas com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar configurações',
        error: friendlyMessage(error, 'Erro desconhecido')
      });
    }
  }
}
