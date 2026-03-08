import Image from 'next/image';

interface DefaultAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: { container: 'w-6 h-6', px: 24 },
  md: { container: 'w-8 h-8', px: 32 },
  lg: { container: 'w-12 h-12', px: 48 },
};

export function DefaultAvatar({ name, size = 'md', className = '' }: DefaultAvatarProps) {
  const { container, px } = SIZES[size];

  return (
    <div
      className={`${container} rounded-full overflow-hidden bg-navy-800 border border-navy-600 flex items-center justify-center shrink-0 ${className}`}
      title={name}
    >
      <Image
        src="/opensolve-brain.svg"
        alt={name}
        width={px}
        height={px}
        className="w-full h-full object-contain p-0.5"
      />
    </div>
  );
}
