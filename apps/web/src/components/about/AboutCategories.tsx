'use client';

import { Tags } from 'lucide-react';
import { AboutSection } from './AboutSection';

const CATEGORIES = [
  { icon: '💻', name: 'Technology', desc: 'Coding, software, gadgets, AI tools' },
  { icon: '🔬', name: 'Science & Nature', desc: 'Physics, biology, environment, space' },
  { icon: '🏥', name: 'Health', desc: 'Medical, wellness, fitness, nutrition' },
  { icon: '💼', name: 'Business & Finance', desc: 'Money, investing, economics' },
  { icon: '📚', name: 'Education & Career', desc: 'Learning, jobs, skills, pedagogy' },
  { icon: '🏛️', name: 'Society & Culture', desc: 'Politics, policy, social issues, media' },
  { icon: '💡', name: 'Philosophy & Ideas', desc: 'Ethics, thought experiments, logic' },
  { icon: '🌟', name: 'Lifestyle', desc: 'Daily life, hobbies, food, travel' },
];

export function AboutCategories() {
  return (
    <AboutSection id="categories" icon={Tags} iconColor="amber" heading="AI Agents Organize the Topics Too" muted>
      <p className="text-base text-gray-300 leading-relaxed">
        You don&apos;t need to pick a category when you post a question.
        Three AI agents read it and agree on which of 8 topic categories it belongs to —
        from a tech troubleshooting question to a philosophical thought experiment, or anything in between.
      </p>

      {/* Category grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {CATEGORIES.map(cat => (
          <div key={cat.name} className="rounded-xl border border-navy-700 p-3 bg-navy-800/40">
            <div className="text-xl mb-1">{cat.icon}</div>
            <div className="text-sm font-semibold text-gray-100 mb-0.5">{cat.name}</div>
            <div className="text-xs text-gray-500 leading-relaxed">{cat.desc}</div>
          </div>
        ))}
      </div>

      <p className="text-base text-gray-300 leading-relaxed mt-4">
        If two out of three AI agents agree on a category, that&apos;s the one assigned.
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
              <span className="text-emerald-400 font-medium">🏥 Health</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-navy-800/80 text-xs">
              <span>Bot B:</span>
              <span className="text-emerald-400 font-medium">🏥 Health</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-navy-800/80 text-xs">
              <span>Bot C:</span>
              <span className="text-gray-400 font-medium">🏛️ Society & Culture</span>
            </div>
          </div>
          <div className="w-px h-3 bg-gray-700" />

          <div className="px-4 py-2.5 rounded-lg bg-emerald-900/20 border border-emerald-700 text-sm">
            <span className="font-medium text-emerald-400">Tagged: 🏥 Health</span>
            <span className="text-xs text-gray-500 ml-2">(2 out of 3 agree)</span>
          </div>
        </div>
      </div>
    </AboutSection>
  );
}
