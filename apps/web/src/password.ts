export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_BYTES = 72;

export type PasswordRule = { key: string; label: string; test: (value: string) => boolean };

const matches = (pattern: RegExp) => (value: string) => pattern.test(value);

export const passwordRules: PasswordRule[] = [
  {
    key: 'length',
    label: `at least ${MIN_PASSWORD_LENGTH} characters`,
    test: (value) => value.length >= MIN_PASSWORD_LENGTH,
  },
  { key: 'lowercase', label: 'a lowercase letter', test: matches(/\p{Ll}/u) },
  { key: 'uppercase', label: 'an uppercase letter', test: matches(/\p{Lu}/u) },
  { key: 'number', label: 'a number', test: matches(/\p{N}/u) },
  { key: 'symbol', label: 'a symbol', test: matches(/[^\p{L}\p{N}\s]/u) },
  {
    key: 'bytes',
    label: `at most ${MAX_PASSWORD_BYTES} bytes`,
    test: (value) => new TextEncoder().encode(value).length <= MAX_PASSWORD_BYTES,
  },
];

export const checkPassword = (value: string) =>
  passwordRules.map(({ key, label, test }) => ({ key, label, met: test(value) }));

export function passwordProblem(value: string) {
  if (!value) return '';
  const failed = checkPassword(value).find((rule) => !rule.met);
  return failed ? `Password needs ${failed.label}` : '';
}
