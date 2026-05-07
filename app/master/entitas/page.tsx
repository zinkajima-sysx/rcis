import React from 'react';
import { Building2 } from 'lucide-react';
import { requireModuleAccess } from '@/lib/auth';
import { db } from '@/lib/db';
import EntitasClient from './EntitasClient';

// Server Component (Page)
export const dynamic = 'force-dynamic';

export default async function EntitasMasterPage() {
  await requireModuleAccess('Entitas', 'r');
  // Fetch real data from NeonDB
  const data = await db.query.entitas.findMany({
    orderBy: (entitas, { asc }) => [asc(entitas.createdAt)],
  });

  return (
    <main className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto no-scrollbar w-full relative">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="text-sky-400" /> Data Entitas
          </h1>
          <p className="text-slate-600 text-sm mt-1">Kelola entitas internal dan eksternal mitra serah terima alkes.</p>
        </div>
      </header>

      {/* Render Client Component to handle state and interactivity */}
      <EntitasClient initialData={data} />
    </main>
  );
}
