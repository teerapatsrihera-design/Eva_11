// ใช้ Zod กับ React Hook Form โดยไม่ต้องลง @hookform/resolvers
// useForm({ resolver: validateWith(schema) })
export const validateWith = (schema) => (values) => {
  const result = schema.safeParse(values);
  if (result.success) return { values: result.data, errors: {} };

  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (!errors[field]) errors[field] = { type: issue.code, message: issue.message };
  }
  return { values: {}, errors };
};
