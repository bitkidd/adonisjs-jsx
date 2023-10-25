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

  private async renderAsHtml<T extends Record<string, any>>(
    component: (props: T) => JSX.Element,
    props?: T
  ) {
    return new Promise(async (resolve, reject) => {
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
  }

  private async renderAsResponse<T extends Record<string, any>>(
    component: (props: T) => JSX.Element,
    props?: T
  ) {
    const ctx = this.#context!

    ctx.response['writeJSX'] = async () => {
      const shouldRenderFull =
        !ctx?.response ||
        (ctx?.response && ctx?.request && isBot(ctx?.request.header('user-agent')))
      const shouldRenderStreaming =
        ctx?.response && ctx?.request && !isBot(ctx?.request.header('user-agent'))

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
                ctx.response.flushHeaders()
                ctx.response.response.end(content)
              })
            }
          },
          onShellReady() {
            if (shouldRenderStreaming) {
              ctx.response.header('content-type', 'text/html')
              ctx.response.status(streamHasErrors ? 500 : 200)
              ctx.response.flushHeaders()
              pipe(ctx.response.response)
            }
          },
          onError(error) {
            streamHasErrors = true
            ctx.response.flushHeaders()
            ctx.response.response.end(error)
          },
        }
      )
    }

    ctx!.response['writerMethod'] = 'writeJSX'
    ctx!.response.hasLazyBody = true
    ctx!.response.lazyBody = [component, props]
    return ctx!.response
  }

  public async render<T extends Record<string, any>>(
    component: (props: T) => JSX.Element,
    props?: T
  ) {
    const ctx = this.#context

    if (!ctx) {
      return this.renderAsHtml(component, props)
    } else {
      return this.renderAsResponse(component, props)
    }
  }
}
