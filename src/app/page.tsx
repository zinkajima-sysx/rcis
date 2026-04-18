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
  getUpcomingSchedule,
  getTotalActivities,
  getRecentActivities,
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
      "border-[#cfe0ff] bg-[linear-gradient(180deg,#ffffff_0%,#f4f8ff_100%)] shadow-[0_14px_28px_rgba(37,99,235,0.10)]",
    icon: "bg-[#e8f0ff] text-[#2454c5]",
    value: "text-[#173b99]",
    badge: "bg-[#edf4ff] text-[#2454c5]",
    accent: "bg-[#2454c5]",
  },
  ready: {
    card:
      "border-[#cdebd4] bg-[linear-gradient(180deg,#ffffff_0%,#f3fcf5_100%)] shadow-[0_14px_28px_rgba(34,139,78,0.10)]",
    icon: "bg-[#e7f8eb] text-[#228b4e]",
    value: "text-[#17663a]",
    badge: "bg-[#ebf9ef] text-[#228b4e]",
    accent: "bg-[#228b4e]",
  },
  alerts: {
    card:
      "border-[#f3d6bb] bg-[linear-gradient(180deg,#ffffff_0%,#fff7ef_100%)] shadow-[0_14px_28px_rgba(234,119,35,0.12)]",
    icon: "bg-[#fff0e1] text-[#d26b19]",
    value: "text-[#a95516]",
    badge: "bg-[#fff3e8] text-[#d26b19]",
    accent: "bg-[#d26b19]",
  },
  activities: {
    card:
      "border-[#ddd8fb] bg-[linear-gradient(180deg,#ffffff_0%,#f7f5ff_100%)] shadow-[0_14px_28px_rgba(109,76,217,0.10)]",
    icon: "bg-[#f0ebff] text-[#6d4cd9]",
    value: "text-[#5133ba]",
    badge: "bg-[#f3efff] text-[#6d4cd9]",
    accent: "bg-[#6d4cd9]",
  },
} as const;

export default async function Home() {
  const allEquipment = await getMedicalEquipments();
  const categories = await getEquipmentCategories();
  const activities = await getRailClinicActivities();

  const metrics = getDashboardMetrics(allEquipment);
  const alerts = getCalibrationAlerts(allEquipment).slice(0, 4);
  const schedule = getUpcomingSchedule(allEquipment).slice(0, 6);
  const categoryTotals = getCategoryTotals(allEquipment, categories);
  const previewActivities = getRecentActivities(activities);

  const elektromedisCount =
    categoryTotals.find((item) => item.id === "alkes-elektromedis")?.total ?? 0;
  const nonElektromedisCount =
    categoryTotals.find((item) => item.id === "alkes-non-elektromedis")?.total ?? 0;
  const perlengkapanPendukungCount =
    categoryTotals.find((item) => item.id === "perlengkapan-pendukung")?.total ?? 0;

  // Update activity count in metrics
  metrics[3].value = getTotalActivities(activities);

  return (
    <div className="flex flex-col gap-6">
      <Card className="surface-panel border-white/70 shadow-lg shadow-primary/5">
        <CardHeader className="gap-4 lg:grid-cols-[1.4fr_auto]">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <CardTitle className="text-3xl">Dashboard</CardTitle>
              <CardDescription>Ringkasan inventaris dan kalibrasi.</CardDescription>
            </div>
          </div>
          <CardAction className="col-start-auto row-start-auto">
            <div className="flex flex-col gap-2 rounded-2xl border border-primary/10 bg-white/80 p-4 shadow-sm sm:min-w-72">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  Snapshot operasional
                </span>
                <Badge variant="secondary">18 Apr 2026</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-secondary/60 p-3">
                  <div className="font-mono text-lg font-semibold">
                    {metrics[2].value}
                  </div>
                  <div className="text-muted-foreground">
                    alat butuh perhatian
                  </div>
                </div>
                <div className="rounded-xl bg-accent/20 p-3">
                  <div className="font-mono text-lg font-semibold">
                    {previewActivities.length * 2}
                  </div>
                  <div className="text-muted-foreground">foto kegiatan siap</div>
                </div>
              </div>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/inventory"
              className={cn(buttonVariants({ size: "lg" }), "sm:w-fit")}
            >
              <PackageCheckIcon data-icon="inline-start" />
              Buka inventaris alkes
            </Link>
            <Link
              href="/gallery"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "sm:w-fit"
              )}
            >
              <FolderOpenIcon data-icon="inline-start" />
              Lihat galeri kegiatan
            </Link>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = iconMap[metric.id];
          const styles = metricCardStyles[metric.id];

          return (
            <Card
              key={metric.id}
              size="sm"
              className={cn(
                "relative overflow-hidden border shadow-none transition-transform duration-200 hover:-translate-y-0.5",
                styles.card
              )}
            >
              <div className={cn("absolute inset-x-0 top-0 h-1.5", styles.accent)} />
              <CardHeader className="gap-3 pb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase",
                      styles.badge
                    )}
                  >
                    KPI
                  </span>
                </div>
                <CardDescription className="text-[13px] font-medium tracking-[0.02em] text-slate-600">
                  {metric.label}
                </CardDescription>
                <CardAction>
                  <div
                    className={cn(
                      "flex size-11 items-center justify-center rounded-2xl shadow-sm",
                      styles.icon
                    )}
                  >
                    <Icon />
                  </div>
                </CardAction>
                <CardTitle className={cn("text-4xl font-semibold tracking-tight", styles.value)}>
                  {metric.value}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-2xl border border-black/5 bg-white/75 px-3.5 py-3 text-[13px] leading-6 text-slate-600">
                  {metric.helper}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section>
        <Card
          size="sm"
          className="relative overflow-hidden border border-[#d5def4] bg-[linear-gradient(180deg,#ffffff_0%,#f6f9ff_100%)] shadow-[0_14px_28px_rgba(31,64,140,0.10)]"
        >
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[#1f4aa1]" />
          <CardHeader className="gap-3 pb-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-full bg-[#eaf1ff] px-2.5 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase text-[#1f4aa1]">
                KPI
              </span>
            </div>
            <CardDescription className="text-[13px] font-medium tracking-[0.02em] text-slate-600">
              Detail Alkes
            </CardDescription>
            <CardTitle className="text-3xl font-semibold tracking-tight text-[#173b99]">
              Ringkasan kategori alat
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-[#dbe7ff] bg-white/85 px-4 py-3">
                <div className="text-[13px] leading-6 text-slate-600">
                  Alkes elektromedis
                </div>
                <div className="mt-1 font-mono text-2xl font-semibold text-[#1f4aa1]">
                  {elektromedisCount}
                </div>
              </div>
              <div className="rounded-2xl border border-[#dbe7ff] bg-white/85 px-4 py-3">
                <div className="text-[13px] leading-6 text-slate-600">
                  Alkes non elektromedis
                </div>
                <div className="mt-1 font-mono text-2xl font-semibold text-[#1f4aa1]">
                  {nonElektromedisCount}
                </div>
              </div>
              <div className="rounded-2xl border border-[#dbe7ff] bg-white/85 px-4 py-3">
                <div className="text-[13px] leading-6 text-slate-600">
                  Perlengkapan pendukung
                </div>
                <div className="mt-1 font-mono text-2xl font-semibold text-[#1f4aa1]">
                  {perlengkapanPendukungCount}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-white/60 shadow-sm">
          <CardHeader>
            <CardTitle>Peringatan kalibrasi 30 hari</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-background/80 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium">{alert.namaAlat}</div>
                    <StatusBadge status={alert.statusKelayakan} />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {alert.merekTipe} •{" "}
                    {
                      categories.find(
                        (category) => category.id === alert.kategoriId
                      )?.nama
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Rencana kalibrasi: {formatDateLong(alert.tglRencanaKalibrasi)}
                  </div>
                </div>
                <Badge
                  className={cn(
                    "w-fit border-transparent",
                    alert.calibrationTone === "danger"
                      ? "status-danger"
                      : "status-warning"
                  )}
                >
                  {alert.calibrationLabel}
                </Badge>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Link
              href="/inventory"
              className={cn(buttonVariants({ variant: "outline" }), "ml-auto")}
            >
              Tindak lanjuti inventaris
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="border-white/60 shadow-sm">
          <CardHeader>
            <CardTitle>Komposisi status kelayakan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {categoryTotals.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-2xl bg-secondary/50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{item.nama}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.total} alat tercatat
                    </div>
                  </div>
                  <div className="font-mono text-lg font-semibold text-primary">
                    {item.total}
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Badge className="status-safe border-transparent">
                    {item.layak} layak
                  </Badge>
                  <Badge className="status-warning border-transparent">
                    {item.perbaikan} perbaikan
                  </Badge>
                  <Badge className="status-danger border-transparent">
                    {item.rusak} rusak
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-white/60 shadow-sm">
          <CardHeader>
            <CardTitle>Agenda kalibrasi terdekat</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {schedule.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-2xl border border-border/80 bg-background/80 p-4 sm:grid-cols-[1fr_auto]"
              >
                <div className="flex flex-col gap-1">
                  <div className="font-medium">{item.namaAlat}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.merekTipe} • terakhir kalibrasi{" "}
                    {formatDateLong(item.tglKalibrasiTerakhir)}
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <Badge
                    className={cn(
                      "border-transparent",
                      item.calibrationTone === "danger"
                        ? "status-danger"
                        : item.calibrationTone === "warning"
                          ? "status-warning"
                          : "status-safe"
                    )}
                  >
                    <CalendarClockIcon data-icon="inline-start" />
                    {item.calibrationLabel}
                  </Badge>
                  <span className="font-mono text-sm text-muted-foreground">
                    {formatDateLong(item.tglRencanaKalibrasi)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/60 shadow-sm">
          <CardHeader>
            <CardTitle>Preview galeri kegiatan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {previewActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-background/80 p-4"
              >
                <div className="flex flex-col gap-1">
                  <div className="font-medium">{activity.namaKegiatan}</div>
                  <div className="text-sm text-muted-foreground">
                    {activity.lokasiStasiun}, {activity.wilayahDaop} •{" "}
                    {formatDateLong(activity.tanggalKegiatan)}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {activity.fotos.map((photo) => (
                    <PhotoTile
                      key={photo.id}
                      title={photo.judul}
                      subtitle={photo.fokus}
                      tone={photo.tone}
                      imageUrl={photo.imageUrl}
                      badgeLabel="Foto kegiatan"
                    />
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Link
              href="/gallery"
              className={cn(buttonVariants({ variant: "outline" }), "ml-auto")}
            >
              Buka galeri lengkap
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}
