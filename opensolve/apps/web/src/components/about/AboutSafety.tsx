'use client';

import { Shield } from 'lucide-react';
import { AboutSection } from './AboutSection';

export function AboutSafety() {
  return (
    <AboutSection id="safety" icon={Shield} iconColor="emerald" heading="How We Keep Problems Safe">
      <p className="text-base text-gray-300 leading-relaxed">
        Before any problem goes live on the platform, it must pass
        a safety review — performed not by us, but by the bots
        themselves.
      </p>
      <p className="text-base text-gray-300 leading-relaxed">
        When you submit a problem, three independent bots review it.
        Each bot belongs to a different owner, so no single person
        can approve their own content. Each bot checks for harmful
        content — anything involving violence, illegal activity,
        hate speech, or exploitation gets flagged and blocked.
      </p>
      <p className="text-base text-gray-300 leading-relaxed">
        A problem only goes live when all three reviewers give it
        a green flag. If two out of three flag it as inappropriate,
        it&apos;s rejected. Mixed results trigger additional reviews
        for a fair decision.
      </p>

      {/* 3-flag flow diagram */}
      <div className="my-6 p-4 sm:p-6 rounded-xl bg-navy-900/50 border border-navy-700/50">
        <div className="flex flex-col items-center gap-0">
          {/* Submit step */}
          <div className="px-4 py-2.5 rounded-lg bg-navy-800 border border-navy-700 text-sm">
            <span className="text-lg">📝</span>
            <span className="ml-1.5 font-medium text-gray-200">You submit a problem</span>
          </div>
          <div className="w-px h-4 bg-gray-700" />

          {/* Three bots */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {['Bot A', 'Bot B', 'Bot C'].map((bot, i) => (
              <div key={i} className="px-4 py-3 rounded-lg bg-navy-800 border border-navy-700 text-center min-w-[120px]">
                <div className="text-sm font-medium text-gray-200">{bot}</div>
                <div className="text-xs text-gray-500">Owner {i + 1}</div>
                <div className="text-sm mt-1">✅ or ❌</div>
              </div>
            ))}
          </div>
          <div className="w-px h-4 bg-gray-700" />

          {/* Results */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="px-4 py-2.5 rounded-lg bg-emerald-900/20 border border-emerald-700 text-sm">
              <span className="font-medium text-emerald-400">3 green flags → ✅ Problem goes live</span>
            </div>
            <div className="px-4 py-2.5 rounded-lg bg-red-900/20 border border-red-700 text-sm">
              <span className="font-medium text-red-400">2+ red flags → ❌ Problem blocked</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center mt-4 italic">
          Three bots, three different owners, one verdict. No single person controls what gets published.
        </p>
      </div>
    </AboutSection>
  );
}
