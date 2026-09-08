// Service de notificações - versão simplificada
// Para usar email/whatsapp, instale as dependências

export class NotificacaoService {
  async enviarEmail(to: string, subject: string, html: string): Promise<void> {
    console.log(`📧 Enviando email para ${to}: ${subject}`);
    console.log(`📝 Conteúdo: ${html}`);
    // Implementação real com nodemailer:
    // 1. npm install nodemailer
    // 2. npm install -D @types/nodemailer
    // 3. Descomentar o código abaixo:
    /*
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html
    });
    */
  }

  async enviarWhatsApp(to: string, message: string): Promise<void> {
    console.log(`💬 Enviando WhatsApp para ${to}: ${message}`);
    // Implementação real com twilio:
    // 1. npm install twilio
    // 2. npm install -D @types/twilio
    // 3. Descomentar o código abaixo:
    /*
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: `whatsapp:${to}`
    });
    */
  }

  async getAlertas(): Promise<any[]> {
    return [
      {
        id: 1,
        tipo: 'peso',
        mensagem: 'Animal 101 está com peso baixo',
        lido: false,
        created_at: new Date()
      },
      {
        id: 2,
        tipo: 'producao',
        mensagem: 'Vaca 205 não produz há 3 dias',
        lido: false,
        created_at: new Date()
      }
    ];
  }

  async marcarComoLido(id: number): Promise<void> {
    console.log(`Alerta ${id} marcado como lido`);
  }
}