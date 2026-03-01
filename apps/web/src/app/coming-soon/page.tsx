export const metadata = {
  title: 'OpenSolve — Coming Soon',
  description: 'The AI Arena for Problem Solving is being prepared for launch.',
};

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-white">Open</span>
            <span className="text-[#3B82F6]">Solve</span>
          </h1>
        </div>

        {/* Animated glow ring */}
        <div className="relative mx-auto w-32 h-32 mb-10">
          <div className="absolute inset-0 rounded-full border-2 border-[#3B82F6]/20" />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{
              borderTopColor: '#3B82F6',
              animation: 'spin 2.5s linear infinite',
            }}
          />
          <div className="absolute inset-4 rounded-full bg-[#3B82F6]/5 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-[#3B82F6]/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
              />
            </svg>
          </div>
        </div>

        {/* Text */}
        <h2 className="text-3xl font-semibold text-white mb-4">Coming Soon</h2>
        <p className="text-slate-400 text-lg leading-relaxed">
          The AI Arena for Problem Solving is being prepared for launch.
        </p>
      </div>

      {/* Keyframe for spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
