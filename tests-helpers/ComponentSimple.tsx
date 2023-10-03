const ComponentSimple = (props?: { message?: string }) => {
  return <div>{props?.message || 'Hello World'}</div>
}

export default ComponentSimple
