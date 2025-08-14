import { useAppointments } from "@/hooks/use-appointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ResponsiveContainer 
} from "recharts";
import { CalendarDays, Clock, User, Users } from "lucide-react";
import { format, startOfDay, endOfDay, subDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { appointments, queue } = useAppointments();
  const { t } = useTranslation();

  // Filtrar citas del día actual
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const todaysAppointments = appointments?.filter(
    (apt) => {
      const aptDate = new Date(apt.scheduledAt);
      return aptDate >= todayStart && aptDate <= todayEnd;
    }
  );

  // Datos para el gráfico de los últimos 7 días
  const lastWeekData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, i);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const count = appointments?.filter(
      (apt) => {
        const aptDate = new Date(apt.scheduledAt);
        return aptDate >= dayStart && aptDate <= dayEnd;
      }
    ).length || 0;

    return {
      date: format(date, 'MMM d', { locale: es }),
      citas: count
    };
  }).reverse();

  const stats = [
    {
      title: t('dashboard.todaysAppointments'),
      value: todaysAppointments?.length || 0,
      icon: CalendarDays
    },
    {
      title: t('dashboard.waiting'),
      value: queue?.filter(q => q.status === "waiting").length || 0,
      icon: Users
    },
    {
      title: t('dashboard.beingServed'),
      value: queue?.filter(q => q.status === "serving").length || 0,
      icon: User
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">{t('dashboard.title')}</h2>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.appointmentTrend')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lastWeekData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="citas" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.todaysAppointments')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {todaysAppointments?.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between py-4 border-b last:border-0"
              >
                <div>
                  <div className="font-medium">{t('dashboard.appointmentNumber')}{apt.confirmationCode}</div>
                  <div className="text-sm text-muted-foreground">
                    {t(`appointments.status.${apt.status}`)}
                  </div>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4" />
                  {format(new Date(apt.scheduledAt), "h:mm a", { locale: es })}
                </div>
              </div>
            ))}
            {!todaysAppointments?.length && (
              <div className="py-4 text-center text-muted-foreground">
                {t('dashboard.noAppointments')}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}