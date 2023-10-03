import { useData } from '../src/Hooks'

const ComponentWithContextProps = () => {
  const { message = 'Hello World' } = useData<{ message: string }>()

  return <div>{message}</div>
}

export default ComponentWithContextProps
