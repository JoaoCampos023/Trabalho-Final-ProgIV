import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { NotificacaoController } from '../controllers/NotificacaoController';

const router = Router();
const notificacaoController = new NotificacaoController();

router.use(authMiddleware);

// Alertas
router.get('/alertas', notificacaoController.getAlertas.bind(notificacaoController));
router.put('/alertas/:id', notificacaoController.marcarComoLido.bind(notificacaoController));

// Envio de notificações
router.post('/email', notificacaoController.enviarEmail.bind(notificacaoController));
router.post('/whatsapp', notificacaoController.enviarWhatsApp.bind(notificacaoController));

// Configurações
router.get('/config', notificacaoController.getConfig.bind(notificacaoController));
router.put('/config', notificacaoController.updateConfig.bind(notificacaoController));

export default router;