import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Loader2, ExternalLink, CheckCircle } from "lucide-react";

interface ZoomMeetingContainerProps {
  isLoading?: boolean;
  meetingActive?: boolean;
  zoomUrl?: string | null;
}

export const ZoomMeetingContainer = ({ 
  isLoading = false, 
  meetingActive = false,
  zoomUrl,
}: ZoomMeetingContainerProps) => {
  return (
    <Card className="w-full h-full min-h-[400px] md:min-h-[500px] lg:min-h-[600px] bg-muted/50">
      <CardContent className="flex items-center justify-center h-full p-0">
        <div className="w-full h-full min-h-[400px] md:min-h-[500px] lg:min-h-[600px] flex items-center justify-center">
          {isLoading ? (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Loading meeting...</p>
            </div>
          ) : meetingActive ? (
            <div className="text-center space-y-4 p-8">
              <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Meeting is Live</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Your Zoom meeting should have opened in a new tab.
                </p>
              </div>
              {zoomUrl && (
                <Button onClick={() => window.open(zoomUrl, "_blank")} variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Reopen Zoom Meeting
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4 p-8">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Video className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Meeting Area</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Click "Start Class" to launch your Zoom meeting.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
