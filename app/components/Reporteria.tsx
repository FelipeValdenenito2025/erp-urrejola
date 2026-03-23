'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import * as XLSX from 'xlsx'

type Proyecto = {
  id: string
  nombre: string
  cliente: string
  rut: string
  moneda: string
  monto_base: number
  monto_extra: number
  estado: string
}

type Hito = {
  id: string
  proyecto_id: string
  descripcion: string
  monto: number
  estado_pago: string
  estado_factura: string
  fecha_pago: string | null
  abonos?: { monto: number; fecha: string }[]
}

type Costo = {
  id: string
  proyecto_id: string
  descripcion: string
  categoria: string
  monto: number
  moneda: string
  estado_pago: string
  created_at: string
}

const fmt = (n: number, m = 'CLP') =>
  m === 'USD' ? 'USD ' + (n||0).toLocaleString('es-CL') : '$' + (n||0).toLocaleString('es-CL')

const hoy = new Date()
const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
const hoyStr = hoy.toISOString().split('T')[0]

export default function Reporteria() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [hitos, setHitos] = useState<Hito[]>([])
  const [costos, setCostos] = useState<Costo[]>([])
  const [loading, setLoading] = useState(true)
  const [desde, setDesde] = useState(primerDiaMes)
  const [hasta, setHasta] = useState(hoyStr)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const [{ data: p }, { data: h }, { data: c }] = await Promise.all([
      supabase.from('proyectos').select('*').order('nombre'),
      supabase.from('hitos').select('*, abonos(*)').order('created_at'),
      supabase.from('costos').select('*').order('created_at'),
    ])
    if (p) setProyectos(p)
    if (h) setHitos(h)
    if (c) setCostos(c)
    setLoading(false)
  }

  const desdeDate = new Date(desde + 'T00:00:00')
  const hastaDate = new Date(hasta + 'T23:59:59')

  // Abonos de hitos en el período (incluye parciales y totales)
  type AbonoHito = { monto: number; fecha: string; hito_id: string; proyecto_id: string; descripcion: string; moneda: string }
  const abonosFiltrados: AbonoHito[] = []
  hitos.forEach(h => {
    (h.abonos || []).forEach((a: any) => {
      const f = new Date(a.fecha + 'T12:00:00')
      if (f >= desdeDate && f <= hastaDate) {
        abonosFiltrados.push({
          monto: a.monto,
          fecha: a.fecha,
          hito_id: h.id,
          proyecto_id: h.proyecto_id,
          descripcion: h.descripcion,
          moneda: proyectos.find(p => p.id === h.proyecto_id)?.moneda || 'CLP',
        })
      }
    })
  })

  // Costos registrados en el período
  const costosFiltrados = costos.filter(c => {
    const f = new Date(c.created_at)
    return f >= desdeDate && f <= hastaDate
  })

  const totalIngresos = abonosFiltrados.reduce((a, ab) => a + ab.monto, 0)
  const totalEgresos  = costosFiltrados.reduce((a, c) => a + c.monto, 0)
  const utilidad      = totalIngresos - totalEgresos

  // Egresos por categoría
  const porCategoria: Record<string, number> = {}
  costosFiltrados.forEach(c => {
    porCategoria[c.categoria] = (porCategoria[c.categoria] || 0) + c.monto
  })

  // Resumen por proyecto
  const resumenProyectos = proyectos.map(p => {
    const ing = abonosFiltrados.filter(a => a.proyecto_id === p.id).reduce((a, ab) => a + ab.monto, 0)
    const egr = costosFiltrados.filter(c => c.proyecto_id === p.id).reduce((a, c) => a + c.monto, 0)
    return { ...p, ingresos: ing, egresos: egr, utilidad: ing - egr }
  }).filter(p => p.ingresos > 0 || p.egresos > 0)

  function exportarExcel() {
    try {
      const wb = XLSX.utils.book_new()

      // Hoja resumen general
      const resumenData = [
        ['REPORTE GLOBAL ERP URREJOLA'],
        [`Período: ${desde} al ${hasta}`],
        [],
        ['RESUMEN GENERAL'],
        ['Concepto', 'Monto'],
        ['Ingresos cobrados', totalIngresos],
        ['Egresos registrados', totalEgresos],
        ['Utilidad neta', utilidad],
        [],
        ['RESUMEN POR PROYECTO'],
        ['Proyecto', 'Cliente', 'Estado', 'Ingresos', 'Egresos', 'Utilidad'],
        ...resumenProyectos.map(p => [p.nombre, p.cliente, p.estado, p.ingresos, p.egresos, p.utilidad]),
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumenData), 'Resumen')

      // Hoja ingresos
      const ingData = [
        ['INGRESOS DEL PERÍODO'],
        [`Desde: ${desde} | Hasta: ${hasta}`],
        [],
        ['Proyecto', 'Cliente', 'Hito', 'Fecha Abono', 'Monto'],
        ...abonosFiltrados.map(ab => {
          const p = proyectos.find(x => x.id === ab.proyecto_id)
          return [p?.nombre||'', p?.cliente||'', ab.descripcion, ab.fecha, ab.monto]
        }),
        [],
        ['', '', '', 'TOTAL', totalIngresos],
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ingData), 'Ingresos')

      // Hoja egresos
      const egrData = [
        ['EGRESOS DEL PERÍODO'],
        [`Desde: ${desde} | Hasta: ${hasta}`],
        [],
        ['Proyecto', 'Cliente', 'Concepto', 'Categoría', 'Fecha Reg.', 'Estado', 'Monto', 'Moneda'],
        ...costosFiltrados.map(c => {
          const p = proyectos.find(x => x.id === c.proyecto_id)
          return [p?.nombre||'', p?.cliente||'', c.descripcion, c.categoria, c.created_at.split('T')[0], c.estado_pago, c.monto, c.moneda]
        }),
        [],
        ['', '', '', '', '', 'TOTAL', totalEgresos, ''],
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(egrData), 'Egresos')

      XLSX.writeFile(wb, `Reporte_ERP_${desde}_al_${hasta}.xlsx`)
    } catch (e: any) {
      alert('Error al generar Excel: ' + e.message)
    }
  }

  function imprimirPDF() {
    const ingRows = abonosFiltrados.map(ab => {
      const p = proyectos.find(x => x.id === ab.proyecto_id)
      return `<tr><td>${p?.nombre||''}</td><td>${p?.cliente||''}</td><td>${ab.descripcion}</td><td>${ab.fecha}</td><td style="text-align:right">${fmt(ab.monto)}</td></tr>`
    }).join('')
    const egrRows = costosFiltrados.map(c => {
      const p = proyectos.find(x => x.id === c.proyecto_id)
      return `<tr><td>${p?.nombre||''}</td><td>${c.descripcion}</td><td>${c.categoria}</td><td>${c.created_at.split('T')[0]}</td><td style="text-align:right">${fmt(c.monto, c.moneda)}</td></tr>`
    }).join('')
    const resRows = resumenProyectos.map(p =>
      `<tr><td>${p.nombre}</td><td>${p.cliente}</td><td>${p.estado}</td><td style="text-align:right">${fmt(p.ingresos)}</td><td style="text-align:right">${fmt(p.egresos)}</td><td style="text-align:right;font-weight:700;color:${p.utilidad>=0?'#198754':'#dc3545'}">${fmt(p.utilidad)}</td></tr>`
    ).join('')

    const win = window.open('', '_blank')!
    win.document.write(`<html><head><title>Reporte ERP</title><style>
      body{font-family:'Segoe UI',sans-serif;padding:30px;color:#333;font-size:12px}
      img{-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact}
      .header{display:flex;align-items:center;gap:16px;margin-bottom:6px}
      .header img{height:40px}
      h1{color:#003366;font-size:18px;margin:0}
      .periodo{font-size:12px;color:#666;margin-bottom:20px}
      .summary{display:flex;gap:12px;margin-bottom:20px}
      .box{flex:1;padding:10px 14px;border-radius:8px;color:white}
      .box label{font-size:9px;opacity:.8;text-transform:uppercase;display:block}
      .box strong{font-size:16px}
      .box-ing{background:#003366}.box-egr{background:#d9534f}.box-uti{background:#198754}
      h2{color:#003366;border-left:4px solid #003366;padding-left:8px;font-size:13px;margin:20px 0 8px}
      table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px}
      th{background:#003366;color:white;padding:6px 8px;text-align:left}
      td{padding:5px 8px;border-bottom:1px solid #eee}
      tr:nth-child(even) td{background:#f8f9fa}
      .total td{font-weight:700;border-top:2px solid #003366;background:#f0f4ff}
    </style></head><body>
      <div class="header">
        <img src="https://i.imgur.com/U7FK19x.png" />
        <div><h1>Reporte Global ERP Urrejola</h1></div>
      </div>
      <div class="periodo">Período: <strong>${desde}</strong> al <strong>${hasta}</strong></div>
      <div class="summary">
        <div class="box box-ing"><label>Ingresos cobrados</label><strong>${fmt(totalIngresos)}</strong><br><small>${hitosFiltrados.length} hitos pagados</small></div>
        <div class="box box-egr"><label>Egresos registrados</label><strong>${fmt(totalEgresos)}</strong><br><small>${costosFiltrados.length} costos</small></div>
        <div class="box box-uti"><label>Utilidad neta</label><strong>${fmt(utilidad)}</strong></div>
      </div>
      <h2>RESUMEN POR PROYECTO</h2>
      <table><thead><tr><th>Proyecto</th><th>Cliente</th><th>Estado</th><th>Ingresos</th><th>Egresos</th><th>Utilidad</th></tr></thead>
      <tbody>${resRows||'<tr><td colspan="6" style="text-align:center;color:#999">Sin movimientos</td></tr>'}</tbody>
      <tr class="total"><td colspan="3" style="padding:6px 8px">TOTALES</td><td style="padding:6px 8px">${fmt(totalIngresos)}</td><td style="padding:6px 8px">${fmt(totalEgresos)}</td><td style="padding:6px 8px">${fmt(utilidad)}</td></tr>
      </table>
      <h2>INGRESOS RECIBIDOS (HITOS PAGADOS)</h2>
      <table><thead><tr><th>Proyecto</th><th>Cliente</th><th>Hito</th><th>Fecha Pago</th><th>Monto</th></tr></thead>
      <tbody>${ingRows||'<tr><td colspan="5" style="text-align:center;color:#999">Sin ingresos en el período</td></tr>'}</tbody>
      <tr class="total"><td colspan="4">Total ingresos</td><td>${fmt(totalIngresos)}</td></tr>
      </table>
      <h2>EGRESOS REGISTRADOS</h2>
      <table><thead><tr><th>Proyecto</th><th>Concepto</th><th>Categoría</th><th>Fecha</th><th>Monto</th></tr></thead>
      <tbody>${egrRows||'<tr><td colspan="5" style="text-align:center;color:#999">Sin egresos en el período</td></tr>'}</tbody>
      <tr class="total"><td colspan="4">Total egresos</td><td>${fmt(totalEgresos)}</td></tr>
      </table>
      <script>window.onload=()=>{window.print();window.close()}</script>
    </body></html>`)
    win.document.close()
  }

  if (loading) return (
    <div style={{ textAlign:'center', padding:'60px', color:'#6c757d' }}>Cargando...</div>
  )

  return (
    <div>
      {/* ── Controles ── */}
      <div style={{ background:'white', borderRadius:'12px', padding:'16px 20px', marginBottom:'16px', border:'1px solid #eee' }}>
        <div style={{ display:'flex', gap:'16px', alignItems:'flex-end', flexWrap:'wrap' as const }}>
          <div>
            <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'4px' }}>Desde</label>
            <input type="date" value={desde} onChange={e=>setDesde(e.target.value)}
              style={{ padding:'8px 12px', fontSize:'13px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none' }} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'4px' }}>Hasta</label>
            <input type="date" value={hasta} onChange={e=>setHasta(e.target.value)}
              style={{ padding:'8px 12px', fontSize:'13px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none' }} />
          </div>
          <div style={{ flex:1 }} />
          <div style={{ display:'flex', gap:'8px' }}>
            <button onClick={imprimirPDF}
              style={{ padding:'8px 18px', borderRadius:'8px', border:'1px solid #003366', background:'white', color:'#003366', cursor:'pointer', fontSize:'13px', fontWeight:'600' }}>
              🖨 Imprimir PDF
            </button>
            <button onClick={exportarExcel}
              style={{ padding:'8px 18px', borderRadius:'8px', border:'none', background:'#198754', color:'white', cursor:'pointer', fontSize:'13px', fontWeight:'600' }}>
              📥 Exportar Excel
            </button>
          </div>
        </div>
      </div>

      {/* ── Tarjetas resumen ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'16px' }}>
        <div style={{ background:'linear-gradient(135deg,#003366,#00509d)', borderRadius:'12px', padding:'18px', color:'white' }}>
          <div style={{ fontSize:'11px', opacity:0.8, textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'4px' }}>Ingresos cobrados</div>
          <div style={{ fontSize:'24px', fontWeight:'700' }}>{fmt(totalIngresos)}</div>
          <div style={{ fontSize:'11px', opacity:0.7, marginTop:'2px' }}>{abonosFiltrados.length} abonos en el período</div>
        </div>
        <div style={{ background:'linear-gradient(135deg,#d9534f,#c9302c)', borderRadius:'12px', padding:'18px', color:'white' }}>
          <div style={{ fontSize:'11px', opacity:0.8, textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'4px' }}>Egresos registrados</div>
          <div style={{ fontSize:'24px', fontWeight:'700' }}>{fmt(totalEgresos)}</div>
          <div style={{ fontSize:'11px', opacity:0.7, marginTop:'2px' }}>{costosFiltrados.length} costos en el período</div>
        </div>
        <div style={{ background:`linear-gradient(135deg,${utilidad>=0?'#198754,#146c43':'#dc3545,#a71d2a'})`, borderRadius:'12px', padding:'18px', color:'white' }}>
          <div style={{ fontSize:'11px', opacity:0.8, textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'4px' }}>Utilidad neta</div>
          <div style={{ fontSize:'24px', fontWeight:'700' }}>{fmt(utilidad)}</div>
          <div style={{ fontSize:'11px', opacity:0.7, marginTop:'2px' }}>Ingresos − egresos del período</div>
        </div>
      </div>

      {/* ── Contenido principal ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>

        {/* Egresos por categoría */}
        <div style={{ background:'white', borderRadius:'12px', padding:'16px', border:'1px solid #eee' }}>
          <div style={{ fontSize:'13px', fontWeight:'700', color:'#003366', marginBottom:'14px' }}>📊 Egresos por categoría</div>
          {Object.keys(porCategoria).length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px', color:'#aaa', fontSize:'13px' }}>Sin egresos en el período</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {Object.entries(porCategoria).sort((a,b)=>b[1]-a[1]).map(([cat, monto]) => {
                const pct = totalEgresos > 0 ? (monto/totalEgresos)*100 : 0
                return (
                  <div key={cat}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'3px' }}>
                      <span style={{ fontWeight:'500', color:'#374151' }}>{cat}</span>
                      <span style={{ color:'#842029', fontWeight:'600' }}>{fmt(monto)} ({Math.round(pct)}%)</span>
                    </div>
                    <div style={{ height:'7px', background:'#f0f0f0', borderRadius:'4px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:'#d9534f', borderRadius:'4px' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Resumen por proyecto */}
        <div style={{ background:'white', borderRadius:'12px', padding:'16px', border:'1px solid #eee' }}>
          <div style={{ fontSize:'13px', fontWeight:'700', color:'#003366', marginBottom:'14px' }}>📁 Resumen por proyecto</div>
          {resumenProyectos.length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px', color:'#aaa', fontSize:'13px' }}>Sin movimientos en el período</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {resumenProyectos.map(p => (
                <div key={p.id} style={{ padding:'10px 12px', background:'#f8f9fa', borderRadius:'8px', borderLeft:`4px solid ${p.utilidad>=0?'#198754':'#dc3545'}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:'600', color:'#003366' }}>{p.nombre}</div>
                      <div style={{ fontSize:'11px', color:'#6c757d' }}>{p.cliente}</div>
                    </div>
                    <span style={{ fontSize:'11px', padding:'2px 7px', borderRadius:'8px', background: p.estado==='Abierto'?'#e3f2fd':'#e8f5e9', color: p.estado==='Abierto'?'#0d47a1':'#1b5e20', fontWeight:'600' }}>
                      {p.estado}
                    </span>
                  </div>
                  <div style={{ display:'flex', gap:'12px', marginTop:'6px', fontSize:'12px' }}>
                    <span style={{ color:'#198754', fontWeight:'600' }}>↑ {fmt(p.ingresos, p.moneda)}</span>
                    <span style={{ color:'#842029', fontWeight:'600' }}>↓ {fmt(p.egresos, p.moneda)}</span>
                    <span style={{ color: p.utilidad>=0?'#198754':'#dc3545', fontWeight:'700', marginLeft:'auto' }}>= {fmt(p.utilidad, p.moneda)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Tablas detalle ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>

        {/* Tabla ingresos */}
        <div style={{ background:'white', borderRadius:'12px', border:'1px solid #eee', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:'13px', fontWeight:'700', color:'#003366' }}>💰 Ingresos del período</div>
            <div style={{ fontSize:'12px', fontWeight:'700', color:'#198754' }}>{fmt(totalIngresos)}</div>
          </div>
          {abonosFiltrados.length === 0 ? (
            <div style={{ textAlign:'center', padding:'24px', color:'#aaa', fontSize:'13px' }}>Sin ingresos en el período</div>
          ) : (
            <div style={{ overflowX:'auto' as const }}>
              <table style={{ width:'100%', fontSize:'12px', borderCollapse:'collapse' as const }}>
                <thead>
                  <tr style={{ background:'#f8f9fa' }}>
                    <th style={{ padding:'8px 10px', textAlign:'left' as const, color:'#6c757d', fontWeight:'600' }}>Proyecto</th>
                    <th style={{ padding:'8px 10px', textAlign:'left' as const, color:'#6c757d', fontWeight:'600' }}>Hito</th>
                    <th style={{ padding:'8px 10px', textAlign:'center' as const, color:'#6c757d', fontWeight:'600' }}>Fecha Abono</th>
                    <th style={{ padding:'8px 10px', textAlign:'right' as const, color:'#6c757d', fontWeight:'600' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {abonosFiltrados.map((ab, idx) => {
                    const p = proyectos.find(x => x.id === ab.proyecto_id)
                    return (
                      <tr key={idx} style={{ borderBottom:'1px solid #f0f0f0' }}>
                        <td style={{ padding:'7px 10px', color:'#003366', fontWeight:'500', fontSize:'11px' }}>{p?.nombre}</td>
                        <td style={{ padding:'7px 10px', color:'#374151', fontSize:'11px' }}>{ab.descripcion}</td>
                        <td style={{ padding:'7px 10px', textAlign:'center' as const, color:'#6c757d', fontSize:'11px' }}>{ab.fecha}</td>
                        <td style={{ padding:'7px 10px', textAlign:'right' as const, fontWeight:'700', color:'#198754', fontSize:'11px' }}>{fmt(ab.monto, ab.moneda)}</td>
                      </tr>
                    )
                  })}
                  <tr style={{ borderTop:'2px solid #003366', background:'#f0f4ff' }}>
                    <td colSpan={3} style={{ padding:'7px 10px', fontWeight:'700', color:'#003366', fontSize:'12px' }}>Total</td>
                    <td style={{ padding:'7px 10px', textAlign:'right' as const, fontWeight:'800', color:'#198754', fontSize:'13px' }}>{fmt(totalIngresos)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tabla egresos */}
        <div style={{ background:'white', borderRadius:'12px', border:'1px solid #eee', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:'13px', fontWeight:'700', color:'#842029' }}>📤 Egresos del período</div>
            <div style={{ fontSize:'12px', fontWeight:'700', color:'#842029' }}>{fmt(totalEgresos)}</div>
          </div>
          {costosFiltrados.length === 0 ? (
            <div style={{ textAlign:'center', padding:'24px', color:'#aaa', fontSize:'13px' }}>Sin egresos en el período</div>
          ) : (
            <div style={{ overflowX:'auto' as const }}>
              <table style={{ width:'100%', fontSize:'12px', borderCollapse:'collapse' as const }}>
                <thead>
                  <tr style={{ background:'#f8f9fa' }}>
                    <th style={{ padding:'8px 10px', textAlign:'left' as const, color:'#6c757d', fontWeight:'600' }}>Proyecto</th>
                    <th style={{ padding:'8px 10px', textAlign:'left' as const, color:'#6c757d', fontWeight:'600' }}>Concepto</th>
                    <th style={{ padding:'8px 10px', textAlign:'left' as const, color:'#6c757d', fontWeight:'600' }}>Cat.</th>
                    <th style={{ padding:'8px 10px', textAlign:'right' as const, color:'#6c757d', fontWeight:'600' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {costosFiltrados.map(c => {
                    const p = proyectos.find(x => x.id === c.proyecto_id)
                    return (
                      <tr key={c.id} style={{ borderBottom:'1px solid #f0f0f0' }}>
                        <td style={{ padding:'7px 10px', color:'#003366', fontWeight:'500', fontSize:'11px' }}>{p?.nombre}</td>
                        <td style={{ padding:'7px 10px', color:'#374151', fontSize:'11px' }}>{c.descripcion}</td>
                        <td style={{ padding:'7px 10px', color:'#6c757d', fontSize:'11px' }}>{c.categoria}</td>
                        <td style={{ padding:'7px 10px', textAlign:'right' as const, fontWeight:'700', color:'#842029', fontSize:'11px' }}>{fmt(c.monto, c.moneda)}</td>
                      </tr>
                    )
                  })}
                  <tr style={{ borderTop:'2px solid #d9534f', background:'#fff5f5' }}>
                    <td colSpan={3} style={{ padding:'7px 10px', fontWeight:'700', color:'#842029', fontSize:'12px' }}>Total</td>
                    <td style={{ padding:'7px 10px', textAlign:'right' as const, fontWeight:'800', color:'#842029', fontSize:'13px' }}>{fmt(totalEgresos)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}