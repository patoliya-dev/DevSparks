import { Router } from "express";
import llm from './llm/index.js';

const router = Router();

router.use('/llm', llm)

export default router;