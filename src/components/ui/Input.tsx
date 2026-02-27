import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftAddon?: ReactNode
  rightAddon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  leftAddon,
  rightAddon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {leftAddon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none">
            {leftAddon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full rounded-lg border text-sm text-slate-900',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'placeholder:text-slate-400 transition-colors',
            error
              ? 'border-red-400 bg-red-50'
              : 'border-slate-300 bg-white hover:border-slate-400',
            leftAddon ? 'pl-9' : 'pl-3',
            rightAddon ? 'pr-9' : 'pr-3',
            'py-2',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50',
            className,
          ].join(' ')}
          {...props}
        />
        {rightAddon && (
          <div className="absolute right-3 text-slate-400">
            {rightAddon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!error && hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
})

Input.displayName = 'Input'
