import { useSharedData } from '../src/Hooks'

const ComponentWithSharedData = () => {
  const { message = 'Hello World' } = useSharedData<{ message: string }>()

  return <div>{message}</div>
}

export default ComponentWithSharedData
