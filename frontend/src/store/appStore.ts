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
}

type AppState = {
  isAuthenticated: boolean
  session: UserSession | null
  activeModule: ModuleKey
  showRegisterForm: boolean
  leftSidebarCollapsed: boolean
  rightSidebarCollapsed: boolean
  headerCollapsed: boolean
  footerCollapsed: boolean
  login: (user: UserSession) => void
  logout: () => void
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
      activeModule: 'dashboard',
      showRegisterForm: false,
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: false,
      headerCollapsed: false,
      footerCollapsed: false,

      login: (user) =>
        set({
          isAuthenticated: true,
          session: user,
          showRegisterForm: false
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          session: null,
          showRegisterForm: false,
          activeModule: 'dashboard'
        }),

      setActiveModule: (module) => set({ activeModule: module }),

      toggleRegisterForm: (value) =>
        set((state) => ({
          showRegisterForm: value ?? !state.showRegisterForm
        })),

      toggleLeftSidebar: () =>
        set((state) => ({
          leftSidebarCollapsed: !state.leftSidebarCollapsed
        })),

      toggleRightSidebar: () =>
        set((state) => ({
          rightSidebarCollapsed: !state.rightSidebarCollapsed
        })),

      toggleHeader: () =>
        set((state) => ({
          headerCollapsed: !state.headerCollapsed
        })),

      toggleFooter: () =>
        set((state) => ({
          footerCollapsed: !state.footerCollapsed
        }))
    }),
    {
      name: 'projecto-app-store'
    }
  )
)
