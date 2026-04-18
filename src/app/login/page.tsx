"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
  LockKeyholeIcon,
  SquareUserRoundIcon,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const result = await login({ username, password });

      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }

      setErrorMessage("");
      router.replace("/");
    });
  };

  return (
    <div className="relative flex min-h-screen items-center overflow-hidden bg-white px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-[28rem]">
        <Card className="overflow-hidden rounded-[25px] border border-slate-200/80 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.14)]">
          <CardHeader className="px-7 pt-10 pb-6 text-center sm:px-14">
            <div className="space-y-2">
              <CardTitle className="text-[17px] font-semibold tracking-tight sm:text-[18px]">
                <span className="text-[#28459d]">Rail </span>
                <span className="text-[#178d42]">Clinic </span>
                <span className="text-[#f06b1e]">Inventory System</span>
              </CardTitle>
              <div className="text-[11px] leading-4.5 font-semibold text-slate-800 sm:text-[12px]">
                Sistem Inventaris Alat Kesehatan
                <br />
                dan Kegiatan Rail Clinic
              </div>
              <CardDescription className="mx-auto max-w-[18rem] pt-2 text-[14px] leading-6 text-slate-500 sm:text-[15px]">
                Masukkan username dan password anda untuk mengakses sistem.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-8 sm:px-14">
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <FieldSet className="gap-5">
                <FieldLegend className="sr-only">Login</FieldLegend>
                <FieldGroup className="gap-5">
                  <Field data-invalid={Boolean(errorMessage)} className="gap-2.5">
                    <FieldLabel
                      htmlFor="username"
                      className="text-[15px] font-semibold text-slate-900"
                    >
                      Username
                    </FieldLabel>
                    <div className="relative">
                      <SquareUserRoundIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="username"
                        value={username}
                        aria-invalid={Boolean(errorMessage)}
                        placeholder="Masukkan username"
                        className="h-14 rounded-[8px] border-slate-300 bg-white pr-4 pl-11 text-[15px] text-slate-700 placeholder:text-slate-400"
                        onChange={(event) => setUsername(event.target.value)}
                      />
                    </div>
                  </Field>

                  <Field data-invalid={Boolean(errorMessage)} className="gap-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <FieldLabel
                        htmlFor="password"
                        className="text-[15px] font-semibold text-slate-900"
                      >
                        Password
                      </FieldLabel>
                      <button
                        type="button"
                        className="text-[14px] font-semibold text-[#245dff] transition-colors hover:text-[#1541c9]"
                      >
                        Lupa password?
                      </button>
                    </div>
                    <div className="relative">
                      <LockKeyholeIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        aria-invalid={Boolean(errorMessage)}
                        placeholder="Masukkan password"
                        className="h-14 rounded-[8px] border-slate-300 bg-white pr-12 pl-11 text-[15px] text-slate-700 placeholder:text-slate-400"
                        onChange={(event) => setPassword(event.target.value)}
                      />
                      <button
                        type="button"
                        aria-label={
                          showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"
                        }
                        className="absolute top-1/2 right-4 inline-flex -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                        onClick={() => setShowPassword((value) => !value)}
                      >
                        {showPassword ? (
                          <EyeOffIcon className="size-5" />
                        ) : (
                          <EyeIcon className="size-5" />
                        )}
                      </button>
                    </div>
                    <FieldError>{errorMessage}</FieldError>
                  </Field>
                </FieldGroup>
              </FieldSet>

              <Button
                type="submit"
                size="lg"
                disabled={isPending}
                className={cn(
                  "mt-1 h-12 rounded-[6px] bg-[#264398] text-base font-semibold text-white shadow-none hover:bg-[#20377e]"
                )}
              >
                {isPending ? "Memproses..." : "Login"}
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </form>
            <div className="mt-8 pt-2 text-center text-[13px] text-slate-500">
              {"\u00A9"} 2026 PT Kereta Api Indonesia (Persero). All rights reserved.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
