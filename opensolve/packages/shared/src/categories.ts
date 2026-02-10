export interface CategoryDefinition {
  slug: string;
  displayName: string;
  icon: string;
  description: string;
  keywords: string[];
}

export const CATEGORIES: CategoryDefinition[] = [
  {
    slug: 'science_technology',
    displayName: 'Science & Technology',
    icon: '🔬',
    description: 'Physics, chemistry, biology, space, AI, computing, engineering, robotics, materials science',
    keywords: ['science', 'technology', 'physics', 'chemistry', 'biology', 'AI', 'artificial intelligence', 'computing', 'engineering', 'robotics', 'software', 'hardware', 'research', 'innovation', 'lab', 'experiment', 'data', 'algorithm', 'machine learning', 'quantum', 'nanotechnology', 'biotechnology'],
  },
  {
    slug: 'health_medicine',
    displayName: 'Health & Medicine',
    icon: '🏥',
    description: 'Public health, disease, mental health, nutrition, fitness, healthcare systems, aging, biomedical',
    keywords: ['health', 'medicine', 'disease', 'hospital', 'mental health', 'nutrition', 'fitness', 'aging', 'wellness', 'therapy', 'pharmaceutical', 'vaccine', 'surgery', 'diagnosis', 'patient', 'healthcare', 'epidemic', 'chronic', 'disability', 'sleep'],
  },
  {
    slug: 'environment_climate',
    displayName: 'Environment & Climate',
    icon: '🌍',
    description: 'Climate change, pollution, conservation, biodiversity, renewable energy, waste, water, ecosystems',
    keywords: ['environment', 'climate', 'pollution', 'conservation', 'biodiversity', 'renewable', 'energy', 'waste', 'recycling', 'water', 'ocean', 'forest', 'carbon', 'emissions', 'sustainability', 'ecosystem', 'wildlife', 'drought', 'flood', 'green'],
  },
  {
    slug: 'education_learning',
    displayName: 'Education & Learning',
    icon: '📚',
    description: 'Teaching methods, access to education, curriculum, lifelong learning, skills gaps, digital literacy',
    keywords: ['education', 'learning', 'teaching', 'school', 'university', 'curriculum', 'student', 'literacy', 'training', 'skill', 'knowledge', 'classroom', 'online learning', 'tutoring', 'exam', 'degree', 'scholarship', 'pedagogy', 'STEM', 'vocational'],
  },
  {
    slug: 'business_economics',
    displayName: 'Business & Economics',
    icon: '💼',
    description: 'Entrepreneurship, markets, finance, employment, supply chain, productivity, trade, economic policy',
    keywords: ['business', 'economics', 'finance', 'startup', 'entrepreneurship', 'market', 'trade', 'employment', 'job', 'salary', 'investment', 'banking', 'supply chain', 'manufacturing', 'retail', 'productivity', 'management', 'strategy', 'revenue', 'GDP'],
  },
  {
    slug: 'society_culture',
    displayName: 'Society & Culture',
    icon: '🏛️',
    description: 'Social justice, inequality, migration, community, demographics, media, arts, ethics, human rights',
    keywords: ['society', 'culture', 'social', 'community', 'inequality', 'justice', 'migration', 'immigration', 'diversity', 'inclusion', 'art', 'music', 'religion', 'tradition', 'ethics', 'human rights', 'poverty', 'homelessness', 'volunteer', 'family'],
  },
  {
    slug: 'governance_policy',
    displayName: 'Governance & Policy',
    icon: '⚖️',
    description: 'Government, regulation, democracy, public policy, law, international relations, civic participation',
    keywords: ['government', 'policy', 'law', 'regulation', 'democracy', 'voting', 'election', 'legislation', 'international', 'diplomacy', 'tax', 'constitution', 'court', 'rights', 'freedom', 'corruption', 'transparency', 'bureaucracy', 'civic', 'treaty'],
  },
  {
    slug: 'urban_infrastructure',
    displayName: 'Urban & Infrastructure',
    icon: '🏗️',
    description: 'Cities, transportation, housing, architecture, utilities, urban planning, smart cities, construction',
    keywords: ['urban', 'city', 'infrastructure', 'transportation', 'housing', 'traffic', 'road', 'bridge', 'building', 'architecture', 'utility', 'electricity', 'plumbing', 'internet', 'broadband', 'public transit', 'parking', 'zoning', 'construction', 'smart city'],
  },
  {
    slug: 'food_agriculture',
    displayName: 'Food & Agriculture',
    icon: '🌾',
    description: 'Farming, food security, sustainable agriculture, supply chains, food waste, nutrition systems',
    keywords: ['food', 'agriculture', 'farming', 'crop', 'livestock', 'food security', 'hunger', 'nutrition', 'organic', 'pesticide', 'irrigation', 'soil', 'harvest', 'food waste', 'restaurant', 'grocery', 'supply chain', 'GMO', 'fishery', 'sustainable farming'],
  },
  {
    slug: 'safety_security',
    displayName: 'Safety & Security',
    icon: '🛡️',
    description: 'Cybersecurity, physical safety, disaster preparedness, conflict resolution, privacy, crime prevention',
    keywords: ['safety', 'security', 'cybersecurity', 'privacy', 'disaster', 'emergency', 'fire', 'crime', 'prevention', 'surveillance', 'encryption', 'data protection', 'fraud', 'terrorism', 'defense', 'military', 'peace', 'conflict', 'rescue', 'insurance'],
  },
  {
    slug: 'communication_media',
    displayName: 'Communication & Media',
    icon: '📡',
    description: 'Journalism, misinformation, social media, connectivity, language barriers, digital communication',
    keywords: ['communication', 'media', 'journalism', 'news', 'social media', 'misinformation', 'fake news', 'language', 'translation', 'broadcasting', 'podcast', 'video', 'content', 'advertising', 'public relations', 'connectivity', 'telecom', 'internet access', 'censorship', 'free speech'],
  },
  {
    slug: 'space_exploration',
    displayName: 'Space & Exploration',
    icon: '🚀',
    description: 'Space travel, colonization, astronomy, deep sea, frontier science, extreme environments',
    keywords: ['space', 'exploration', 'NASA', 'Mars', 'moon', 'satellite', 'rocket', 'astronaut', 'astronomy', 'telescope', 'orbit', 'deep sea', 'ocean floor', 'expedition', 'frontier', 'colony', 'habitat', 'radiation', 'gravity', 'planetary'],
  },
];

export const CATEGORY_SLUGS = CATEGORIES.map(c => c.slug);

export function getCategoryBySlug(slug: string): CategoryDefinition | undefined {
  return CATEGORIES.find(c => c.slug === slug);
}

export function getCategoryDisplayName(slug: string): string {
  return getCategoryBySlug(slug)?.displayName ?? slug;
}
