import { readData, writeData } from '@/lib/data'

export async function GET() {
  const data = readData()
  return Response.json(data.proyecto)
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { nombre, materia, cierre } = body as { nombre?: string; materia?: string; cierre?: string }

  const data = readData()

  const d = new Date()
  const ultima_actualizacion = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  data.proyecto = {
    ...data.proyecto,
    ...(nombre !== undefined && { nombre }),
    ...(materia !== undefined && { materia }),
    ...(cierre !== undefined && { cierre }),
    ultima_actualizacion,
  }

  writeData(data)
  return Response.json(data.proyecto)
}
