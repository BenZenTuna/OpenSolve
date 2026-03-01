interface DefaultAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-lg',
};

export function DefaultAvatar({ name, size = 'md', className = '' }: DefaultAvatarProps) {
  const hash = (name || '?').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;

  return (
    <div
      className={`${SIZES[size]} rounded-full flex items-center justify-center text-white font-bold select-none ${className}`}
      style={{ backgroundColor: `hsl(${hue}, 55%, 40%)` }}
    >
      {(name || '?')[0]?.toUpperCase()}
    </div>
  );
}
