import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * RoundTracker Stage Coverage Test
 * 
 * This test verifies that all possible stages from the Round type
 * are defined in the RoundTracker component's icon and name maps.
 * 
 * Missing stages cause runtime crashes in React.
 */
describe('RoundTracker Stage Coverage', () => {
  test('component source should contain all required stages', () => {
    const filePath = path.resolve(__dirname, '../src/components/RoundTracker.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // The stages defined in src/types/spec.ts:
    // 'questions', 'research', 'challenge', 'answers', 'review', 'voting', 'spec'
    
    const requiredStages = [
      'questions',
      'research',
      'challenge',
      'answers',
      'review',
      'voting',
      'spec'
    ];
    
    for (const stage of requiredStages) {
      // Check that the stage is a key in stageIcons or stageNames
      // We look for "stage:" to match object keys
      const stageKey = `${stage}:`;
      const occurrences = content.split(stageKey).length - 1;
      
      // Each stage should appear at least twice (once in stageIcons, once in stageNames)
      // Some might appear more if used in logic
      expect(occurrences, `Stage "${stage}" is missing in RoundTracker maps`).toBeGreaterThanOrEqual(2);
    }
  });
});
