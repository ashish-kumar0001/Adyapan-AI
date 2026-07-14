FROM ghcr.io/engineer-man/piston:latest

COPY patches/job.js /piston_api/src/job.js

RUN mkdir -p /piston/boxes && chmod -R 777 /piston/boxes

COPY start.sh /start.sh
RUN chmod +x /start.sh

ENTRYPOINT ["/start.sh"]
