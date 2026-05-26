import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { SignInButton } from "@/components/sign-in-button";
import { authOptions, isOwnerSession, ownerGithubUsername } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    error?: string;
    setup?: string;
  }>;
};

function getAuthErrorMessage(error?: string): string | null {
  if (!error) {
    return null;
  }

  const messages: Record<string, string> = {
    AccessDenied: "このGitHubアカウントは許可されていません。",
    Callback: "GitHub認証の戻り処理に失敗しました。OAuth Appのcallback URLを確認してください。",
    Configuration: "認証設定に問題があります。Vercelの環境変数を確認してください。",
    OAuthCallback: "GitHub認証のcallback処理に失敗しました。",
    OAuthSignin: "GitHubの認証開始に失敗しました。",
  };

  return messages[error] ?? `ログインに失敗しました: ${error}`;
}

async function SignInContent({ searchParams }: Props) {
  const params = await searchParams;
  const needsSetup = params.setup === "1";
  const session = await getServerSession(authOptions);
  const authErrorMessage = getAuthErrorMessage(params.error);

  if (session && isOwnerSession(session)) {
    redirect("/");
  }

  if (session) {
    redirect("/denied");
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <h1>Scene Builder</h1>
        <p>
          GitHubログインで保護されています。現在は @{ownerGithubUsername}
          だけが閲覧できます。
        </p>
        {authErrorMessage ? <p className="error-note">{authErrorMessage}</p> : null}
        {needsSetup ? (
          <>
            <p>
              VercelにGitHub OAuth用の環境変数を設定するとログインできます。
            </p>
            <ul className="setup-list">
              <li>AUTH_GITHUB_ID</li>
              <li>AUTH_GITHUB_SECRET</li>
              <li>AUTH_SECRET</li>
              <li>OWNER_GITHUB_USERNAME=kohei321dev</li>
            </ul>
          </>
        ) : (
          <SignInButton />
        )}
      </section>
    </main>
  );
}

export default function SignInPage(props: Props) {
  return (
    <Suspense>
      <SignInContent {...props} />
    </Suspense>
  );
}
