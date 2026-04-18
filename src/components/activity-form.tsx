"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CldUploadWidget } from "next-cloudinary";
import { useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { PlusIcon, TrashIcon, ImageIcon, CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { upsertActivityAction } from "@/lib/activity-actions";
import {
  type DaopDivre,
  type Entity,
  type RailClinicActivity,
  type PhotoTone,
} from "@/lib/types";

const activitySchema = z.object({
  id: z.string().optional(),
  namaKegiatan: z.string().min(1, "Nama kegiatan wajib diisi"),
  kodeKegiatan: z.string().min(1, "Kode kegiatan wajib diisi"),
  entityId: z.string().min(1, "Entitas wajib dipilih"),
  daopDivreId: z.string().min(1, "Wilayah wajib dipilih"),
  tanggalKegiatan: z.string().min(1, "Tanggal wajib diisi"),
  tanggalSelesai: z.string().optional().nullable(),
  lokasiStasiun: z.string().min(1, "Lokasi stasiun wajib diisi"),
  jumlahLayanan: z.coerce.number().min(0).default(0),
  status: z.enum(["draft", "scheduled", "in_progress", "completed", "cancelled"]),
  deskripsi: z.string().optional().nullable(),
  fotos: z
    .array(
      z.object({
        judul: z.string().optional().nullable(),
        fokus: z.string().optional().nullable(),
        tone: z.enum(["ocean", "ember", "meadow", "dusk"]).default("ocean"),
        imageUrl: z.string().min(1, "Foto wajib diunggah"),
      })
    )
    .max(2, "Maksimal 2 foto sesuai standar PRD"),
});

type ActivityFormValues = z.infer<typeof activitySchema>;

type ActivityFormProps = {
  activity?: RailClinicActivity;
  entities: Entity[];
  daopDivres: DaopDivre[];
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function ActivityForm({
  activity,
  entities,
  daopDivres,
  onSuccess,
  onCancel,
}: ActivityFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      id: activity?.id,
      namaKegiatan: activity?.namaKegiatan || "",
      kodeKegiatan: activity?.kodeKegiatan || "",
      entityId: activity?.entityId || "",
      daopDivreId: activity?.daopDivreId || "",
      tanggalKegiatan: activity?.tanggalKegiatan || "",
      tanggalSelesai: activity?.tanggalSelesai || null,
      lokasiStasiun: activity?.lokasiStasiun || "",
      jumlahLayanan: activity?.jumlahLayanan || 0,
      status: activity?.status || "scheduled",
      deskripsi: activity?.deskripsi || null,
      fotos: activity?.fotos.map((f) => ({
        judul: f.judul,
        fokus: f.fokus,
        tone: f.tone as any,
        imageUrl: f.imageUrl,
      })) || [],
    } as ActivityFormValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fotos",
  });

  const onSubmit = (values: ActivityFormValues) => {
    startTransition(async () => {
      // Find Daop Name for wilayaDaop snapshot
      const daop = daopDivres.find((d) => d.id === values.daopDivreId);
      const payload = {
        ...values,
        wilayahDaop: daop?.name || "",
      };

      const result = await upsertActivityAction(payload);
      if (result.success) {
        onSuccess?.();
      } else {
        alert("Gagal menyimpan kegiatan: " + result.error);
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Field>
          <FieldLabel>Nama Kegiatan</FieldLabel>
          <Input {...form.register("namaKegiatan")} placeholder="Contoh: Baksos KAI Daop 1" />
          {form.formState.errors.namaKegiatan && (
            <p className="text-xs text-destructive">{form.formState.errors.namaKegiatan.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel>Kode Kegiatan</FieldLabel>
          <Input {...form.register("kodeKegiatan")} placeholder="RC-2024-001" />
          {form.formState.errors.kodeKegiatan && (
            <p className="text-xs text-destructive">{form.formState.errors.kodeKegiatan.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel>Entitas</FieldLabel>
          <Select
            value={form.watch("entityId")}
            onValueChange={(val) => form.setValue("entityId", val || "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih entitas" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {entities.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Wilayah (Daop/Divre)</FieldLabel>
          <Select
            value={form.watch("daopDivreId")}
            onValueChange={(val) => form.setValue("daopDivreId", val || "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih wilayah" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {daopDivres.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Tanggal Mulai</FieldLabel>
          <Input type="date" {...form.register("tanggalKegiatan")} />
        </Field>

        <Field>
          <FieldLabel>Tanggal Selesai (Opsional)</FieldLabel>
          <Input type="date" {...form.register("tanggalSelesai")} />
        </Field>

        <Field>
          <FieldLabel>Lokasi (Stasiun)</FieldLabel>
          <Input {...form.register("lokasiStasiun")} placeholder="Stasiun Gambir" />
        </Field>

        <Field>
          <FieldLabel>Jumlah Layanan</FieldLabel>
          <Input type="number" {...form.register("jumlahLayanan")} />
        </Field>

        <Field>
          <FieldLabel>Status</FieldLabel>
          <Select
            value={form.watch("status")}
            onValueChange={(val) => form.setValue("status", (val as any) || "scheduled")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Terjadwal</SelectItem>
                <SelectItem value="in_progress">Berjalan</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field>
        <FieldLabel>Deskripsi</FieldLabel>
        <Textarea {...form.register("deskripsi")} rows={3} />
      </Field>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Galeri Foto (Max 2)
          </h3>
          {fields.length < 2 && (
            <CldUploadWidget
              uploadPreset="railclinic-assets"
              onSuccess={(result: any) => {
                append({
                  imageUrl: result.info.secure_url,
                  judul: "",
                  fokus: "",
                  tone: "ocean",
                });
              }}
            >
              {({ open }) => (
                <Button type="button" variant="outline" size="sm" onClick={() => open()}>
                  <PlusIcon className="mr-2 size-4" />
                  Tambah Foto
                </Button>
              )}
            </CldUploadWidget>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field, index) => (
            <div key={field.id} className="relative rounded-2xl border border-border bg-secondary/30 p-4">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2 size-7 rounded-full shadow-lg"
                onClick={() => remove(index)}
              >
                <TrashIcon className="size-3" />
              </Button>

              <div className="flex flex-col gap-3">
                <div className="aspect-video overflow-hidden rounded-xl bg-muted">
                  <img src={form.watch(`fotos.${index}.imageUrl`)} alt="Activity" className="h-full w-full object-cover" />
                </div>
                
                <Field>
                  <FieldLabel className="text-xs">Judul Foto</FieldLabel>
                  <Input {...form.register(`fotos.${index}.judul`)} />
                </Field>

                <Field>
                  <FieldLabel className="text-xs">Fokus / Detail</FieldLabel>
                  <Input {...form.register(`fotos.${index}.fokus`)} />
                </Field>

                <Field>
                  <FieldLabel className="text-xs">Visual Tone</FieldLabel>
                  <Select
                    value={form.watch(`fotos.${index}.tone`)}
                    onValueChange={(val) => form.setValue(`fotos.${index}.tone`, (val as any) || "ocean")}
                  >
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ocean">Ocean (Blue)</SelectItem>
                      <SelectItem value="ember">Ember (Orange)</SelectItem>
                      <SelectItem value="meadow">Meadow (Green)</SelectItem>
                      <SelectItem value="dusk">Dusk (Purple)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
          Batal
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan Kegiatan"}
        </Button>
      </div>
    </form>
  );
}
