import { redirect } from "next/navigation";
import { ScheduleExplorer } from "@/components/schedule-explorer";
import { getCurrentUser, getRailClinicActivities, getEntities, getDaopDivres } from "@/lib/rci-data";

export const metadata = {
  title: "Jadwal RC - RCI",
  description: "Manajemen jadwal kegiatan Rail Clinic",
};

export default async function SchedulePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [activities, entities, daopDivres] = await Promise.all([
    getRailClinicActivities(),
    getEntities(),
    getDaopDivres(),
  ]);

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-kai-navy">Jadwal RC</h1>
        <p className="text-muted-foreground">
          Kelola dan pantau jadwal kegiatan Rail Clinic di seluruh wilayah kerja.
        </p>
      </div>
      
      <ScheduleExplorer 
        activities={activities} 
        entities={entities} 
        daopDivres={daopDivres}
        userRole={user.role}
      />
    </div>
  );
}
