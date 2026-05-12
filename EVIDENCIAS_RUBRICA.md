# Evidencias de Rubrica - miniOS

Este documento sirve para recoger las 10 capturas requeridas en el PDF.

## Entorno recomendado

Ejecutar en WSL2/Ubuntu dentro del repo.

## Terminales

- Terminal A: ./minios
- Terminal B: node bridge/index.js
- Terminal C: npm run dev (dashboard)
- Terminal D: comandos del sistema (ps, grep)

## Capturas por criterio

1. Criterio 1 - Creacion de proceso real
- En miniOS: run programs/bin/countdown 10
- En Terminal D: ps aux | grep countdown
- Captura: proceso countdown visible con PID real.

2. Criterio 2 - Hijo detenido en READY
- En miniOS: ps
- En Terminal D: ps -o pid,stat,cmd -p <pid>
- Captura: en miniOS estado READY y en sistema estado T.

3. Criterio 3 - Arranque del scheduler
- En miniOS: run programs/bin/countdown 10
- Captura: el proceso empieza a imprimir salida tras run.

4. Criterio 4 - Context switch entre 2+ procesos
- En miniOS:
  - run programs/bin/countdown 30
  - run programs/bin/countdown 30
- Captura: salida intercalada y Gantt alternando procesos.

5. Criterio 5 - Time slice respetado y configurable
- En miniOS:
  - slice 500
  - esperar unos segundos
  - slice 200
- Captura: dashboard/log con alternancia mas rapida en 200 ms.

6. Criterio 6 - Sin zombies + despacho tras terminacion
- Ejecutar 3 procesos con distinta duracion.
- Salir con: exit
- En Terminal D: ps aux | grep defunct
- Captura: sin procesos defunct.

7. Criterio 7 - cmd_run valida y lanza
- En miniOS:
  - run ruta/inexistente
  - run programs/bin/countdown 15
- Captura: error para ruta falsa y ejecucion correcta con argumento 15.

8. Criterio 8 - cmd_ps muestra tabla y ready queue
- En miniOS: lanzar 3 procesos y luego ps
- Captura: columnas PID, nombre, estado, CPU, espera, switches + ready queue.

9. Criterio 9 - cmd_kill_proc mata y limpia
- En miniOS:
  - ps
  - kill <pid>
  - ps
- Captura: proceso eliminado y los demas siguen corriendo.

10. Criterio 10 - cmd_stats calcula metricas
- En miniOS: stats
- Captura: activos, terminados, slice, CPU total, switches y promedios.

## Sugerencia de nombres de archivos

- 01_proceso_real.png
- 02_ready_stop.png
- 03_start_scheduler.png
- 04_context_switch.png
- 05_slice_configurable.png
- 06_sin_zombies.png
- 07_cmd_run.png
- 08_cmd_ps.png
- 09_cmd_kill.png
- 10_cmd_stats.png

## Material para portada del PDF

- Nombre completo
- Codigo del curso
- Fecha
- Link del fork publico
- Link del video en YouTube (max. 10 min)


Siguiente paso recomendado:

Abrir el repo en WSL2/Ubuntu y ejecutar make, luego correr miniOS + bridge + dashboard para empezar a tomar las 10 capturas con la guía.
Si quieres, en el siguiente paso te acompaño criterio por criterio en ejecución real y te voy diciendo exactamente qué capturar para que cierres el PDF y video rápido.
