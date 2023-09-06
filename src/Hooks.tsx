import { useContext } from 'react'

import Context from './Context'

export function useHttpContext() {
  const { ctx } = useContext(Context)

  return ctx
}

export function useSharedData<T>() {
  const { shared } = useContext(Context)

  return shared as T
}

export function useData<T>() {
  const { props } = useContext(Context)

  return props as T
}
