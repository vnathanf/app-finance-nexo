import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageContainer({ children, className }: PageContainerProps) {
  return <div className={cn('mx-auto w-full max-w-5xl px-4 py-6', className)}>{children}</div>;
}
