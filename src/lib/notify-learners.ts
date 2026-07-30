import { supabase } from "@/integrations/supabase/client";

export type NotifyKind = "assignment" | "material" | "exam" | "upload" | "announcement";

export interface NotifyLearnersInput {
  entityType: "program" | "course";
  entityId: string;
  kind: NotifyKind;
  itemId?: string;
  itemTitle: string;
  moduleTitle?: string | null;
  description?: string | null;
  dueDate?: string | null;
  startTime?: string | null;
  durationMinutes?: number | null;
  maxScore?: number | null;
}

/**
 * Fire-and-forget email notification to everyone enrolled in the course/program.
 * Never throws — notification failures must not break content creation.
 */
export async function notifyLearners(input: NotifyLearnersInput): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("notify-learners", {
      body: {
        ...input,
        moduleTitle: input.moduleTitle ?? undefined,
        description: input.description ?? undefined,
        dueDate: input.dueDate ?? undefined,
        startTime: input.startTime ?? undefined,
        durationMinutes: input.durationMinutes ?? undefined,
        maxScore: input.maxScore ?? undefined,
      },
    });
    if (error) console.warn("notifyLearners failed", error);
  } catch (err) {
    console.warn("notifyLearners failed", err);
  }
}
