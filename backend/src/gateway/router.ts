import express, { Router } from 'express';
import { supabaseAdmin } from "../database/supabase";
import { requireAuth } from "./middleware/auth";

// Central router, controllers mount here
// Each controller groups related endpoints (plaid, webhooks, transactions etc)
const router: Router = express.Router();

// GET /api/me - returns the current user's profile
router.get("/me", requireAuth, async( req, res, next) => {
  try{
    const {data, error} = await supabaseAdmin
      .from("profiles")
      .select("id, name, pay_frequency, estimated_monthly_income, next_payday, setup_complete")
      .eq("id", req.userId)
      .single()

    if( error ){
      next(error);
      return;
    }

    if( !data ){
      res.status(404).json({
        error: {
          code: "PROFILE_NOT_FOUND",
          message: "Profile not found for this user:,"
        },
      });
      return;
    }

    res.json(data);
  } catch (err){
    next(err);
  }
});

export default router;