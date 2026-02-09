import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, CheckCircle, RefreshCw, Loader2 } from "lucide-react";
import { useZoom } from "@/hooks/useZoom";

export const ZoomConnectionStatus = () => {
  const { isConnected, zoomConnection, loading, connecting, connectZoom, refreshConnection } = useZoom();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Zoom Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking connection status...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Zoom Integration
        </CardTitle>
        <CardDescription>
          Connect your Zoom account to host live classes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
              {zoomConnection?.zoom_email && (
                <span className="text-sm text-muted-foreground">
                  {zoomConnection.zoom_email}
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={connectZoom}
              disabled={connecting}
            >
              {connecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Reconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">
                Not Connected
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Connect your Zoom account to schedule and host live classes for your courses.
            </p>
            <Button
              onClick={connectZoom}
              disabled={connecting}
            >
              {connecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Video className="h-4 w-4 mr-2" />
              )}
              Connect Zoom Account
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
