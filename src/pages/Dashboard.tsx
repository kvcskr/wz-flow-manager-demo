import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/format';
import { FilePlus, Printer } from 'lucide-react';

export default function Dashboard() {
  const { orgId } = useAuth();
  const [stats, setStats] = useState({ today: 0, month: 0, value: 0 });
  const [recentWz, setRecentWz] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }

    const fetchData = async () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      const [todayRes, monthRes, recentRes] = await Promise.all([
        supabase.from('dokumenty_wz').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('data', todayStr),
        supabase.from('dokumenty_wz').select('id').eq('org_id', orgId).gte('data', monthStart),
        supabase.from('dokumenty_wz').select('*, klienci(nazwa)').eq('org_id', orgId).order('utworzono', { ascending: false }).limit(10),
      ]);

      const monthIds = monthRes.data?.map(w => w.id) || [];
      let totalValue = 0;
      if (monthIds.length > 0) {
        const { data: pozycje } = await supabase
          .from('pozycje_wz')
          .select('wydano, zwrocono, cena_snapshot')
          .in('wz_id', monthIds);
        totalValue = (pozycje || []).reduce((s, p) => s + ((p.wydano - p.zwrocono) * (p.cena_snapshot || 0)), 0);
      }

      const recentIds = (recentRes.data || []).map((w: any) => w.id);
      let recentPozycje: any[] = [];
      if (recentIds.length > 0) {
        const { data } = await supabase
          .from('pozycje_wz')
          .select('wz_id, wydano, zwrocono, cena_snapshot')
          .in('wz_id', recentIds);
        recentPozycje = data || [];
      }
      const enriched = (recentRes.data || []).map((wz: any) => {
        const val = recentPozycje
          .filter(p => p.wz_id === wz.id)
          .reduce((s: number, p: any) => s + ((p.wydano - p.zwrocono) * (p.cena_snapshot || 0)), 0);
        return { ...wz, wartosc: val };
      });

      setStats({
        today: todayRes.count || 0,
        month: monthRes.data?.length || 0,
        value: totalValue,
      });
      setRecentWz(enriched);
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel('dashboard-wz-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dokumenty_wz', filter: `org_id=eq.${orgId}` }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orgId]);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link to="/wz/nowe"><FilePlus className="h-4 w-4 mr-2" /> Nowe WZ</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-8 w-20" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">WZ dzisiaj</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{stats.today}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">WZ w tym miesiącu</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{stats.month}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Wartość w tym miesiącu</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{formatCurrency(stats.value)}</div></CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Ostatnie dokumenty WZ</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : recentWz.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Brak dokumentów WZ</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead className="text-right">Wartość</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentWz.map((wz: any) => (
                  <TableRow key={wz.id}>
                    <TableCell>{formatDate(wz.data)}</TableCell>
                    <TableCell>{wz.klienci?.nazwa || '—'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(wz.wartosc)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/wz/${wz.id}/wydruk`} target="_blank"><Printer className="h-4 w-4" /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
