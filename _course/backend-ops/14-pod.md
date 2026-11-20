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

## Try it

Run the isolated cluster drill. Record the pod identities and list contents before and after the rollout. Explain why adding another replica would give inconsistent lists here.

[Open the local exercise](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service/k8s)

## Check yourself

- After a pod replacement, which observation proves the bookmark survived?::*Reading the original row||Seeing one ready replica again >> The replacement can be ready with an empty directory. >> the-building-block::A Deployment describes the desired pods. Their storage lifetime depends on the selected volume.

## Sources

- [Technical reference](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
