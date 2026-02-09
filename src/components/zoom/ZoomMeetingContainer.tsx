import { Card, CardContent } from "@/components/ui/card";
import { Video, Loader2 } from "lucide-react";

interface ZoomMeetingContainerProps {
  isLoading?: boolean;
  meetingActive?: boolean;
}

/**
 * Placeholder container for Zoom Web SDK
 * The Zoom Web SDK will mount its meeting UI inside this component
 */
export const ZoomMeetingContainer = ({ 
  isLoading = false, 
  meetingActive = false 
}: ZoomMeetingContainerProps) => {
  return (
    <Card className="w-full h-full min-h-[400px] md:min-h-[500px] lg:min-h-[600px] bg-muted/50">
      <CardContent className="flex items-center justify-center h-full p-0">
        {/* 
          ZOOM WEB SDK MOUNT POINT
          The Zoom Web SDK will mount its meeting UI here.
          Use the element ID "zoom-meeting-container" for SDK initialization.
        */}
        <div 
          id="zoom-meeting-container" 
          className="w-full h-full min-h-[400px] md:min-h-[500px] lg:min-h-[600px] flex items-center justify-center"
        >
          {isLoading ? (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Loading meeting...</p>
            </div>
          ) : !meetingActive ? (
            <div className="text-center space-y-4 p-8">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Video className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Meeting Area</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  The Zoom meeting will appear here once started.
                  <br />
                  <span className="text-xs opacity-70">
                    (Zoom Web SDK integration pending)
                  </span>
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};
