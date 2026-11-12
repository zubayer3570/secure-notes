export const normalizeInterests = (values: unknown) => {
  if (!Array.isArray(values)) return values;
  const cleaned = values.map((value) => String(value).trim().toLowerCase()).filter(Boolean);
  return [...new Set(cleaned)];
};
