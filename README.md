# Performance Testing Framework

Proyecto de pruebas de rendimiento con k6. Incluye una estrategia para una tienda online, escenarios de 50 y 100 TPS durante 60 segundos para una API de productos, un simulador local y un informe con resultados históricos.

## Tech Stack

- k6
- JavaScript
- Node.js para el simulador local

## Prerequisites

- k6 v2.3.0 o una versión compatible.
- Node.js 22 o posterior para los comandos de `make` y el simulador local.
- `make` para los comandos abreviados.
- Para un servicio remoto: URL, credenciales de prueba y autorización del responsable del ambiente.

## Getting Started

En macOS, instala las herramientas de línea de comandos de Apple si aún no tienes `make`:

```bash
xcode-select --install
```

Instala [Homebrew](https://brew.sh/) siguiendo su guía oficial y después instala Node.js y k6:

```bash
brew install node k6
```

Si usas otro sistema operativo o prefieres no utilizar Homebrew, sigue las guías oficiales de [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) y [Node.js](https://nodejs.org/) e instala `make` con el gestor de paquetes de tu sistema.

Desde la carpeta `Perfomance`, comprueba las versiones:

```bash
export PATH="$HOME/.local/bin:$PATH"
k6 version
node --version
npm --version
make --version
```

Instala las dependencias del proyecto para generar los PDF:

```bash
npm ci
```

## Configuration

El proyecto incluye `.env.example` sin contraseña. Para crear tu configuración local si todavía no existe:

```bash
cp -n .env.example .env
chmod 600 .env
```

Completa `K6_PASSWORD` en `.env` con la contraseña de prueba. `make` carga automáticamente de ese archivo `BASE_URL`, `K6_USERNAME` y `K6_PASSWORD`; las variables ya exportadas en la terminal tienen prioridad. `.env` está excluido por `.gitignore`: no lo compartas ni subas credenciales o tokens reales al repositorio.

| Variable | Uso |
|---|---|
| `BASE_URL` | URL obligatoria del servicio, configurada en `.env` o en la terminal. |
| `K6_USERNAME`, `K6_PASSWORD` | Credenciales para `POST /auth/login`. |
| `TPS` | Perfil de carga del script directo: `50` o `100`; por defecto `50`. |
| `SMOKE_ITERATIONS` | Cantidad de iteraciones del smoke test. |
| `LOAD_TEST_AUTHORIZED` | Confirmación técnica para destinos remotos: definirla en la terminal solo con autorización; no se carga desde `.env`. |

## Running Tests

**Smoke local.** En una terminal, inicia el simulador:

```bash
make mock
```

En otra terminal, desde `Perfomance`, ejecuta 100 iteraciones funcionales:

```bash
export PATH="$HOME/.local/bin:$PATH"
K6_USERNAME="mock-user" K6_PASSWORD="mock-password" make smoke BASE_URL="http://127.0.0.1:3000"
```

Las credenciales del mock se aplican solo a ese comando. Al terminar, detén el simulador con `Ctrl+C` en la primera terminal. El mock usa un token simulado, no valida un JWT firmado y no mide el rendimiento de DummyJSON.

**Load del challenge.** El destino solicitado es DummyJSON. Completa la contraseña de prueba en `.env` y, solo después de obtener autorización expresa de su operador, ejecuta los perfiles por separado:

```bash
unset BASE_URL K6_USERNAME K6_PASSWORD
export LOAD_TEST_AUTHORIZED=yes
make load-50
make load-100
```

`unset` elimina esas variables de la terminal actual para que el runner use los valores de `.env`. También puedes usar estos perfiles en un ambiente propio autorizado cambiando `BASE_URL` y las credenciales. Para establecer la contraseña solo en la terminal zsh, usa `read -rs 'K6_PASSWORD?Contraseña de prueba: '` y luego `export K6_PASSWORD`.

Cada escenario usa `constant-arrival-rate` durante 60 segundos, con un POST de producto por iteración. El login se realiza una vez en `setup()` y no se incluye en las métricas de producto. Si la configuración es válida y el proceso de generación finaliza correctamente, se guarda un PDF en `reports/`; también se guarda un JSON cuando k6 produce un resumen. La terminal muestra sus rutas. El PDF se intenta generar incluso si k6 termina con umbrales fallidos, pero no se genera si falta la URL o alguna credencial antes de iniciar. Cada PDF presenta los datos disponibles de una ejecución; no combina automáticamente los perfiles de 50 y 100 TPS. `LOAD_TEST_AUTHORIZED=yes` es una confirmación técnica y no reemplaza el permiso del operador.

## Project Structure

El proyecto separa la configuración de carga, los servicios de API y la generación de datos para facilitar la incorporación de nuevos escenarios.

```text
Perfomance/
|-- .gitignore
|-- .env.example
|-- Makefile
|-- README.md
|-- Parte1_test-plan.md
|-- config/
|   |-- scenarios.js
|   `-- thresholds.js
|-- scripts/
|   |-- run-k6.js
|   |-- pdf-report.js
|   `-- mock-server.js
|-- tests/
|   `-- products-add.js
|-- services/
|   |-- auth.service.js
|   `-- products.service.js
|-- utils/
|   `-- data-generator.js
`-- reports/
    |-- reporte-ejecutivo.md
    `-- Reporte_Ejecutivo_Performance_DummyJSON.pdf
```

`Makefile` ofrece comandos abreviados; `config/` define escenarios y umbrales; `tests/` contiene el punto de entrada de k6; `scripts/` contiene el cargador de `.env` y el mock; `services/` maneja autenticación y productos; `utils/` genera títulos únicos; `reports/` conserva la evidencia.

## Documentation

- [Parte 1: plan de pruebas y estrategia](Parte1_test-plan.md).
- [Reporte ejecutivo PDF](reports/Reporte_Ejecutivo_Performance_DummyJSON.pdf): parte de la entrega del challenge.
- Los resúmenes JSON históricos de 50 y 100 TPS no están actualmente en `reports/`; el PDF ejecutivo conserva los resultados publicados.
- [Criterios y umbrales k6](config/thresholds.js).

## Notes

- DummyJSON es un servicio público compartido. No ejecutes carga sin autorización expresa de su operador; `LOAD_TEST_AUTHORIZED=yes` no constituye autorización. El script exige esta variable para pruebas de carga remotas.
- La [creación de productos en DummyJSON](https://dummyjson.com/docs/products#products-add) es simulada: los productos no se guardan en el servidor.
- Los resultados históricos corresponden a una versión anterior del script, antes de la refactorización modular; no son mediciones del mock local ni de la versión actual. La versión modular pasó un smoke funcional local de 100 iteraciones, pero no se repitieron los perfiles de carga sobre DummyJSON.
- Si se recuperan los JSON históricos, revisa y elimina posibles tokens en `setup_data` antes de compartirlos. Los JSON nuevos eliminan ese campo antes de guardarse.
- Los umbrales son referencias iniciales, no un SLA acordado. Si un umbral falla, k6 marca la ejecución como fallida; otros errores también pueden producir una salida distinta de cero.
- `.gitignore` excluye archivos `.env` locales y los JSON nuevos con marca de tiempo. El PDF ejecutivo de la entrega no está excluido. Revisa y sanitiza las evidencias antes de compartirlas.

## Autora

Johanna Palomino Gamarra