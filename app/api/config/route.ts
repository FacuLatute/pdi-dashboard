import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('proyectos')
    .select('nombre, materia, cierre, ultima_actualizacion')
    .eq('user_id', user.id)
    .single()

  if (!error) return Response.json(data)

  if (error.code !== 'PGRST116') {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // No project row yet — create a default one
  const d = new Date()
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const { data: created, error: createError } = await supabase
    .from('proyectos')
    .insert({
      user_id: user.id,
      nombre: 'AgroEnergía SRL',
      materia: 'PDI 1',
      cierre: '31/07/2026',
      ultima_actualizacion: today,
    })
    .select('nombre, materia, cierre, ultima_actualizacion')
    .single()

  if (createError) return Response.json({ error: createError.message }, { status: 500 })

  return Response.json(created)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { nombre, materia, cierre } = body as {
    nombre?: string
    materia?: string
    cierre?: string
  }

  const d = new Date()
  const ultima_actualizacion = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('proyectos')
    .update({
      ...(nombre !== undefined && { nombre }),
      ...(materia !== undefined && { materia }),
      ...(cierre !== undefined && { cierre }),
      ultima_actualizacion,
    })
    .eq('user_id', user.id)
    .select('nombre, materia, cierre, ultima_actualizacion')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json(data)
}
