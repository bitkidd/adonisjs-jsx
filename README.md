# AdonisJS JSX
> adonis, adonisjs, jsx

[![npm-image]][npm-url] [![license-image]][license-url] [![typescript-image]][typescript-url]

A AdonisJS v5.x provider for JSX renderer. Use JSX as a templating language on server.

## Installation

To install the provider run:
```bash
npm install @bitkidd/adonisjs-jsx
# or
yarn add @bitkidd/adonisjs-jsx
```

## Configure

To configure JSX provider run the command below:

```
node ace configure @bitkidd/adonisjs-jsx
```

Then modify your `tsconfig.json` file and add two new lines to `compilerOptions` section:

```json
...
"compilerOptions": {
  "lib": ["DOM", "DOM.Iterable", "ESNext"], //ESNext part is up to you
  "jsx": "react-jsx",
}
...
```

## Usage

#### Basic usage

JSX renderer is exposed in `HttpContextContract` and can be used as follows:

```ts
...
public async index({ jsx }: HttpContextContract) {
  return jsx.render(HelloWorld)
}
...
```

Or you can access JSX rendered directly and render your component anywhere in the app:

```ts
import { JSX } from '@ioc:Adonis/Addons/JSX'

JSX.render(HelloWorld)
```

#### Context

A `Context` provider is used to pass `HttpContext`, props and shared data. The hook that is the most important and can be used to access `HttpContextContract` data is `useHttpContext`. Using it you can get anything from the context: authenticated used, csrf token, flash messages, i18n and so on. You'll only have to create a custom hook.

```tsx
import { useHttpContext } from '@ioc:Adonis/Addons/JSX'

const HelloWorld = () => {
  const ctx = useHttpContext()

  return ctx?.request.csrfToken ?? ''
}
```

#### Hooks

There are some hooks exposed:
- `useData` that can access data passed to the component when rendering it
- `useSharedData` that can access data passed to the component using `JSX.share` method
- `useHttpContext` that can access `HttpContextContract`

The `useHttpContext` can be used to create custom hooks based on some `HttpContext` data:

```tsx
import { Context } from '@ioc:Adonis/Addons/JSX'

export const useCsrfToken = () => {
  const ctx = useHttpContext()

  return ctx?.request.csrfToken ?? ''
}
```

#### Props in components

You can pass and access data passed into components when rendering them.

In your controller:
```ts
...
public async index({ jsx }: HttpContextContract) {
  return jsx.render(HelloWorld, { hello: 'world' })
}
...
```

In your component:

```tsx
const HelloWorld = () => {
  const { hello } = useData<{ hello: 'world' }>()
}
```

#### Shared data

Sometimes you need to share some data between all the components and not pass it every time. 

In this case you have to create a `jsx.ts` file in a `/start` folder and then add this `jsx.ts` file into `.adonisrc.json` in a `preloads` section.

Then you can expose some data inside this file:

```ts
import { JSX } from '@ioc:Adonis/Addons/JSX'

JSX.share('hello', async () => {
  return 'world'
})
```

And then access it in your components:

```tsx
const HelloWorld = () => {
  const { hello } = useSharedData<{ hello: 'world' }>()
}
```

[npm-image]: https://img.shields.io/npm/v/@bitkidd/adonisjs-jsx.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/@bitkidd/adonisjs-jsx "npm"

[license-image]: https://img.shields.io/npm/l/@bitkidd/adonisjs-jsx?color=blueviolet&style=for-the-badge
[license-url]: LICENSE.md "license"

[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]:  "typescript"
