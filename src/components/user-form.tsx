"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2Icon } from "lucide-react";

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
import { upsertUserAction } from "@/lib/user-actions";
import type { AppUser } from "@/lib/types";

const userSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
  namaLengkap: z.string().min(1, "Nama lengkap harus diisi"),
  nipp: z.string().optional(),
  roleId: z.string().min(1, "Role harus dipilih"),
  entityId: z.string().min(1, "Unit harus dipilih"),
});

type UserFormValues = z.infer<typeof userSchema>;

type UserFormProps = {
  user?: AppUser;
  roles: { id: string; name: string }[];
  entities: { id: string; name: string }[];
  onSuccess: () => void;
};

export function UserForm({ user, roles, entities, onSuccess }: UserFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      id: user?.id,
      username: user?.username || "",
      password: "",
      namaLengkap: user?.namaLengkap || "",
      nipp: user?.nipp || "",
      roleId: roles.find(r => r.name.toLowerCase() === user?.role.replace("_", " ").toLowerCase())?.id || "",
      entityId: user?.entityId || "",
    },
  });

  const onSubmit = (values: UserFormValues) => {
    startTransition(async () => {
      const result = await upsertUserAction(values as any);
      if (result.ok) {
        onSuccess();
      } else {
        alert(result.message);
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
      <FieldGroup>
        <Field>
          <FieldLabel>Username</FieldLabel>
          <FieldContent>
            <Input {...form.register("username")} placeholder="Contoh: budi.setiawan" />
            {form.formState.errors.username && (
              <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
            )}
          </FieldContent>
        </Field>

        {!user && (
          <Field>
            <FieldLabel>Password</FieldLabel>
            <FieldContent>
              <Input
                {...form.register("password")}
                type="password"
                placeholder="Minimal 6 karakter"
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </FieldContent>
          </Field>
        )}

        <Field>
          <FieldLabel>Nama Lengkap</FieldLabel>
          <FieldContent>
            <Input {...form.register("namaLengkap")} placeholder="Nama lengkap sesuai NIPP" />
            {form.formState.errors.namaLengkap && (
              <p className="text-xs text-destructive">{form.formState.errors.namaLengkap.message}</p>
            )}
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel>NIPP</FieldLabel>
          <FieldContent>
            <Input {...form.register("nipp")} placeholder="NIPP (Opsional)" />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel>Role / Peran</FieldLabel>
          <FieldContent>
            <Select
              onValueChange={(val) => form.setValue("roleId", val || "")}
              defaultValue={form.getValues("roleId")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih peran" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.roleId && (
              <p className="text-xs text-destructive">{form.formState.errors.roleId.message}</p>
            )}
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel>Unit / Entitas</FieldLabel>
          <FieldContent>
            <Select
              onValueChange={(val) => form.setValue("entityId", val || "")}
              defaultValue={form.getValues("entityId")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih unit kerja" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.entityId && (
              <p className="text-xs text-destructive">{form.formState.errors.entityId.message}</p>
            )}
          </FieldContent>
        </Field>
      </FieldGroup>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
          {user ? "Simpan Perubahan" : "Tambah Pengguna"}
        </Button>
      </div>
    </form>
  );
}
