---
title: Don't ask, get told
short: Notifications
summary: In puzzle 3, the phone read the heart rate by asking for it. Asking again and again wastes radio time. Here's how the strap tells the phone instead, and the one step everyone forgets.
takeaway: A notification is the server sending a characteristic's value by itself when it changes. It only starts after the client writes the CCCD descriptor on the device. On Android, setCharacteristicNotification() alone isn't enough: you also writeDescriptor() the CCCD.
---

## The problem

In puzzle 3, the phone read the heart rate by asking: "read 2A37". To show a live heart rate, it would have to ask at every connection event. That's a request and an answer each time, even when the value didn't change, and a read waits for the next meeting to ask and another to answer, so the value can be old by the time it arrives. Can the strap just tell the phone when the value changes?

## See it

```diagram notify
```

## The building block

Yes: that's a **notification**. The GATT server sends a characteristic's new value by itself at the next connection event, without being asked. One packet instead of two, and only when there's something new.

But the strap doesn't notify everyone by default. A characteristic can carry extra settings called **descriptors**. Descriptors have UUIDs too, and a client can write them. One of them, the **CCCD** (Client Characteristic Configuration Descriptor, UUID 2902), holds a switch per client: bit 0 on means "notify me". The client turns notifications on by writing that descriptor on the device.

On Android, your app gets a `BluetoothGatt` object when it connects: Android's handle for that connection's GATT client. After service discovery you find the characteristic by its UUIDs. Then turning notifications on takes two separate steps:

```kotlin
val characteristic = gatt.getService(HEART_RATE).getCharacteristic(MEASUREMENT)   // found by UUID
gatt.setCharacteristicNotification(characteristic, true)   // 1. on the phone: pass these to my app
val cccd = characteristic.getDescriptor(UUID.fromString("00002902-0000-1000-8000-00805f9b34fb"))   // 2902, written in full
gatt.writeDescriptor(cccd, BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE)   // 2. on the strap: bit 0 on
```

`setCharacteristicNotification()` only tells your own phone to hand this characteristic's notifications to your app. It sends nothing to the strap. `writeDescriptor()` is what flips the switch on the strap. Skip it, and the strap never sends a thing: the classic "connected, but no data" bug.

## The analogy

Instead of phoning the newsroom every hour to ask "anything new?", you subscribe. But the subscription has two halves: you tell your own mailbox to accept the paper, and you send the form to the newspaper. Do only the first, and your mailbox waits forever.

## Check yourself

- Your app calls `setCharacteristicNotification(characteristic, true)` and nothing else. The heart rate changes. What arrives?::*Nothing: the CCCD on the strap was never written||Every change, right away, as notifications are now on >> That call only prepares your own phone. The strap starts sending only when its CCCD is written. >> s4||Only the first change, then the strap waits to be asked >> No notifications are sent at all until the CCCD is written. >> s2::Two steps: your phone, and the switch on the strap.
- Why are notifications cheaper than reading again and again?::*One packet only when the value changes, with no request first||Because notifications travel outside the connection events >> They still travel at connection events; the saving is the request and answer packets, and fresher values. >> s3||Because notifications are compressed into fewer bytes >> Same value, same bytes; the saving is not having to ask. >> s1::No request, and nothing sent when nothing changed.
- What's the difference between a characteristic and a descriptor?::*A characteristic holds a value; a descriptor is a setting attached to it||A descriptor is a second copy of the value, kept as a backup >> It's not the value: it describes or configures the characteristic. >> s2::Value vs a setting about that value.

## Sources

- [Bluetooth Core Specification 5.4, Vol 3, Part G: GATT](https://www.bluetooth.com/wp-content/uploads/Files/Specification/HTML/Core-54/out/en/host/generic-attribute-profile--gatt-.html) (Client Characteristic Configuration: "Bit 0: Notification. The Characteristic Value shall be notified"; the descriptor value is kept per client)
- [Bluetooth SIG assigned numbers: descriptors](https://bitbucket.org/bluetooth-SIG/public/src/main/assigned_numbers/uuids/descriptors.yaml) (`0x2902`: Client Characteristic Configuration)
- [Android Developers: Transfer BLE data](https://developer.android.com/develop/connectivity/bluetooth/ble/transfer-ble-data) (the sample calls `setCharacteristicNotification()` and then writes the descriptor with `ENABLE_NOTIFICATION_VALUE`)
