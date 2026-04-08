"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, LogIn } from "lucide-react";

export default function LoginPage() {
    const [error, setError] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoadingIndicator, setIsLoadingIndicator] = useState(false);
    
    const { loginWithGoogle, loginWithEmail, user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push("/");
        }
    }, [user, loading, router]);

    const handleGoogleLogin = async () => {
        setError("");
        try {
            await loginWithGoogle();
            router.push("/");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "فشل تسجيل الدخول عبر جوجل");
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
            return;
        }
        setIsLoadingIndicator(true);
        setError("");
        try {
            await loginWithEmail(email, password);
            router.push("/");
        } catch (err: unknown) {
            const error = err as Error & { code?: string; message?: string };
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
            } else {
                setError(error.message || "حدث خطأ أثناء تسجيل الدخول");
            }
        } finally {
            setIsLoadingIndicator(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#0f172a] via-[#1e293b] to-[#334155] p-4 text-white" dir="rtl">
            <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-4xl p-10 shadow-2xl text-center">
                <div className="mb-8">
                    <h1 className="text-5xl font-black bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-purple-500 mb-4">
                        MyTO-DO
                    </h1>
                    <p className="text-slate-400 font-medium">سجل دخولك لتبدأ تنظيم يومك</p>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-4 mb-6 text-right">
                    <div>
                        <label className="block text-sm text-slate-300 mb-2 ml-1">البريد الإلكتروني</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pr-10 pl-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
                                placeholder="name@example.com"
                                dir="ltr"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm text-slate-300 ml-1">كلمة المرور</label>
                            <Link href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                هل نسيت كلمة المرور؟
                            </Link>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pr-10 pl-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
                                placeholder="••••••••"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoadingIndicator}
                        className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white font-bold py-3.5 rounded-xl hover:bg-blue-600 transition-all duration-300 shadow-lg shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {isLoadingIndicator ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <span>تسجيل الدخول</span>
                                <LogIn size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="relative flex items-center py-5">
                    <div className="grow border-t border-slate-700"></div>
                    <span className="shrink-0 mx-4 text-slate-500 text-sm">أو</span>
                    <div className="grow border-t border-slate-700"></div>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="group relative w-full flex items-center justify-center gap-4 bg-white text-slate-900 font-bold py-3.5 rounded-xl hover:bg-slate-100 transition-all duration-300 shadow-lg active:scale-[0.98]"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    المتابعة عبر المزامنة بجوجل
                </button>

                {error && (
                    <div className="mt-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="mt-8 text-slate-400 text-sm">
                    لا تمتلك حساباً؟{" "}
                    <Link href="/register" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                        سجل الآن
                    </Link>
                </div>
            </div>
        </div>
    );
}
