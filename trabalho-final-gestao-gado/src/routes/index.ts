import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import animalRoutes from './animalRoutes';
import producaoRoutes from './producaoRoutes';
import relatorioRoutes from './relatorioRoutes';
import notificacaoRoutes from './notificacaoRoutes';
import importacaoRoutes from './importacaoRoutes';
import externaRoutes from './externaRoutes';

const router = Router();

// Rotas públicas (autenticação)
router.use('/auth', authRoutes);

// Rotas protegidas (requerem autenticação)
router.use('/users', userRoutes);
router.use('/animais', animalRoutes);
router.use('/producoes', producaoRoutes);
router.use('/relatorios', relatorioRoutes);
router.use('/notificacoes', notificacaoRoutes);
router.use('/importacao', importacaoRoutes);
router.use('/externa', externaRoutes);

export default router;
