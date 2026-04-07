"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User as UserIcon, UserPlus } from "lucide-react";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoadingIndicator, setIsLoadingIndicator] = useState(false);
    
    const { registerWithEmail, user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push("/");
        }
    }, [user, loading, router]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name || !email || !password || !confirmPassword) {
            setError("يرجى تعبئة جميع الحقول");
            return;
        }

        if (password !== confirmPassword) {
            setError("كلمات المرور غير متطابقة");
            return;
        }

        if (password.length < 6) {
            setError("يجب أن تكون كلمة المرور 6 أحرف على الأقل");
            return;
        }

        setIsLoadingIndicator(true);
        try {
            await registerWithEmail(name, email, password);
            router.push("/");
        } catch (err: unknown) {
            const error = err as Error & { code?: string; message?: string };
            if (error.code === 'auth/email-already-in-use') {
                setError("البريد الإلكتروني مسجل مسبقاً");
            } else if (error.code === 'auth/invalid-email') {
                setError("صيغة البريد الإلكتروني غير صحيحة");
            } else {
                setError(error.message || "حدث خطأ أثناء إنشاء الحساب");
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] p-4 text-white" dir="rtl">
            <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 shadow-2xl text-center">
                <div className="mb-8">
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-3">
                        حساب جديد
                    </h1>
                    <p className="text-slate-400 font-medium">أنشئ حسابك وابدأ بتنظيم مهامك</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4 mb-6 text-right">
                    <div>
                        <label className="block text-sm text-slate-300 mb-2 ml-1">الاسم الكامل</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                                <UserIcon size={18} />
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pr-10 pl-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
                                placeholder="محمد أحمد"
                            />
                        </div>
                    </div>

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
                        <label className="block text-sm text-slate-300 mb-2 ml-1">كلمة المرور</label>
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

                    <div>
                        <label className="block text-sm text-slate-300 mb-2 ml-1">تأكيد كلمة المرور</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pr-10 pl-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
                                placeholder="••••••••"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoadingIndicator}
                        className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white font-bold py-3.5 rounded-xl hover:bg-blue-600 transition-all duration-300 shadow-lg shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {isLoadingIndicator ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <span>إنشاء الحساب</span>
                                <UserPlus size={18} />
                            </>
                        )}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="mt-8 text-slate-400 text-sm">
                    لديك حساب بالفعل؟{" "}
                    <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                        تسجيل الدخول
                    </Link>
                </div>
            </div>
        </div>
    );
}
