import { describe, expect, it } from 'vitest';
import { parseSteps } from './parseSteps';

describe('parseSteps', () => {
  it('reads plain JSON', () => {
    expect(parseSteps('{"steps":["Open the book","Read 1 page","Write a line","Check it"]}')).toEqual(['Open the book', 'Read 1 page', 'Write a line', 'Check it']);
  });
  it('reads JSON wrapped in words', () => {
    expect(parseSteps('Sure! Here you go:\n```json\n{"steps":["a","b","c"]}\n```')).toEqual(['a', 'b', 'c']);
  });
  it('rejects too few steps or the wrong shape', () => {
    expect(parseSteps('{"steps":["only one"]}')).toBeNull();
    expect(parseSteps('{"steps":"nope"}')).toBeNull();
    expect(parseSteps('no json here')).toBeNull();
  });
  it('drops empty and non-text steps and trims', () => {
    expect(parseSteps('{"steps":["  one  ","",2,"two","three"]}')).toEqual(['one', 'two', 'three']);
  });
});
