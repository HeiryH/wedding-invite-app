import { expect, test } from 'vitest';
import { apiErrorMessage, apiErrorStatus } from './errors';

test('narrows Axios errors and validates remote message types', () => {
  const error = { isAxiosError: true, response: { status: 403, data: { message: 'Upgrade required' } } };
  expect(apiErrorMessage(error)).toBe('Upgrade required');
  expect(apiErrorStatus(error)).toBe(403);
  for (const data of [null, 'text', { message: 42 }, {}]) {
    expect(apiErrorMessage({ ...error, response: { ...error.response, data } })).toBeUndefined();
  }
  for (const value of [null, undefined, new Error('network'), 'failure']) {
    expect(apiErrorMessage(value)).toBeUndefined();
    expect(apiErrorStatus(value)).toBeUndefined();
  }
});
