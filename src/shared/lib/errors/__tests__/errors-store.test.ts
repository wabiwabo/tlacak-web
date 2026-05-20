import { describe, expect, it, beforeEach } from 'vitest';
import { useErrorsStore } from '../errors-store';

beforeEach(() => {
  useErrorsStore.setState({ errors: [] });
});

describe('useErrorsStore', () => {
  it('pushes an error onto the queue', () => {
    useErrorsStore.getState().push('boom');
    expect(useErrorsStore.getState().errors).toEqual(['boom']);
  });

  it('pops the oldest error first (FIFO)', () => {
    useErrorsStore.getState().push('first');
    useErrorsStore.getState().push('second');
    useErrorsStore.getState().pop();
    expect(useErrorsStore.getState().errors).toEqual(['second']);
  });

  it('pop is a no-op on an empty queue', () => {
    useErrorsStore.getState().pop();
    expect(useErrorsStore.getState().errors).toEqual([]);
  });
});
