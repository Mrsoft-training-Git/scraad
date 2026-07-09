// Compute the effective program status from stored status + dates.
// Dates take precedence over stale stored status so a program past its
// end_date always reads as "closed", and one past its start_date reads as
// "ongoing", regardless of what the DB row says.
export type EffectiveProgramStatus = "open" | "ongoing" | "closed";

export function getEffectiveProgramStatus(opts: {
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}): EffectiveProgramStatus {
  const now = new Date();
  const start = opts.start_date ? new Date(opts.start_date) : null;
  const end = opts.end_date ? new Date(opts.end_date) : null;

  if (opts.status === "closed") return "closed";
  if (end && end.getTime() < now.getTime()) return "closed";
  if (start && start.getTime() <= now.getTime()) return "ongoing";
  return (opts.status as EffectiveProgramStatus) || "open";
}
