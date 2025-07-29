import { Request, Response } from 'express';
import AuthService from '../services/auth.service';

export default class AuthController {
  static async register(req: Request, res: Response) {
    const result = await AuthService.register(req.body);
    res.status(result.success ? 201 : 400).json(result);
  }

  static async login(req: Request, res: Response) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    const result = await AuthService.login({ ...req.body, ip_address: ip, user_agent: userAgent });
    res.status(result.success ? 200 : 401).json(result);
  }

  static async refresh(req: Request, res: Response) {
    const result = await AuthService.refresh(req.body);
    res.status(result.success ? 200 : 401).json(result);
  }

  static async logout(req: Request, res: Response) {
    const result = await AuthService.logout(req.body);
    res.status(200).json(result);
  }

  static async forgotPassword(req: Request, res: Response) {
    const result = await AuthService.forgotPassword(req.body);
    res.status(200).json(result);
  }

  static async resetPassword(req: Request, res: Response) {
    const result = await AuthService.resetPassword(req.body);
    res.status(result.success ? 200 : 400).json(result);
  }

  static async validateResetToken(req: Request, res: Response) {
    const { token } = req.params;
    const result = await AuthService.validateResetToken(token);
    res.status(result.success ? 200 : 400).json(result);
  }
}
