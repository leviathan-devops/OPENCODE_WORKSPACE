# Cloud Hermes - Uses pre-built ghcr.io image
FROM ghcr.io/leviathan-devops/cloud-hermes:build

ENV PYTHONUNBUFFERED=1
ENV HERMES_HOME=/opt/data
ENV PORT=8080

EXPOSE 8080

# Run Hermes gateway directly (entrypoint already configured in base image)
CMD ["hermes", "gateway", "run"]
