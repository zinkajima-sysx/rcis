import Link from "next/link";
import {
  ActivityIcon,
  ArrowRightIcon,
  CalendarClockIcon,
  FolderOpenIcon,
  PackageCheckIcon,
  ShieldAlertIcon,
} from "lucide-react";

import { PhotoTile } from "@/components/photo-tile";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getEquipmentCategories,
  getMedicalEquipments,
  getRailClinicActivities,
} from "@/lib/rci-data";
import {
  formatDateLong,
  getCalibrationAlerts,
  getCategoryTotals,
  getDashboardMetrics,
  getInventorySummary,
  getUpcomingSchedule,
  getTotalActivities,
  getRecentActivities,
  enhanceEquipmentWithCalibration,
} from "@/lib/rci-utils";
import { cn } from "@/lib/utils";

const iconMap = {
  total: PackageCheckIcon,
  ready: ActivityIcon,
  alerts: ShieldAlertIcon,
  activities: FolderOpenIcon,
};

const metricCardStyles = {
  total: {
    card:
      "border-primary/20 bg-[linear-gradient(180deg,#ffffff_0%,#f0f4fa_100%)] shadow-[0_14px_28px_rgba(0,51,102,0.08)]",
    icon: "bg-primary/10 text-primary",
    value: "text-primary",
    badge: "bg-primary/5 text-primary",
    accent: "bg-primary",
  },
  ready: {
    card:
      "border-emerald-200 bg-[linear-gradient(180deg,#ffffff_0%,#f0fdf4_100%)] shadow-[0_14px_28px_rgba(16,185,129,0.08)]",
    icon: "bg-emerald-100 text-emerald-600",
    value: "text-emerald-700",
    badge: "bg-emerald-50 text-emerald-600",
    accent: "bg-emerald-500",
  },
  alerts: {
    card:
      "border-accent/20 bg-[linear-gradient(180deg,#ffffff_0%,#fffaf0_100%)] shadow-[0_14px_28px_rgba(255,130,0,0.1)]",
    icon: "bg-accent/10 text-accent",
    value: "text-accent",
    badge: "bg-accent/5 text-accent",
    accent: "bg-accent",
  },
  activities: {
    card:
      "border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_14px_28px_rgba(71,85,105,0.08)]",
    icon: "bg-slate-100 text-slate-600",
    value: "text-slate-700",
    badge: "bg-slate-50 text-slate-600",
    accent: "bg-slate-500",
  },
} as const;

export default async function Home() {
  const allEquipment = await getMedicalEquipments();
  const categories = await getEquipmentCategories();
  const activities = await getRailClinicActivities();

  const enhancedEquipment = enhanceEquipmentWithCalibration(allEquipment);
  const summary = getInventorySummary(allEquipment);
  
  const metrics = [
    {
      id: "total" as const,
      label: "Total Alkes",
      value: summary.total,
      helper: "Seluruh aset kesehatan yang terdata pada sistem.",
    },
    {
      id: "ready" as const,
      label: "Layak Pakai",
      value: summary.layak,
      helper: "Alat dalam status siap dipakai untuk pelayanan.",
    },
    {
      id: "alerts" as const,
      label: "Butuh Perbaikan",
      value: summary.perbaikan,
      helper: "Alat yang membutuhkan perbaikan teknis.",
    },
    {
      id: "activities" as const,
      label: "Rusak / Tidak Layak",
      value: summary.rusak,
      helper: "Alat yang sudah tidak dapat digunakan.",
    },
  ];

  const alerts = getCalibrationAlerts(enhancedEquipment).slice(0, 4);
  const categoryTotals = getCategoryTotals(allEquipment, categories);
  const previewActivities = getRecentActivities(activities);

  // Filter activities for ongoing/upcoming (simplified for this demo)
  const ongoingActivities = activities.filter(a => new Date(a.tanggalKegiatan) <= new Date() && new Date(a.tanggalKegiatan) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const upcomingActivities = activities.filter(a => new Date(a.tanggalKegiatan) > new Date()).slice(0, 2);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard RCIS</h1>
            <p className="text-muted-foreground">Rail Clinic Inventory System - Snapshot Operasional</p>
          </div>
          <Badge variant="outline" className="px-4 py-1.5 text-sm font-medium border-primary/20 bg-primary/5 text-primary">
            {formatDateLong("2026-04-19")}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = iconMap[metric.id];
            const styles = metricCardStyles[metric.id];

            return (
              <Card
                key={metric.id}
                size="sm"
                className={cn(
                  "relative overflow-hidden border shadow-none transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
                  styles.card
                )}
              >
                <div className={cn("absolute inset-x-0 top-0 h-1.5", styles.accent)} />
                <CardHeader className="gap-3 pb-1">
                  <div className="flex items-center justify-between">
                    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-[0.1em] uppercase", styles.badge)}>
                      KAI RCIS
                    </span>
                    <div className={cn("flex size-10 items-center justify-center rounded-xl shadow-inner", styles.icon)}>
                      <Icon className="size-5" />
                    </div>
                  </div>
                  <CardDescription className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide">
                    {metric.label}
                  </CardDescription>
                  <CardTitle className={cn("text-4xl font-bold tracking-tighter", styles.value)}>
                    {metric.value}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-[12px] leading-5 text-slate-500 italic">
                    {metric.helper}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-2">
            <ShieldAlertIcon className="size-5 text-accent" />
            <h2 className="text-xl font-bold text-primary">Peringatan Kalibrasi</h2>
          </div>
          <Card className="border-accent/10 shadow-sm overflow-hidden bg-white/50">
             <div className="bg-accent/5 px-4 py-2 border-b border-accent/10">
                <span className="text-xs font-bold text-accent uppercase tracking-widest">Masa kalibrasi akan habis (30 hari)</span>
             </div>
             <CardContent className="p-4 flex flex-col gap-3">
                {alerts.length > 0 ? alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 rounded-xl border border-accent/5 bg-white hover:border-accent/20 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{alert.namaAlat}</span>
                      <span className="text-xs text-slate-500">{alert.merekTipe}</span>
                    </div>
                    <Badge className={cn("border-none", alert.calibrationTone === "danger" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700")}>
                      {alert.calibrationLabel}
                    </Badge>
                  </div>
                )) : (
                  <div className="py-8 text-center text-muted-foreground text-sm uppercase italic tracking-widest">Semua alat terkalibrasi aman</div>
                )}
             </CardContent>
             {alerts.length > 0 && (
               <CardFooter className="p-4 pt-0">
                  <Link href="/inventory" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full border-accent/20 text-accent hover:bg-accent/5")}>
                    Lihat Inventaris Lengkap
                  </Link>
               </CardFooter>
             )}
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-2">
            <ActivityIcon className="size-5 text-primary" />
            <h2 className="text-xl font-bold text-primary">Status Per Kategori</h2>
          </div>
          <Card className="border-primary/10 shadow-sm bg-white/50 overflow-hidden">
            <div className="bg-primary/5 px-4 py-2 border-b border-primary/10">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">Komposisi Inventaris Alkes</span>
             </div>
            <CardContent className="p-4 flex flex-col gap-4">
              {categoryTotals.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 p-4 rounded-2xl bg-white border border-primary/5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">{item.nama}</span>
                    <span className="text-lg font-black text-primary/40">{item.total}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center p-2 rounded-lg bg-emerald-50 text-emerald-700">
                      <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">Layak</span>
                      <span className="text-sm font-bold">{item.layak}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-orange-50 text-orange-700">
                      <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">Perbaikan</span>
                      <span className="text-sm font-bold">{item.perbaikan}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-red-50 text-red-700">
                      <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">Rusak</span>
                      <span className="text-sm font-bold">{item.rusak}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-2">
            <CalendarClockIcon className="size-5 text-primary" />
            <h2 className="text-xl font-bold text-primary">Jadwal Sedang Berlangsung</h2>
          </div>
          {ongoingActivities.length > 0 ? ongoingActivities.map(activity => (
            <Card key={activity.id} className="border-primary/10 shadow-sm border-l-4 border-l-primary">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{activity.namaKegiatan}</CardTitle>
                  <Badge className="bg-primary/10 text-primary border-none">Ongoing</Badge>
                </div>
                <CardDescription>{activity.lokasiStasiun}, {activity.wilayahDaop}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2">{activity.deskripsi}</p>
              </CardContent>
            </Card>
          )) : (
            <div className="p-8 rounded-3xl border border-dashed border-primary/20 bg-primary/5 text-center text-sm text-primary/50 font-medium italic">Tidak ada kegiatan yang sedang berlangsung</div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-2">
            <ArrowRightIcon className="size-5 text-accent" />
            <h2 className="text-xl font-bold text-primary">Jadwal Akan Datang</h2>
          </div>
          {upcomingActivities.length > 0 ? upcomingActivities.map(activity => (
            <Card key={activity.id} className="border-accent/10 shadow-sm border-l-4 border-l-accent opacity-90 grayscale-[0.2]">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{activity.namaKegiatan}</CardTitle>
                  <span className="text-xs font-bold text-accent">{formatDateLong(activity.tanggalKegiatan)}</span>
                </div>
                <CardDescription>{activity.lokasiStasiun}, {activity.wilayahDaop}</CardDescription>
              </CardHeader>
            </Card>
          )) : (
            <div className="p-8 rounded-3xl border border-dashed border-accent/20 bg-accent/5 text-center text-sm text-accent/50 font-medium italic">Tidak ada agenda kegiatan mendatang</div>
          )}
        </div>
      </section>
      
      <section className="flex flex-col gap-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-primary">Preview Dokumentasi Baru</h2>
          <Link href="/gallery" className="text-sm font-bold text-accent flex items-center gap-1 hover:underline">
            Buka Galeri <ArrowRightIcon className="size-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {previewActivities.map((activity) => (
             <Card key={activity.id} className="overflow-hidden border-none shadow-md group">
                <div className="grid grid-cols-2 h-48 sm:h-64">
                   {activity.fotos.slice(0, 2).map((photo: any) => (
                      <div key={photo.id} className="relative overflow-hidden">
                        <img src={photo.imageUrl} alt={photo.judul} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/20" />
                      </div>
                   ))}
                </div>
                <div className="p-4 bg-white">
                   <h3 className="font-bold text-slate-800">{activity.namaKegiatan}</h3>
                   <p className="text-xs text-slate-500">{activity.lokasiStasiun} &bull; {formatDateLong(activity.tanggalKegiatan)}</p>
                </div>
             </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
