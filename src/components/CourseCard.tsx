import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Play, ArrowRight } from "lucide-react";
import { TiltCard } from "@/components/TiltCard";

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description?: string | null;
    price: number;
    image_url?: string | null;
    category: string;
    students_count?: number | null;
    featured?: boolean;
    top_rated?: boolean;
    instructor?: string | null;
    level?: string | null;
  };
  isEnrolled?: boolean;
  /** Optional override for the primary CTA. Defaults to /enroll/:id (or /dashboard/learning when enrolled). */
  onPrimaryAction?: () => void;
  /** When true (default), wraps the card in a 3D tilt effect on hover. */
  tilt?: boolean;
  className?: string;
}

/**
 * Unified course card used across Home, Catalog, and Dashboard surfaces.
 * - Primary CTA: "Enroll Now" → /enroll/:id  (or "Go to Course" → /dashboard/learning when enrolled)
 * - Secondary CTA: "View Details" → /courses/:id
 */
export const CourseCard = ({
  course,
  isEnrolled = false,
  onPrimaryAction,
  tilt = true,
  className = "",
}: CourseCardProps) => {
  const navigate = useNavigate();

  const handlePrimary = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onPrimaryAction) return onPrimaryAction();
    navigate(isEnrolled ? "/dashboard/learning" : `/enroll/${course.id}`);
  };

  const card = (
    <Card className="group overflow-hidden bg-card border border-border hover:border-secondary/40 hover:shadow-2xl transition-all duration-500 flex flex-col h-full rounded-2xl relative">
      {/* Gradient ring on hover */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-secondary/0 via-secondary/0 to-accent/0 group-hover:from-secondary/40 group-hover:to-accent/40 transition-all duration-500 pointer-events-none -z-10 blur-sm" />

      <Link to={`/courses/${course.id}`} className="block aspect-video overflow-hidden relative">
        <img
          src={
            course.image_url ||
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"
          }
          alt={course.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        {course.price === 0 && (
          <Badge className="absolute top-2.5 left-2.5 bg-success text-success-foreground text-[10px] border-0 shadow-sm">
            Free
          </Badge>
        )}
        {course.top_rated && course.price !== 0 && (
          <Badge className="absolute top-2.5 left-2.5 bg-secondary text-secondary-foreground border-0 z-10 text-[10px] font-bold shadow-sm">
            <Star className="w-3 h-3 mr-0.5 fill-current" /> Top Rated
          </Badge>
        )}
        <Badge className="absolute top-2.5 right-2.5 bg-card/95 backdrop-blur text-foreground text-[10px] border-0">
          {course.category}
        </Badge>

        {/* Play overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-secondary/95 flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
            <Play className="w-5 h-5 text-secondary-foreground fill-current ml-0.5" />
          </div>
        </div>
      </Link>

      <CardContent className="p-4 sm:p-5 flex flex-col flex-grow">
        <Link to={`/courses/${course.id}`}>
          <h3 className="font-heading font-semibold text-sm sm:text-base text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors leading-snug min-h-[2.5rem]">
            {course.title}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground mb-2 truncate">
          {course.instructor || "ScraAD Instructor"}
        </p>

        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-xs font-bold text-secondary">4.5</span>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < 4 ? "fill-secondary text-secondary" : "fill-secondary/30 text-secondary/30"
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground">
            ({course.students_count || 0})
          </span>
        </div>

        <div className="mt-auto pt-3 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            {course.price === 0 ? (
              <span className="font-bold text-success text-sm">Free</span>
            ) : (
              <span className="font-bold text-foreground text-base">
                ₦{course.price.toLocaleString()}
              </span>
            )}
            {course.level && (
              <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5">
                {course.level}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-9 border-border hover:bg-muted"
              asChild
            >
              <Link to={`/courses/${course.id}`}>View Details</Link>
            </Button>
            <Button
              size="sm"
              className="text-xs h-9 font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 magnetic-btn group/btn"
              onClick={handlePrimary}
            >
              {isEnrolled ? "Go to Course" : "Enroll Now"}
              <ArrowRight className="ml-1 w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={className}>
      {tilt ? <TiltCard intensity={6}>{card}</TiltCard> : card}
    </div>
  );
};
