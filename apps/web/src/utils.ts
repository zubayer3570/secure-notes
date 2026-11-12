export const formValues = (form: HTMLFormElement) => Object.fromEntries(new FormData(form)) as Record<string, string>;

export const splitInterests = (value = '') =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export function userPayload(form: HTMLFormElement) {
  const { password, interests, ...rest } = formValues(form);
  return { ...rest, interests: splitInterests(interests), ...(password && { password }) };
}

export const when = (iso: string) => new Date(iso).toLocaleString();
