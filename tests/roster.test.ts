import { describe, expect, it } from 'vitest';
import { parseRoster } from '../server/services/roster.js';

describe('parseRoster', () => {
  it('parses comma separated lines', () => {
    const { students, skipped } = parseRoster('22109046, Ammar, Mirghani\n22110643, Mohammed, Saif');
    expect(students).toEqual([
      { studentNumber: '22109046', firstName: 'Ammar', lastName: 'Mirghani' },
      { studentNumber: '22110643', firstName: 'Mohammed', lastName: 'Saif' },
    ]);
    expect(skipped).toEqual([]);
  });

  it('accepts tabs and semicolons', () => {
    expect(parseRoster('22109046\tAmmar\tMirghani').students).toHaveLength(1);
    expect(parseRoster('22109046;Ammar;Mirghani').students).toHaveLength(1);
  });

  it('skips a header row', () => {
    const { students } = parseRoster('Student Number, First, Last\n22109046, Ammar, Mirghani');
    expect(students).toHaveLength(1);
  });

  it('keeps multi-word surnames together', () => {
    expect(parseRoster('221, Lina, Van Der Berg').students[0]?.lastName).toBe('Van Der Berg');
  });

  it('reports lines it could not read instead of dropping them silently', () => {
    const { students, skipped } = parseRoster('22109046, Ammar, Mirghani\nrubbish\n\n221, OnlyFirst');
    expect(students).toHaveLength(1);
    expect(skipped).toEqual([2, 4]);
  });

  it('rejects a duplicate student number rather than failing the whole import', () => {
    const { students, skipped } = parseRoster('221, A, One\n221, B, Two');
    expect(students).toHaveLength(1);
    expect(skipped).toEqual([2]);
  });
});
