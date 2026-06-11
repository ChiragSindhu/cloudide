#!/bin/bash

echo "Running setup2"

chmod -R 755 .

mkdir -p logs

if [ ! -f .env ]; then
echo ".env missing"
fi
