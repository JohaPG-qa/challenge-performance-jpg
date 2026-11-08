import { createWriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';
import PDFDocument from 'pdfkit';

const colors = {
  ink: '#182840',
  muted: '#566478',
  pale: '#f0f3f6',
  success: '#168572',
  failure: '#c3484a',
};

function valueOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatNumber(value, decimals = 0) {
  return value === null ? 'No disponible' : value.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function label(doc, text, x, y, size = 10, color = colors.ink) {
  doc.fillColor(color).font('Helvetica').fontSize(size).text(text, x, y, { width: 495 });
}

function heading(doc, text, x, y, size = 15) {
  doc.fillColor(colors.ink).font('Helvetica-Bold').fontSize(size).text(text, x, y, { width: 495 });
}

function reportStatus(exitCode, hasMetrics) {
  if (!hasMetrics) return 'Sin métricas: la ejecución no produjo un resumen de k6.';
  if (exitCode === 0) return 'Ejecución completada con los umbrales configurados aprobados.';
  if (exitCode === 99) return 'Ejecución finalizada con uno o más umbrales incumplidos.';
  return `Ejecución incompleta o fallida (código de salida: ${exitCode ?? 'no disponible'}).`;
}

export async function generatePdfReport({ summary, profile, target, startedAt, exitCode, outputPath }) {
  const metrics = summary?.metrics || {};
  const attempted = valueOrNull(metrics.product_posts_attempted?.count);
  const responded = valueOrNull(metrics.product_posts_responded?.count ?? metrics.product_posts_completed?.count);
  const successes = valueOrNull(metrics.product_posts_successful?.count ?? metrics.product_post_failure_rate?.fails);
  const failures = valueOrNull(metrics.product_post_failure_rate?.passes);
  const responseRate = valueOrNull(metrics.product_posts_responded?.rate ?? metrics.product_posts_completed?.rate);
  const httpErrors = valueOrNull(metrics.product_http_errors?.count);
  const dropped = valueOrNull(metrics.dropped_iterations?.count);
  const p95 = valueOrNull(metrics.product_post_duration?.['p(95)']);
  const checksTotal = successes !== null && failures !== null ? successes + failures : null;
  const successPercent = checksTotal ? successes / checksTotal * 100 : null;
  const failurePercent = checksTotal ? failures / checksTotal * 100 : null;
  const profileLabel = profile === 'smoke' ? 'Smoke funcional (100 iteraciones)' : `Carga objetivo: ${profile} TPS durante 60 segundos`;
  const status = reportStatus(exitCode, attempted !== null);

  const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: 'Reporte ejecutivo de rendimiento', Author: 'Performance Testing Framework' } });
  const output = createWriteStream(outputPath, { flags: 'wx', mode: 0o600 });
  doc.pipe(output);

  doc.rect(0, 0, doc.page.width, 12).fill(colors.success);
  heading(doc, 'REPORTE EJECUTIVO', 48, 42, 22);
  heading(doc, 'Prueba de creación de productos', 48, 75, 18);
  label(doc, `Destino: ${target}`, 48, 108, 10, colors.muted);
  label(doc, `Inicio (UTC): ${startedAt}`, 48, 125, 10, colors.muted);
  label(doc, `Perfil: ${profileLabel}`, 48, 142, 10, colors.muted);

  heading(doc, 'Resumen para la toma de decisiones', 48, 183);
  label(doc, status, 48, 208, 11);
  label(doc, 'El flujo obtiene un token antes de la prueba y envía un título distinto en cada POST. El login no forma parte de las métricas de producto.', 48, 237, 10);

  heading(doc, 'Resultados observados', 48, 290);
  const rows = [
    ['POST de producto intentados', formatNumber(attempted)],
    ['POST con respuesta HTTP', formatNumber(responded)],
    ['POST que cumplen las validaciones', formatNumber(successes)],
    ['POST que no cumplen las validaciones', formatNumber(failures)],
    ['Errores HTTP o sin respuesta', formatNumber(httpErrors)],
    ['Respuestas por segundo', formatNumber(responseRate, 2)],
    ['Tiempo de respuesta p95', p95 === null ? 'No disponible' : `${formatNumber(p95, 2)} ms`],
    ['Iteraciones descartadas por k6', formatNumber(dropped)],
  ];
  rows.forEach(([name, value], index) => {
    const rowY = 319 + index * 36;
    if (index % 2 === 0) doc.rect(48, rowY - 5, 499, 34).fill(colors.pale);
    label(doc, name, 60, rowY + 4, 10);
    doc.fillColor(colors.ink).font('Helvetica-Bold').fontSize(10).text(value, 387, rowY + 4, { width: 148, align: 'right' });
  });
  label(doc, 'p95 incluye respuestas exitosas y fallidas. La tasa por segundo cuenta respuestas, no solo éxitos.', 48, 625, 9, colors.muted);
  label(doc, 'Este reporte representa una sola ejecución; no combina automáticamente los perfiles de 50 y 100 TPS.', 48, 655, 9, colors.muted);

  doc.addPage();
  doc.rect(0, 0, doc.page.width, 12).fill(colors.success);
  heading(doc, 'Comparación de resultados', 48, 49, 19);
  label(doc, 'Proporción de POST con validación completada', 48, 82, 10, colors.muted);
  if (successPercent !== null && failurePercent !== null) {
    const barWidth = 495;
    const successWidth = barWidth * successPercent / 100;
    doc.rect(48, 112, successWidth, 32).fill(colors.success);
    doc.rect(48 + successWidth, 112, barWidth - successWidth, 32).fill(colors.failure);
    label(doc, `Correctos: ${formatNumber(successPercent, 2)} % (${formatNumber(successes)})`, 48, 156, 10);
    label(doc, `Fallidos: ${formatNumber(failurePercent, 2)} % (${formatNumber(failures)})`, 48, 176, 10);
  } else {
    label(doc, 'No hay datos suficientes para construir el gráfico.', 48, 114, 11, colors.muted);
  }

  heading(doc, 'Conclusión', 48, 235);
  label(doc, status, 48, 262, 11);
  const conclusion = failures === null
    ? 'No es posible evaluar el éxito de los POST sin un resumen de métricas.'
    : failures > 0
      ? 'Se observaron fallos de validación. Revisa los errores y los umbrales antes de concluir sobre la capacidad del servicio.'
      : 'No se observaron fallos de validación en los POST completados de esta ejecución.';
  label(doc, conclusion, 48, 290, 10);

  heading(doc, 'Alcance y limitaciones', 48, 350);
  label(doc, 'Los resultados dependen del destino y de las condiciones de esta ejecución. Un simulador local no representa el rendimiento de DummyJSON ni de una tienda real.', 48, 378, 10);
  label(doc, 'La documentación de DummyJSON indica que la creación de productos es simulada y no persiste los datos. Los umbrales del proyecto son referencias iniciales, no un SLA acordado.', 48, 424, 10);
  label(doc, 'Consulta el resumen JSON de esta ejecución para métricas y comprobaciones detalladas. El reporte no incluye credenciales ni tokens.', 48, 470, 10);

  doc.end();
  await finished(output);
}