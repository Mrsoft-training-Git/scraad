import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AboutCourseSectionProps {
  description: string | null;
}

export const AboutCourseSection = ({ description }: AboutCourseSectionProps) => {
  const [expanded, setExpanded] = useState(false);

  const text = description || "This comprehensive program will equip you with the skills and knowledge needed to excel in your field. Learn from industry experts and gain practical, hands-on experience.";

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-4">About This Course</h2>
      <div className="relative">
        <p 
          className={`text-muted-foreground leading-relaxed ${
            !expanded ? "line-clamp-6" : ""
          }`}
        >
          {text}
        </p>
        {text.length > 300 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="mt-2 p-0 h-auto text-primary hover:text-primary/80 font-medium"
          >
            {expanded ? (
              <>
                Show Less <ChevronUp className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                Show More <ChevronDown className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
