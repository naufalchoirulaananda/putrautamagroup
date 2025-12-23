"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import NavMain from "./nav-main"
import { NavUser } from "./nav-user"
import { LogoHeader } from "./logo-header"

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <LogoHeader />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
      <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
