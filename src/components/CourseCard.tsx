import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Star, Share2, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
  };
  onEnroll?: (courseId: string) => void;
  showEnrollButton?: boolean;
}

export const CourseCard = ({ course, onEnroll, showEnrollButton = true }: CourseCardProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    const courseUrl = `${window.location.origin}/programs/${course.id}`;
    try {
      await navigator.clipboard.writeText(courseUrl);
      setCopied(true);
      toast({ title: "Link copied!", description: "Course link has been copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", description: "Please try again.", variant: "destructive" });
    }
  };

  return (
    <Card className="group overflow-hidden bg-card border border-border hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <div className="aspect-video overflow-hidden relative">
        <Badge className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm text-foreground border-0 z-10 text-xs">
          {course.category}
        </Badge>
        {course.top_rated && (
          <Badge className="absolute top-3 left-3 bg-secondary text-secondary-foreground border-0 z-10 text-xs">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Top Rated
          </Badge>
        )}
        <img
          src={course.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <CardContent className="p-5 flex flex-col flex-grow">
        <h3 className="font-heading font-bold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[3rem] text-foreground">
          {course.title}
        </h3>
        {course.description && (
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{course.description}</p>
        )}
        <div className="flex items-center justify-between mb-4 mt-auto">
          {course.price === 0 ? (
            <Badge className="bg-success/10 text-success border-0 text-sm px-3 py-1">Free</Badge>
          ) : (
            <span className="text-xl font-bold text-foreground">₦{course.price.toLocaleString()}</span>
          )}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{course.students_count || 0}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {showEnrollButton && (
            <Button
              className="flex-1 bg-primary hover:bg-accent text-primary-foreground font-semibold shadow-sm"
              asChild
            >
              <Link to={`/enroll/${course.id}`}>Apply Now</Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleShare} className="shrink-0 text-muted-foreground hover:text-primary" title="Share course">
            {copied ? <Check className="w-4 h-4 text-success" /> : <Share2 className="w-4 h-4" />}
          </Button>
          <Button variant="outline" className={`${!showEnrollButton ? 'flex-1' : ''} border-border hover:bg-muted`} asChild>
            <Link to={`/courses/${course.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
