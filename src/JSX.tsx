import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { Writable } from 'stream'
import { renderToPipeableStream } from 'react-dom/server'
import Context from './Context'

export default class JSX {
  #shared: Record<string, any> = {}
  #context: HttpContextContract | null = null

  public context({ context }: { context: HttpContextContract }) {
    this.#context = context

    return this
  }

  public share(key: string, fn: (context: HttpContextContract | null) => Promise<any>) {
    this.#shared[key] = fn
  }

  public async render<T extends Record<string, any>>(
    component: (props: T) => JSX.Element,
    props?: T
  ) {
    const ctx = this.#context

    if (!ctx) throw new Error('HTTP context is not provided')

    const response = new Promise(async (resolve, reject) => {
      const Component = component
      const sharedValuesPrepared = {}
      let streamHasErrored = false

      for (const key in this.#shared) {
        sharedValuesPrepared[key] = await this.#shared[key](ctx)
      }

      if (props === undefined) {
        props = {} as T
      }

      const { pipe } = renderToPipeableStream(
        <Context.Provider value={{ ctx, shared: sharedValuesPrepared, props }}>
          <Component {...props} />
        </Context.Provider>,
        {
          onAllReady() {
            let content = ''
            const writable = new Writable({
              write: function (chunk, _, next) {
                content += chunk.toString()
                next()
              },
            })

            ctx.response.status(streamHasErrored ? 500 : 200)
            ctx.response.header('content-type', 'text/html')

            pipe(writable)

            writable.on('finish', () => {
              resolve(content)
            })
          },
          onError(error) {
            streamHasErrored = true
            reject(error)
          },
        }
      )
    })

    return response
  }
}
