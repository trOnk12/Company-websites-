---
title: A BLE UUID says what kind of data, not which device
date: 2026-11-13
status: seedling
tags: [ble, android]
summary: In BLE, a UUID names a kind of service or characteristic and is the same on every device of that model. The device address is what tells two devices apart.
---

## The gap

I read "a custom UUID is a unique ID that never clashes" and concluded that each device needs its own UUID. That's wrong, and the word "unique" pushed me there: unique compared to what?

## The pieces

- A GATT characteristic is a data element inside a service, for example "battery level" or "temperature". Each characteristic and service is identified by a UUID.
- A custom 128-bit UUID is unique compared to *other kinds of data*, so your "temperature" never clashes with someone else's.
- Every device running the same firmware exposes the same UUIDs.
- The Bluetooth **address** identifies one device. On Android, `BluetoothDevice` is a thin wrapper around that hardware address.

## The click

Picture identical apartment blocks built from the same plan. Every block has a flat called "3B" (the UUID: which kind of room), but each block has its own street address (the device address). To deliver to one specific flat 3B, you need the street address first, then "3B".

So a scan filter on a service UUID finds *all* devices of that kind, and you choose the one you want by its address.

## How I checked it

I read the Android reference: a `BluetoothGattCharacteristic` is "a basic data element used to construct a GATT service" and `getUuid()` returns the UUID of the characteristic; `BluetoothDevice` is "a thin wrapper for a Bluetooth hardware address", and `getAddress()` returns that address.

I didn't test this on two real devices, so this card stays a seedling until I do.

## Check yourself

- Two sensors of the same model are nearby. Do they expose the same characteristic UUIDs?::Yes. The UUID names the kind of data, and both run the same firmware.
- How do you connect to one specific sensor of the two?::By its device address, after finding both by the service UUID.
- A custom UUID is "unique". Unique compared to what?::Compared to other kinds of data (other services or characteristics), not compared to other devices.

## Sources

- [Android reference: BluetoothGattCharacteristic](https://developer.android.com/reference/android/bluetooth/BluetoothGattCharacteristic)
- [Android reference: BluetoothDevice](https://developer.android.com/reference/android/bluetooth/BluetoothDevice)
