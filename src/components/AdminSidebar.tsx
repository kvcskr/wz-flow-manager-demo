import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Users,
  Package,
  BarChart3,
  UsersRound,
  Settings,
  LogOut,
} from 'lucide-react';

const items = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Nowe WZ', url: '/wz/nowe', icon: FilePlus },
  { title: 'Lista WZ', url: '/wz', icon: FileText },
  { title: 'Klienci', url: '/klienci', icon: Users },
  { title: 'Produkty', url: '/produkty', icon: Package },
  { title: 'Raporty', url: '/raporty', icon: BarChart3 },
  { title: 'Zespół', url: '/zespol', icon: UsersRound },
  { title: 'Ustawienia', url: '/ustawienia', icon: Settings },
];

export function AdminSidebar() {
  const { signOut } = useAuth();

  return (
    <Sidebar className="border-r-0">
      <div className="p-4 border-b border-sidebar-border">
        <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight">
          WZ Manager
        </h1>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/wz'}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="p-3 mt-auto border-t border-sidebar-border">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>Wyloguj</span>
        </button>
      </div>
    </Sidebar>
  );
}
