import { useState } from 'react';
import { AppShell } from './components/AppShell';
import { BottomNav } from './components/BottomNav';
import { formatClock } from './lib/calendar';
import {
  INITIAL_MESSAGES,
  INITIAL_SETTINGS,
  INITIAL_TASKS,
} from './mockData';
import { CalendarScreen } from './screens/CalendarScreen';
import { ChatScreen } from './screens/ChatScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import type { ChatMessage, NavTab, NewTaskInput, SettingItem, Task, TaskStatus } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [chatLoading, setChatLoading] = useState(false);
  const [settings, setSettings] = useState<SettingItem[]>(INITIAL_SETTINGS);

  function handleAddTask(input: NewTaskInput): void {
    const task: Task = {
      id: Date.now(),
      ...input,
    };
    setTasks((prev) => [task, ...prev]);
  }

  function handleStatusChange(id: number, next: TaskStatus): void {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status: next } : task)));
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

    window.setTimeout(() => {
      const pending = tasks.filter((task) => task.status !== 'Done').length;
      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'ai',
        text: `Noted. You currently have ${pending} open task${pending === 1 ? '' : 's'}. I'll use your academic context to refine this once the LLM API is connected. For now: block 90 minutes for the highest-priority item, then review remaining deadlines tonight.`,
        time: formatClock(new Date()),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setChatLoading(false);
    }, 1200);
  }

  function handleToggleSetting(id: string): void {
    setSettings((prev) =>
      prev.map((item) => (item.id === id && item.toggle ? { ...item, on: !item.on } : item)),
    );
  }

  return (
    <AppShell>
      <div className="app-content">
        {activeTab === 'home' ? (
          <HomeScreen tasks={tasks} onAddTask={handleAddTask} onStatusChange={handleStatusChange} />
        ) : null}
        {activeTab === 'calendar' ? <CalendarScreen tasks={tasks} /> : null}
        {activeTab === 'chat' ? (
          <ChatScreen messages={messages} loading={chatLoading} onSend={handleSendMessage} />
        ) : null}
        {activeTab === 'profile' ? (
          <ProfileScreen settings={settings} onToggleSetting={handleToggleSetting} />
        ) : null}
      </div>
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </AppShell>
  );
}
