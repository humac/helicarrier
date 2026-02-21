import * as React from 'react';
import { cn } from '@/lib/utils';

interface DialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextType | undefined>(undefined);

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

function DialogTrigger({ asChild = false, children, ...props }: DialogTriggerProps) {
  const context = React.useContext(DialogContext);

  if (!context) {
    throw new Error('DialogTrigger must be used within a Dialog');
  }

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (props.onClick) {
      props.onClick(e);
    }
    context.onOpenChange(true);
  };

  if (asChild) {
    return React.cloneElement(
      children as React.ReactElement<{ onClick?: React.MouseEventHandler<HTMLButtonElement> }>,
      {
        onClick,
      }
    );
  }

  return (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  );
}

type DialogContentProps = React.HTMLAttributes<HTMLDivElement>;

function DialogContent({ children, className, ...props }: DialogContentProps) {
  return (
    <div
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-700 bg-gray-950 p-6 shadow-lg',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type DialogHeaderProps = React.HTMLAttributes<HTMLDivElement>;

function DialogHeader({ children, className, ...props }: DialogHeaderProps) {
  return (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props}>
      {children}
    </div>
  );
}

type DialogTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

function DialogTitle({ children, className, ...props }: DialogTitleProps) {
  return (
    <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props}>
      {children}
    </h2>
  );
}

type DialogDescriptionProps = React.HTMLAttributes<HTMLDivElement>;

function DialogDescription({ children, className, ...props }: DialogDescriptionProps) {
  return (
    <div className={cn('text-sm text-gray-400', className)} {...props}>
      {children}
    </div>
  );
}

type DialogFooterProps = React.HTMLAttributes<HTMLDivElement>;

function DialogFooter({ children, className, ...props }: DialogFooterProps) {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props}>
      {children}
    </div>
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};