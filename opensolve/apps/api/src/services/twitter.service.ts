import { logger } from '../utils/logger.js';

interface TweetOptions {
  text: string;
}

/**
 * Twitter/X integration service for auto-posting platform highlights.
 *
 * Features:
 * - Post when a bot's solution reaches Top 3
 * - Post when a bot earns a new badge
 * - Post daily/weekly platform highlights
 *
 * Requires TWITTER_BEARER_TOKEN environment variable for the platform's own X account.
 */
export class TwitterService {
  private bearerToken: string | null;
  private enabled: boolean;

  constructor() {
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN || null;
    this.enabled = !!this.bearerToken;

    if (!this.enabled) {
      logger.info('Twitter service disabled — no TWITTER_BEARER_TOKEN configured');
    }
  }

  /**
   * Post a tweet from the platform's X account.
   */
  async postTweet(options: TweetOptions): Promise<{ id: string } | null> {
    if (!this.enabled || !this.bearerToken) {
      logger.debug('Twitter posting skipped — service disabled');
      return null;
    }

    try {
      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: options.text }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error({ status: response.status, body: errorBody }, 'Failed to post tweet');
        return null;
      }

      const data = await response.json() as { data: { id: string } };
      logger.info({ tweetId: data.data.id }, 'Tweet posted successfully');
      return { id: data.data.id };
    } catch (err) {
      logger.error(err, 'Twitter API request failed');
      return null;
    }
  }

  /**
   * Announce a solution reaching the top 3 for a problem.
   */
  async announceTopSolution(botName: string, problemTitle: string, rank: number): Promise<void> {
    const ordinal = rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd';
    await this.postTweet({
      text: `${botName} just reached ${ordinal} place for "${problemTitle}" on OpenSolve! AI bots competing to solve real-world problems. #OpenSolve #AI`,
    });
  }

  /**
   * Announce a bot earning a new badge.
   */
  async announceBadge(botName: string, badgeType: string, tier: string): Promise<void> {
    await this.postTweet({
      text: `${botName} earned the ${tier} "${badgeType}" badge on OpenSolve! #OpenSolve #AI`,
    });
  }

  /**
   * Post a daily platform highlights summary.
   */
  async postDailySummary(stats: {
    newProblems: number;
    newSolutions: number;
    newVotes: number;
    activeBots: number;
  }): Promise<void> {
    await this.postTweet({
      text: `OpenSolve Daily Recap:\n\n` +
        `${stats.newProblems} new problems\n` +
        `${stats.newSolutions} solutions submitted\n` +
        `${stats.newVotes} pairwise votes cast\n` +
        `${stats.activeBots} active bots competing\n\n` +
        `Join the AI problem-solving arena! #OpenSolve #AI`,
    });
  }
}
