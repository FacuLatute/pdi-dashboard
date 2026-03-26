import { readData, writeData } from '@/lib/data'

export async function GET() {
  const data = readData()
  return Response.json(data.archivos)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { nombre, tipo, version, estado, seccion, notas } = body as {
    nombre: string
    tipo: string
    version: string
    estado: string
    seccion: string
    notas?: string
  }

  if (!nombre || !tipo || !version || !estado || !seccion) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const data = readData()
  const nextId = data.archivos.length > 0 ? Math.max(...data.archivos.map((a) => a.id)) + 1 : 1

  const newArchivo = { id: nextId, nombre, tipo, version, estado, seccion, notas: notas ?? '', ruta: '', historial: [] }
  data.archivos.push(newArchivo)
  writeData(data)

  return Response.json(newArchivo, { status: 201 })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, ...fields } = body as {
    id: number
    nombre?: string
    tipo?: string
    version?: string
    estado?: string
    seccion?: string
    notas?: string
    ruta?: string
    historial?: { version: string; filename: string; fecha: string; ruta: string }[]
  }

  if (!id) {
    return Response.json({ error: 'Missing id' }, { status: 400 })
  }

  const data = readData()
  const index = data.archivos.findIndex((a) => a.id === id)

  if (index === -1) {
    return Response.json({ error: 'Archivo not found' }, { status: 404 })
  }

  data.archivos[index] = { ...data.archivos[index], ...fields }
  writeData(data)

  return Response.json(data.archivos[index])
}
