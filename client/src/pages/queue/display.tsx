import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAppointments } from "@/hooks/use-appointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell } from "lucide-react";

export default function QueueDisplay() {
  const { t } = useTranslation();
  const { queue, queueLoading } = useAppointments();

  useEffect(() => {
    // Set up full screen
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }

    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
  }, []);

  const servingQueue = queue?.filter(q => q.status === "serving") || [];
  const waitingQueue = queue?.filter(q => q.status === "waiting") || [];

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="grid gap-8">        
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">{t("queue.display.title")}</h1>
          <p className="text-muted-foreground">
            {t("queue.display.currentTime")}: {new Date().toLocaleTimeString()}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-primary/5">            
          <CardHeader>
              <CardTitle className="text-2xl text-center">
                {t("queue.display.nowServing")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {servingQueue.map((entry) => (
                <Alert key={entry.id} className="mb-4 bg-primary text-primary-foreground">
                  <Bell className="h-4 w-4" />
                  <AlertTitle className="text-2xl font-bold">
                    #{entry.appointmentId}
                  </AlertTitle>                  
                  <AlertDescription>
                    {t("queue.display.proceedToCounter")} {entry.counter}
                  </AlertDescription>
                </Alert>
              ))}              {servingQueue.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  {t("queue.display.noCustomersServed")}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>            
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                {t("queue.display.waitingList")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {waitingQueue.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 text-center border rounded-lg bg-muted"
                  >
                    <div className="text-2xl font-bold">
                      #{entry.appointmentId}
                    </div>
                  </div>
                ))}                {waitingQueue.length === 0 && (
                  <div className="col-span-3 text-center text-muted-foreground py-8">
                    {t("queue.display.noCustomersWaiting")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
