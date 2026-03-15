import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/format';
import { Download } from 'lucide-react';
import React from 'react';

const MONTHS = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];

export default function Raporty() {
  const { orgId } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [produkty, setProdukty] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      const m = month.padStart(2, '0');
      const dateFrom = `${year}-${m}-01`;
      const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
      const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
      const dateTo = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

      const [prodRes, wzRes] = await Promise.all([
        supabase.from('produkty').select('id, nazwa').eq('org_id', orgId).order('kolejnosc'),
        supabase.from('dokumenty_wz').select('id, klient_id, klienci(nazwa)').eq('org_id', orgId).gte('data', dateFrom).lt('data', dateTo),
      ]);
      setProdukty(prodRes.data || []);

      const wzIds = (wzRes.data || []).map(w => w.id);
      let allPoz: any[] = [];
      if (wzIds.length > 0) {
        const { data } = await supabase.from('pozycje_wz').select('*').in('wz_id', wzIds);
        allPoz = data || [];
      }

      const clientMap: Record<string, { nazwa: string; produkty: Record<string, { wydano: number; zwrocono: number; wartosc: number }> }> = {};
      (wzRes.data || []).forEach((wz: any) => {
        if (!wz.klient_id) return;
        if (!clientMap[wz.klient_id]) {
          clientMap[wz.klient_id] = { nazwa: wz.klienci?.nazwa || '—', produkty: {} };
        }
        const wzPoz = allPoz.filter(p => p.wz_id === wz.id);
        wzPoz.forEach(p => {
          if (!clientMap[wz.klient_id].produkty[p.produkt_id]) {
            clientMap[wz.klient_id].produkty[p.produkt_id] = { wydano: 0, zwrocono: 0, wartosc: 0 };
          }
          const entry = clientMap[wz.klient_id].produkty[p.produkt_id];
          entry.wydano += p.wydano;
          entry.zwrocono += p.zwrocono;
          entry.wartosc += (p.wydano - p.zwrocono) * (p.cena_snapshot || 0);
        });
      });

      setRows(Object.values(clientMap));
      setLoading(false);
    };
    fetch();
  }, [orgId, month, year]);

  const totals = (prodId: string, field: 'wydano' | 'zwrocono' | 'wartosc') => {
    return rows.reduce((s, r) => s + (r.produkty[prodId]?.[field] || 0), 0);
  };
  const totalWartosc = rows.reduce((s, r) => {
    return s + Object.values(r.produkty as Record<string, any>).reduce((ss: number, p: any) => ss + (p.wartosc || 0), 0);
  }, 0);

  const exportCSV = () => {
    const prods = produkty;
    const headers = ['Klient', ...prods.flatMap(p => [`Wydano ${p.nazwa}`, `Zwrócono ${p.nazwa}`, `Saldo ${p.nazwa}`]), 'Wartość netto'];
    const csvRows = rows.map(r => [
      r.nazwa,
      ...prods.flatMap(p => {
        const d = r.produkty[p.id] || { wydano: 0, zwrocono: 0 };
        return [d.wydano, d.zwrocono, d.wydano - d.zwrocono];
      }),
      Object.values(r.produkty as Record<string, any>).reduce((s: number, p: any) => s + (p.wartosc || 0), 0).toFixed(2).replace('.', ','),
    ]);
    const csv = [headers.join(';'), ...csvRows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `raport_${year}_${month}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 2 + i));

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Raporty</h1>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" /> Eksportuj CSV</Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="space-y-1">
          <Label className="text-xs">Miesiąc</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Rok</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-2">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Brak danych za wybrany okres</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Klient</TableHead>
                    {produkty.map(p => (
                      <TableHead key={p.id} className="text-center" colSpan={3}>{p.nazwa}</TableHead>
                    ))}
                    <TableHead className="text-right">Wartość netto</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead />
                    {produkty.map(p => (
                      <React.Fragment key={p.id}>
                        <TableHead className="text-right text-xs">Wyd.</TableHead>
                        <TableHead className="text-right text-xs">Zwr.</TableHead>
                        <TableHead className="text-right text-xs">Saldo</TableHead>
                      </React.Fragment>
                    ))}
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => {
                    const rowVal = Object.values(r.produkty as Record<string, any>).reduce((s: number, p: any) => s + (p.wartosc || 0), 0);
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{r.nazwa}</TableCell>
                        {produkty.map(p => {
                          const d = r.produkty[p.id] || { wydano: 0, zwrocono: 0 };
                          return (
                            <React.Fragment key={p.id}>
                              <TableCell className="text-right">{d.wydano}</TableCell>
                              <TableCell className="text-right">{d.zwrocono}</TableCell>
                              <TableCell className="text-right">{d.wydano - d.zwrocono}</TableCell>
                            </React.Fragment>
                          );
                        })}
                        <TableCell className="text-right">{formatCurrency(rowVal)}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="font-bold border-t-2">
                    <TableCell>RAZEM</TableCell>
                    {produkty.map(p => (
                      <React.Fragment key={p.id}>
                        <TableCell className="text-right">{totals(p.id, 'wydano')}</TableCell>
                        <TableCell className="text-right">{totals(p.id, 'zwrocono')}</TableCell>
                        <TableCell className="text-right">{totals(p.id, 'wydano') - totals(p.id, 'zwrocono')}</TableCell>
                      </React.Fragment>
                    ))}
                    <TableCell className="text-right">{formatCurrency(totalWartosc)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
