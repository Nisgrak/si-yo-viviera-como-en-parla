# IBI: lo que paga una vivienda media

Extraído el 15-10-2026. Datos en `ibi.json`.

- Tipo general del IBI urbano 2026 y año de la última revisión catastral: [Ministerio de Hacienda, consulta de información impositiva municipal](https://serviciostelematicosext.hacienda.gob.es/SGFAL/ConsultaTipos/aspx/listado_municipiosm.aspx) ([Excel de Madrid, 2026](https://serviciostelematicosext.hacienda.gob.es/SGFAL/ConsultaTipos/aspx/ImpuestosExcel.aspx?provincia=28&anosel=2026)).
- Valor catastral e inmuebles de uso residencial, 2026: [Catastro, valor catastral por usos](https://www.catastro.hacienda.gob.es/jaxi/tabla.do?path=/est2026/catastro/urbano/&file=URBO4228.px&type=pcaxis&L=0) e [inmuebles por usos](https://www.catastro.hacienda.gob.es/jaxi/tabla.do?path=/est2026/catastro/urbano/&file=URAO4228.px&type=pcaxis&L=0). El valor viene en miles de euros. El certificado del Catastro falla con curl (hace falta `-k`); en el navegador abre bien.

## Cálculo y cautelas
- Recibo estimado = valor catastral medio residencial × tipo. Es la cuota íntegra antes de bonificaciones (familia numerosa, VPO…), sin garaje ni trastero, que suelen tener recibo aparte. Ningún organismo publica «el recibo de la vivienda media».
- En Pinto (revisión de 2016) la base liquidable es el 97,1 % del valor catastral; en Parla el 99,77 %; en el resto el 100 %: el recibo real puede ser algo menor.
- Para los tipos se usa Hacienda: la tabla de ordenanzas del Catastro repite en 2026 los de 2025 de Móstoles (0,52; el BOCM de 22-12-2025 da 0,49) y Pinto (0,655).
- El valor catastral no es valor de mercado ni es comparable entre ponencias de años muy distintos; lo comparable es la cuota.
- No existe una tabla oficial comparable de la plusvalía municipal.
