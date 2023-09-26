declare module '@ioc:Adonis/Addons/JSX' {
  import type { Context as ContextType } from 'react'
  import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

  export interface JsxRendererContract {
    context: ({ context }: { context: HttpContextContract }) => void
    share: (key: string, data: any) => void
    render: <T extends Record<string, any>>(component: (props: T) => JSX.Element, props?: T) => void
  }

  export const JSX: JsxRendererContract
  export const Context: ContextType<{
    ctx: HttpContextContract | null
    props: any | null
    shared: Record<string, any>
  }>

  export const useData: <T>() => T
  export const useSharedData: <T>() => T
  export const useHttpContext: () => HttpContextContract | null
}

declare module '@ioc:Adonis/Core/HttpContext' {
  import { JsxRendererContract } from '@ioc:Adonis/Addons/JSX'
  interface HttpContextContract {
    jsx: JsxRendererContract
  }
}
