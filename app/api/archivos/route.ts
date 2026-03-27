import { createClient } from '@/lib/supabase/server'

async function getOrCreateProyectoId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | undefined> {
  const { data, error: selectError } = await supabase
    .from('proyectos')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (data?.id) return data.id as string

  // PGRST116 = no rows found — that's expected on first visit, not a real error
  if (selectError && selectError.code !== 'PGRST116') {
    console.log('[archivos] getOrCreateProyectoId select error:', selectError)
  }

  const d = new Date()
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const { data: created, error: insertError } = await supabase
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

  if (insertError) {
    console.log('[archivos] getOrCreateProyectoId insert error:', insertError)
  }

  return created?.id as string | undefined
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const proyectoId = await getOrCreateProyectoId(supabase, user.id)
  if (!proyectoId) return Response.json([])

  const { data, error } = await supabase
    .from('archivos')
    .select('*')
    .eq('proyecto_id', proyectoId)
    .order('created_at', { ascending: true })

  if (error) {
    console.log('[archivos] GET query error:', error)
    return Response.json([])
  }

  return Response.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

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

  const proyectoId = await getOrCreateProyectoId(supabase, user.id)
  if (!proyectoId) return Response.json({ error: 'No project found' }, { status: 404 })

  const { data, error } = await supabase
    .from('archivos')
    .insert({
      proyecto_id: proyectoId,
      nombre,
      tipo,
      version,
      estado,
      seccion,
      notas: notas ?? '',
      ruta: '',
      historial: [],
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, ...fields } = body as {
    id: string
    nombre?: string
    tipo?: string
    version?: string
    estado?: string
    seccion?: string
    notas?: string
    ruta?: string
    historial?: { version: string; filename: string; fecha: string; ruta: string }[]
  }

  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 })

  const { data, error } = await supabase
    .from('archivos')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id } = body as { id: string }

  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase
    .from('archivos')
    .delete()
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
