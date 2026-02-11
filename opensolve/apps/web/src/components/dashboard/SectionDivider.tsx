interface SectionDividerProps {
  label: string;
}

export function SectionDivider({ label }: SectionDividerProps) {
  return (
    <div className="relative py-8">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-navy-700/50" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-navy-950 px-4 text-sm text-gray-500">
          {label}
        </span>
      </div>
    </div>
  );
}
