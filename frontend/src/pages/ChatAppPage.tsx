import Logout from "@/components/auth/logout";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import React from "react";
import { toast } from "sonner";

const ChatAppPage = () => {
  const user = useAuthStore((s) => s.user); // syntax mean that take only user in the context store

  const handleOnclick = async () => {
    try {
      await api.get("/users/test", { withCredentials: true });
      toast.success("ok");
    } catch (error) {
      toast.error("Thất bại");
      console.error(error);
    }
  };

  return (
    <div>
      {user?.username}
      <Logout />

      <Button onClick={handleOnclick}>test</Button>
    </div>
  );
};

export default ChatAppPage;
