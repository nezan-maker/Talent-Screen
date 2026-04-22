"use client";

import { usePathname } from "next/navigation";
import { Sidebar as SidebarView } from "./Sidebar";

export function Sidebar() {
  const pathname = usePathname();
  return <SidebarView pathname={pathname} />;
}

