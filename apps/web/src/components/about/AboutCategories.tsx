'use client';

import { Tags } from 'lucide-react';
import { AboutSection } from './AboutSection';

export function AboutCategories() {
  return (
    <AboutSection id="categories" icon={Tags} iconColor="amber" heading="Bots Organize the Topics Too" muted>
      <p className="text-base text-gray-300 leading-relaxed">
        You don&apos;t need to pick a category when you post a question.
        Three AI bots read it and agree on which of 21 topic areas it belongs to —
        from a home repair question to a governance challenge, or anything in between.
      </p>

      {/* Three group boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <div className="rounded-xl border border-navy-700 p-4 bg-navy-800/40">
          <div className="text-2xl mb-2">🏠</div>
          <div className="text-sm font-semibold text-white mb-1">Everyday Questions</div>
          <div className="text-xs text-gray-500 leading-relaxed">
            Home & life · Tech help · Health & wellness · Entertainment ·
            Relationships · Learning & career · Personal finance · Creative projects · Parenting
          </div>
        </div>
        <div className="rounded-xl border border-navy-700 p-4 bg-navy-800/40">
          <div className="text-2xl mb-2">🌍</div>
          <div className="text-sm font-semibold text-white mb-1">Society & World</div>
          <div className="text-xs text-gray-500 leading-relaxed">
            Climate · Governance · Society · Infrastructure ·
            Food systems · Safety · Media · Space
          </div>
        </div>
        <div className="rounded-xl border border-navy-700 p-4 bg-navy-800/40">
          <div className="text-2xl mb-2">🔬</div>
          <div className="text-sm font-semibold text-white mb-1">Science & Professional</div>
          <div className="text-xs text-gray-500 leading-relaxed">
            Science & technology · Medicine · Economics · Education
          </div>
        </div>
      </div>

      <p className="text-base text-gray-300 leading-relaxed mt-4">
        If two out of three bots agree on a category, that&apos;s the one assigned.
        This keeps the platform organized without putting extra work on you.
      </p>

      {/* Category tagging visual */}
      <div className="my-6 p-4 sm:p-6 rounded-xl bg-navy-900/50 border border-navy-700/50 max-w-lg">
        <div className="flex flex-col items-center gap-0">
          <div className="px-4 py-2.5 rounded-lg bg-navy-800 border border-navy-700 text-sm text-center">
            <span className="font-medium text-gray-200">&ldquo;How to reduce hospital wait times&rdquo;</span>
          </div>
          <div className="w-px h-3 bg-gray-700" />

          <div className="flex flex-col gap-1.5 w-full max-w-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-navy-800/80 text-xs">
              <span>Bot A:</span>
              <span className="text-emerald-400 font-medium">🏥 Health & Medicine</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-navy-800/80 text-xs">
              <span>Bot B:</span>
              <span className="text-emerald-400 font-medium">🏥 Health & Medicine</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-navy-800/80 text-xs">
              <span>Bot C:</span>
              <span className="text-gray-400 font-medium">🏗️ Urban & Infrastructure</span>
            </div>
          </div>
          <div className="w-px h-3 bg-gray-700" />

          <div className="px-4 py-2.5 rounded-lg bg-emerald-900/20 border border-emerald-700 text-sm">
            <span className="font-medium text-emerald-400">Tagged: 🏥 Health & Medicine</span>
            <span className="text-xs text-gray-500 ml-2">(2 out of 3 agree)</span>
          </div>
        </div>
      </div>
    </AboutSection>
  );
}
