import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { renderToString } from 'react-dom/server'
import Context from './Context'

export default class JSX {
  #shared: Record<string, any> = {}
  #context: HttpContextContract | null = null

  public context({ context }: { context: HttpContextContract }) {
    this.#context = context

    return this
  }

  public share(key: string, data: any) {
    this.#shared[key] = data
  }

  public async render<T extends Record<string, any>>(
    component: (props: T) => JSX.Element,
    props?: T
  ) {
    const Component = component
    const sharedValuesPrepared = {}

    for (const key in this.#shared) {
      sharedValuesPrepared[key] = await this.#shared[key]()
    }

    if (props === undefined) {
      props = {} as T
    }

    return renderToString(
      <Context.Provider value={{ ctx: this.#context, shared: sharedValuesPrepared, props }}>
        <Component {...props} />
      </Context.Provider>
    )
  }
}
