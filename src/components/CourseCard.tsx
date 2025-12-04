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
      toast({
        title: "Link copied!",
        description: "Course link has been copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="group overflow-hidden border-border/50 bg-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 flex flex-col">
      <div className="aspect-video overflow-hidden relative">
        <Badge className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm text-primary border-0 z-10">
          {course.category}
        </Badge>
        {course.top_rated && (
          <Badge className="absolute top-4 left-4 bg-yellow-500 text-white border-0 z-10">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Top Rated
          </Badge>
        )}
        <img
          src={course.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>
      <CardContent className="p-6 flex flex-col flex-grow">
        <h3 className="font-heading font-bold text-lg mb-3 line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
          {course.title}
        </h3>
        {course.description && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{course.description}</p>
        )}
        <div className="flex items-center justify-between mb-5 mt-auto">
          {course.price === 0 ? (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-lg px-3 py-1">
              Free
            </Badge>
          ) : (
            <span className="text-2xl font-bold text-primary">₦{course.price.toLocaleString()}</span>
          )}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{course.students_count || 0}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {showEnrollButton && (
            <Button 
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/20 font-semibold"
              onClick={() => onEnroll?.(course.id)}
            >
              Apply Now
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={handleShare}
            className="shrink-0"
            title="Share course"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            className={`${!showEnrollButton ? 'flex-1' : ''}`}
            asChild
          >
            <Link to={`/programs/${course.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
