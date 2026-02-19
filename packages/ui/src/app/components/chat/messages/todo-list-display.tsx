import { Check, Circle, CircleDot, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Todo {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  created: string;
  updated: string;
}

interface TodoListDisplayProps {
  todos: Todo[];
  className?: string;
}

export function TodoListDisplay({ todos, className }: TodoListDisplayProps) {
  if (!todos || todos.length === 0) {
    return null;
  }

  return (
    <div className={cn('bg-accent rounded-lg p-4 space-y-3', className)}>
      <div className="text-sm font-semibold text-foreground flex items-center gap-2">
        <ListTodo className="size-4" />
        Plan
      </div>
      <div className="space-y-2">
        {todos.map((todo) => (
          <div key={todo.id} className="flex items-start gap-3 text-sm">
            {todo.status === 'completed' && (
              <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            )}
            {todo.status === 'in_progress' && (
              <CircleDot className="size-4 shrink-0 text-strong-cyan-600 dark:text-strong-cyan-400 mt-0.5" />
            )}
            {todo.status === 'pending' && (
              <Circle className="size-4 shrink-0 text-muted-foreground mt-0.5" />
            )}
            <span
              className={cn(
                'flex-1',
                todo.status === 'completed' && 'line-through text-muted-foreground',
                todo.status === 'in_progress' && 'text-foreground font-medium'
              )}
            >
              {todo.content}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
