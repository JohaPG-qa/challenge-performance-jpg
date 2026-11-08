K6 ?= k6
K6_RUNNER := scripts/run-k6.js

.PHONY: help mock smoke load-50 load-100

help:
	@printf '%s\n' 'make mock      Start the local mock API' 'make smoke     Run 100 functional iterations' 'make load-50   Run the 50 TPS scenario' 'make load-100  Run the 100 TPS scenario'

mock:
	node scripts/mock-server.js

smoke:
	@K6_BIN="$(K6)" node $(K6_RUNNER) smoke

load-50:
	@K6_BIN="$(K6)" node $(K6_RUNNER) 50

load-100:
	@K6_BIN="$(K6)" node $(K6_RUNNER) 100