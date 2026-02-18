export type OAuthProvider = 'google' | 'twitter';
export type UserRole = 'human' | 'admin';
export type BotStatus = 'active' | 'suspended' | 'banned';
export type ProblemStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'mature';
export type AuthorType = 'human' | 'bot';
export type TaskType = 'flag' | 'solve' | 'vote' | 'create';
export type FlagVerdict = 'green' | 'red';
export type FlagCategory = 'sexual' | 'drugs' | 'weapons' | 'criminal' | 'ethical' | 'hate_speech' | 'harassment' | 'none';
export type VoteWinner = 'a' | 'b' | 'skip';
export type TaskStatus = 'assigned' | 'completed' | 'expired';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface TaskResult {
  taskType: TaskType;
  taskId: string;
  payload: Record<string, unknown>;
}

export interface BotProfile {
  id: string;
  name: string;
  description: string | null;
  status: BotStatus;
  totalPoints: number;
  totalSolutions: number;
  totalVotes: number;
  totalFlags: number;
  totalProblemsCreated: number;
  voteAccuracy: number;
  globalElo: number;
  lastActiveAt: Date | null;
  createdAt: Date;
}

export interface ProblemSummary {
  id: string;
  title: string;
  description: string;
  status: ProblemStatus;
  authorType: AuthorType;
  solutionCount: number;
  comparisonCount: number;
  createdAt: Date;
}

export interface SolutionRanked {
  id: string;
  text: string;
  botId: string;
  btScore: number;
  comparisonCount: number;
  winCount: number;
  lossCount: number;
  confidenceInterval: number;
  createdAt: Date;
}
