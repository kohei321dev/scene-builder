"use client";

import { signIn, signOut } from "next-auth/react";
import { Github, LogOut, Mail } from "lucide-react";
import { useState } from "react";

type SignInButtonsProps = {
  allowGitHub: boolean;
  allowGoogle: boolean;
};

export function SignInButtons({ allowGitHub, allowGoogle }: SignInButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<"github" | "google" | null>(
    null,
  );

  return (
    <div className="auth-button-stack">
      {allowGitHub ? (
        <button
          className="primary-button"
          disabled={Boolean(loadingProvider)}
          onClick={() => {
            setLoadingProvider("github");
            void signIn("github", { callbackUrl: "/" });
          }}
        >
          <Github aria-hidden="true" size={18} />
          {loadingProvider === "github" ? "GitHubへ移動中" : "GitHubでログイン"}
        </button>
      ) : null}
      {allowGoogle ? (
        <button
          className="secondary-button"
          disabled={Boolean(loadingProvider)}
          onClick={() => {
            setLoadingProvider("google");
            void signIn("google", { callbackUrl: "/" });
          }}
        >
          <Mail aria-hidden="true" size={18} />
          {loadingProvider === "google" ? "Googleへ移動中" : "Googleでゲストログイン"}
        </button>
      ) : null}
    </div>
  );
}

export function SignOutButton() {
  return (
    <button className="icon-text-button" onClick={() => signOut({ callbackUrl: "/signin" })}>
      <LogOut aria-hidden="true" size={16} />
      ログアウト
    </button>
  );
}
