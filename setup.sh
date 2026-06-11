#!/bin/bash

echo "Running setup"

chmod -R 755 .

mkdir -p logs

if [ ! -f .env ]; then
echo ".env missing"
fi
