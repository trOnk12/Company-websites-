FROM python:3.12-slim
WORKDIR /app
COPY server.py .
RUN mkdir /data && chown 65534:65534 /data
USER 65534:65534
ENV BOOKMARK_DB=/data/bookmarks.db PYTHONDONTWRITEBYTECODE=1
CMD ["python", "server.py"]
