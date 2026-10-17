import { DevApiStatus } from '@/components/dev/DevApiStatus'
import { DeviceFrame } from '@/components/layout/DeviceFrame'
import { HomePage } from '@/pages/HomePage'

function App() {
  return (
    <DeviceFrame>
      <HomePage />
      {import.meta.env.DEV ? <DevApiStatus /> : null}
    </DeviceFrame>
  )
}

export default App
