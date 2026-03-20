import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, CheckCircle2, PlayCircle, CreditCard, Search, GraduationCap, Clock, UserCheck, Send } from "lucide-react";

type ProgramStatus = "applied" | "admitted" | "in-progress" | "ended";

interface LearningProgram {
  id: string;
  program_id: string;
  title: string;
  short_description: string | null;
  banner_image_url: string | null;
  duration: string | null;
  mode: string;
  start_date: string | null;
  end_date: string | null;
  program_status: string | null;
  progress: number | null;
  payment_status: string | null;
  access_status: string | null;
  application_status: string | null;
  computedStatus: ProgramStatus;
  enrolled: boolean;
}

interface Props {
  userId: string | undefined;
}

function computeStatus(opts: {
  application_status: string | null;
  enrolled: boolean;
  payment_status: string | null;
  start_date: string | null;
  end_date: string | null;
  program_status: string | null;
}): ProgramStatus {
  const now = new Date();
  const started = opts.start_date ? new Date(opts.start_date) <= now : false;
  const ended = opts.end_date ? new Date(opts.end_date) < now : false;
  const closed = opts.program_status === "closed";

  if ((ended || closed)) return "ended";
  if (opts.enrolled && started) return "in-progress";
  if (opts.application_status === "approved" || opts.enrolled) return "admitted";
  return "applied";
}

const statusConfig: Record<ProgramStatus, { label: string; icon: typeof Send; badgeClass: string }> = {
  applied: { label: "Applied", icon: Send, badgeClass: "bg-blue-500/10 text-blue-600 border-blue-200" },
  admitted: { label: "Admitted", icon: UserCheck, badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  "in-progress": { label: "In Progress", icon: PlayCircle, badgeClass: "bg-primary/10 text-primary border-primary/20" },
  ended: { label: "Ended", icon: Clock, badgeClass: "bg-muted text-muted-foreground border-border" },
};

export const LearningProgramList = ({ userId }: Props) => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<LearningProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | ProgramStatus>("all");

  useEffect(() => {
    if (userId) fetchPrograms();
  }, [userId]);

  const fetchPrograms = async () => {
    if (!userId) return;
    setLoading(true);

    // Fetch applications and enrollments in parallel
    const [appRes, enrollRes] = await Promise.all([
      supabase
        .from("program_applications")
        .select("id, program_id, status, program:programs(id, title, short_description, banner_image_url, duration, mode, start_date, end_date, status)")
        .eq("user_id", userId),
      supabase
        .from("program_enrollments")
        .select("id, program_id, status, progress, payment_status, access_status, program:programs(id, title, short_description, banner_image_url, duration, mode, start_date, end_date, status)")
        .eq("user_id", userId),
    ]);

    const programMap = new Map<string, LearningProgram>();

    // Process applications first
    if (appRes.data) {
      for (const app of appRes.data) {
        const prog = app.program as any;
        if (!prog) continue;
        programMap.set(app.program_id, {
          id: app.id,
          program_id: app.program_id,
          title: prog.title,
          short_description: prog.short_description,
          banner_image_url: prog.banner_image_url,
          duration: prog.duration,
          mode: prog.mode,
          start_date: prog.start_date,
          end_date: prog.end_date,
          progress: null,
          payment_status: null,
          access_status: null,
          application_status: app.status,
          enrolled: false,
          computedStatus: "applied",
        });
      }
    }

    // Overlay enrollment data (takes priority)
    if (enrollRes.data) {
      for (const enr of enrollRes.data) {
        const prog = enr.program as any;
        if (!prog) continue;
        const existing = programMap.get(enr.program_id);
        programMap.set(enr.program_id, {
          id: enr.id,
          program_id: enr.program_id,
          title: prog.title,
          short_description: prog.short_description,
          banner_image_url: prog.banner_image_url,
          duration: prog.duration,
          mode: prog.mode,
          start_date: prog.start_date,
          end_date: prog.end_date,
          progress: enr.progress,
          payment_status: enr.payment_status,
          access_status: enr.access_status,
          application_status: existing?.application_status || "approved",
          enrolled: true,
          computedStatus: "admitted",
        });
      }
    }

    // Compute statuses
    const results = Array.from(programMap.values()).map(p => ({
      ...p,
      computedStatus: computeStatus({
        application_status: p.application_status,
        enrolled: p.enrolled,
        payment_status: p.payment_status,
        start_date: p.start_date,
        end_date: p.end_date,
      }),
    }));

    setPrograms(results);
    setLoading(false);
  };

  const filteredPrograms = programs.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || p.computedStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getAction = (p: LearningProgram) => {
    if (p.computedStatus === "applied") {
      return { label: "View Program", onClick: () => navigate(`/programs/${p.program_id}`) };
    }
    if (p.computedStatus === "admitted" && (!p.enrolled || p.payment_status === "pending" || p.access_status === "locked")) {
      return { label: "Pay Now", onClick: () => navigate(`/programs/${p.program_id}`) };
    }
    if (p.computedStatus === "in-progress" || p.computedStatus === "admitted") {
      return { label: "Continue", onClick: () => navigate(`/dashboard/programs/${p.program_id}`) };
    }
    return { label: "View", onClick: () => navigate(`/dashboard/programs/${p.program_id}`) };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {programs.length} program{programs.length !== 1 ? "s" : ""}
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search programs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-9 w-[200px] text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {(["all", "applied", "admitted", "in-progress", "ended"] as const).map(status => (
          <Badge
            key={status}
            variant={filterStatus === status ? "default" : "outline"}
            className="cursor-pointer px-3 py-1.5 text-xs whitespace-nowrap hover:bg-primary hover:text-primary-foreground transition-colors capitalize"
            onClick={() => setFilterStatus(status)}
          >
            {status === "all" ? "All" : status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-muted rounded-xl mb-3" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredPrograms.length === 0 ? (
        <Card className="border border-border/60 shadow-none">
          <CardContent className="py-16 text-center">
            <GraduationCap className="w-14 h-14 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-heading font-semibold text-lg mb-2">
              {programs.length === 0 ? "No Programs Yet" : "No results"}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {programs.length === 0 ? "Explore available programs to get started" : "Try adjusting your filters"}
            </p>
            {programs.length === 0 && (
              <Button asChild className="bg-primary hover:bg-accent text-primary-foreground">
                <Link to="/programs">Browse Programs</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPrograms.map((p) => {
            const config = statusConfig[p.computedStatus];
            const StatusIcon = config.icon;
            const action = getAction(p);
            const progress = p.progress ?? 0;

            return (
              <Card
                key={`${p.program_id}-${p.id}`}
                className="group overflow-hidden border border-border bg-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                <div className="aspect-video overflow-hidden relative">
                  <Badge className={`absolute top-2.5 left-2.5 border z-10 text-[10px] ${config.badgeClass}`}>
                    <StatusIcon className="w-3 h-3 mr-0.5" /> {config.label}
                  </Badge>
                  <img
                    src={p.banner_image_url || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80"}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {p.computedStatus === "in-progress" && progress > 0 && progress < 100 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-1.5 flex-1 bg-white/30" />
                        <span className="text-[11px] font-bold text-white">{progress}%</span>
                      </div>
                    </div>
                  )}
                </div>
                <CardContent className="p-4 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="w-fit text-[10px] bg-muted text-muted-foreground">
                      {p.mode}
                    </Badge>
                    {p.duration && (
                      <Badge variant="outline" className="w-fit text-[10px]">
                        {p.duration}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors text-foreground">
                    {p.title}
                  </h3>
                  {p.short_description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{p.short_description}</p>
                  )}
                  <div className="mt-auto pt-3 border-t border-border">
                    <Button
                      variant={p.computedStatus === "admitted" && (!p.enrolled || p.payment_status === "pending") ? "destructive" : "default"}
                      className={p.computedStatus !== "admitted" || p.enrolled ? "w-full bg-primary hover:bg-accent text-primary-foreground font-semibold" : "w-full"}
                      size="sm"
                      onClick={action.onClick}
                    >
                      {action.label}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
