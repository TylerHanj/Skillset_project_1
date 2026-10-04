import React, { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';

export function Login() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        setLoading(false);

        if (error) {
            alert(`Ошибка входа: ${error.message}`);
        } else {
            console.log('Успешный вход:', data);
        }
    };

    return (
        <div className="w-full max-w-sm rounded-sm border border-charcoal bg-surface p-6 shadow-sm">
            <h2 className="font-display text-xl font-extrabold tracking-tight text-charcoal mb-5 uppercase">
                Вход в аккаунт
            </h2>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                    <label className="block font-display text-[10px] font-bold tracking-widest text-muted-2 uppercase mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="your@email.com"
                        className="w-full rounded-sm border border-ui bg-transparent px-3 py-2 font-body text-sm text-ink outline-none focus:border-charcoal"
                    />
                </div>
                <div>
                    <label className="block font-display text-[10px] font-bold tracking-widest text-muted-2 uppercase mb-1">
                        Пароль
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full rounded-sm border border-ui bg-transparent px-3 py-2 font-body text-sm text-ink outline-none focus:border-charcoal"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 w-full rounded-sm bg-charcoal py-2.5 font-display text-xs font-bold tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                    {loading ? 'ВХОД...' : 'ВОЙТИ'}
                </button>
            </form>
        </div>
    );
}
