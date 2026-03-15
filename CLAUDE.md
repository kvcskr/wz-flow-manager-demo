# WZ Manager — Kontekst projektu

## Co to jest
SaaS dla firm dystrybucyjnych do zarządzania dokumentami WZ (Wydanie Zewnętrzne).
Budowany w Lovable (React + Supabase), rozwijany ręcznie w VSCode.
Pacjent 0: firma **Polix** (NIP: 7941827391).

---

## Role użytkowników

| Rola | Kto | Co może |
|------|-----|---------|
| `superadmin` | Właściciel SaaS | Panel /superadmin: wszystkie firmy, blokady, subskrypcje |
| `admin` | Właściciel firmy (np. Polix) | Pełny panel swojej org: WZ, klienci, produkty, raporty, zespół, ustawienia |
| `kierowca` | Pracownik dostawczy | TYLKO: formularz WZ (/wz/nowe) → strona wydruku (/wz/:id/wydruk) |

Kierowca nie ma żadnej nawigacji — widzi tylko formularz i wydruk.

---

## Model danych (Supabase)

```
organizacje          — tenant (firma korzystająca z SaaS)
  nazwa_na_wz        — nazwa sprzedawcy na dokumentach WZ
  nip_na_wz          — NIP sprzedawcy na dokumentach WZ
  subscription_status — 'trial' | 'active' | 'inactive'
  subscription_expires_at

uzytkownicy_organizacji — powiązanie user ↔ org + rola
  rola: 'superadmin' | 'admin' | 'kierowca'
  WAŻNE: unique(user_id) — jeden user należy do jednej org

produkty             — katalog per org (każda firma ma SWOJE produkty)
  nazwa, jednostka ('szt.' | 'kg' | 'l'), aktywny, kolejnosc
  Polix ma: Zapiekanki, Bułki
  Inne firmy mogą mieć: Chleb, Woda, Ogórki itp.

klienci              — odbiorcy towarów per org (każda firma ma SWOICH klientów)
  nazwa, nip, aktywny
  Dezaktywacja zamiast usunięcia (historia WZ musi być nienaruszona)

ceny_klientow        — indywidualna cena per klient per produkt
  klient_id, produkt_id, cena_jednostkowa
  Każdy klient może mieć inną cenę każdego produktu

dokumenty_wz         — dokument wydania zewnętrznego
  org_id, klient_id, data, wystawil

pozycje_wz           — pozycje dokumentu WZ
  wz_id, produkt_id, wydano, zwrocono, cena_snapshot
  saldo = wydano - zwrocono (obliczane w UI, nie w bazie)
```

**RLS:** każdy user widzi TYLKO dane swojej org\_id. Superadmin widzi wszystko.

---

## Subskrypcja

- Cena: 100 PLN/miesiąc za każde konto (admin i kierowca — ta sama stawka)
- Billing ręczny: superadmin ręcznie zmienia status po otrzymaniu przelewu
- Jeśli `inactive` → wszyscy userzy org widzą ekran blokady (dane zachowane)
- Stripe — planowany w przyszłości (Faza 2)

---

## Ekrany admina (sidebar z 8 pozycjami)

1. **Dashboard** — kafelki (WZ dziś / mies. / wartość) + ostatnie 10 WZ
2. **Nowe WZ** — formularz (wspólny z kierowcą)
3. **Lista WZ** — tabela + filtry + eksport CSV
4. **Klienci** — CRUD klientów + indywidualne ceny per produkt
5. **Produkty** — katalog produktów org (dynamiczny, per firma)
6. **Raporty** — miesięczna tabela: klient × produkt (wydano/zwrócono/saldo/wartość)
7. **Zespół** — zapraszanie userów przez email, usuwanie
8. **Ustawienia** — nazwa i NIP firmy na dokumentach WZ

---

## Formularz WZ (kierowca + admin)

- Dropdown klienta (tylko aktywni)
- Data (domyślnie dziś)
- Dla KAŻDEGO aktywnego produktu org: pola "Wydano" i "Zwrócono" + live saldo
- Liczba pól = liczba aktywnych produktów (dynamiczne, nie hardkodowane)
- Po zapisaniu → redirect na /wz/:id/wydruk

---

## Dokument WZ (wydruk)

- Box SPRZEDAWCA: dane z organizacje.nazwa\_na\_wz i nip\_na\_wz
- Box NABYWCA: nazwa i NIP klienta
- Tabela: Lp | Towar | Wydano | Zwrócono | Saldo | Cena jedn. | Wartość
- Wiersz RAZEM
- Linie podpisu: "Wydał" i "Odebrał"
- Strona bez nawigacji, z przyciskiem "Drukuj" (ukryty przy druku)

---

## Dane startowe dla Polixa

Produkty: Zapiekanki (szt.), Bułki (szt.)

Klienci:
- Mała rawka, NIP 12344234412434
- Duża rawka, NIP 124540231252
- Firma Handlowo Usługowa Dawid Konior, NIP 6020133233
- F.H.U. Grażyna Malek Delikatesy Premium, NIP 8651317521
- RENMAR s.c. Renata i Marek Machaj, NIP 6020132676
- Stalowawoladis Sp. z o.o. Frac, NIP 8652568788
- DUO s.c. Agnieszka Kieliszek Robert Kieliszek, NIP 8172079115

---

## Stack techniczny

- Frontend: React + TypeScript + Tailwind CSS + shadcn/ui
- Backend/DB: Supabase (PostgreSQL + Auth + RLS)
- Routing: React Router
- Generowany przez: Lovable, rozwijany w VSCode
- Język UI: polski (100%)

---

## Fazy

- **Faza 1 (MVP):** Obecny zakres — formularz WZ, wydruk, admin, subskrypcja ręczna
- **Faza 2:** Stripe — automatyczne płatności, checkout, webhooks
- **Faza 3:** Portal klienta — Rawka itp. logują się i widzą swoje WZ
