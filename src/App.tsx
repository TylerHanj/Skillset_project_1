import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Register } from './screens/Register';
import { LanguageProvider } from './lib/language';
import { Login } from './screens/Login';

import { AppShell } from './components/AppShell';
import { BottomNav } from './components/BottomNav';
import { formatClock } from './lib/calendar';
import {
  DEFAULT_PREFS,
  fetchMessages,
  fetchPrefs,
  fetchTasks,
  insertMessage,
  insertTask,
  savePrefs,
  updateTaskStatus,
  type UserPrefs,
} from './lib/db';
import { CalendarScreen } from './screens/CalendarScreen';
import { ChatScreen } from './screens/ChatScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import type { ChatMessage, NavTab, NewTaskInput, SettingItem, Task, TaskStatus } from './types';

function buildSettings(prefs: UserPrefs): SettingItem[] {
  return [
    { id: 'notifications', label: 'Notifications', toggle: true, on: prefs.notifications },
    { id: 'ai-mode', label: 'AI Study Mode', toggle: true, on: prefs.aiMode },
  ];
}

function welcomeMessage(name: string): ChatMessage {
  return {
    id: 0,
    role: 'ai',
    text: `Hello, ${name}. I'm your study assistant. Add your first task and I'll help you plan your week.`,
    time: formatClock(new Date()),
  };
}

function AppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [showLogin, setShowLogin] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [prefs, setPrefs] = useState<UserPrefs>(DEFAULT_PREFS);

  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const userId = session?.user?.id;
  const username: string = session?.user?.user_metadata?.username || 'Student';

  // Актуальные задачи для таймера ответа ИИ (чтобы не читать устаревшее замыкание).
  const tasksRef = useRef<Task[]>([]);
  tasksRef.current = tasks;
  // Текущий пользователь для отложенных колбэков (в замыкании userId может устареть).
  const userIdRef = useRef<string | undefined>(undefined);
  userIdRef.current = userId;

  // --- Сессия Supabase ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Данные ТЕКУЩЕГО пользователя. Перезагружаются при смене userId (вход/выход/смена аккаунта). ---
  useEffect(() => {
    // Любой выход или смена аккаунта: сразу чистим всё, чтобы не мелькали чужие данные.
    setTasks([]);
    setMessages([]);
    setPrefs(DEFAULT_PREFS);
    setChatLoading(false);
    setDataError(null);
    setActiveTab('home');

    if (!userId) {
      setDataLoading(false);
      return undefined;
    }

    let cancelled = false;
    setDataLoading(true);

    Promise.all([fetchTasks(), fetchMessages(), fetchPrefs()])
      .then(([loadedTasks, loadedMessages, loadedPrefs]) => {
        if (cancelled) return;
        setTasks(loadedTasks);
        setMessages(loadedMessages);
        setPrefs(loadedPrefs);
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setDataError(error.message);
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const reportError = useCallback((error: unknown) => {
    setDataError(error instanceof Error ? error.message : String(error));
  }, []);

  async function handleAddTask(input: NewTaskInput): Promise<void> {
    try {
      const created = await insertTask(input);
      setTasks((prev) => [created, ...prev]);
    } catch (error) {
      reportError(error);
    }
  }

  async function handleStatusChange(id: number, next: TaskStatus): Promise<void> {
    const previous = tasksRef.current.find((task) => task.id === id)?.status;
    // Оптимистично обновляем UI, при ошибке откатываем.
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status: next } : task)));
    try {
      await updateTaskStatus(id, next);
    } catch (error) {
      if (previous) {
        setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status: previous } : task)));
      }
      reportError(error);
    }
  }

  function handleSendMessage(text: string): void {
    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      text,
      time: formatClock(new Date()),
    };
    setMessages((prev) => [...prev, userMessage]);
    setChatLoading(true);
    insertMessage('user', text).catch(reportError);

    const sendingUserId = userId;
    window.setTimeout(() => {
      // Если за это время пользователь вышел/сменился — ответ не показываем и не сохраняем.
      if (sendingUserId !== userIdRef.current) return;
      const pending = tasksRef.current.filter((task) => task.status !== 'Done').length;
      const replyText = `Noted. You currently have ${pending} open task${pending === 1 ? '' : 's'}. I'll use your academic context to refine this once the LLM API is connected. For now: block 90 minutes for the highest-priority item, then review remaining deadlines tonight.`;
      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'ai',
        text: replyText,
        time: formatClock(new Date()),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setChatLoading(false);
      insertMessage('ai', replyText).catch(reportError);
    }, 1200);
  }

  function handleToggleSetting(id: string): void {
    if (!userId) return;
    const next: UserPrefs =
      id === 'notifications'
        ? { ...prefs, notifications: !prefs.notifications }
        : id === 'ai-mode'
          ? { ...prefs, aiMode: !prefs.aiMode }
          : prefs;
    if (next === prefs) return;
    const previous = prefs;
    setPrefs(next);
    savePrefs(userId, next).catch((error) => {
      setPrefs(previous);
      reportError(error);
    });
  }

  // --- Экран загрузки сессии ---
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', background: '#121212', color: '#fff' }}>
        <h3>Синхронизация профиля...</h3>
      </div>
    );
  }

  // --- Нет сессии: только вход/регистрация ---
  if (!session) {
    return (
      <AppShell>
        <main className="app-content min-h-0 overflow-y-auto bg-page">
          <div className="accent-bar" />
          <div className="mx-auto flex min-h-full w-full max-w-device flex-col px-6 py-7 sm:px-8 sm:py-9">
            <header className="flex shrink-0 items-center gap-3 border-b border-ui pb-5">
              <span className="h-2.5 w-2.5 bg-accent-red" aria-hidden="true" />
              <div>
                <p className="font-display text-[10px] font-bold tracking-[0.16em] text-charcoal">EDU NAVIGATOR</p>
                <p className="mt-0.5 font-body text-[10px] text-muted-2">AI STUDY PLANNER</p>
              </div>
            </header>
            <div className="flex flex-1 items-center justify-center py-7">
              {showLogin ? <Login /> : <Register />}
            </div>
            <footer className="shrink-0 border-t border-ui pt-5 text-center">
              <p className="font-body text-[12px] text-slate">
                {showLogin ? 'New to Skillset?' : 'Already have an account?'}
              </p>
              <button type="button" onClick={() => setShowLogin(!showLogin)}
                className="mt-2 bg-transparent font-display text-[10px] font-bold tracking-widest text-charcoal underline decoration-accent-red decoration-2 underline-offset-4 hover:text-accent-red">
                {showLogin ? 'CREATE AN ACCOUNT' : 'SIGN IN'}
              </button>
            </footer>
          </div>
        </main>
      </AppShell>
    );
  }

  // --- Загрузка данных пользователя ---
  if (dataLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', background: '#121212', color: '#fff' }}>
        <h3>Loading your data...</h3>
      </div>
    );
  }

  const chatMessages = messages.length === 0 ? [welcomeMessage(username)] : messages;

  return (
    <AppShell>
      {dataError ? (
        <div
          role="alert"
          onClick={() => setDataError(null)}
          style={{ background: '#b00020', color: '#fff', padding: '8px 16px', fontSize: 12, cursor: 'pointer' }}
        >
          Ошибка данных: {dataError} (нажми, чтобы скрыть)
        </div>
      ) : null}
      <div className="app-content">
        {activeTab === 'home' ? (
          <HomeScreen tasks={tasks} onAddTask={handleAddTask} onStatusChange={handleStatusChange} />
        ) : null}
        {activeTab === 'calendar' ? <CalendarScreen tasks={tasks} /> : null}
        {activeTab === 'chat' ? (
          <ChatScreen messages={chatMessages} loading={chatLoading} onSend={handleSendMessage} />
        ) : null}
        {activeTab === 'profile' ? (
          <ProfileScreen
            tasks={tasks}
            settings={buildSettings(prefs)}
            onToggleSetting={handleToggleSetting}
            session={session}
          />
        ) : null}
      </div>
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </AppShell>
  );
}

export default function App() { return <LanguageProvider><AppContent /></LanguageProvider>; }
