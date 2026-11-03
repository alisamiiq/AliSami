import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Info } from 'lucide-react';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type Tone = 'success' | 'info';
interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const show = useCallback((message: string, tone: Tone = 'info') => {
    const id = ++counter.current;
    setItems((list) => [...list.slice(-2), { id, message, tone }]);
    window.setTimeout(() => setItems((list) => list.filter((i) => i.id !== id)), 4200);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite" data-float-ignore>
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              className={`toast is-${item.tone}`}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              {item.tone === 'success' ? <CheckCircle2 size={18} /> : <Info size={18} />}
              <span>{item.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
