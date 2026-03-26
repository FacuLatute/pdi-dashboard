import fs from 'fs'
import path from 'path'

const DATA_PATH = path.join(process.cwd(), 'pdi-data.json')

export interface Premisa {
  id: number
  titulo: string
  estado: string
  pagina: number | null
  notas: string
  archivos_vinculados: number[]
}

export interface Archivo {
  id: number
  nombre: string
  tipo: string
  version: string
  estado: string
  seccion: string
  notas: string
  ruta: string
}

export interface PdiData {
  proyecto: {
    nombre: string
    materia: string
    cierre: string
    ultima_actualizacion: string
  }
  premisas: Premisa[]
  archivos: Archivo[]
}

export function readData(): PdiData {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8')
  return JSON.parse(raw) as PdiData
}

export function writeData(data: PdiData): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8')
}
