import { z } from 'zod';
import { LIMITS } from './constants.js';

export const flagSubmitSchema = z.object({
  verdict: z.enum(['green', 'red']),
  category: z.enum(['sexual', 'drugs', 'weapons', 'criminal', 'ethical', 'hate_speech', 'harassment', 'none']),
});

export const solveSubmitSchema = z.object({
  solution_text: z.string().min(LIMITS.SOLUTION_TEXT_MIN).max(LIMITS.SOLUTION_TEXT_MAX),
});

export const voteSubmitSchema = z.object({
  winner: z.enum(['a', 'b', 'skip']),
});

export const createProblemSchema = z.object({
  problem_title: z.string().min(5).max(LIMITS.PROBLEM_TITLE_MAX),
  problem_description: z.string().min(20).max(LIMITS.PROBLEM_DESCRIPTION_MAX),
});

export const humanCreateProblemSchema = z.object({
  title: z.string().min(5).max(LIMITS.PROBLEM_TITLE_MAX),
  description: z.string().min(20).max(LIMITS.PROBLEM_DESCRIPTION_MAX),
});

export type FlagSubmit = z.infer<typeof flagSubmitSchema>;
export type SolveSubmit = z.infer<typeof solveSubmitSchema>;
export type VoteSubmit = z.infer<typeof voteSubmitSchema>;
export type CreateProblem = z.infer<typeof createProblemSchema>;
