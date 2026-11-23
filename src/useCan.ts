import { createContext, useContext } from 'react'
import type { Action } from './access.ts'

// CON-94: the viewer's permissions for components deep in the page tree (bulk create, QE Mapping, Monthly pack text,
// the shared Feature setup, table export). Provided by the app from useAccess; without a provider nothing is allowed,
// as without an access policy (CON-101, fail closed).
export const CanContext = createContext<(action: Action) => boolean>(() => false)
export const useCan = () => useContext(CanContext)
