import data from "@/content/council-departments.json";
import type { Department } from "@/lib/council";

/** Council departments in display order (content/council-departments.json). */
export const DEPARTMENTS: Department[] = data.departments;

export const deptByKey = (key: string | null | undefined) => DEPARTMENTS.find((d) => d.key === key) ?? null;
/** Department key from a stored Thai label (rows written before dept_key existed), with or without the "ฝ่าย" prefix. */
export const deptKeyFromLabel = (label: string) => {
  const t = label.trim().replace(/^ฝ่าย/, "");
  return DEPARTMENTS.find((d) => d.th === t)?.key ?? null;
};
