import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ShieldAlert } from 'lucide-react';

export function SubscriptionBlockScreen() {
  const { signOut } = useAuth();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <ShieldAlert className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
        <h1 className="text-2xl font-semibold mb-2">Subskrypcja wygasła</h1>
        <p className="text-muted-foreground mb-6">
          Skontaktuj się z dostawcą aplikacji.
        </p>
        <Button onClick={signOut} variant="outline">Wyloguj</Button>
      </div>
    </div>
  );
}
