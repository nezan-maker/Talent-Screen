import express from "express";
import dashBoardControl from "../controllers/dashboardControl.js";
const dashRoutes = () => {
  const router = express.Router();
  router.get("/dashboard", dashBoardControl);
  return router;
};
export default dashRoutes;
