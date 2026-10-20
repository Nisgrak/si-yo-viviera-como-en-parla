#!/usr/bin/env python3
"""Comprueba el cálculo de isocronas.py contra la consulta oficial de horarios
de Renfe Cercanías: tiempo mediano de estación a estación, saliendo cada
minuto de 7:30 a 8:30, con el mismo algoritmo y los mismos GTFS.

Uso:
    python3 herramientas/transporte/comprobar.py [--fecha 2026-10-27]
"""
import argparse
import datetime as dt
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import isocronas as I  # noqa: E402
import tiempos as T  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--fecha', default='2026-10-27')
    a = ap.parse_args()
    fecha = dt.date.fromisoformat(a.fecha)
    v0, v1 = T.hms('07:30:00'), T.hms('08:30:00')
    sol = T.utm30(*I.SOL)
    caja = (sol[0] - 50000, sol[1] - 50000, sol[0] + 50000, sol[1] + 50000)
    red = T.Red()
    for f in ('cercanias', 'metro', 'ligero', 'interurbanos'):
        red.cargar(f, fecha, v0, v1 + I.MAX_T, caja)
    red.transbordos()
    conex = sorted(red.conex, key=lambda c: (c[0], c[1]))
    ctd = [c[0] for c in conex]
    print('mediana, percentil 25 y 75 en minutos, de estación a estación')
    for o, on, de, _ in T.COMPROBACIONES:
        x, y = red.stops['c5_' + o][:2]
        tt = []
        for t in range(v0, v1 + 1, 60):
            arr = I.llegadas(red, ctd, conex, x, y, t)
            tt.append(arr.get('c5_' + de, T.INF) - t)
        ofi = T.mediana_oficial(T.renfe_oficial(o, de, fecha), v0, v1)
        print(f'{on} -> {de}: modelo {T.percentiles(tt)}, Renfe {ofi}')


if __name__ == '__main__':
    main()
