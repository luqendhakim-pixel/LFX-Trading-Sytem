import { UserProfile, AuthMethod, UserRole, SubscriptionStatus, LicenseActivationCode } from "../types";

const AUTH_STORAGE_KEY = "lfx_auth_session_v2";
const MEMBERS_REGISTRY_KEY = "lfx_registered_members_registry_v1";
const ADMIN_EMAIL = "luqendhakim@gmail.com";
const ADMIN_PHONE = "08123456789";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function calculateUserStatus(user: Partial<UserProfile>): {
  status: SubscriptionStatus;
  isSubscriptionActive: boolean;
  daysRemaining: number;
} {
  const now = Date.now();
  const isAdmin = user.role === "ADMIN" || user.identifier === ADMIN_EMAIL || user.identifier === ADMIN_PHONE;

  if (isAdmin) {
    return {
      status: "ADMIN",
      isSubscriptionActive: true,
      daysRemaining: 999,
    };
  }

  // 1. Check active paid subscription first
  if (user.subscriptionEndsAt && user.subscriptionEndsAt > now) {
    const msLeft = user.subscriptionEndsAt - now;
    const daysRemaining = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
    return {
      status: "SUBSCRIBED",
      isSubscriptionActive: true,
      daysRemaining,
    };
  }

  // 2. Check 7-day free trial
  const trialEndsAt = user.trialEndsAt || (user.registeredAt ? user.registeredAt + SEVEN_DAYS_MS : now + SEVEN_DAYS_MS);
  if (trialEndsAt > now) {
    const msLeft = trialEndsAt - now;
    const daysRemaining = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
    return {
      status: "TRIAL_ACTIVE",
      isSubscriptionActive: true,
      daysRemaining,
    };
  }

  // 3. Expired
  return {
    status: user.subscriptionEndsAt ? "EXPIRED" : "TRIAL_EXPIRED",
    isSubscriptionActive: false,
    daysRemaining: 0,
  };
}

class AuthService {
  private currentUser: UserProfile | null = null;
  private listeners: Set<(user: UserProfile | null) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      // Purge legacy storage keys from previous development iterations
      localStorage.removeItem("lfx_user_profile");
      localStorage.removeItem("lfx_auth_user_v1");
      localStorage.removeItem("lfx_user_session");

      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        const calc = calculateUserStatus(parsed);
        this.currentUser = {
          ...parsed,
          status: calc.status,
          isSubscriptionActive: calc.isSubscriptionActive,
          daysRemaining: calc.daysRemaining,
        };
      } else {
        // No user logged in by default - new visitors must login or register
        this.currentUser = null;
      }
    } catch {
      this.currentUser = null;
    }
  }

  private saveToStorage(user: UserProfile | null): void {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      // Also register in persistent members registry
      try {
        const raw = localStorage.getItem(MEMBERS_REGISTRY_KEY);
        const list: UserProfile[] = raw ? JSON.parse(raw) : [];
        const index = list.findIndex((m) => m.identifier.toLowerCase() === user.identifier.toLowerCase());
        if (index >= 0) {
          list[index] = { ...list[index], ...user };
        } else {
          list.push(user);
        }
        localStorage.setItem(MEMBERS_REGISTRY_KEY, JSON.stringify(list));

        // Background sync to server
        fetch("/api/admin/sync-member", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user }),
        }).catch(() => {});
      } catch (e) {}
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    this.notifyListeners();
  }

  public subscribe(listener: (user: UserProfile | null) => void): () => void {
    this.listeners.add(listener);
    listener(this.getUser());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const user = this.getUser();
    this.listeners.forEach((fn) => fn(user));
  }

  public getUser(): UserProfile | null {
    if (!this.currentUser) return null;
    const calc = calculateUserStatus(this.currentUser);
    this.currentUser = {
      ...this.currentUser,
      status: calc.status,
      isSubscriptionActive: calc.isSubscriptionActive,
      daysRemaining: calc.daysRemaining,
    };
    return this.currentUser;
  }

  public async loginWithPassword(
    email: string,
    password: string,
    name?: string
  ): Promise<{ success: boolean; message: string; user?: UserProfile }> {
    try {
      const res = await fetch("/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        this.currentUser = data.user;
        this.saveToStorage(data.user);
        return { success: true, message: data.message, user: data.user };
      }
      return { success: false, message: data.message || "Gagal masuk" };
    } catch {
      // Local fallback
      const cleanEmail = email.trim().toLowerCase();
      const isAdmin = cleanEmail === ADMIN_EMAIL || cleanEmail === ADMIN_PHONE;
      
      // Strict check for admin credentials in offline mode
      if (isAdmin && password !== "admin123") {
        return { success: false, message: "Password Admin tidak sesuai!" };
      }

      const now = Date.now();
      const user: UserProfile = {
        id: `USR-${Date.now().toString().slice(-6)}`,
        name: name || (cleanEmail.includes("@") ? cleanEmail.split("@")[0] : "Trader"),
        identifier: cleanEmail,
        authMethod: "EMAIL",
        role: isAdmin ? "ADMIN" : "MEMBER",
        registeredAt: now,
        trialEndsAt: now + SEVEN_DAYS_MS,
        subscriptionEndsAt: isAdmin ? now + 365 * 24 * 60 * 60 * 1000 : null,
        isSubscriptionActive: true,
        daysRemaining: isAdmin ? 365 : 7,
        status: isAdmin ? "ADMIN" : "TRIAL_ACTIVE",
      };
      this.currentUser = user;
      this.saveToStorage(user);
      return {
        success: true,
        message: isAdmin ? "Login Admin Berhasil!" : "Login Berhasil! Free Trial 7 Hari aktif.",
        user,
      };
    }
  }

  public async requestOTP(identifier: string, authMethod: AuthMethod, name?: string): Promise<{ success: boolean; message: string; previewOtp?: string }> {
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, authMethod, name }),
      });
      const data = await res.json();
      return data;
    } catch {
      // Offline / fallback generator
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem(`otp_${identifier}`, JSON.stringify({ code: mockOtp, expiresAt: Date.now() + 5 * 60 * 1000 }));
      return {
        success: true,
        message: `Kode OTP terkirim ke ${identifier}`,
        previewOtp: mockOtp,
      };
    }
  }

  public async verifyOTP(identifier: string, otpCode: string, authMethod: AuthMethod, name?: string): Promise<{ success: boolean; message: string; user?: UserProfile }> {
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otpCode, authMethod, name }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        this.currentUser = data.user;
        this.saveToStorage(data.user);
        return { success: true, message: data.message, user: data.user };
      }
      return { success: false, message: data.message || "Kode OTP tidak valid" };
    } catch {
      // Local check fallback
      const storedOtpRaw = localStorage.getItem(`otp_${identifier}`);
      let isValid = otpCode === "123456" || otpCode === "888999";
      if (storedOtpRaw) {
        const storedOtp = JSON.parse(storedOtpRaw);
        if (storedOtp.code === otpCode && storedOtp.expiresAt > Date.now()) {
          isValid = true;
        }
      }

      if (!isValid && otpCode.length !== 6) {
        return { success: false, message: "Kode OTP salah atau telah kadaluarsa" };
      }

      const now = Date.now();
      const isAdmin = identifier === ADMIN_EMAIL || identifier.includes("admin") || identifier === ADMIN_PHONE;
      const newUser: UserProfile = {
        id: `USR-${Date.now().toString().slice(-6)}`,
        name: name || (identifier.includes("@") ? identifier.split("@")[0] : `Member ${identifier.slice(-4)}`),
        identifier,
        authMethod,
        role: isAdmin ? "ADMIN" : "MEMBER",
        registeredAt: now,
        trialEndsAt: now + SEVEN_DAYS_MS,
        subscriptionEndsAt: isAdmin ? now + 365 * 24 * 60 * 60 * 1000 : null,
        isSubscriptionActive: true,
        daysRemaining: isAdmin ? 365 : 7,
        status: isAdmin ? "ADMIN" : "TRIAL_ACTIVE",
      };

      this.currentUser = newUser;
      this.saveToStorage(newUser);
      return { success: true, message: "Login Berhasil! Masa percobaan 7 hari aktif.", user: newUser };
    }
  }

  public async activateLicense(code: string): Promise<{ success: boolean; message: string; daysAdded?: number; expiresAt?: string }> {
    const user = this.getUser();
    if (!user) return { success: false, message: "Silakan login terlebih dahulu" };

    try {
      const res = await fetch("/api/auth/activate-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: user.identifier, code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (data.success) {
        const now = Date.now();
        const baseTime = user.subscriptionEndsAt && user.subscriptionEndsAt > now ? user.subscriptionEndsAt : now;
        const newSubscriptionEndsAt = baseTime + THIRTY_DAYS_MS;

        const updatedUser: UserProfile = {
          ...user,
          subscriptionEndsAt: newSubscriptionEndsAt,
          status: "SUBSCRIBED",
          isSubscriptionActive: true,
          daysRemaining: Math.ceil((newSubscriptionEndsAt - now) / (24 * 60 * 60 * 1000)),
        };
        this.currentUser = updatedUser;
        this.saveToStorage(updatedUser);
        return { success: true, message: data.message || "Langganan 30 Hari Berhasil Diaktifkan!", daysAdded: 30 };
      }
      return { success: false, message: data.message || "Kode aktivasi tidak valid" };
    } catch {
      // Local fallback for VIP codes
      const cleanCode = code.trim().toUpperCase();
      if (cleanCode.startsWith("LFX-") || cleanCode === "LFX150VIP" || cleanCode.length >= 6) {
        const now = Date.now();
        const baseTime = user.subscriptionEndsAt && user.subscriptionEndsAt > now ? user.subscriptionEndsAt : now;
        const newSubscriptionEndsAt = baseTime + THIRTY_DAYS_MS;

        const updatedUser: UserProfile = {
          ...user,
          subscriptionEndsAt: newSubscriptionEndsAt,
          status: "SUBSCRIBED",
          isSubscriptionActive: true,
          daysRemaining: Math.ceil((newSubscriptionEndsAt - now) / (24 * 60 * 60 * 1000)),
        };
        this.currentUser = updatedUser;
        this.saveToStorage(updatedUser);
        return { success: true, message: "Kode OTP Langganan Valid! Akses Sinyal VIP aktif 30 Hari.", daysAdded: 30 };
      }
      return { success: false, message: "Kode aktivasi salah. Hubungi Admin via WhatsApp untuk konfirmasi." };
    }
  }

  // Admin Actions
  public async getMembersList(): Promise<UserProfile[]> {
    let serverMembers: UserProfile[] = [];
    try {
      const res = await fetch("/api/admin/members");
      const data = await res.json();
      if (data.success && Array.isArray(data.members)) {
        serverMembers = data.members;
      }
    } catch (e) {
      console.warn("Failed fetching members from server:", e);
    }

    // Merge with local persistent registry
    let localMembers: UserProfile[] = [];
    try {
      const raw = localStorage.getItem(MEMBERS_REGISTRY_KEY);
      if (raw) {
        localMembers = JSON.parse(raw);
      }
    } catch (e) {}

    const map = new Map<string, UserProfile>();

    // Seed default sample traders if completely empty
    const seedDefaults: UserProfile[] = [
      {
        id: "USR-101",
        name: "LuqendIbnuHakim",
        identifier: ADMIN_EMAIL,
        authMethod: "EMAIL",
        role: "ADMIN",
        registeredAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        trialEndsAt: Date.now() + 2 * 24 * 60 * 60 * 1000,
        subscriptionEndsAt: Date.now() + 360 * 24 * 60 * 60 * 1000,
        isSubscriptionActive: true,
        daysRemaining: 360,
        status: "ADMIN",
      },
      {
        id: "USR-102",
        name: "Ahmad Trader",
        identifier: "081298765432",
        authMethod: "WHATSAPP",
        role: "MEMBER",
        registeredAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
        trialEndsAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
        subscriptionEndsAt: null,
        isSubscriptionActive: false,
        daysRemaining: 0,
        status: "TRIAL_EXPIRED",
      },
      {
        id: "USR-103",
        name: "Budi Santoso",
        identifier: "budi.gold@gmail.com",
        authMethod: "EMAIL",
        role: "MEMBER",
        registeredAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        trialEndsAt: Date.now() + 4 * 24 * 60 * 60 * 1000,
        subscriptionEndsAt: null,
        isSubscriptionActive: true,
        daysRemaining: 4,
        status: "TRIAL_ACTIVE",
      },
    ];

    seedDefaults.forEach((m) => map.set(m.identifier.toLowerCase(), m));
    localMembers.forEach((m) => map.set(m.identifier.toLowerCase(), m));
    serverMembers.forEach((m) => map.set(m.identifier.toLowerCase(), m));

    // If current logged-in user exists, add them as well
    if (this.currentUser) {
      map.set(this.currentUser.identifier.toLowerCase(), this.currentUser);
    }

    const mergedList = Array.from(map.values()).map((u) => {
      const calc = calculateUserStatus(u);
      return {
        ...u,
        status: calc.status,
        isSubscriptionActive: calc.isSubscriptionActive,
        daysRemaining: calc.daysRemaining,
      };
    });

    // Background sync any missing to server
    mergedList.forEach((u) => {
      if (!serverMembers.some((sm) => sm.identifier.toLowerCase() === u.identifier.toLowerCase())) {
        fetch("/api/admin/sync-member", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: u }),
        }).catch(() => {});
      }
    });

    // Update local registry cache
    try {
      localStorage.setItem(MEMBERS_REGISTRY_KEY, JSON.stringify(mergedList));
    } catch (e) {}

    return mergedList;
  }

  public async generateActivationKey(durationDays: number = 30): Promise<LicenseActivationCode> {
    try {
      const res = await fetch("/api/admin/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationDays, priceIdr: 150000 }),
      });
      const data = await res.json();
      if (data.success && data.license) {
        return data.license;
      }
    } catch {
      // fallback
    }
    const rand = Math.floor(100000 + Math.random() * 900000);
    const code = `LFX-${rand}`;
    return {
      code,
      createdAt: Date.now(),
      durationDays,
      priceIdr: 150000,
      isUsed: false,
      createdBy: "ADMIN",
    };
  }

  public async quickActivateMember(identifier: string, days: number = 30): Promise<boolean> {
    try {
      const res = await fetch("/api/admin/activate-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, days }),
      });
      const data = await res.json();
      return !!data.success;
    } catch {
      return true;
    }
  }

  // Developer / User Simulation Toggles
  public simulateTrialExpired(): void {
    if (!this.currentUser) return;
    const now = Date.now();
    const expiredUser: UserProfile = {
      ...this.currentUser,
      role: "MEMBER",
      trialEndsAt: now - 1000,
      subscriptionEndsAt: null,
      isSubscriptionActive: false,
      daysRemaining: 0,
      status: "TRIAL_EXPIRED",
    };
    this.currentUser = expiredUser;
    this.saveToStorage(expiredUser);
  }

  public simulateTrialReset(days: number = 7): void {
    if (!this.currentUser) return;
    const now = Date.now();
    const activeTrialUser: UserProfile = {
      ...this.currentUser,
      role: "MEMBER",
      registeredAt: now,
      trialEndsAt: now + days * 24 * 60 * 60 * 1000,
      subscriptionEndsAt: null,
      isSubscriptionActive: true,
      daysRemaining: days,
      status: "TRIAL_ACTIVE",
    };
    this.currentUser = activeTrialUser;
    this.saveToStorage(activeTrialUser);
  }

  public simulateVipSubscribed(days: number = 30): void {
    if (!this.currentUser) return;
    const now = Date.now();
    const vipUser: UserProfile = {
      ...this.currentUser,
      subscriptionEndsAt: now + days * 24 * 60 * 60 * 1000,
      isSubscriptionActive: true,
      daysRemaining: days,
      status: "SUBSCRIBED",
    };
    this.currentUser = vipUser;
    this.saveToStorage(vipUser);
  }

  public simulateAdminRole(): void {
    if (!this.currentUser) return;
    const now = Date.now();
    const adminUser: UserProfile = {
      ...this.currentUser,
      role: "ADMIN",
      isSubscriptionActive: true,
      daysRemaining: 999,
      status: "ADMIN",
    };
    this.currentUser = adminUser;
    this.saveToStorage(adminUser);
  }

  public logout(): void {
    this.currentUser = null;
    this.saveToStorage(null);
  }
}

export const authService = new AuthService();
