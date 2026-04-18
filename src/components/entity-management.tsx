"use client";

import { useState } from "react";
import {
  EditIcon,
  MoreHorizontalIcon,
  PlusIcon,
  TrashIcon,
  BuildingIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

type Entity = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
};

type EntityManagementProps = {
  entities: Entity[];
};

export function EntityManagement({ entities }: EntityManagementProps) {
  const [selectedEntity, setSelectedEntity] = useState<Entity | undefined>(undefined);

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Nama Entitas</TableHead>
              <TableHead>Kode</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead className="w-[100px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Belum ada entitas terdaftar.
                </TableCell>
              </TableRow>
            ) : (
              entities.map((entity) => (
                <TableRow key={entity.id} className="group hover:bg-muted/20">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {entity.id.substring(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kai-navy/10 text-kai-navy">
                        <BuildingIcon className="size-4" />
                      </div>
                      <span className="font-medium text-foreground">
                        {entity.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">
                      {entity.code || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {entity.description || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontalIcon className="size-4" />
                          <span className="sr-only">Buka menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                          <EditIcon className="size-4" />
                          Edit
                         </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive cursor-pointer">
                          <TrashIcon className="size-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
