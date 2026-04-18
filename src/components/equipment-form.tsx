"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2Icon, UploadIcon, ImageIcon } from "lucide-react";
import { CldUploadWidget } from 'next-cloudinary';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { upsertEquipmentAction } from "@/lib/equipment-actions";
import type { MedicalEquipment, Entity, DaopDivre, EquipmentCategory } from "@/lib/types";

const equipmentSchema = z.object({
  id: z.string().optional(),
  code: z.string().optional(),
  serialNumber: z.string().optional(),
  kategoriId: z.string().min(1, "Kategori harus dipilih"),
  namaAlat: z.string().min(1, "Nama alat harus diisi"),
  merekTipe: z.string().optional(),
  tahunPengadaan: z.string().optional(),
  tglKalibrasiTerakhir: z.string().optional(),
  tglRencanaKalibrasi: z.string().optional(),
  statusKelayakan: z.enum(["Layak Pakai", "Butuh Perbaikan", "Rusak / Tidak Layak"]),
  lokasiPenempatan: z.string().optional(),
  visualTone: z.string().optional(),
  keteranganKalibrasi: z.string().optional(),
  imageUrl: z.string().optional(),
  entityId: z.string().min(1, "Unit harus dipilih"),
  homeDaopDivreId: z.string().optional(),
  currentDaopDivreId: z.string().optional(),
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

type EquipmentFormProps = {
  equipment?: MedicalEquipment;
  categories: { id: string; nama: string }[];
  entities: Entity[];
  daopDivres: DaopDivre[];
  onSuccess: () => void;
};

export function EquipmentForm({
  equipment,
  categories,
  entities,
  daopDivres,
  onSuccess,
}: EquipmentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState(equipment?.imageUrl || "");

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      id: equipment?.id,
      code: equipment?.code || "",
      serialNumber: equipment?.serialNumber || "",
      kategoriId: equipment?.kategoriId || "",
      namaAlat: equipment?.namaAlat || "",
      merekTipe: equipment?.merekTipe || "",
      tahunPengadaan: equipment?.tahunPengadaan?.toString() || "",
      tglKalibrasiTerakhir: equipment?.tglKalibrasiTerakhir || "",
      tglRencanaKalibrasi: equipment?.tglRencanaKalibrasi || "",
      statusKelayakan: (equipment?.statusKelayakan as any) || "Layak Pakai",
      lokasiPenempatan: equipment?.lokasiPenempatan || "",
      visualTone: equipment?.visualTone || "ocean",
      keteranganKalibrasi: equipment?.keteranganKalibrasi || "",
      imageUrl: equipment?.imageUrl || "",
      entityId: equipment?.entityId || "",
      homeDaopDivreId: equipment?.homeDaopDivreId || "",
      currentDaopDivreId: equipment?.currentDaopDivreId || "",
    },
  });

  const onSubmit = (values: EquipmentFormValues) => {
    startTransition(async () => {
      const result = await upsertEquipmentAction({ ...values, imageUrl });
      if (result.success) {
        onSuccess();
      } else {
        alert(result.message);
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto px-1">
      <div className="flex flex-col items-center gap-4 mb-6">
        <div className="relative group w-full aspect-video rounded-xl bg-muted overflow-hidden border-2 border-dashed flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-muted-foreground">
              <ImageIcon className="size-12 mb-2 opacity-20" />
              <p className="text-xs font-medium">Foto Alat Belum Tersedia</p>
              <p className="text-[10px] opacity-60">Unggah foto untuk visualisasi di aplikasi</p>
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
            <CldUploadWidget 
              uploadPreset="railclinic-assets"
              onSuccess={(result: any) => {
                if (result.info && typeof result.info === "object") {
                   setImageUrl(result.info.secure_url);
                }
              }}
            >
              {({ open }) => (
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => open()}
                  className="gap-2 shadow-lg"
                >
                  <UploadIcon className="size-4" />
                  {imageUrl ? "Ganti Foto Alat" : "Unggah Foto Alat"}
                </Button>
              )}
            </CldUploadWidget>
          </div>
        </div>
      </div>

      <FieldGroup>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Kode Alat</FieldLabel>
            <FieldContent>
              <Input {...form.register("code")} placeholder="Contoh: ALK-001" />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Serial Number</FieldLabel>
            <FieldContent>
              <Input {...form.register("serialNumber")} placeholder="SN-123456" />
            </FieldContent>
          </Field>
        </div>

        <Field>
          <FieldLabel>Nama Alat</FieldLabel>
          <FieldContent>
            <Input {...form.register("namaAlat")} placeholder="Contoh: USG Mindray DP-10" />
            {form.formState.errors.namaAlat && (
              <p className="text-xs text-destructive">{form.formState.errors.namaAlat.message}</p>
            )}
          </FieldContent>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Kategori</FieldLabel>
            <FieldContent>
              <Select
                onValueChange={(val) => form.setValue("kategoriId", val || "")}
                defaultValue={form.getValues("kategoriId")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Status Kelayakan</FieldLabel>
            <FieldContent>
              <Select
                onValueChange={(val) => form.setValue("statusKelayakan", (val as any) || "baik")}
                defaultValue={form.getValues("statusKelayakan")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Layak Pakai">Layak Pakai</SelectItem>
                  <SelectItem value="Butuh Perbaikan">Butuh Perbaikan</SelectItem>
                  <SelectItem value="Rusak / Tidak Layak">Rusak / Tidak Layak</SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        </div>

        <Field>
          <FieldLabel>Unit Kerja Pengelola</FieldLabel>
          <FieldContent>
            <Select
              onValueChange={(val) => form.setValue("entityId", val || "")}
              defaultValue={form.getValues("entityId")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih unit pengelola" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((ent) => (
                  <SelectItem key={ent.id} value={ent.id}>
                    {ent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Daop/Divre Home</FieldLabel>
            <FieldContent>
              <Select
                onValueChange={(val) => form.setValue("homeDaopDivreId", val || undefined)}
                defaultValue={form.getValues("homeDaopDivreId")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih daop home" />
                </SelectTrigger>
                <SelectContent>
                  {daopDivres.map((daop) => (
                    <SelectItem key={daop.id} value={daop.id}>
                      {daop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Lokasi Saat Ini (Daop)</FieldLabel>
            <FieldContent>
              <Select
                onValueChange={(val) => form.setValue("currentDaopDivreId", val || undefined)}
                defaultValue={form.getValues("currentDaopDivreId")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih lokasi saat ini" />
                </SelectTrigger>
                <SelectContent>
                  {daopDivres.map((daop) => (
                    <SelectItem key={daop.id} value={daop.id}>
                      {daop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Merek & Tipe</FieldLabel>
            <FieldContent>
              <Input {...form.register("merekTipe")} placeholder="Contoh: Mindray DP-10" />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Tahun Pengadaan</FieldLabel>
            <FieldContent>
              <Input type="number" {...form.register("tahunPengadaan")} placeholder="Tahun (YYYY)" />
            </FieldContent>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Terakhir Kalibrasi</FieldLabel>
            <FieldContent>
              <Input type="date" {...form.register("tglKalibrasiTerakhir")} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Rencana Kalibrasi</FieldLabel>
            <FieldContent>
              <Input type="date" {...form.register("tglRencanaKalibrasi")} />
            </FieldContent>
          </Field>
        </div>

        <Field>
          <FieldLabel>Keterangan Hasil Kalibrasi</FieldLabel>
          <FieldContent>
            <Textarea {...form.register("keteranganKalibrasi")} placeholder="Tuliskan hasil atau catatan kalibrasi terakhir..." className="resize-none" />
          </FieldContent>
        </Field>
      </FieldGroup>

      <div className="flex justify-end pt-6 gap-2 sticky bottom-0 bg-background/95 backdrop-blur-sm pb-2 z-10">
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto font-semibold">
          {isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
          {equipment ? "Update Data Alat" : "Daftarkan Alat Baru"}
        </Button>
      </div>
    </form>
  );
}
