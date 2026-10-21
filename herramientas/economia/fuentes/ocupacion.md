# Ocupación: en qué trabajan los vecinos

Extraído el **21-10-2026** con `herramientas/economia/ocupacion.py`. Datos en `ocupacion.json` (mismo directorio).

| Indicador | Fuente | Tabla / fichero | Fecha de referencia |
|---|---|---|---|
| Vecinos ocupados por gran grupo de ocupación (CNO-11, un dígito) | INE, Censo anual de población | [tabla 69986](https://www.ine.es/jaxiT3/Tabla.htm?t=69986), [CSV](https://www.ine.es/jaxiT3/files/t/es/csv_bdsc/69986.csv) | 2021, 2022, 2023 |

Es la misma tabla que da el lugar de trabajo en `trabajo.json`. Aquí se filtra `Lugar trabajo = Total` y `Sexo = Total`, y
se coge cada ocupación. Las nueve más «No consta» suman exactamente el total en las once ciudades y los tres años
(el script lo comprueba).

## Resultados (2023, de cada 100 ocupados cuya ocupación consta)

| Municipio | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | Ocupados |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Parla | 1,7 | 9,8 | 10,4 | 10,6 | 24,6 | 0,8 | 14,7 | 8,2 | 19,3 | 57.167 |
| Fuenlabrada | 1,9 | 12,1 | 11,4 | 12,4 | 25,3 | 0,7 | 13,1 | 7,8 | 15,2 | 86.670 |
| Móstoles | 2,2 | 16,0 | 12,0 | 12,5 | 27,1 | 0,6 | 10,5 | 5,9 | 13,1 | 90.150 |
| Torrejón de Ardoz | 2,5 | 15,0 | 12,5 | 14,1 | 21,6 | 0,5 | 10,8 | 7,5 | 15,5 | 64.817 |
| Leganés | 2,4 | 17,5 | 12,4 | 13,1 | 23,8 | 0,6 | 10,4 | 6,5 | 13,2 | 81.948 |
| Alcorcón | 3,1 | 21,8 | 13,3 | 13,8 | 23,3 | 0,5 | 8,2 | 5,0 | 11,1 | 75.835 |
| Pinto | 3,4 | 18,5 | 13,7 | 14,5 | 21,7 | 0,3 | 9,7 | 6,7 | 11,4 | 26.529 |
| Getafe | 3,2 | 20,6 | 13,5 | 13,6 | 20,3 | 0,5 | 9,4 | 6,3 | 12,6 | 84.531 |
| Alcobendas | 7,3 | 24,3 | 13,7 | 13,6 | 18,6 | 0,6 | 5,8 | 3,6 | 12,3 | 53.265 |
| Majadahonda | 9,6 | 36,3 | 13,8 | 11,7 | 15,4 | 0,5 | 2,8 | 1,6 | 8,3 | 31.814 |
| Pozuelo de Alarcón | 12,7 | 40,8 | 13,8 | 11,4 | 11,1 | 0,4 | 2,4 | 1,4 | 6,0 | 38.924 |

1 directores y gerentes; 2 profesionales científicos e intelectuales; 3 técnicos de apoyo; 4 oficina; 5 restauración,
servicios personales, protección y vendedores; 6 agricultura; 7 oficios de la industria y la construcción;
8 operadores de maquinaria y montadores (aquí están los conductores); 9 ocupaciones elementales.

La web los junta en cinco: 1+2, 3+4, 5, 6+7+8 y 9. De las once, Parla tiene el menor peso de 1+2 y el mayor de 9.

## Cautelas

- Cuenta a los vecinos por su ocupación, trabajen en su ciudad o fuera. No dice en qué trabaja la gente que tiene su
  puesto en la ciudad.
- Es la ocupación (lo que hace cada uno), no la rama de actividad de la empresa.
- «No consta»: 2.448 en Parla en 2023 (4,3 %). Se quedan fuera del denominador.
- El Censo anual sale de registros administrativos (Seguridad Social, SEPE, DIRCE), no de una encuesta.

## Lo que no se usa

- **Por sexo, y los años 2021 y 2022.** Están en la tabla y en `ocupacion.json`, pero no en la web.
