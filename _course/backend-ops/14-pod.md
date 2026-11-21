---
title: Who replaces a missing pod?
short: Who replaces a missing pod?
summary: Watch a local cluster restore a process and inspect what survives.
takeaway: A Deployment describes the desired pods. Their storage lifetime depends on the selected volume.
---

## The problem

A **pod** groups containers that run together. Docker can restart your app. Who notices when its whole pod disappears? Will the bookmark come back with it?

## See it

```diagram pod
```

## The building block

A pod is the unit Kubernetes schedules. A Deployment declares the desired application and replica count. Its controller manages a replica set, which creates pods to reach that count. Kubernetes selects a node and the node starts the container. A readiness probe checks when the instance can serve work. Our database uses a directory scoped to this pod. Restarting a container in the same pod preserves it. Replacing the whole pod gives the new instance a fresh directory. A green probe can therefore coexist with missing data.

### Trace the three lifetimes

An application process runs in a container, and Kubernetes runs that container inside a pod. In this exercise the pod mounts a temporary directory belonging to that pod. Container A writes river, stops, and restarts within the same pod: the volume is still there. A rollout creates a replacement pod, whose own empty directory starts without river. To preserve the row across replacement, the new pod must attach storage that outlives the old one. The workbench assumes one writer. Adding replicas with their own temporary databases would create separate copies of the service state.

## Try it

[Run the browser experiment](https://pachulski.dev/labs/backend-workbench/#14-pod)

### Optional local lab

Run the isolated cluster drill. Record the pod identities and list contents before and after the rollout. Explain why adding another replica would give inconsistent lists here.

[Open the local exercise files](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service/k8s)

## Check yourself

- After a pod replacement, which observation proves the bookmark survived?::*Reading the original row||Seeing one ready replica again >> The replacement can be ready with an empty directory. >> the-building-block::A Deployment describes the desired pods. Their storage lifetime depends on the selected volume.

- Which event ends the lifetime of this pod's temporary storage?::Restarting only its container inside the same pod >> The temporary volume belongs to the pod lifetime. >> the-building-block||*Removal of that pod::The temporary volume belongs to the pod lifetime.
- Two pods each serve their own local database. What could alternating reads reveal?::*Different lists from different pods||One automatically merged list from both pods >> A shared service address does not combine pod-local data. >> the-building-block::A shared service address does not combine pod-local data.

## Sources

- [Technical reference](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)

- [Kubernetes temporary volume lifetime](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir)
