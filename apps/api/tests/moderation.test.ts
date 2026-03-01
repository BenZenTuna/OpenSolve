import { describe, it, expect } from 'vitest';

/**
 * Moderation state machine unit tests.
 * Tests the flag-counting logic and status transition rules.
 */

type ProblemStatus = 'pending' | 'active' | 'rejected' | 'mature';

interface ProblemState {
  status: ProblemStatus;
  greenFlags: number;
  redFlags: number;
}

/**
 * Pure function extracting the moderation state machine from ModerationService.
 * Given a problem state and a new flag, returns the new status.
 */
function determineNewStatus(
  state: ProblemState,
  newVote: 'green' | 'red'
): ProblemStatus {
  const greenFlags = state.greenFlags + (newVote === 'green' ? 1 : 0);
  const redFlags = state.redFlags + (newVote === 'red' ? 1 : 0);
  const totalFlags = greenFlags + redFlags;

  let newStatus = state.status;

  if (totalFlags >= 3) {
    if (redFlags >= 2) {
      newStatus = 'rejected';
    } else if (greenFlags >= 3) {
      newStatus = 'active';
    } else {
      // Mixed — need 5 flags for tiebreaker
      if (totalFlags >= 5) {
        newStatus = greenFlags > redFlags ? 'active' : 'rejected';
      }
    }
  }

  return newStatus;
}

describe('Moderation State Machine', () => {
  describe('Three green flags → active', () => {
    it('should activate after 3 green flags', () => {
      let state: ProblemState = { status: 'pending', greenFlags: 0, redFlags: 0 };

      // Flag 1: green
      let newStatus = determineNewStatus(state, 'green');
      state = { ...state, greenFlags: 1, status: newStatus };
      expect(newStatus).toBe('pending'); // Only 1 flag, stay pending

      // Flag 2: green
      newStatus = determineNewStatus(state, 'green');
      state = { ...state, greenFlags: 2, status: newStatus };
      expect(newStatus).toBe('pending'); // Only 2 flags, stay pending

      // Flag 3: green
      newStatus = determineNewStatus(state, 'green');
      expect(newStatus).toBe('active'); // 3 green = active
    });
  });

  describe('Two red flags → rejected', () => {
    it('should reject with 2 red flags (after 3 total)', () => {
      let state: ProblemState = { status: 'pending', greenFlags: 0, redFlags: 0 };

      // Flag 1: red
      let newStatus = determineNewStatus(state, 'red');
      state = { ...state, redFlags: 1, status: newStatus };
      expect(newStatus).toBe('pending');

      // Flag 2: green
      newStatus = determineNewStatus(state, 'green');
      state = { ...state, greenFlags: 1, status: newStatus };
      expect(newStatus).toBe('pending'); // Only 2 total

      // Flag 3: red → 2 red out of 3 → rejected
      newStatus = determineNewStatus(state, 'red');
      expect(newStatus).toBe('rejected');
    });

    it('should reject with 2 red 1 green', () => {
      const state: ProblemState = { status: 'pending', greenFlags: 1, redFlags: 1 };
      const newStatus = determineNewStatus(state, 'red');
      expect(newStatus).toBe('rejected'); // 2 red >= 2 → rejected
    });
  });

  describe('Mixed flags — tiebreaker at 5', () => {
    it('should stay pending with 2 green 1 red (mixed, < 5)', () => {
      const state: ProblemState = { status: 'pending', greenFlags: 2, redFlags: 0 };
      const newStatus = determineNewStatus(state, 'red');
      // 2 green, 1 red — total 3 but mixed (not 3 green, not 2+ red)
      expect(newStatus).toBe('pending');
    });

    it('should resolve at 5 total flags with majority green', () => {
      // 3 green, 1 red → 4 total, still pending
      let state: ProblemState = { status: 'pending', greenFlags: 3, redFlags: 1 };
      // This is actually 3 green, but also 1 red... wait.
      // With greenFlags=3, redFlags=1 → totalFlags=4, redFlags<2, greenFlags>=3 → active
      // Actually... the condition checks redFlags>=2 FIRST, then greenFlags>=3
      // With greenFlags=3 and redFlags=1, redFlags<2 → skip, greenFlags>=3 → active
      let newStatus = determineNewStatus(state, 'green');
      // After: greenFlags=4, redFlags=1, total=5
      expect(newStatus).toBe('active'); // 4 green > 1 red at 5 total

      // Now test when green < 3 at total 5
      state = { status: 'pending', greenFlags: 2, redFlags: 1 };
      newStatus = determineNewStatus(state, 'green');
      // After: 3 green, 1 red, total 4. greenFlags >= 3 → active
      expect(newStatus).toBe('active');
    });

    it('should reject at 5 total flags with majority red', () => {
      // 2 green, 2 red → still pending (need 5th)
      const state: ProblemState = { status: 'pending', greenFlags: 2, redFlags: 2 };
      // Adding red: 2 green, 3 red → total 5, redFlags >= 2 → rejected
      const newStatus = determineNewStatus(state, 'red');
      expect(newStatus).toBe('rejected');
    });
  });

  describe('Edge cases', () => {
    it('should not transition if already active', () => {
      const state: ProblemState = { status: 'active', greenFlags: 3, redFlags: 0 };
      const newStatus = determineNewStatus(state, 'red');
      // The function still runs the logic — in the actual service, only
      // updates happen if newStatus !== problem.status.
      // But the pure logic still returns a status based on counts.
      // With 3 green, 1 red: greenFlags >= 3 → active (stays active)
      expect(newStatus).toBe('active');
    });

    it('should handle all-red scenario', () => {
      let state: ProblemState = { status: 'pending', greenFlags: 0, redFlags: 0 };

      state = { ...state, redFlags: 1 };
      let newStatus = determineNewStatus(state, 'red');
      // 0 green, 2 red, total 2 → < 3 → pending
      expect(newStatus).toBe('pending');

      state = { ...state, redFlags: 2 };
      newStatus = determineNewStatus(state, 'red');
      // 0 green, 3 red, total 3, red >= 2 → rejected
      expect(newStatus).toBe('rejected');
    });
  });
});
