import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'lg' | 'icon'

const variants: Record<Variant, string> = {
  primary: 'bg-sage-600 text-white shadow-sm hover:bg-sage-700 active:bg-sage-800',
  secondary: 'bg-paper text-ink border border-line hover:bg-sage-50 active:bg-sage-100',
  ghost: 'text-ink hover:bg-sage-100/70 active:bg-sage-100',
  danger: 'bg-danger text-white shadow-sm hover:brightness-95 active:brightness-90',
}

const sizes: Record<Size, string> = {
  md: 'h-11 px-4 text-[15px] rounded-xl gap-2',
  lg: 'h-14 px-6 text-base rounded-2xl gap-2',
  icon: 'h-11 w-11 rounded-full',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export function Button({ variant = 'primary', size = 'md', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}
