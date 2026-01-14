"use client";

import * as React from "react";
import { Command, Moon, Sun } from "lucide-react";

import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Switch } from "../ui/switch";
import CreateNewChat from "../chat/CreateNewChat";
import NewGroupChatModal from "../chat/NewGroupChatModal";
import GroupChatList from "../chat/GroupChatList";
import AddFriendModal from "../chat/AddFriendModal";
import DirectMessageList from "../chat/DirectMessageList";
import { useThemeStore } from "@/stores/useThemeStore";
import { useAuthStore } from "@/stores/useAuthStore";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isDark, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();

  return (
    <Sidebar variant="inset" {...props}>
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="bg-gradient-primary"
            >
              {/* a tag */}
              <a href="#">
                <div className="flex w-full items-center justify-between px-2">
                  <h1 className="text-xl font-bold text-white">Moji</h1>
                  <div className="flex items-center gap-2">
                    <Sun className="size-4 text-white/80" />
                    <Switch
                      checked={isDark}
                      onCheckedChange={toggleTheme}
                      className="data-[state=checked]:bg-background/80" // data selector in tailwind, if component have state checked, then apply the style
                    />
                    <Moon className="size-4 text-white/80" />
                  </div>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="beautiful-scrollbar">
        {/* New chat */}
        <SidebarGroup>
          <SidebarGroupContent>
            <CreateNewChat />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Group chat */}
        <SidebarGroup>
          {/* Title */}
          <SidebarGroupLabel className="uppercase">Nhóm chat</SidebarGroupLabel>

          {/* Create new chat modal */}
          <SidebarGroupAction title="Tạo nhóm" className="cursor-pointer">
            <NewGroupChatModal />
          </SidebarGroupAction>

          {/* List of group chat */}
          <SidebarGroupContent>
            <GroupChatList />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Direct Message */}
        <SidebarGroup>
          {/* Title */}
          <SidebarGroupLabel className="uppercase">Bạn bè</SidebarGroupLabel>

          {/* Create new chat modal */}
          <SidebarGroupAction title="Kết Bạn" className="cursor-pointer">
            <AddFriendModal />
          </SidebarGroupAction>

          {/* List of chat */}
          <SidebarGroupContent>
            <DirectMessageList />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
