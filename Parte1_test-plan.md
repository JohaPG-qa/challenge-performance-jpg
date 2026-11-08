# Plan recomendado de performance para la tienda

## Respuesta corta

Para preparar la tienda para fechas especiales, primero mediría cómo funciona normalmente. Después probaría el pico esperado de campaña, una llegada repentina de visitantes y una jornada prolongada. Finalmente, con autorización y monitoreo, buscaría el límite del sistema y comprobaría que pueda recuperarse.

## Qué significan los datos disponibles

La tienda procesa aproximadamente **1.500 pedidos al día** y puede llegar a **7.500 pedidos al día** en campañas. El segundo número es cinco veces el primero.

Repartidos uniformemente durante todo el día, serían unos **1,04 pedidos por minuto** en un día normal y **5,2 pedidos por minuto** en una campaña. Pero las compras no llegan de manera uniforme: muchas pueden concentrarse en la hora de una promoción.

Además, un pedido no equivale a una solicitud. Para comprar, una persona puede consultar el catálogo, abrir productos, usar el carrito, comprobar el inventario y completar el pago. Por eso, estos promedios **no permiten calcular directamente cuántos usuarios simultáneos o solicitudes por segundo debemos simular**.

## Pruebas que recomiendo, por prioridad

### Prioridad 1: comprobar el funcionamiento habitual

Simular la actividad normal de la tienda y medir cuánto tardan las páginas y acciones principales, y cuántos errores ocurren. Este resultado sirve como punto de comparación para las pruebas siguientes.

### Prioridad 2: simular una campaña

Reproducir el patrón de visitas de Black Friday o Navidad y comprobar si la tienda puede completar compras durante ese periodo. La meta comercial informada es llegar a 7.500 pedidos diarios; para convertirla en una carga de prueba necesitamos saber en qué horas ocurren esos pedidos y cuántas visitas terminan en compra.

### Prioridad 3: simular un pico repentino

Hacer que muchas personas lleguen casi al mismo tiempo, como al comenzar una oferta. Observar si la tienda sigue aceptando pedidos y cuánto tarda en estabilizarse cuando baja la demanda.

### Prioridad 4: mantener la carga durante más tiempo

Mantener la actividad de campaña durante varias horas. Esto permite encontrar problemas que aparecen lentamente, como acumulación de tareas o degradación del sistema.

### Prioridad 5: descubrir el límite y comprobar la recuperación

Subir la carga gradualmente hasta encontrar el punto en que la tienda se vuelve demasiado lenta o empieza a fallar. Después reducir la carga y medir cuánto tarda en volver a la normalidad. Esta prueba requiere un ambiente de performance, monitoreo y un límite aprobado por el equipo responsable.

## Qué datos pedir antes de fijar la carga

- Visitas y pedidos por hora, idealmente de una campaña anterior; también el periodo de mayor actividad de 5 o 15 minutos.
- Cuántas visitas terminan en compra y cuántas personas abandonan el proceso.
- Las acciones que realiza una persona antes de comprar: catálogo, búsqueda, detalle del producto, carrito y checkout.
- Los tiempos de respuesta y el porcentaje de errores que el negocio considera aceptables.
- Confirmación de qué ambiente y servicios se pueden usar para una prueba de carga. Los pagos deben usar un sandbox.

Con esa información se calcula un patrón de usuarios y solicitudes que represente la campaña. Hasta entonces, no asignaría un número arbitrario de usuarios ni asumiría que el sistema necesita cinco veces más solicitudes por segundo.

## Qué revisar en los resultados

En lenguaje simple: cuánto espera la persona, cuántas acciones fallan, cuántas compras se completan y si el sistema se mantiene estable. El equipo técnico también debe revisar si la base de datos, el inventario, el procesador de pagos u otro servicio se convierte en el cuello de botella.

Antes de probar, negocio y tecnología deben acordar qué tiempos y errores son aceptables. Sin ese acuerdo no se puede declarar objetivamente que la prueba pasó o falló.

## Relación con el script k6 incluido

El script de k6 de este proyecto prueba un endpoint de creación de productos a 50 o 100 solicitudes por segundo. Es un ejercicio separado y **no se deduce de los 1.500 o 7.500 pedidos diarios**. Para medir la capacidad de la tienda completa, haría falta simular el recorrido de compra con el patrón de tráfico real.

## Conclusión

Con los datos actuales sí se puede recomendar qué tipos de pruebas hacer, pero todavía no se puede definir la cantidad exacta de usuarios o solicitudes por segundo. El siguiente paso es obtener el patrón horario de visitas y pedidos de una campaña y ejecutar las pruebas en un ambiente autorizado. Este documento es un plan recomendado; no contiene resultados medidos sobre la tienda.
