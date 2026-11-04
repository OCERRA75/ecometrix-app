// src/lib/clasificadorGastos.js — clasificación por palabras completas y en orden de especificidad
import { norm } from './factoresEmision.js'

const REGLAS = [
  ['refrigerantes',        /\b(refrigerante|refrigerantes|hfc|freon|r-?22|r-?410a?|r-?134a?)\b/],
  ['combustible_gasolina', /\b(gasolina|biomax|terpel|primax)\b/],
  ['combustible_diesel',   /\b(diesel|acpm|gasoil|combustible|combustibles)\b/],
  ['gas_natural',          /\b(gas natural|gas domiciliario|vanti|surtigas|gases del caribe|gas)\b/],
  ['electricidad',         /\b(electricidad|energia|energia electrica|luz|kwh|enel|codensa|epsa|chec|essa)\b/],
  ['transporte_aereo',     /\b(aereo|vuelo|vuelos|tiquete|tiquetes|avianca|latam|wingo)\b/],
  ['transporte_terrestre', /\b(transporte|flete|fletes|envio|envios|mensajeria|servientrega|envia|deprisa)\b/],
  ['residuos',             /\b(residuo|residuos|basura|desecho|desechos|reciclaje|aseo)\b/],
  ['agua',                 /\b(agua|acueducto|eaab|alcantarillado)\b/],
  ['nomina',               /\b(nomina|salario|salarios|empleado|empleados|prestacion|prestaciones)\b/],
  ['compras_bienes',       /\b(compra|compras|materia prima|insumo|insumos|mercancia|producto|productos)\b/],
]

export function clasificarGasto(...textos) {
  const t = norm(textos.filter(Boolean).join(' '))
  for (const [cat, re] of REGLAS) if (re.test(t)) return cat
  return 'compras_servicios'
}
