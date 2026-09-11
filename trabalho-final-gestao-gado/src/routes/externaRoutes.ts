import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { ExternaController } from '../controllers/ExternaController';

const router = Router();
const externaController = new ExternaController();

// ViaCEP (público)
router.get('/cep/:cep', externaController.buscarCep.bind(externaController));

// Validação de CPF (público)
router.post('/validar/cpf', externaController.validarCpf.bind(externaController));

// Rotas protegidas
router.use(authMiddleware);

// Buscar endereço por CEP (autenticado)
router.get('/endereco/:cep', externaController.buscarEndereco.bind(externaController));

export default router;
