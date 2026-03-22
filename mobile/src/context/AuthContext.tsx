import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AxiosInstance } from "axios";
import { createApi, clearTokens, loadTokens, loginRequest, registerRequest } from "../api/client";

type Profile = {
  username: string;
  email: string;
  weekly_budget: string;
  university_slug: string;
  total_xp: number;
  wake_time: string | null;
  sleep_reminder_time: string | null;
};

type AuthCtx = {
  ready: boolean;
  signedIn: boolean;
  profile: Profile | null;
  api: AxiosInstance;
  refreshProfile: () => Promise<void>;
  signIn: (u: string, p: string) => Promise<void>;
  signUp: (u: string, p: string, e?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const api = useMemo(() => createApi(), []);

  const refreshProfile = useCallback(async () => {
    const { data } = await api.get<Profile>("profile/me/");
    setProfile(data);
  }, [api]);

  useEffect(() => {
    (async () => {
      const { access } = await loadTokens();
      if (access) {
        try {
          await refreshProfile();
          setSignedIn(true);
        } catch {
          await clearTokens();
        }
      }
      setReady(true);
    })();
  }, [api, refreshProfile]);

  const signIn = useCallback(
    async (username: string, password: string) => {
      await loginRequest(username, password);
      await refreshProfile();
      setSignedIn(true);
    },
    [refreshProfile]
  );

  const signUp = useCallback(
    async (username: string, password: string, email?: string) => {
      await registerRequest({ username, password, password_confirm: password, email: email || "" });
      await refreshProfile();
      setSignedIn(true);
    },
    [refreshProfile]
  );

  const signOut = useCallback(async () => {
    await clearTokens();
    setProfile(null);
    setSignedIn(false);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      signedIn,
      profile,
      api,
      refreshProfile,
      signIn,
      signUp,
      signOut,
    }),
    [ready, signedIn, profile, api, refreshProfile, signIn, signUp, signOut]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth");
  return v;
}
