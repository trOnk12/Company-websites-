---
title: The filing cabinet
short: GATT
summary: In puzzle 2, the phone and the strap met on a timetable. Now they need to agree on what the data is: which value is the heart rate, and which is the battery level.
takeaway: GATT organizes a device's data like a filing cabinet: services are drawers, characteristics are folders holding one value, each named by a UUID. The GATT server holds them; the GATT client reads and writes them.
---

## The problem

In puzzle 2, the phone and the strap met on a timetable to exchange packets. But a packet is just bytes. The strap has a heart rate, a battery level, a name, maybe a setting for its light. How does the phone ask for "the heart rate" and know the bytes it gets back are one?

## See it

```diagram gatt
```

## The building block

**GATT** (Generic Attribute Profile) is the way a BLE device organizes its data, so any phone can find its way around it. The side that holds the data is the **GATT server**, usually the small device. The side that reads and writes it is the **GATT client**, usually the phone.

The data comes in two levels. A **service** is a group of related values: Heart Rate, or Battery. Inside each service, a **characteristic** holds one value: the latest heart rate, or the battery level in percent. A client can read a characteristic, write it, or, as the next puzzle shows, be told when it changes. Each service and each characteristic is named by a **UUID** (universally unique identifier), a long number. For standard features, the Bluetooth group fixed the UUIDs in advance, so they're the same on every device: unlike the random ones `UUID.randomUUID()` gives you, these are agreed. They're written in hexadecimal and often shortened, so the heart-rate measurement is 2A37. That lets an app look for "the Heart Rate service" on any brand of strap.

Right after connecting, the phone asks the strap for its list of services and characteristics: service discovery. Only then does it know which drawers this cabinet has.

GATT's roles are separate from the roles in puzzle 2. Central and peripheral are about who sets the timing; server and client are about who holds the data. A phone can be a GATT server too, for example when a watch reads the phone's messages.

## The analogy

The strap carries a filing cabinet. Each drawer is a service, with a label. Inside, each folder is a characteristic holding one sheet with one value. The phone doesn't rummage: it asks for "drawer Heart Rate, folder Measurement" by its label, and gets that sheet.

## Check yourself

- Your app works with one brand of heart strap. A different brand also offers the standard Heart Rate service. What does your app need to change to read it?::*Probably nothing: it looks the service and characteristic up by the same UUIDs||Everything: each brand stores the heart rate differently >> The standard service and characteristic have the same UUIDs on every device that offers them. >> s3||Only the connection interval >> Timing has nothing to do with where the value lives; the UUIDs do. >> the-building-block::Standard services share UUIDs across brands.
- Why does GATT group values into services instead of one long list?::*So an app can find a whole feature, like Heart Rate, by one name, and ignore the rest||Because a packet can only hold one service >> Services are about organizing data, not packet size. >> s2::A service is a feature you can find by name.
- What's the difference between a GATT server and a peripheral?::*Peripheral is about who follows the timing; GATT server is about who holds the data, and they can be different devices||They're always the same device >> Usually, but not always: a phone (central) can be a GATT server too. >> the-building-block||A GATT server is the central >> The central sets timing; the server holds data. Those are separate roles. >> the-building-block::Timing roles and data roles are separate.

## Sources

- [Bluetooth Core Specification 5.4, Vol 3, Part G: Generic Attribute Profile (GATT)](https://www.bluetooth.com/wp-content/uploads/Files/Specification/HTML/Core-54/out/en/host/generic-attribute-profile--gatt-.html) (services, characteristics, descriptors; client and server roles)
- [Bluetooth SIG assigned numbers: characteristic UUIDs](https://bitbucket.org/bluetooth-SIG/public/src/main/assigned_numbers/uuids/characteristic_uuids.yaml) (`0x2A37`: Heart Rate Measurement)
- [Android Developers: Connect to a GATT server](https://developer.android.com/develop/connectivity/bluetooth/ble/connect-gatt-server)
