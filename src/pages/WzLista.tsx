import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/format';
import { Printer, Trash2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function WzLista() {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const [docs, setDocs] = useState<any[]>([]);
  const [produkty, setProdukty] = useState<any[]>([]);
  const [klienci, setKlienci] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterKlient, setFilterKlient] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!orgId) return;
    setLoading(true);

    const [prodRes, kliRes] = await Promise.all([
      supabase.from('produkty').select('id, nazwa').eq('org_id', orgId).eq('aktywny', true).order('kolejnosc'),
      supabase.from('klienci').select('id, nazwa').eq('org_id', orgId),
    ]);
    setProdukty(prodRes.data || []);
    setKlienci(kliRes.data || []);

    let query = supabase.from('dokumenty_wz').select('*, klienci(nazwa)').eq('org_id', orgId).order('data', { ascending: false });
    if (dateFrom) query = query.gte('data', dateFrom);
    if (dateTo) query = query.lte('data', dateTo);
    if (filterKlient && filterKlient !== 'all') query = query.eq('klient_id', filterKlient);

    const { data: wzDocs } = await query;

    // Fetch all pozycje for these docs
    const wzIds = (wzDocs || []).map(w => w.id);
    let allPozycje: any[] = [];
    if (wzIds.length > 0) {
      const { data } = await supabase.from('pozycje_wz').select('*').in('wz_id', wzIds);
      allPozycje = data || [];
    }

    const enriched = (wzDocs || []).map(wz => {
      const poz = allPozycje.filter(p => p.wz_id === wz.id);
      const wartosc = poz.reduce((s: number, p: any) => s + ((p.wydano - p.zwrocono) * (p.cena_snapshot || 0)), 0);
      const produktMap: Record<string, number> = {};
      poz.forEach((p: any) => { produktMap[p.produkt_id] = (p.wydano || 0) - (p.zwrocono || 0); });
      return { ...wz, wartosc, produktMap };
    });

    setDocs(enriched);
    setLoading(false);
  };

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    fetchData();
  }, [orgId, dateFrom, dateTo, filterKlient]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('dokumenty_wz').delete().eq('id', deleteId);
    if (error) {
      toast({ title: 'Błąd', description: 'Nie udało się usunąć dokumentu.', variant: 'destructive' });
    } else {
      toast({ title: 'Usunięto', description: 'Dokument WZ został usunięty.' });
      fetchData();
    }
    setDeleteId(null);
  };

  const exportCSV = () => {
    const headers = ['Data', 'Klient', ...produkty.map(p => `Saldo ${p.nazwa}`), 'Wartość'];
    const rows = docs.map(d => [
      formatDate(d.data),
      d.klienci?.nazwa || '',
      ...produkty.map(p => d.produktMap?.[p.id] ?? 0),
      (d.wartosc || 0).toFixed(2).replace('.', ','),
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'wz_lista.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Lista WZ</h1>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" /> Eksportuj CSV</Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Od</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Do</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-1 min-w-[200px]">
              <Label className="text-xs">Klient</Label>
              <Select value={filterKlient} onValueChange={setFilterKlient}>
                <SelectTrigger><SelectValue placeholder="Wszyscy" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszyscy</SelectItem>
                  {klienci.map(k => <SelectItem key={k.id} value={k.id}>{k.nazwa}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-2">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : docs.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Brak dokumentów WZ</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Klient</TableHead>
                    {produkty.map(p => <TableHead key={p.id} className="text-right">Saldo {p.nazwa}</TableHead>)}
                    <TableHead className="text-right">Wartość</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map(d => (
                    <TableRow key={d.id}>
                      <TableCell>{formatDate(d.data)}</TableCell>
                      <TableCell>{d.klienci?.nazwa || '—'}</TableCell>
                      {produkty.map(p => <TableCell key={p.id} className="text-right">{d.produktMap?.[p.id] ?? 0}</TableCell>)}
                      <TableCell className="text-right">{formatCurrency(d.wartosc)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/wz/${d.id}/wydruk`} target="_blank"><Printer className="h-4 w-4" /></Link>
                        </Button>
                        <Dialog open={deleteId === d.id} onOpenChange={(o) => !o && setDeleteId(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteId(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Usunąć dokument WZ?</DialogTitle>
                              <DialogDescription>Ta operacja jest nieodwracalna.</DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDeleteId(null)}>Anuluj</Button>
                              <Button variant="destructive" onClick={handleDelete}>Usuń</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
