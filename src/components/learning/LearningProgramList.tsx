import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, CheckCircle2, PlayCircle, CreditCard, Search, GraduationCap } from "lucide-react";

interface EnrolledProgram {
  id: string;
  program_id: string;
  status: string;
  progress: number | null;
  enrolled_at: string;
  payment_status: string;
  access_status: string;
  program?: {
    id: string;
    title: string;
    description: string | null;
    short_description: string | null;
    banner_image_url: string | null;
    duration: string | null;
    mode: string;
    status: string;
  };
}

interface Props {
  userId: string | undefined;
}

export const LearningProgramList = ({ userId }: Props) => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<EnrolledProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "in-progress" | "completed" | "not-started">("all");

  useEffect(() => {
    if (userId) fetchPrograms();
  }, [userId]);

  const fetchPrograms = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("program_enrollments")
      .select(`id, program_id, status, progress, enrolled_at, payment_status, access_status, program:programs(id, title, description, short_description, banner_image_url, duration, mode, status)`)
      .eq("user_id", userId)
      .order("enrolled_at", { ascending: false });

    if (!error && data) {
      setPrograms(data as EnrolledProgram[]);
    }
    setLoading(false);
  };

  const filteredPrograms = programs.filter(p => {
    const title = p.program?.title || "";
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    const progress = p.progress ?? 0;
    const matchesFilter = filterStatus === "all" ||
      (filterStatus === "completed" && progress >= 100) ||
      (filterStatus === "in-progress" && progress > 0 && progress < 100) ||
      (filterStatus === "not-started" && progress === 0);
    return matchesSearch && matchesFilter;
  });

  const getButtonState = (enrollment: EnrolledProgram) => {
    if (enrollment.payment_status === "pending" || enrollment.access_status === "locked") {
      return { label: "Pay Now", icon: CreditCard, variant: "destructive" as const, action: "pay" as const };
    }
    const progress = enrollment.progress ?? 0;
    if (progress >= 100) return { label: "View", icon: CheckCircle2, variant: "outline" as const, action: "view" as const };
    if (progress > 0) return { label: "Continue", icon: PlayCircle, variant: "default" as const, action: "view" as const };
    return { label: "Start", icon: PlayCircle, variant: "default" as const, action: "view" as const };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {programs.length} program{programs.length !== 1 ? 's' : ''} enrolled
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
        {(["all", "in-progress", "completed", "not-started"] as const).map(status => (
          <Badge
            key={status}
            variant={filterStatus === status ? "default" : "outline"}
            className="cursor-pointer px-3 py-1.5 text-xs whitespace-nowrap hover:bg-primary hover:text-primary-foreground transition-colors capitalize"
            onClick={() => setFilterStatus(status)}
          >
            {status === "all" ? "All" : status.replace("-", " ")}
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
          {filteredPrograms.map((enrollment) => {
            const program = enrollment.program;
            const buttonState = getButtonState(enrollment);
            const ButtonIcon = buttonState.icon;
            const progress = enrollment.progress ?? 0;

            return (
              <Card
                key={enrollment.id}
                className="group overflow-hidden border border-border bg-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                <div className="aspect-video overflow-hidden relative">
                  {progress >= 100 && (
                    <Badge className="absolute top-2.5 left-2.5 bg-success text-success-foreground border-0 z-10 text-[10px]">
                      <CheckCircle2 className="w-3 h-3 mr-0.5" /> Completed
                    </Badge>
                  )}
                  {buttonState.action === "pay" && (
                    <Badge className="absolute top-2.5 left-2.5 bg-destructive text-destructive-foreground border-0 z-10 text-[10px]">
                      <CreditCard className="w-3 h-3 mr-0.5" /> Payment Required
                    </Badge>
                  )}
                  <img
                    src={program?.banner_image_url || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80"}
                    alt={program?.title || "Program"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {progress > 0 && progress < 100 && (
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
                      {program?.mode || "Program"}
                    </Badge>
                    {program?.duration && (
                      <Badge variant="outline" className="w-fit text-[10px]">
                        {program.duration}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors text-foreground">
                    {program?.title || "Program"}
                  </h3>
                  {program?.short_description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{program.short_description}</p>
                  )}
                  <div className="mt-auto pt-3 border-t border-border">
                    <Button
                      variant={buttonState.variant}
                      className={`w-full ${buttonState.variant === "default" ? "bg-primary hover:bg-accent text-primary-foreground font-semibold" : ""}`}
                      size="sm"
                      onClick={() => {
                        if (buttonState.action === "pay") {
                          navigate(`/programs/${enrollment.program_id}`);
                        } else {
                          navigate(`/dashboard/programs/${enrollment.program_id}`);
                        }
                      }}
                    >
                      <ButtonIcon className="w-4 h-4 mr-2" />
                      {buttonState.label}
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
