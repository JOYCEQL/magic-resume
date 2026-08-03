FROM ghcr.io/anomalyco/opencode:1.18.9

WORKDIR /opt/resume-runtime
COPY . /opt/resume-runtime
RUN chmod +x /opt/resume-runtime/start.sh

WORKDIR /runtime
ENTRYPOINT ["/opt/resume-runtime/start.sh"]
