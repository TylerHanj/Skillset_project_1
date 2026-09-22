import { Header } from '../components/Header';
import { AIChatBox } from '../components/AIChatBox';
import type { ChatMessage } from '../types';

interface ChatScreenProps {
  messages: ChatMessage[];
  loading: boolean;
  onSend: (text: string) => void;
}

export function ChatScreen({ messages, loading, onSend }: ChatScreenProps) {
  return (
    <main className="flex h-full min-h-0 flex-col bg-page">
      <Header
        overline="AI ASSISTANT"
        title="Study AI"
        trailing={
          <div className="flex items-center gap-1.5 rounded-sm border-hairline border-muted-4 px-2.5 py-[5px]">
            <span className="h-1.5 w-1.5 rounded-pill bg-success" aria-hidden />
            <span className="font-display text-[10px] font-semibold tracking-wide text-slate">ONLINE</span>
          </div>
        }
      />
      <AIChatBox messages={messages} loading={loading} onSend={onSend} />
    </main>
  );
}
