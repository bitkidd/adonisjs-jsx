import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { renderToPipeableStream } from 'react-dom/server'
import { Writable } from 'stream'
import isBot from 'isbot'

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
    const ctx = this.#context
    const shouldRenderFull =
      !ctx?.response || (ctx?.response && ctx?.request && isBot(ctx?.request.header('user-agent')))
    const shouldRenderStreaming =
      ctx?.response && ctx?.request && !isBot(ctx?.request.header('user-agent'))

    const response = new Promise(async (resolve, reject) => {
      const Component = component
      const sharedValuesPrepared = await this.processShared()
      let streamHasErrors = false

      if (props === undefined) {
        props = {} as T
      }

      const { pipe } = renderToPipeableStream(
        <Context.Provider value={{ ctx, shared: sharedValuesPrepared, props }}>
          <Component {...props} />
        </Context.Provider>,
        {
          onAllReady() {
            if (shouldRenderFull) {
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
            }
          },
          onShellReady() {
            if (shouldRenderStreaming) {
              ctx.response.header('content-type', 'text/html')
              ctx.response.status(streamHasErrors ? 500 : 200)

              pipe(ctx.response.response)

              resolve(ctx.response)
            }
          },
          onError(error) {
            streamHasErrors = true
            reject(error)
          },
        }
      )
    })

    return response
  }
}
