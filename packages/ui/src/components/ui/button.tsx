import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { LoadingSpinner } from '../custom/spinner';
import { Shortcut } from '../custom/shortcut';

const buttonVariants = cva(
  'ring-offset-background inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary stroke-background text-primary-foreground enabled:hover:bg-primary/90',
        primary:
          'bg-primary stroke-background text-primary-foreground enabled:hover:bg-primary/90',
        basic: 'text-primary underline-offset-4 enabled:hover:bg-accent',
        destructive:
          'bg-destructive text-background enabled:hover:bg-destructive/90',
        outline:
          'border-input bg-background enabled:hover:bg-accent enabled:hover:text-accent-foreground border',
        secondary:
          'bg-secondary text-secondary-foreground enabled:hover:bg-secondary/80',
        ghost:
          'enabled:hover:bg-background/90 enabled:hover:text-accent-foreground focus-visible:ring-0',
        link: 'text-primary underline-offset-4 enabled:hover:underline',
        transparent: 'text-primary enabled:hover:bg-transparent',
        icon: 'bg-background enabled:hover:bg-muted focus-visible:ring-0',
        none: ''
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3',
        lg: 'h-11 rounded-lg px-8',
        xs: 'h-6 p-2',
        icon: 'size-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  keyboardShortcut?: string;
  onKeyboardShortcut?: () => void;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      keyboardShortcut,
      disabled,
      onKeyboardShortcut,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';

    const isMac = /(Mac)/i.test(navigator.userAgent);
    const isEscape = keyboardShortcut?.toLocaleLowerCase() === 'esc';
    React.useEffect(() => {
      if (keyboardShortcut) {
        document.addEventListener('keydown', handleKeyDown);
      }

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [keyboardShortcut, disabled]);

    const handleKeyDown = (event: KeyboardEvent) => {
      const isEscapePressed = event.key === 'Escape' && isEscape;
      const isCtrlWithShortcut =
        keyboardShortcut &&
        event.key === keyboardShortcut.toLocaleLowerCase() &&
        (isMac ? event.metaKey : event.ctrlKey);
      if (isEscapePressed || isCtrlWithShortcut) {
        event.preventDefault();
        event.stopPropagation();
        if (onKeyboardShortcut && !disabled) {
          onKeyboardShortcut();
        }
      }
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), {})}
        ref={ref}
        disabled={disabled}
        {...props}
        onClick={(e) => {
          loading ? e.stopPropagation() : props.onClick && props.onClick(e);
        }}
      >
        {loading ? (
          <LoadingSpinner
              size={size === 'xs' ? 16 : 24}
              className={
                cn('text-background foreground')
              }
            />
        ) : (
          <>
            {keyboardShortcut && (
              <div className="flex justify-center items-center gap-2">
                {children}
                <Shortcut shortcutKey={keyboardShortcut} withCtrl={true} />
              </div>
            )}
            {!keyboardShortcut && children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

const GradientButton = ({ children, ...props }: ButtonProps) => {
  return (
    <div className="rounded-lg p-[1px] bg-purple-blue-gradient flex items-center justify-center">
      <Button variant="outline" {...props} className={cn("hover:!bg-background !rounded-md", props.className)}>
        {children}
      </Button>
    </div>

  )
}

export { Button, buttonVariants, GradientButton };