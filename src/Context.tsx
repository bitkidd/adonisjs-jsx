import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { createContext } from 'react'

const GlobalContext = createContext<{
  ctx: HttpContextContract | null
  props: any | null
  shared: Record<string, any>
}>({ ctx: null, props: null, shared: {} })

export default GlobalContext
