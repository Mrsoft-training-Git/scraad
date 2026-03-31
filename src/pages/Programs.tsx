import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Users, MapPin, Calendar, Search, ArrowRight, Laptop, Building, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Program {
  id: string;
  title: string;
  short_description: string | null;
  banner_image_url: string | null;
  duration: string | null;
  mode: string;
  location: string | null;
  start_date: string | null;
  status: string;
  max_participants: number | null;
}

const modeIcons: Record<string, React.ReactNode> = {
  physical: <Building className="w-4 h-4" />,
  hybrid: <Globe className="w-4 h-4" />,
  online: <Laptop className="w-4 h-4" />,
};

const statusColors: Record<string, string> = {
  open: "bg-green-500/10 text-green-600 border-green-500/20",
  ongoing: "bg-secondary/10 text-secondary border-secondary/20",
  closed: "bg-muted text-muted-foreground border-border",
};

const Programs = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("programs")
      .select("id, title, short_description, banner_image_url, duration, mode, location, start_date, status, max_participants")
      .neq("status", "closed")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setPrograms(data);
    }
    setLoading(false);
  };

  const filtered = programs.filter((p) => {
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
    const matchesMode = modeFilter === "all" || p.mode === modeFilter;
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesMode && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <Badge className="mb-4 bg-secondary/20 text-secondary border-secondary/30 font-semibold">
            Advanced Training Programs
          </Badge>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Earn Accredited Degrees from
            <span className="block bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent mt-1">
              Top Nigerian Universities
            </span>
          </h1>
          <p className="text-lg text-primary-foreground/80 mb-4 max-w-2xl mx-auto">
            Apply for advanced online training programs from leading universities and tertiary 
            institutions in Nigeria. Land a <strong>PGD</strong>, <strong>B.Sc</strong>, or <strong>M.Sc</strong> on 
            fully accredited courses — study online, on-site, or hybrid.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {["PGD", "B.Sc", "M.Sc", "HND", "Professional Certs"].map((tag) => (
              <span key={tag} className="px-4 py-1.5 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-sm font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-b bg-card sticky top-0 z-20">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search programs..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={modeFilter} onValueChange={setModeFilter}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Mode" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              <SelectItem value="physical">Physical</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="online">Online</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">Loading programs...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">No programs found</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((program) => (
                <Card key={program.id} className="group overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
                  <div className="aspect-video overflow-hidden relative">
                    <Badge className={`absolute top-3 left-3 z-10 capitalize ${statusColors[program.status] || ""}`}>
                      {program.status}
                    </Badge>
                    <Badge className="absolute top-3 right-3 z-10 bg-background/90 backdrop-blur-sm text-foreground border-0 capitalize">
                      {modeIcons[program.mode]} <span className="ml-1">{program.mode}</span>
                    </Badge>
                    <img
                      src={program.banner_image_url || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80"}
                      alt={program.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <CardContent className="p-5 flex flex-col flex-grow">
                    <h3 className="font-heading font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {program.title}
                    </h3>
                    {program.short_description && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{program.short_description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4 mt-auto">
                      {program.duration && (
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{program.duration}</span>
                      )}
                      {program.location && (
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{program.location}</span>
                      )}
                      {program.start_date && (
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(program.start_date), "MMM d, yyyy")}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {program.status === "open" ? (
                        <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" asChild>
                          <Link to={`/programs/${program.id}`}>Apply Now</Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          {program.status === "ongoing" ? "In Progress" : "Closed"}
                        </Button>
                      )}
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/programs/${program.id}`}>
                          View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Programs;
