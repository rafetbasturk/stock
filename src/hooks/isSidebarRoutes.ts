import { useRouter } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

type SidebarRoute = {
  id: string;
  to: string;
  label: string;
  icon: LucideIcon;
  order: number;
};

function collectSidebarRoutes(route: any, acc: SidebarRoute[]) {
  const sidebar = route.options?.staticData?.sidebar;

  if (sidebar) {
    acc.push({
      id: route.id,
      to: route.fullPath,
      label: sidebar.label,
      icon: sidebar.icon,
      order: sidebar.order ?? 0,
    });
  }

  if (route.children) {
    for (const child of route.children) {
      collectSidebarRoutes(child, acc);
    }
  }
}

export function useSidebarRoutes(): SidebarRoute[] {
  const router = useRouter();

  const routes: SidebarRoute[] = [];
  collectSidebarRoutes(router.routeTree, routes);

  return routes.sort((a, b) => a.order - b.order);
}
