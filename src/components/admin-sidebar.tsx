import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import { 
  Home, 
  BarChart3, 
  Users, 
  Tag, 
  ClipboardList, 
  CalendarDays, 
  Upload, 
  Edit, 
  AlertTriangle, 
  Coffee, 
  FileText,
  Building2,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const navigation = [
  { 
    name: "Dashboard", 
    href: "/admin", 
    icon: Home,
    badge: null
  },
  { 
    name: "Daily Chart", 
    href: "/admin/daily-chart", 
    icon: BarChart3,
    badge: null
  },
  { 
    name: "Employees", 
    href: "/admin/employees", 
    icon: Users,
    badge: null
  },
  { 
    name: "Tags", 
    href: "/admin/tags", 
    icon: Tag,
    badge: "4"
  },
  { 
    name: "Assignments", 
    href: "/admin/assignments", 
    icon: ClipboardList,
    badge: null
  },
  { 
    name: "Attendance", 
    href: "/admin/attendance", 
    icon: CalendarDays,
    badge: null
  },
  { 
    name: "Flowace", 
    href: "/admin/flowace", 
    icon: Upload,
    badge: null
  },
  { 
    name: "Edit Logs", 
    href: "/admin/edit-logs", 
    icon: Edit,
    badge: null
  },
  { 
    name: "Missing Data", 
    href: "/admin/missing-data", 
    icon: AlertTriangle,
    badge: "2"
  },
  { 
    name: "Warnings", 
    href: "/admin/warnings", 
    icon: AlertTriangle,
    badge: null
  },
  { 
    name: "Breaks", 
    href: "/admin/breaks", 
    icon: Coffee,
    badge: null
  },
  { 
    name: "Issues", 
    href: "/admin/issues", 
    icon: FileText,
    badge: "3"
  },
];

interface AdminSidebarProps {
  isCollapsed?: boolean;
}

export default function AdminSidebar({ isCollapsed = false }: AdminSidebarProps) {
  const pathname = usePathname();
  
  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground max-h-screen">
      {/* Header - Fixed */}
      <div className="border-b border-sidebar-border/50 p-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-4" />
          </div>
          {!isCollapsed && (
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold text-sidebar-foreground">Employee Tracker</span>
              <span className="truncate text-xs text-sidebar-foreground/70">Admin Portal</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Content - Scrollable */}
      <div className="flex-1 px-2 py-2 overflow-y-auto sidebar-scrollbar min-h-0">
        <div className="mb-2">
          {!isCollapsed && (
            <div className="text-sidebar-foreground/70 text-xs font-medium px-2 py-2">
              Navigation
            </div>
          )}
          <div className="space-y-1">
            {navigation.map((item) => (
              <div key={item.name}>
                <Link 
                  href={item.href} 
                  className={`
                    relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm
                    transition-all duration-200 ease-in-out
                    hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                    ${pathname === item.href 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                      : ''
                    }
                    ${isCollapsed ? 'justify-center px-2' : ''}
                  `}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="size-4 shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="truncate">
                        {item.name}
                      </span>
                      {item.badge && (
                        <Badge 
                          variant="secondary" 
                          className="ml-auto h-5 px-1.5 text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer - Fixed */}
      <div className="border-t border-sidebar-border/50 p-2 flex-shrink-0">
        <div 
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src="/placeholder-avatar.jpg" alt="Admin" />
            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground font-medium">
              AD
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-sidebar-foreground">Admin</span>
                <span className="truncate text-xs text-sidebar-foreground/70">admin@company.com</span>
              </div>
              <ChevronRight className="size-4 ml-auto" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

