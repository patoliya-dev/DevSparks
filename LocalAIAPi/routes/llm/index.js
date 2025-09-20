import { Router } from "express";
import { chat } from "../../controllers/llm.js";

const router = Router();

router.post('/chat', chat)

export default router;
