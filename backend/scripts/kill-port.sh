#!/bin/bash

# Script para matar el proceso que ocupa un puerto específico
PORT=${1:-3000}

echo "🔍 Buscando procesos en el puerto $PORT..."

# Buscar el PID del proceso usando el puerto
PID=$(lsof -ti :$PORT 2>/dev/null)

if [ -z "$PID" ]; then
  echo "✅ Puerto $PORT libre"
else
  echo "🔪 Matando proceso $PID en puerto $PORT..."
  kill -9 $PID 2>/dev/null
  sleep 0.5
  echo "✅ Puerto $PORT liberado"
fi
