import type { ApplicationContract } from '@ioc:Adonis/Core/Application'

import JSXRenderer from '../src/JSX'
import Context from '../src/Context'
import * as Hooks from '../src/Hooks'

export default class JsxProvider {
  constructor(protected app: ApplicationContract) {}

  /**
   * Register view binding
   */
  public register() {
    this.app.container.singleton('Adonis/Addons/JSX', () => {
      const JSX = new JSXRenderer()

      return { JSX, Context, ...Hooks }
    })
  }

  /**
   * Setup view on boot
   */
  public boot() {
    const { JSX } = this.app.container.resolveBinding('Adonis/Addons/JSX')
    const HttpContext = this.app.container.resolveBinding('Adonis/Core/HttpContext')

    HttpContext.getter(
      'jsx',
      function () {
        return JSX.context({ context: this })
      },
      true
    )
  }
}
