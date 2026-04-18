"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { railClinicActivities, scheduleGalleryPhotos } from "@/db/schema";
import { type RailClinicActivity } from "@/lib/types";

export async function upsertActivityAction(
  data: Omit<Partial<RailClinicActivity>, "fotos"> & { fotos?: any[] }
) {
  try {
    const { id, fotos, ...activityData } = data;

    let activityId = id;

    const payload = {
      entityId: activityData.entityId!,
      daopDivreId: activityData.daopDivreId!,
      code: activityData.kodeKegiatan!,
      name: activityData.namaKegiatan!,
      date: activityData.tanggalKegiatan!,
      endDate: activityData.tanggalSelesai || null,
      location: activityData.lokasiStasiun!,
      serviceCount: activityData.jumlahLayanan || 0,
      status: (activityData.status as any) || "scheduled",
      description: activityData.deskripsi || null,
      region: activityData.wilayahDaop || null,
    };

    if (id) {
      // Update
      await db
        .update(railClinicActivities)
        .set({
          ...payload,
          updatedAt: new Date(),
        })
        .where(eq(railClinicActivities.id, id));
    } else {
      // Create
      const [newActivity] = await db
        .insert(railClinicActivities)
        .values({
          ...payload,
        })
        .returning();
      activityId = newActivity.id;
    }

    // Handle Photos
    if (fotos && activityId) {
      // Simple approach: delete existing photos and re-insert
      // Or more advanced: diffing
      await db
        .delete(scheduleGalleryPhotos)
        .where(eq(scheduleGalleryPhotos.activityId, activityId));

      if (fotos.length > 0) {
        await db.insert(scheduleGalleryPhotos).values(
          fotos.map((f, index) => ({
            activityId: activityId!,
            slot: index + 1,
            title: f.judul || null,
            focus: f.fokus || null,
            tone: f.tone || "ocean",
            imageUrl: f.imageUrl,
          }))
        );
      }
    }

    revalidatePath("/gallery");
    revalidatePath("/schedule");
    return { success: true, id: activityId };
  } catch (error: any) {
    console.error("Error upserting activity:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteActivityAction(id: string) {
  try {
    await db.delete(railClinicActivities).where(eq(railClinicActivities.id, id));
    revalidatePath("/gallery");
    revalidatePath("/schedule");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting activity:", error);
    return { success: false, error: error.message };
  }
}
