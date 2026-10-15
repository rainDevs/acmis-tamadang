import { cn } from '@/lib/utils'

// Shared form building blocks (brand-guidelines: labels, required markers,
// inline errors with role="alert", 44px touch targets, duplicate-submit guard
// via the disabled prop at the call site).

export function Field({ label, required = false, hint, error, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold">
        {label} {required ? <span aria-hidden="true" className="text-destructive">*</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function TextInput({ className, invalid = false, ...props }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        'h-11 min-h-[44px] w-full rounded-lg border bg-background px-3 text-sm outline-none',
        'placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring',
        invalid && 'border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export function FormError({ message }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive dark:bg-destructive/20"
    >
      {message}
    </p>
  )
}
