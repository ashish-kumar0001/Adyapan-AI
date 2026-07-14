#!/bin/bash
mkdir -p /piston/boxes /piston/packages
chmod -R 777 /piston/boxes /piston/packages
exec su -- piston -c "ulimit -n 65536 && node /piston_api/src"
