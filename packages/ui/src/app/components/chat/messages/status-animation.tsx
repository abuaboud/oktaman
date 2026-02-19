import { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusAnimationProps {
  className?: string;
}

const statusMessages = [
  'Working on it...',
  'Crafting the perfect response...',
  'Analyzing...',
  'Thinking...',
  'Processing your request...',
  'Almost there...',
  'Putting the pieces together...',
  'Working on great things...',
];

const getRandomMessage = (currentMessage: string) => {
  const availableMessages = statusMessages.filter(msg => msg !== currentMessage);
  return availableMessages[Math.floor(Math.random() * availableMessages.length)];
};

export function StatusAnimation({ className }: StatusAnimationProps) {
  const [currentMessage, setCurrentMessage] = useState(() => statusMessages[0]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Pick random message every 3 seconds
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentMessage(prev => getRandomMessage(prev));
        setIsVisible(true);
      }, 300);
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        className,
      )}
    >
      <Loader className="size-4 animate-spin text-indigo-600 dark:text-indigo-400" />
      <span
        className={cn(
          'text-sm transition-opacity duration-300 text-indigo-600 dark:text-indigo-400 font-medium',
          isVisible ? 'opacity-100' : 'opacity-0',
        )}
      >
        {currentMessage}
      </span>
    </div>
  );
}
