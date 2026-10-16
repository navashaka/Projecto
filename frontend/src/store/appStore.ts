import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ModuleKey =
  | 'dashboard'
  | 'accounting'
  | 'hr'
  | 'employees'
  | 'payroll'
  | 'recruitment'
  | 'reports'

export type UserSession = {
  email: string
  name?: string
  role?: string
  accessToken?: string
  mustChangePassword?: boolean
}

type AppState = {
  isAuthenticated: boolean
  session: UserSession | null
  userSession: UserSession | null
  adminSession: UserSession | null

  activeModule: ModuleKey
  showRegisterForm: boolean
  leftSidebarCollapsed: boolean
  rightSidebarCollapsed: boolean
  headerCollapsed: boolean
  footerCollapsed: boolean

  login: (user: UserSession) => void
  logout: () => void
  adminLogout: () => void

  setActiveModule: (module: ModuleKey) => void
  toggleRegisterForm: (value?: boolean) => void
  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
  toggleHeader: () => void
  toggleFooter: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      session: null,
      userSession: null,
      adminSession: null,

      activeModule: 'dashboard',
      showRegisterForm: true,
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: false,
      headerCollapsed: false,
      footerCollapsed: false,

      login: (user) =>
        set(() => {
          if (user.role === 'admin') {
            return {
              isAuthenticated: true,
              session: user,
              adminSession: user,
              showRegisterForm: false,
            }
          }

          return {
            isAuthenticated: true,
            session: user,
            userSession: user,
            showRegisterForm: false,
          }
        }),

      // Normal user logout only.
      logout: () =>
        set({
          isAuthenticated: false,
          session: null,
          userSession: null,
          showRegisterForm: false,
          activeModule: 'dashboard',
        }),

      // Admin logout only; preserve the normal user session.
      adminLogout: () =>
        set((state) => ({
          isAuthenticated: Boolean(state.userSession),
          session: state.userSession,
          adminSession: null,
          showRegisterForm: false,
          activeModule: 'dashboard',
        })),

      setActiveModule: (module) =>
        set({ activeModule: module }),

      toggleRegisterForm: (value) =>
        set((state) => ({
          showRegisterForm: value ?? !state.showRegisterForm,
        })),

      toggleLeftSidebar: () =>
        set((state) => ({
          leftSidebarCollapsed: !state.leftSidebarCollapsed,
        })),

      toggleRightSidebar: () =>
        set((state) => ({
          rightSidebarCollapsed: !state.rightSidebarCollapsed,
        })),

      toggleHeader: () =>
        set((state) => ({
          headerCollapsed: !state.headerCollapsed,
        })),

      toggleFooter: () =>
        set((state) => ({
          footerCollapsed: !state.footerCollapsed,
        })),
    }),
    {
      name: 'projecto-app-store',
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<AppState>),
        showRegisterForm: currentState.showRegisterForm,
      }),
    },
  ),
)