import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, CalendarCheck } from "lucide-react";

type Status = "present" | "absent" | "late" | "excused";

const STATUSES: { value: Status; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "excused", label: "Excused" },
];

interface Student {
  user_id: string;
  full_name?: string | null;
  email?: string | null;
}

interface Props {
  programId: string;
  students: Student[];
  markedBy?: string;
}

export const ProgramAttendance = ({ programId, students, markedBy }: Props) => {
  const { toast } = useToast();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const fetchAttendance = async () => {
    if (!programId) return;
    setLoading(true);
    const [dayRes, allRes] = await Promise.all([
      supabase.from("program_attendance").select("user_id, status").eq("program_id", programId).eq("session_date", date),
      supabase.from("program_attendance").select("session_date, status").eq("program_id", programId),
    ]);
    const map: Record<string, Status> = {};
    (dayRes.data || []).forEach((r: any) => { map[r.user_id] = r.status; });
    setRecords(map);
    setHistory(allRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAttendance(); /* eslint-disable-next-line */ }, [programId, date]);

  const setStatus = (userId: string, status: Status) =>
    setRecords((prev) => ({ ...prev, [userId]: status }));

  const markAll = (status: Status) => {
    const next: Record<string, Status> = {};
    students.forEach((s) => { next[s.user_id] = status; });
    setRecords(next);
  };

  const save = async () => {
    const rows = students
      .filter((s) => records[s.user_id])
      .map((s) => ({
        program_id: programId,
        user_id: s.user_id,
        session_date: date,
        status: records[s.user_id],
        marked_by: markedBy ?? null,
      }));
    if (rows.length === 0) {
      toast({ title: "Nothing to save", description: "Mark at least one student." });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("program_attendance")
      .upsert(rows, { onConflict: "program_id,user_id,session_date" });
    setSaving(false);
    if (error) {
      toast({ title: "Failed to save attendance", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Attendance saved", description: `${rows.length} student(s) marked for ${date}.` });
    fetchAttendance();
  };

  const summary = useMemo(() => {
    const sessions = new Set(history.map((h: any) => h.session_date)).size;
    const present = history.filter((h: any) => h.status === "present" || h.status === "late").length;
    const rate = history.length ? Math.round((present / history.length) * 100) : 0;
    return { sessions, rate };
  }, [history]);

  if (students.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No students enrolled yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <Label htmlFor="attendance-date">Session date</Label>
          <Input
            id="attendance-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-[180px]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => markAll("present")}>Mark all present</Button>
          <Button size="sm" variant="outline" onClick={() => markAll("absent")}>Mark all absent</Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Save attendance
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><CalendarCheck className="w-3.5 h-3.5" />{summary.sessions} session(s) recorded</span>
        <span>Overall attendance rate: <strong className="text-foreground">{summary.rate}%</strong></span>
      </div>

      {loading ? (
        <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {students.map((s) => (
            <Card key={s.user_id} className="border-border/60">
              <CardContent className="p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{s.full_name || "Unnamed student"}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((st) => (
                    <Button
                      key={st.value}
                      size="sm"
                      variant={records[s.user_id] === st.value ? "default" : "outline"}
                      className="h-8 text-xs"
                      onClick={() => setStatus(s.user_id, st.value)}
                    >
                      {st.label}
                    </Button>
                  ))}
                  {!records[s.user_id] && <Badge variant="secondary" className="text-[10px] self-center">Unmarked</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
