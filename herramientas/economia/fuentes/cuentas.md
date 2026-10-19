# Las cuentas del ayuntamiento

Extraído el **19-10-2026**. Datos en `cuentas.json`; script en
`herramientas/economia/cuentas_extraer.py` (biblioteca estándar + `mdb-export`).

## Fuentes

- **CONPREL, liquidaciones 2021-2024** (Ministerio de Hacienda), base Access por ejercicio:
  `https://serviciostelematicosext.hacienda.gob.es/SGFAL/CONPREL/Consulta/DescargaFichero?CCAA=&TipoDato=Liquidaciones&Ejercicio=AAAA&TipoPublicacion=Access`
  (AAAA = 2021, 2022, 2023, 2024). Tablas `tb_economica_cons`, `tb_funcional_cons`,
  `tb_inventario` y `tb_remanente`.
- **Periodo medio de pago a proveedores de las EE.LL.** (Hacienda, PMP_NET, RD 635/2014):
  [consulta](https://serviciostelematicosext.hacienda.gob.es/SGCIEF/PMP_NET/aspx/consulta/consulta.aspx?tipoPublicacion=2);
  cada mes, `…/descarga.aspx?ejercicio=AAAA&periodo=Mes&tipoPublicacion=2&fichero=fichero1`
  (`fichero2` en marzo, junio, septiembre y diciembre). Las 12 URL exactas están en
  `_meta.fuentes.pmp_ficheros`.
- **Población**: INE, cifras oficiales del Padrón a 1-1-2025, `BASES.total` de `datos/datos.js`.

## Método (el del README, sin cambios)

- Consolidado ayuntamiento + organismos autónomos, columna `importer`: obligaciones reconocidas
  netas (gastos), derechos reconocidos netos (ingresos). La fila del capítulo («3», «9»…) ya
  incluye el ajuste de consolidación «3t», «9t»: no se suma aparte.
- Por habitante con la población a 1-1-2025, la misma los cuatro años; media simple de los
  ejercicios publicados. **Pozuelo de Alarcón: media de 2021 y 2024** (no hay 2022 ni 2023).
- Media de la Comunidad: cada año, suma de todos los ayuntamientos de la provincia 28 que
  liquidaron (152-158) entre la suma de su población del inventario de CONPREL de ese año;
  después media simple de los cuatro años. Con y sin Madrid capital.

**Comprobación contra el README**: inversión (cap. 6) año a año de los once, idéntica
(Parla 8 / 18 / 57 / 8, media 23; Getafe 156…); impuestos directos (cap. 1 de ingresos), las
once medias idénticas (Parla 254 … Pozuelo 733); gasto total Parla 780 y Leganés 782; medias
regionales 1.345 / 1.032 € de gasto y 139 / 112 € de inversión. Todas cuadran.

Todas las cifras: **€ por habitante, media 2021-2024**, salvo que se diga otra cosa.

## 1. Lo que se paga por la deuda: capítulos 3 y 9 de gastos

| Municipio | Cap. 3 intereses |   art. 31 préstamos |   art. 35 demora y otros | Cap. 9 amortización | 3 + 9 | % del gasto |
|---|---:|---:|---:|---:|---:|---:|
| Móstoles | 12,34 | 1,37 | 10,96 | 122,66 | 134,99 | 14,56 |
| Alcorcón | 15,14 | 10,74 | 4,39 | 67,18 | 82,32 | 9,43 |
| Alcobendas | 7,20 | 1,37 | 5,29 | 69,87 | 77,08 | 5,31 |
| Parla | 42,83 | 17,41 | 25,42 | 23,12 | 65,95 | 8,27 |
| Torrejón de Ardoz | 11,45 | 9,93 | 1,52 | 52,98 | 64,43 | 6,72 |
| Leganés | 4,52 | 1,48 | 3,04 | 43,43 | 47,95 | 6,11 |
| Fuenlabrada | 4,58 | 3,57 | 1,01 | 36,95 | 41,53 | 4,21 |
| Pinto | 4,46 | 0,10 | 4,37 | 18,82 | 23,28 | 2,63 |
| Getafe | 8,58 | 0,01 | 8,57 | 0,00 | 8,58 | 0,86 |
| Pozuelo de Alarcón | 4,42 | 0,00 | 4,42 | 0,00 | 4,42 | 0,34 |
| Majadahonda | 3,75 | 0,00 | 3,75 | 0,00 | 3,75 | 0,35 |
| Media Comunidad (con Madrid) | 18,29 | 7,30 | 8,51 | 51,72 | 70,00 | 5,23 |
| Media Comunidad (sin Madrid) | 9,63 | 4,14 | 5,38 | 45,08 | 54,71 | 5,33 |

- El capítulo 3 no es todo deuda bancaria. El **artículo 31** son intereses de préstamos; el
  **artículo 35**, intereses de demora y otros gastos financieros (pagar tarde, sentencias).
  En Parla el 35 pesa más que el 31: 10,9 millones en 2022 (79,5 €/hab ese año), que es lo que
  dispara su capítulo 3 medio a 42,83 €, el más alto de los once y más del doble de la media.
- **El capítulo 9 de Parla es bajo para su deuda** (3.785 €/hab de deuda viva, la mayor de
  largo): 23 €/hab al año de amortización, menos que la media. La deuda de Parla está
  refinanciada con carencias largas; al mismo tiempo entró endeudamiento nuevo (capítulo 9 de
  **ingresos**: 132 millones en 2022 y 276 millones en 2023, en `i9_pasivos_financieros`).
  No es correcto leer «Parla paga poco por su deuda» sin esto. Lo que sí se puede decir: en
  intereses (cap. 3) es la que más paga, y buena parte son intereses de demora.
- El capítulo 9 incluye amortizaciones anticipadas y refinanciaciones; de ahí los saltos
  (Móstoles 2021: 234 €/hab; Fuenlabrada 2021: 116).
- Getafe, Pozuelo y Majadahonda no amortizan nada: no tienen préstamos vivos relevantes.

## 2. Gasto por área (primer dígito de la clasificación por programas)

| Municipio | 0 Deuda | 1 Serv. básicos | 2 Social | 3 Bienes preferentes | 4 Económicas | 9 Generales | Total |
|---|---:|---:|---:|---:|---:|---:|---:|
| Parla | 40,53 | 325,44 | 74,93 | 87,69 | 109,49 | 142,12 | 780,20 |
| Getafe | 0,01 | 474,61 | 94,07 | 231,02 | 28,30 | 150,48 | 978,50 |
| Leganés | 44,91 | 342,14 | 75,07 | 128,50 | 4,75 | 187,00 | 782,37 |
| Fuenlabrada | 40,52 | 369,44 | 132,54 | 215,21 | 34,31 | 222,01 | 1.014,04 |
| Móstoles | 70,16 | 318,00 | 101,59 | 156,23 | 6,55 | 232,84 | 885,36 |
| Alcorcón | 77,92 | 387,26 | 84,82 | 137,83 | 20,39 | 169,20 | 877,43 |
| Alcobendas | 71,25 | 446,74 | 77,14 | 412,50 | 29,59 | 390,82 | 1.428,05 |
| Pinto | 23,28 | 220,54 | 82,19 | 169,81 | 167,94 | 281,73 | 945,49 |
| Torrejón de Ardoz | 64,43 | 497,05 | 85,55 | 122,54 | 40,82 | 130,98 | 941,36 |
| Pozuelo de Alarcón | 0,00 | 652,10 | 60,53 | 235,78 | 14,93 | 309,43 | 1.272,76 |
| Majadahonda | 0,00 | 636,87 | 66,39 | 191,31 | 13,35 | 237,76 | 1.145,67 |
| Media Comunidad (con Madrid) | 64,54 | 632,88 | 133,60 | 203,37 | 98,11 | 212,47 | 1.344,98 |
| Media Comunidad (sin Madrid) | 46,25 | 429,56 | 82,70 | 208,74 | 35,70 | 228,82 | 1.031,79 |

**¿Aguanta la comparación? Solo en parte.** La suma de las seis áreas cuadra al céntimo con el
gasto total en los once municipios y los cuatro años, y no hay áreas fuera del catálogo. Pero el
reparto entre áreas depende de cómo etiquete cada ayuntamiento, igual que con la limpieza:

- **Área 4 (actuaciones económicas)** no es comparable: Parla apunta ahí el tranvía
  (política 44, transporte público, ~104 €/hab) y Pinto las vías públicas (política 45,
  ~127 €/hab), que los demás llevan a la política 15, en el área 1. Leganés y Móstoles salen
  con 5-7 €.
- **Áreas 1 y 9** absorben lo que las demás no recogen (el área 9 es un cajón: administración
  general, intereses de demora, transferencias a otras administraciones).
- **Área 0** es solo intereses de préstamos (art. 31) + capítulo 9; los intereses de demora
  suelen ir al área 9. Para la deuda, mejor los capítulos (punto 1).
- **Área 2** aguanta, pero ya está en la web como política 23. **Área 3** (educación, cultura,
  deporte) es la más defendible de las restantes, con la cautela de la frontera entre
  programas (Alcobendas, 412 €, por sus patronatos).

Conclusión: no recomendable como serie de la web; sirve para leer un ayuntamiento.

## 3. Ingresos por capítulo (derechos reconocidos netos)

| Municipio | Cap. 1 | Cap. 2 | Cap. 3 | 1+2+3 | Cap. 4 |   art. 42 Estado | Cap. 7 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Pozuelo de Alarcón | 733,13 | 110,28 | 235,61 | 1.079,03 | 154,28 | 103,54 | 1,73 |
| Alcobendas | 706,90 | 101,04 | 214,12 | 1.022,07 | 254,44 | 188,60 | 22,16 |
| Majadahonda | 517,51 | 31,95 | 127,78 | 677,24 | 326,01 | 265,74 | 3,90 |
| Alcorcón | 470,24 | 45,34 | 81,15 | 596,72 | 333,06 | 273,30 | 13,06 |
| Getafe | 459,80 | 63,92 | 65,06 | 588,78 | 335,41 | 273,59 | 17,80 |
| Pinto | 433,12 | 42,88 | 99,12 | 575,12 | 343,90 | 268,64 | 28,02 |
| Torrejón de Ardoz | 358,15 | 66,05 | 136,07 | 560,27 | 293,56 | 226,94 | 87,74 |
| Fuenlabrada | 367,38 | 45,46 | 99,62 | 512,47 | 410,55 | 330,48 | 34,86 |
| Móstoles | 369,83 | 50,53 | 77,48 | 497,83 | 343,60 | 293,13 | 4,13 |
| Leganés | 326,40 | 43,04 | 73,42 | 442,85 | 348,75 | 292,98 | 16,15 |
| Parla | 254,39 | 42,45 | 54,56 | 351,41 | 259,53 | 181,88 | 23,89 |
| Media Comunidad (con Madrid) | 570,92 | 58,74 | 171,23 | 800,89 | 470,00 | 402,60 | 30,72 |
| Media Comunidad (sin Madrid) | 445,55 | 52,76 | 125,37 | 623,68 | 344,60 | 253,09 | 34,33 |

- 1+2+3 es lo que el ayuntamiento recauda por sí mismo. Parla es la última de las once en
  impuestos directos, en tasas y en la suma (351 €, 56 % de la media sin capital); en indirectos
  solo Majadahonda queda por debajo.
- Capítulo 4: transferencias corrientes; el **artículo 42** es lo del Estado (casi todo, la
  participación en tributos del Estado). Parla recibe del Estado 181,88 €/hab, la penúltima
  (solo Pozuelo, 103,54, recibe menos). La fuente da derechos reconocidos, no explica la
  fórmula de reparto.
- Capítulo 7 es volátil (el README ya lo descartó como serie): Torrejón 87,74 por el convenio
  de 2024.
- `ingreso_total` en el JSON **incluye el capítulo 9** (préstamos): Parla sale con 1.453 €/hab
  por los 276 millones de 2023. No usar como indicador de financiación.

## 4. Periodo medio de pago a proveedores (días)

Último mes publicado a 19-10-2026: **julio de 2026**. Media simple de agosto 2025 - julio 2026.

| Municipio | Último mes | PMP último (días) | Media 12 meses (días) |
|---|---|---:|---:|
| Parla | 2026-07 | 155,49 | 155,77 |
| Leganés | 2026-07 | 43,35 | 54,20 |
| Getafe | 2026-07 | 24,05 | 49,09 |
| Pinto | 2026-06 (T2, trimestral) | 75,87 | 40,01 (4 trimestres) |
| Alcobendas | 2026-07 | 33,15 | 31,98 |
| Móstoles | 2026-07 | 25,76 | 28,93 |
| Torrejón de Ardoz | 2026-07 | 32,29 | 26,67 |
| Fuenlabrada | 2026-07 | 12,68 | 12,77 |
| Pozuelo de Alarcón | 2026-07 | 8,78 | 10,59 |
| Alcorcón | 2026-07 | 8,34 | 9,03 |
| Majadahonda | 2026-06 (T2, trimestral) | 7,29 | 7,13 (4 trimestres) |

- Fila del ayuntamiento (código `12-28-XXX-A-A-000`) del informe ejecutivo, columna «Periodo
  Medio de Pago». El máximo legal es 30 días.
- **Pinto y Majadahonda** están en el «modelo de variables»: solo publican trimestre a trimestre
  (marzo, junio, septiembre y diciembre); último, 2.º trimestre de 2026; media de 4 trimestres.
- Parla supera los 130 días los doce meses (máximo 192,59 en abril de 2026).
- Media simple, no ponderada por importe. No se calcula media de la Comunidad.

## 5. Plan de ajuste, ahorro neto y remanente

**Remanente de tesorería** (`tb_remanente`, CONPREL, oficial). Solo la entidad principal (la
fuente no lo consolida con los organismos autónomos). Es un saldo a 31 de diciembre: el dato
a usar es **2024**, no la media. € por habitante:

| Municipio | RT gastos generales 2024 | RT ajustado 2024 |
|---|---:|---:|
| Parla | -74,28 | -585,68 |
| Getafe | 514,67 | 493,27 |
| Leganés | 421,73 | 402,54 |
| Fuenlabrada | 120,02 | 112,29 |
| Móstoles | 104,33 | 51,42 |
| Alcorcón | 205,59 | 182,49 |
| Alcobendas | 267,27 | 210,10 |
| Pinto | 248,33 | 243,21 |
| Torrejón de Ardoz | 29,46 | 3,40 |
| Pozuelo de Alarcón | 772,37 | 730,51 |
| Majadahonda | 722,68 | 708,06 |

«Ajustado» descuenta las obligaciones pendientes de aplicar al presupuesto (facturas en la
cuenta 413). Parla, en euros: −446,2 M (2021), −340,0 M (2022), −85,2 M (2023), −80,5 M (2024).
Es el único negativo de los once (Torrejón roza el cero, 3,40). No hay media regional (no se
calculó: no es consolidado).

**Ahorro** — calculado por nosotros sobre la liquidación, **no es el ahorro neto legal**
(art. 53 TRLRHL, que usa la anualidad teórica) ni una cifra que publique Hacienda:
ahorro bruto = ingresos corrientes (cap. 1-5) − gastos corrientes (cap. 1-4); neto = bruto −
cap. 9.

| Municipio | Ahorro bruto | Ahorro neto (liquidación) |
|---|---:|---:|
| Leganés | 179,59 | 136,17 |
| Alcorcón | 172,19 | 105,01 |
| Pozuelo de Alarcón | 157,96 | 157,96 |
| Móstoles | 140,27 | 17,62 |
| Getafe | 137,28 | 137,28 |
| Torrejón de Ardoz | 136,85 | 83,87 |
| Alcobendas | 120,64 | 50,77 |
| Pinto | 70,33 | 51,51 |
| Fuenlabrada | 63,22 | 26,27 |
| Majadahonda | 37,13 | 37,13 |
| Parla | -24,57 | -47,69 |
| Media Comunidad (con Madrid) | 185,20 | 133,48 |
| Media Comunidad (sin Madrid) | 124,70 | 79,61 |

Parla, ahorro bruto negativo en la media (−119,78 en 2022 y −36,77 en 2023; positivo en 2021 y
2024). Úsese con cautela.

**Plan de ajuste: no salió.** Se buscó una relación oficial y descargable de ayuntamientos con
plan de ajuste vigente (RDL 4/2012, Fondo de Ordenación del RDL 17/2014) y no la hay por
municipio: los planes y sus informes de seguimiento están en los portales de cada ayuntamiento
y en acuerdos de la CDGAE, no en un fichero comparable. Que Parla tiene plan de ajuste ya lo dice
el README; no se añade nada nuevo.

## Cautelas

- Las cifras son de liquidación (lo reconocido), no de presupuesto.
- Población fija a 1-1-2025 para los cuatro años (igual que la web); la media regional usa la
  población del inventario de cada año, como en el README.
- Los porcentajes de la media regional son el cociente de las sumas de cada año, promediado.
- Descargas en bruto en `/tmp/claude-1000/economia-cuentas/`; las bases Access descomprimidas
  (≈1,7 GB) no caben en el `/tmp` de 2 GB en memoria y se dejan en `/var/tmp/economia-cuentas/`
  (opción `--trabajo` del script), junto con los CSV filtrados a la provincia 28 (caché).
