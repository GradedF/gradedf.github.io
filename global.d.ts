
interface Navigator {
    // Web Bluetooth
    bluetooth?: {
        requestDevice(options: {
            acceptAllDevices?: boolean;
            filters?: BluetoothLEScanFilter[];
            optionalServices?: (string | number)[];
        }): Promise<BluetoothDevice>;
    };

    // Web USB
    usb?: {
        requestDevice(options: {
            filters: USBDeviceFilter[];
            exclusionFilters?: USBDeviceFilter[];
        }): Promise<USBDevice>;
    };

    // Web Serial
    serial?: {
        requestPort(options?: {
            filters?: SerialPortFilter[];
        }): Promise<SerialPort>;
    };

    // Web HID
    hid?: {
        requestDevice(options: {
            filters: HIDDeviceFilter[];
            exclusionFilters?: HIDDeviceFilter[];
        }): Promise<HIDDevice[]>;
    };
}

// Bluetooth
interface BluetoothDevice {
    id: string;
    name?: string;
}

// USB
interface USBDeviceFilter {
    vendorId?: number;
    productId?: number;
    classCode?: number;
    subclassCode?: number;
    protocolCode?: number;
}

interface USBDevice {
    vendorId: number;
    productId: number;
    opened: boolean;
}

// Serial
interface SerialPortFilter {
    usbVendorId?: number;
    usbProductId?: number;
    bluetoothServiceClassId?: string;
}

interface SerialPort {}

// HID
interface HIDDeviceFilter {
    vendorId: number;
    productId?: number;
    usagePage?: number;
    usage?: number;
}

interface HIDDevice {
    vendorId: number;
    productId: number;
    opened: boolean;
}

// Bluetooth filters
interface BluetoothLEScanFilter {
    services?: (string | number)[];
    name?: string;
    namePrefix?: string;
}
