import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/auth';
import { roleMiddleware } from '../middlewares/role';

const router = Router();
const userController = new UserController();

// ============================================
// ROTAS PÚBLICAS (não requerem autenticação)
// ============================================

// Nenhuma rota pública para usuários (criação é feita via registro)

// ============================================
// ROTAS PROTEGIDAS (requerem autenticação)
// ============================================

// Todas as rotas de usuário requerem autenticação
router.use(authMiddleware);

// ============================================
// ROTAS ADMIN (requerem role Admin)
// ============================================

// Listar todos os usuários (Admin)
router.get('/', roleMiddleware(['Admin']), userController.listarTodos.bind(userController));

// IMPORTANTE: rotas literais de um segmento (/paginated, /stats, ...)
// precisam vir ANTES de '/:id', senão o Express casa "stats"/"paginated"
// como se fosse o valor de :id e a rota nunca é alcançada.

// Listar com paginação e filtros (Admin)
router.get('/paginated', roleMiddleware(['Admin']), userController.listarComFiltros.bind(userController));

// Estatísticas de usuários (Admin)
router.get('/stats', roleMiddleware(['Admin']), userController.getStats.bind(userController));

// Buscar usuário por ID (Admin)
router.get('/:id', roleMiddleware(['Admin']), userController.buscarPorId.bind(userController));

// Criar usuário (Admin)
router.post('/', roleMiddleware(['Admin']), userController.criar.bind(userController));

// Atualizar usuário (Admin)
router.put('/:id', roleMiddleware(['Admin']), userController.atualizar.bind(userController));

// Ativar/Desativar usuário (Admin)
router.patch('/:id/toggle-status', roleMiddleware(['Admin']), userController.toggleStatus.bind(userController));

// Resetar senha (Admin)
router.post('/:id/reset-password', roleMiddleware(['Admin']), userController.resetarSenha.bind(userController));

// Excluir usuário (Admin)
router.delete('/:id', roleMiddleware(['Admin']), userController.excluir.bind(userController));

export default router;
