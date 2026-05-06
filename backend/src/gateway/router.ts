import { Router } from 'express'

// Central router — all controllers mount here
// Each controller groups related endpoints (plaid, webhooks, transactions etc)
const router = Router()

// Controllers will be mounted here as we build each phase
// e.g. router.use('/plaid', plaidRouter)

export default router