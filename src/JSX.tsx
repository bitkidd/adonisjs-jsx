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

  private async processShared() {
    const sharedValuesPrepared = {}

    for (const key in this.#shared) {
      const sharedValue = this.#shared[key]

      if (typeof sharedValue === 'function') {
        sharedValuesPrepared[key] = await sharedValue()
      } else {
        sharedValuesPrepared[key] = sharedValue
      }
    }

    return sharedValuesPrepared
  }

  public async render<T extends Record<string, any>>(
    component: (props: T) => JSX.Element,
    props?: T
  ) {
    const response = new Promise(async (resolve, reject) => {
      const Component = component
      const sharedValuesPrepared = await this.processShared()

      if (props === undefined) {
        props = {} as T
      }

      const { pipe } = renderToPipeableStream(
        <Context.Provider value={{ ctx: this.#context, shared: sharedValuesPrepared, props }}>
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

            pipe(writable)

            writable.on('finish', () => {
              resolve(content)
            })
          },
          onError(error) {
            reject(error)
          },
        }
      )
    })

    return response
  }
}
