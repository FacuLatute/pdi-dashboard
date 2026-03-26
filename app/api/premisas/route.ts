import { readData, writeData } from '@/lib/data'

export async function GET() {
  const data = readData()
  return Response.json(data.premisas)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { titulo, estado } = body as { titulo: string; estado: string }

  if (!titulo || !estado) {
    return Response.json({ error: 'Missing fields' }, { status: 400 })
  }

  const data = readData()
  const maxId = data.premisas.reduce((max, p) => Math.max(max, p.id), 15)
  const newPremisa = {
    id: maxId + 1,
    titulo,
    estado,
    pagina: null,
    notas: '',
  }

  data.premisas.push(newPremisa)
  writeData(data)

  return Response.json(newPremisa, { status: 201 })
}

export async function DELETE(request: Request) {
  const body = await request.json()
  const { id } = body as { id: number }

  if (!id) {
    return Response.json({ error: 'Missing id' }, { status: 400 })
  }

  const data = readData()
  const index = data.premisas.findIndex((p) => p.id === id)

  if (index === -1) {
    return Response.json({ error: 'Premisa not found' }, { status: 404 })
  }

  data.premisas.splice(index, 1)
  writeData(data)

  return Response.json({ ok: true })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, ...fields } = body as { id: number; titulo?: string; estado?: string; pagina?: number | null; notas?: string; archivos_vinculados?: number[] }

  if (!id) {
    return Response.json({ error: 'Missing id' }, { status: 400 })
  }

  const data = readData()
  const index = data.premisas.findIndex((p) => p.id === id)

  if (index === -1) {
    return Response.json({ error: 'Premisa not found' }, { status: 404 })
  }

  data.premisas[index] = { ...data.premisas[index], ...fields }
  writeData(data)

  return Response.json(data.premisas[index])
}
