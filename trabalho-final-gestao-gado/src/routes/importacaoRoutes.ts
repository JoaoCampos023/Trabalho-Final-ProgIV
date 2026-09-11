import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { ImportacaoController } from '../controllers/ImportacaoController';
import multer from 'multer';

const router = Router();
const importacaoController = new ImportacaoController();
const upload = multer({ dest: 'uploads/' });

router.use(authMiddleware);

// Exportação
router.get('/exportar/animais', importacaoController.exportarAnimais.bind(importacaoController));
router.get('/exportar/producoes', importacaoController.exportarProducoes.bind(importacaoController));
router.get('/exportar/rebanho', importacaoController.exportarRebanho.bind(importacaoController));

// Importação
router.post(
  '/importar/animais',
  upload.single('arquivo'),
  importacaoController.importarAnimais.bind(importacaoController)
);
router.post(
  '/importar/producoes',
  upload.single('arquivo'),
  importacaoController.importarProducoes.bind(importacaoController)
);

// Modelos
router.get('/modelos/animais', importacaoController.downloadModeloAnimais.bind(importacaoController));
router.get('/modelos/producoes', importacaoController.downloadModeloProducoes.bind(importacaoController));

export default router;
