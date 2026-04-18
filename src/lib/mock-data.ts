import type { AppUser } from "./rci-data";

export const mockAppUsers: AppUser[] = [
  {
    id: "USR-001",
    username: "mira.pratama",
    password: "railclinic123",
    namaLengkap: "Mira Pratama",
    role: "petugas_medis",
    unit: "Tim Medis Rail Clinic",
  },
  {
    id: "USR-002",
    username: "raka.manajemen",
    password: "railclinic123",
    namaLengkap: "Raka Maheswara",
    role: "manajemen",
    unit: "Manajemen Operasional",
  },
];
