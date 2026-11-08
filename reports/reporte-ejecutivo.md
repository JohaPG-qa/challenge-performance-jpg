# Informe de prueba: creación de productos

**Fecha de ejecución:** 7 de noviembre de 2026

**Destino de estas ejecuciones:** `https://dummyjson.com/products/add`

## Resumen

Se ejecutaron los perfiles de 50 y 100 solicitudes por segundo durante un minuto. k6 se acercó a las tasas solicitadas y no descartó iteraciones, pero un porcentaje alto de solicitudes no devolvió HTTP 201: **ambos escenarios fallaron los umbrales de éxito**.

DummyJSON simula la creación: su documentación indica que los productos añadidos no se guardan en el servidor. Por tanto, estos resultados describen la respuesta de ese servicio en esas ejecuciones, no la capacidad de una tienda real ni persistencia de productos.

## Resultados observados

| Perfil | POST con HTTP 201 | Errores HTTP | Porcentaje de error | TPS observado (todas las respuestas) | p95 | Iteraciones descartadas |
|---|---:|---:|---:|---:|---:|---:|
| 50 TPS, 60 s | 1.303 de 3.001 (43,42%) | 1.698 | 56,58% | 49,405 | 270,30 ms | 0 |
| 100 TPS, 60 s | 1.399 de 6.001 (23,31%) | 4.602 | 76,69% | 98,828 | 273,18 ms | 0 |

[Ver el gráfico comparativo en el reporte ejecutivo PDF](Reporte_Ejecutivo_Performance_DummyJSON.pdf).

El TPS observado cuenta las respuestas recibidas, incluidas las que fueron errores; el TPS de respuestas HTTP 201 fue aproximadamente **21,72** en el escenario de 50 TPS y **23,32** en el de 100 TPS. “p95” significa que el 95% de las solicitudes POST respondió en ese tiempo o menos. El login se ejecutó una vez por escenario y está excluido de las métricas de producto.

Los resúmenes JSON originales de las dos ejecuciones no están actualmente en `reports/`. k6 marcó ambos escenarios como fallidos porque se cruzaron los umbrales de checks y errores HTTP. La evidencia disponible no incluye un desglose por código HTTP; no se puede atribuir la causa a rate limiting u otra condición. La versión actual del script agrega contadores por código HTTP frecuente para futuras ejecuciones autorizadas. No se repitió carga contra DummyJSON para obtenerlos.

## Comprobación puntual de DummyJSON

Se hizo una comprobación de bajo volumen, no una prueba de carga: el login respondió HTTP 200 y un POST respondió HTTP 201, con el título solicitado y un ID en la respuesta. Esto confirmó que el flujo respondió en ese momento; no demuestra que soporte una cantidad determinada de tráfico.

La documentación oficial indica que añadir un producto simula la creación y **no lo guarda** en el servidor. También documenta el login y el uso de JWT, pero las páginas revisadas no publican permiso para pruebas de carga, límites de 50/100 TPS ni un entorno dedicado para performance: [productos](https://dummyjson.com/docs/products#products-add), [autenticación](https://dummyjson.com/docs/auth#auth-login), [documentación general](https://dummyjson.com/docs).

## Conclusión y límites

El p95 fue menor a 300 ms y k6 no descartó iteraciones, pero la tasa de errores fue demasiado alta para considerar exitoso cualquiera de los escenarios. El resultado principal es que **la mayoría de solicitudes a 100 TPS no obtuvo HTTP 201**, frente a más de la mitad a 50 TPS. No se debe concluir que la API puede sostener la carga correctamente basándose solo en el p95.

La documentación oficial indica que `/products/add` simula la creación y no persiste productos. Este informe conserva los resultados proporcionados de las ejecuciones anteriores; no se enviaron solicitudes adicionales al actualizarlo.
