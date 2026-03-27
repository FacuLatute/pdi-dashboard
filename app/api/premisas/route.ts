import { createClient } from '@/lib/supabase/server'

async function getOrCreateProyectoId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | undefined> {
  const { data } = await supabase
    .from('proyectos')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (data?.id) return data.id as string

  const d = new Date()
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const { data: created } = await supabase
    .from('proyectos')
    .insert({
      user_id: userId,
      nombre: 'AgroEnergía SRL',
      materia: 'PDI 1',
      cierre: '31/07/2026',
      ultima_actualizacion: today,
    })
    .select('id')
    .single()

  return created?.id as string | undefined
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const proyectoId = await getOrCreateProyectoId(supabase, user.id)
  if (!proyectoId) return Response.json([])

  const { data, error } = await supabase
    .from('premisas')
    .select('*')
    .eq('proyecto_id', proyectoId)
    .order('created_at', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { titulo, estado } = body as { titulo: string; estado: string }

  if (!titulo || !estado) return Response.json({ error: 'Missing fields' }, { status: 400 })

  const proyectoId = await getOrCreateProyectoId(supabase, user.id)
  if (!proyectoId) return Response.json({ error: 'No project found' }, { status: 404 })

  const { data, error } = await supabase
    .from('premisas')
    .insert({
      proyecto_id: proyectoId,
      titulo,
      estado,
      pagina: null,
      notas: '',
      archivos_vinculados: [],
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json(data, { status: 201 })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id } = body as { id: string }

  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase
    .from('premisas')
    .delete()
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, ...fields } = body as {
    id: string
    titulo?: string
    estado?: string
    pagina?: number | null
    notas?: string
    archivos_vinculados?: string[]
  }

  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 })

  if (fields.archivos_vinculados !== undefined) {
    // Postgres expects an integer array; client sends UUIDs as strings — cast to number
    ;(fields as Record<string, unknown>).archivos_vinculados = fields.archivos_vinculados.map(Number)
  }

  const { data, error } = await supabase
    .from('premisas')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json(data)
}
