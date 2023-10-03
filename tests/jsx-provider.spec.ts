import { test } from '@japa/runner'

import { setup, fs } from '../tests-helpers'
import JSXInstance from '../src/JSX'
import ComponentSimple from '../tests-helpers/ComponentSimple'

test.group('JSX Provider', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  test('register jsx provider', async ({ assert }) => {
    const app = await setup()

    const { JSX } = app.container.use('Adonis/Addons/JSX')

    assert.instanceOf(JSX, JSXInstance)
  })

  test('render simple jsx component', async ({ assert }) => {
    const app = await setup()
    process.env.NODE_ENV = 'development'

    const { JSX } = app.container.use('Adonis/Addons/JSX')

    const output = await JSX.render(ComponentSimple)

    assert.equal(output, `<div>Hello World</div>`)
    delete process.env.NODE_ENV
  })

  test('render simple jsx component with props', async ({ assert }) => {
    const app = await setup()
    process.env.NODE_ENV = 'development'

    const { JSX } = app.container.use('Adonis/Addons/JSX')

    const output = await JSX.render(ComponentSimple, { message: 'Hello World From Props' })

    assert.equal(output, `<div>Hello World From Props</div>`)
    delete process.env.NODE_ENV
  })
})
