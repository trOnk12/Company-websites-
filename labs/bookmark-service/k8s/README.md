# Replace a pod on your own computer

Use Docker, kind and kubectl. Run from labs/bookmark-service. This creates a disposable single-node cluster. Its control plane listens on loopback. The application listens on loopback inside its pod. The exercise uses exec probes and publishes no application port. Use a fresh cluster name.

```sh
kind create cluster --name bookmark-course --config k8s/kind.yaml
docker build -t bookmark-lab:local .
kind load docker-image bookmark-lab:local --name bookmark-course
kubectl --context kind-bookmark-course apply -f k8s/deployment.yaml
kubectl --context kind-bookmark-course rollout status deployment/bookmarks --timeout=120s
kubectl --context kind-bookmark-course get pods -l app=bookmarks
```

Write one row. List the pod and record its name and UID before replacing it.

```sh
kubectl --context kind-bookmark-course exec deploy/bookmarks -- python -c "from urllib.request import Request,urlopen; print(urlopen(Request('http://127.0.0.1:8080/bookmarks/river', method='PUT')).status)"
kubectl --context kind-bookmark-course get pods -l app=bookmarks -o custom-columns=NAME:.metadata.name,UID:.metadata.uid
kubectl --context kind-bookmark-course rollout restart deployment/bookmarks
kubectl --context kind-bookmark-course rollout status deployment/bookmarks --timeout=120s
kubectl --context kind-bookmark-course get pods -l app=bookmarks -o custom-columns=NAME:.metadata.name,UID:.metadata.uid
kubectl --context kind-bookmark-course exec deploy/bookmarks -- python -c "from urllib.request import urlopen; print(urlopen('http://127.0.0.1:8080/bookmarks').read())"
```

Expect 201 on the fresh write, a different UID and an empty list after replacement. The exercise intentionally uses emptyDir. A container restart in the same pod keeps this directory. A replacement pod gets a new one. Compare this with the named Docker volume from the earlier lesson. Raising the replica count here would create independent databases. For shared durable data, design a separate database and test backup restoration.

If the rollout stalls, inspect the evidence before changing anything:

```sh
kubectl --context kind-bookmark-course describe pods -l app=bookmarks
kubectl --context kind-bookmark-course logs deployment/bookmarks
```

Check image name and loading if the container cannot start. Check probe output and storage permissions if the process is running but unready. Remove only this disposable cluster when finished:

```sh
kind delete cluster --name bookmark-course
```
