"use server";

import { db } from "../db";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./rci-data";

export async function upsertEquipmentAction(formData: any) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  const {
    id,
    code,
    serialNumber,
    kategoriId,
    namaAlat,
    merekTipe,
    tahunPengadaan,
    tglKalibrasiTerakhir,
    tglRencanaKalibrasi,
    statusKelayakan,
    lokasiPenempatan,
    visualTone,
    keteranganKalibrasi,
    imageUrl,
    entityId,
    homeDaopDivreId,
    currentDaopDivreId,
  } = formData;

  try {
    // Find category UUID
    const [category] = await db
      .select()
      .from(schema.equipmentCategories)
      .where(eq(schema.equipmentCategories.code, kategoriId))
      .limit(1);

    if (!category) {
      return { success: false, message: "Invalid category" };
    }

    const data: any = {
      entityId,
      categoryId: category.id,
      homeDaopDivreId: homeDaopDivreId || null,
      currentDaopDivreId: currentDaopDivreId || null,
      code: code || null,
      serialNumber: serialNumber || null,
      name: namaAlat,
      brandType: merekTipe || null,
      acquisitionYear: tahunPengadaan ? parseInt(tahunPengadaan.toString()) : null,
      lastCalibrationDate: tglKalibrasiTerakhir || null,
      nextCalibrationDate: tglRencanaKalibrasi || null,
      status: statusKelayakan,
      location: lokasiPenempatan || null,
      visualTone: visualTone || "ocean",
      calibrationNote: keteranganKalibrasi || null,
      imageUrl: imageUrl || null,
      updatedAt: new Date(),
    };

    if (id) {
      // Update
      await db
        .update(schema.medicalEquipment)
        .set(data)
        .where(eq(schema.medicalEquipment.id, id));
    } else {
      // Create
      data.createdBy = user.id;
      await db.insert(schema.medicalEquipment).values(data);
    }

    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Error upserting equipment:", error);
    return { success: false, message: error.message };
  }
}

export async function deleteEquipmentAction(id: string) {
  try {
    await db.delete(schema.medicalEquipment).where(eq(schema.medicalEquipment.id, id));
    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting equipment:", error);
    return { success: false, message: error.message };
  }
}
