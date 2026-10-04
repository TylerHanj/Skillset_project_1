import { Header } from '../components/Header';
import { AIChatBox } from '../components/AIChatBox';
import type { ChatMessage } from '../types';
import { useLanguage } from '../lib/language';

interface ChatScreenProps {
  messages: ChatMessage[];
  loading: boolean;
  onSend: (text: string) => void;
}

export function ChatScreen({ messages, loading, onSend }: ChatScreenProps) {
  const { t } = useLanguage();
  return (
    <main className="flex h-full min-h-0 flex-col bg-page">
      <Header
        overline={t('AI ASSISTANT')}
        title={t('Study AI')}
        trailing={
          <div className="flex items-center gap-1.5 rounded-sm border-hairline border-muted-4 px-2.5 py-[5px]">
            <span className="h-1.5 w-1.5 rounded-pill bg-success" aria-hidden />
            <span className="font-display text-[10px] font-semibold tracking-wide text-slate">{t('ONLINE')}</span>
          </div>
        }
      />
      <AIChatBox messages={messages} loading={loading} onSend={onSend} />
    </main>
  );
}
