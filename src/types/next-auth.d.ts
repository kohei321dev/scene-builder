import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      authProvider?: string;
      githubLogin?: string;
      githubId?: string;
      googleEmail?: string;
      googleId?: string;
      role?: "owner" | "guest";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    authProvider?: string;
    githubLogin?: string;
    githubId?: string;
    googleEmail?: string;
    googleId?: string;
    role?: "owner" | "guest";
  }
}
