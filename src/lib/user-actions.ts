"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import type { UserRole } from "./types";

export async function upsertUserAction(formData: {
  id?: string;
  username: string;
  password?: string;
  namaLengkap: string;
  nipp?: string;
  roleId: string;
  entityId: string;
  isActive?: boolean;
}) {
  try {
    const { id, username, password, namaLengkap, nipp, roleId, entityId, isActive = true } = formData;

    let userId = id;

    if (id) {
      // Update existing user
      await db
        .update(schema.users)
        .set({
          username,
          namaLengkap,
          nipp,
          isActive,
          updatedAt: new Date(),
          ...(password ? { passwordHash: password } : {}),
        })
        .where(eq(schema.users.id, id));
    } else {
      // Create new user
      const [newUser] = await db
        .insert(schema.users)
        .values({
          username,
          passwordHash: password || "123456", // Default password if not provided
          namaLengkap,
          nipp,
          isActive,
          defaultEntityId: entityId,
        })
        .returning({ id: schema.users.id });
      
      userId = newUser.id;
    }

    if (!userId) throw new Error("Failed to resolve user ID");

    // Handle role assignment
    // For simplicity, we'll deactivate old assignments and create a new one
    await db
      .update(schema.userEntityRoles)
      .set({ isActive: false })
      .where(
        and(
          eq(schema.userEntityRoles.userId, userId),
          eq(schema.userEntityRoles.isActive, true)
        )
      );

    await db.insert(schema.userEntityRoles).values({
      userId,
      entityId,
      roleId,
      isActive: true,
      assignedAt: new Date(),
    });

    revalidatePath("/users");
    return { ok: true, message: id ? "User updated successfully" : "User created successfully" };
  } catch (error) {
    console.error("Error in upsertUserAction:", error);
    return { ok: false, message: "Failed to save user. Please check if username is already taken." };
  }
}

export async function toggleUserStatusAction(userId: string, currentStatus: boolean) {
  try {
    await db
      .update(schema.users)
      .set({ isActive: !currentStatus, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    revalidatePath("/users");
    return { ok: true, message: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully` };
  } catch (error) {
    console.error("Error in toggleUserStatusAction:", error);
    return { ok: false, message: "Failed to toggle user status." };
  }
}
