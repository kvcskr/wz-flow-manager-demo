import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/format';
import { Printer, ArrowLeft } from 'lucide-react';

export default function WzWydruk() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const [wz, setWz] = useState<any>(null);
  const [pozycje, setPozycje] = useState<any[]>([]);
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const [wzRes, pozRes] = await Promise.all([
        supabase.from('dokumenty_wz').select('*, klienci(nazwa, nip)').eq('id', id).single(),
        supabase.from('pozycje_wz').select('*, produkty(nazwa, jednostka)').eq('wz_id', id),
      ]);
      setWz(wzRes.data);
      setPozycje(pozRes.data || []);

      if (wzRes.data?.org_id) {
        const { data: orgData } = await supabase.from('organizacje').select('nazwa_na_wz, nip_na_wz').eq('id', wzRes.data.org_id).single();
        setOrg(orgData);
      }

      if (wzRes.data) {
        const klient = wzRes.data.klienci?.nazwa || 'klient';
        const data = wzRes.data.data ? new Date(wzRes.data.data).toLocaleDateString('pl-PL') : '';
        document.title = `WZ – ${klient} – ${data}`;
      }

      setLoading(false);
    };
    fetch();
    return () => { document.title = 'WZ Manager'; };
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><Skeleton className="h-96 w-[600px]" /></div>;
  }

  if (!wz) {
    return <div className="flex justify-center items-center min-h-screen text-muted-foreground">Nie znaleziono dokumentu.</div>;
  }

  const total = pozycje.reduce((s, p) => s + ((p.wydano - p.zwrocono) * (p.cena_snapshot || 0)), 0);

  return (
    <div className="min-h-screen bg-muted">
      <div className="no-print p-4 flex items-center gap-4 max-w-[210mm] mx-auto">
        {role === 'kierowca' && (
          <Link to="/wz/nowe" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Nowe WZ
          </Link>
        )}
        <Button onClick={() => window.print()} className="ml-auto bg-success hover:bg-success/90 text-success-foreground">
          <Printer className="h-4 w-4 mr-2" /> Drukuj dokument WZ
        </Button>
      </div>

      <div className="bg-white mx-auto max-w-[210mm] p-8 shadow-sm print:shadow-none print:p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-foreground">WZ – Wydanie Zewnętrzne</h2>
          <p className="text-sm text-muted-foreground">Data: {formatDate(wz.data)}</p>
        </div>
        <hr className="mb-6" />

        {/* Parties */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="border rounded p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Sprzedawca</p>
            <p className="font-medium">{org?.nazwa_na_wz || '—'}</p>
            <p className="text-sm text-muted-foreground">NIP: {org?.nip_na_wz || '—'}</p>
          </div>
          <div className="border rounded p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Nabywca</p>
            <p className="font-medium">{wz.klienci?.nazwa || '—'}</p>
            <p className="text-sm text-muted-foreground">NIP: {wz.klienci?.nip || '—'}</p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-sm border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-foreground/20">
              <th className="text-left py-2 px-1">Lp.</th>
              <th className="text-left py-2 px-1">Nazwa towaru</th>
              <th className="text-right py-2 px-1">Wydano</th>
              <th className="text-right py-2 px-1">Zwrócono</th>
              <th className="text-right py-2 px-1">Saldo</th>
              <th className="text-right py-2 px-1">Cena jedn.</th>
              <th className="text-right py-2 px-1">Wartość</th>
            </tr>
          </thead>
          <tbody>
            {pozycje.filter(p => p.wydano > 0 || p.zwrocono > 0).map((p, idx) => {
              const saldo = p.wydano - p.zwrocono;
              const wartosc = saldo * (p.cena_snapshot || 0);
              return (
                <tr key={p.id} className="border-b">
                  <td className="py-2 px-1">{idx + 1}</td>
                  <td className="py-2 px-1">{p.produkty?.nazwa || '—'}</td>
                  <td className="text-right py-2 px-1">{p.wydano}</td>
                  <td className="text-right py-2 px-1">{p.zwrocono}</td>
                  <td className="text-right py-2 px-1">{saldo}</td>
                  <td className="text-right py-2 px-1">{formatCurrency(p.cena_snapshot || 0)}</td>
                  <td className="text-right py-2 px-1">{formatCurrency(wartosc)}</td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-foreground/20 font-bold">
              <td colSpan={6} className="py-2 px-1 text-right">RAZEM</td>
              <td className="text-right py-2 px-1">{formatCurrency(total)}</td>
            </tr>
          </tbody>
        </table>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-12 mt-16">
          <div className="text-center">
            <div className="border-b border-foreground/30 mb-2 h-12" />
            <p className="text-sm text-muted-foreground">Wydał</p>
          </div>
          <div className="text-center">
            <div className="border-b border-foreground/30 mb-2 h-12" />
            <p className="text-sm text-muted-foreground">Odebrał</p>
          </div>
        </div>
      </div>
    </div>
  );
}
