"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isLoadingIndicator, setIsLoadingIndicator] = useState(false);
    
    const { resetPassword } = useAuth();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        
        if (!email) {
            setError("يرجى إدخال البريد الإلكتروني");
            return;
        }

        setIsLoadingIndicator(true);
        try {
            await resetPassword(email);
            setSuccessMessage("تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح.");
        } catch (err: unknown) {
            const error = err as Error & { code?: string; message?: string };
            if (error.code === 'auth/user-not-found') {
                setError("لا يوجد حساب مسجل بهذا البريد الإلكتروني");
            } else if (error.code === 'auth/invalid-email') {
                setError("صيغة البريد الإلكتروني غير صحيحة");
            } else {
                setError(error.message || "حدث خطأ أثناء العملية");
            }
        } finally {
            setIsLoadingIndicator(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] p-4 text-white" dir="rtl">
            <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 shadow-2xl text-center">
                <div className="mb-8 relative">
                    <Link href="/login" className="absolute -right-4 -top-4 p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10">
                        <ArrowRight size={24} />
                    </Link>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-3 mt-4">
                        استعادة كلمة المرور
                    </h1>
                    <p className="text-slate-400 text-sm">أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.</p>
                </div>

                {successMessage ? (
                    <div className="flex flex-col items-center justify-center py-6 animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 size={64} className="text-green-400 mb-4" />
                        <p className="text-green-400 text-center text-sm leading-relaxed mb-6">
                            {successMessage}
                        </p>
                        <Link href="/login" className="w-full text-center bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-xl transition-all duration-300">
                            العودة لتسجيل الدخول
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleReset} className="space-y-4 mb-6 text-right">
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

                        <button
                            type="submit"
                            disabled={isLoadingIndicator}
                            className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white font-bold py-3.5 rounded-xl hover:bg-blue-600 transition-all duration-300 shadow-lg shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                        >
                            {isLoadingIndicator ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            ) : (
                                <span>إرسال رابط الاستعادة</span>
                            )}
                        </button>
                    </form>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
