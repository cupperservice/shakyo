"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // 簡単な認証（実際のアプリでは適切な認証システムを使用）
    if (email === "admin@example.com" && password === "password") {
      // ログイン成功
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", email);
      router.push("/");
    } else {
      setError("メールアドレスまたはパスワードが正しくありません");
    }

    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // メールアドレス確認
    if (email !== confirmEmail) {
      setError("メールアドレスが一致しません");
      setIsLoading(false);
      return;
    }

    // 簡単な登録処理（実際のアプリでは適切な登録システムを使用）
    if (email && confirmEmail) {
      // 登録成功
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", email);
      router.push("/");
    } else {
      setError("すべての項目を入力してください");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Shakyo
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isRegisterMode ? "アカウントを作成してください" : "アカウントにログインしてください"}
          </p>
        </div>

        {/* モード切り替えボタン */}
        <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <button
            onClick={() => {
              setIsRegisterMode(false);
              setError("");
              setEmail("");
              setPassword("");
              setConfirmEmail("");
            }}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !isRegisterMode
                ? 'bg-indigo-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ログイン
          </button>
          <button
            onClick={() => {
              setIsRegisterMode(true);
              setError("");
              setEmail("");
              setPassword("");
              setConfirmEmail("");
            }}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isRegisterMode
                ? 'bg-indigo-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            新規登録
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={isRegisterMode ? handleRegister : handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {!isRegisterMode && (
              <div>
                <label htmlFor="password" className="sr-only">
                  パスワード
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="パスワード"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            {isRegisterMode && (
              <div>
                <label htmlFor="confirmEmail" className="sr-only">
                  メールアドレス確認
                </label>
                <input
                  id="confirmEmail"
                  name="confirmEmail"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="メールアドレス確認"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (isRegisterMode ? "登録中..." : "ログイン中...") : (isRegisterMode ? "登録" : "ログイン")}
            </button>
          </div>

          {!isRegisterMode && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                デモ用アカウント: admin@example.com / password
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 