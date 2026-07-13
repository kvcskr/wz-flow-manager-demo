import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, CalendarIcon, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Produkt {
  id: string;
  nazwa: string;
  jednostka: string;
}

interface PozycjaForm {
  produkt_id: string;
  nazwa: string;
  jednostka: string;
  wydano: string;
  zwrocono: string;
}

function WzNoweContent() {
  const { orgId, user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [klienci, setKlienci] = useState<any[]>([]);
  const [selectedKlient, setSelectedKlient] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [pozycje, setPozycje] = useState<PozycjaForm[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [klientOpen, setKlientOpen] = useState(false);

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    const fetch = async () => {
      try {
        const [kRes, pRes] = await Promise.all([
          supabase.from('klienci').select('id, nazwa').eq('org_id', orgId).eq('aktywny', true).order('nazwa'),
          supabase.from('produkty').select('id, nazwa, jednostka').eq('org_id', orgId).eq('aktywny', true).order('kolejnosc'),
        ]);
        setKlienci(kRes.data || []);
        setPozycje((pRes.data || []).map((p: Produkt) => ({
          produkt_id: p.id,
          nazwa: p.nazwa,
          jednostka: p.jednostka,
          wydano: '',
          zwrocono: '',
        })));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [orgId]);

  const updatePozycja = (idx: number, field: 'wydano' | 'zwrocono', raw: string) => {
    const digits = raw.replace(/\D/g, '');
    setPozycje(prev => prev.map((p, i) => i === idx ? { ...p, [field]: digits } : p));
  };

  const handleSave = async () => {
    if (!selectedKlient || !orgId || !user) return;
    setSaving(true);

    // Fetch prices for selected client
    const { data: prices } = await supabase
      .from('ceny_klientow')
      .select('produkt_id, cena_jednostkowa')
      .eq('klient_id', selectedKlient);

    const priceMap = new Map((prices || []).map(p => [p.produkt_id, p.cena_jednostkowa]));

    const { data: wz, error } = await supabase
      .from('dokumenty_wz')
      .insert({
        org_id: orgId,
        klient_id: selectedKlient,
        data: format(date, 'yyyy-MM-dd'),
        wystawil: user.id,
      })
      .select()
      .single();

    if (error || !wz) {
      toast({ title: 'Błąd', description: 'Nie udało się zapisać dokumentu.', variant: 'destructive' });
      setSaving(false);
      return;
    }

    const items = pozycje.map(p => ({
      wz_id: wz.id,
      produkt_id: p.produkt_id,
      wydano: parseInt(p.wydano) || 0,
      zwrocono: parseInt(p.zwrocono) || 0,
      cena_snapshot: priceMap.get(p.produkt_id) ?? 0,
    }));

    const { error: itemsError } = await supabase.from('pozycje_wz').insert(items);
    if (itemsError) {
      toast({ title: 'Błąd', description: 'Nie udało się zapisać pozycji.', variant: 'destructive' });
      setSaving(false);
      return;
    }

    toast({ title: 'Zapisano', description: 'Dokument WZ został utworzony.' });
    navigate(`/wz/${wz.id}/wydruk`);
  };

  if (loading) return <div className="space-y-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-16 bg-muted rounded animate-pulse" />)}</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nowe WZ</h1>

      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Klient</Label>
            <Popover open={klientOpen} onOpenChange={setKlientOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={klientOpen} className="w-full justify-between font-normal">
                  {selectedKlient ? klienci.find(k => k.id === selectedKlient)?.nazwa : 'Wybierz klienta...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Szukaj klienta..." />
                  <CommandList>
                    <CommandEmpty>Nie znaleziono klienta.</CommandEmpty>
                    <CommandGroup>
                      {klienci.map(k => (
                        <CommandItem key={k.id} value={k.nazwa} onSelect={() => { setSelectedKlient(k.id); setKlientOpen(false); }}>
                          <Check className={cn('mr-2 h-4 w-4', selectedKlient === k.id ? 'opacity-100' : 'opacity-0')} />
                          {k.nazwa}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'dd.MM.yyyy') : 'Wybierz datę'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {pozycje.map((p, idx) => (
        <Card key={p.produkt_id} className="mb-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{p.nazwa}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Wydano</Label>
                <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={p.wydano} onChange={(e) => updatePozycja(idx, 'wydano', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Zwrócono</Label>
                <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={p.zwrocono} onChange={(e) => updatePozycja(idx, 'zwrocono', e.target.value)} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Saldo: <span className="font-medium text-foreground">{(parseInt(p.wydano) || 0) - (parseInt(p.zwrocono) || 0)}</span> {p.jednostka}
            </p>
          </CardContent>
        </Card>
      ))}

      <Button className="w-full mt-4" size="lg" disabled={!selectedKlient || saving} onClick={handleSave}>
        <Save className="h-4 w-4 mr-2" /> {saving ? 'Zapisywanie...' : 'Zapisz i drukuj'}
      </Button>
    </div>
  );
}

export default function WzNowe() {
  const { role } = useAuth();
  if (role === 'kierowca') {
    return (
      <div className="min-h-screen bg-background p-4">
        <WzNoweContent />
      </div>
    );
  }
  return <AdminLayout><WzNoweContent /></AdminLayout>;
}
