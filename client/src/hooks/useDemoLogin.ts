/**
 * useDemoLogin
 *
 * Calls trpc.auth.demoLogin to create a sandboxed demo session without OAuth.
 * Used by Apple reviewers and anyone who wants to try the app without signing up.
 * On success, invalidates auth state so useAuth() picks up the new session cookie.
 */
import { trpc } from "@/lib/trpc";
import { useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export function useDemoLogin() {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();

  const mutation = trpc.auth.demoLogin.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setLocation("/app");
    },
    onError: (err) => {
      toast.error("Demo login failed: " + err.message);
    },
  });

  const demoLogin = useCallback(() => {
    mutation.mutate();
  }, [mutation]);

  return { demoLogin, isLoading: mutation.isPending };
}
