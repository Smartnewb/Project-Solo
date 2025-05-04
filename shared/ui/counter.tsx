import { Button } from './button';
import { cn } from '../utils';

type CounterSize = 'md' | 'lg' | 'xl';

const sizeStyles: Record<CounterSize, {
  button: string;
  text: string;
  container: string;
}> = {
  md: {
    button: 'h-8 w-8',
    text: 'text-md',
    container: 'min-w-[3rem]'
  },
  lg: {
    button: 'h-10 w-10',
    text: 'text-lg',
    container: 'min-w-[4rem]'
  },
  xl: {
    button: 'h-12 w-12',
    text: 'text-xl',
    container: 'min-w-[5rem]'
  }
};

interface CounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: CounterSize;
  disabled?: boolean;
  className?: string;
}

export function Counter({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  size = 'md',
  disabled = false,
  className,
}: CounterProps) {
  const increment = () => {
    if (value + step <= max) {
      onChange(value + step);
    }
  };

  const decrement = () => {
    if (value - step >= min) {
      onChange(value - step);
    }
  };

  return (
    <div className={cn('flex items-center', className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={decrement}
        disabled={disabled || value <= min}
        className={cn(sizeStyles[size].button, 'rounded-full')}
      >
        <span className="sr-only">감소</span>
        <span aria-hidden="true">-</span>
      </Button>

      <div className={cn(
        'flex items-center justify-center text-center',
        sizeStyles[size].container
      )}>
        <span className={cn(
            'font-bold text-primary',
          sizeStyles[size].text
        )}>{value}</span>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={increment}
        disabled={disabled || value >= max}
        className={cn(sizeStyles[size].button, 'rounded-full')}
      >
        <span className="sr-only">증가</span>
        <span aria-hidden="true">+</span>
      </Button>
    </div>
  );
}
