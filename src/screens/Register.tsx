import React, { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase'; // путь к твоему файлу из Шага 3

export const Register: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        // Вызываем встроенную функцию регистрации Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // Передаем юзернейм в метаданные, чтобы наш SQL-триггер подхватил его в profiles
                data: {
                    username: username,
                },
            },
        });

        setLoading(false);

        if (error) {
            alert(`Ошибка: ${error.message}`);
        } else {
            alert('Успешно! Проверь почту (если включено подтверждение email) или попробуй войти.');
            console.log('Пользователь создан:', data);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', border: '1px solid #ccc' }}>
            <h2>Регистрация нового аккаунта</h2>
            <form onSubmit={handleRegister}>
                <div>
                    <label>Email:</label><br />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <br />
                <div>
                    <label>Пароль:</label><br />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <br />
                <div>
                    <label>Юзернейм (min 3 символа):</label><br />
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <br />
                <button type="submit" disabled={loading}>
                    {loading ? 'Загрузка...' : 'Зарегистрироваться'}
                </button>
            </form>
        </div>
    );
};
