// Schema lives in supabase/migrations. Running `supabase gen types typescript` and replacing this alias gives full typing;
// until then rows are loosely typed and every query result is validated/mapped at the call site.
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Db = any;
