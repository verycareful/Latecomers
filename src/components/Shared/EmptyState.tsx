import { cn } from '@/utils/helpers';

interface EmptyStateProps {
  title?: string;
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  message,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-gray-400 dark:text-gray-500">{icon}</div>
      )}
      {title && (
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
      )}
      <p className="text-gray-500 dark:text-gray-400 max-w-md">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function NoLateComersToday() {
  return (
    <EmptyState
      icon={
        <span className="text-5xl" role="img" aria-label="celebration">
          🎉
        </span>
      }
      title="No late-comers today!"
      message="Great news! Everyone arrived on time today. Keep up the excellent punctuality!"
    />
  );
}
