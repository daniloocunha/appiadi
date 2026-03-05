import { useState } from 'react'
import { User } from 'lucide-react'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm:  'w-8 h-8 text-xs',
  md:  'w-10 h-10 text-sm',
  lg:  'w-14 h-14 text-base',
  xl:  'w-24 h-24 text-2xl',
}

function getInitials(name: string | null | undefined): string {
  if (!name) return ''
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const initials = getInitials(name)
  const [imgError, setImgError] = useState(false)

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name ?? 'Foto do membro'}
        className={[
          'rounded-full object-cover shrink-0',
          sizeClasses[size],
          className,
        ].join(' ')}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div
      className={[
        'rounded-full bg-amber-100 text-amber-700 font-semibold',
        'flex items-center justify-center shrink-0',
        sizeClasses[size],
        className,
      ].join(' ')}
      aria-label={name ?? undefined}
    >
      {initials || <User size={size === 'sm' ? 14 : size === 'xl' ? 32 : 18} />}
    </div>
  )
}
