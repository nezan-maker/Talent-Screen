declare global {
  namespace Express {
    interface Request {
      currentUserId?: string;
      currentUser?: {
        _id: string;
        user_name: string;
        user_email: string;
        company_name: string;
        isVerified: boolean;
      };
    }
  }
}

export {};
