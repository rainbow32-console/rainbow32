export type StructType = 'u8' | 'u16' | 'bool' | number;
export type StructDefinition = Record<string, StructType>;
export type StructTypeToValue<T extends StructType> = T extends 'bool'
    ? boolean
    : number;

export class Struct<T extends StructDefinition> {
    offsets: Record<keyof T, number>;
    bitLengths: Record<keyof T, number>;
    length: number;
    byteLength: number;
    def: T;

    constructor(def: T) {
        this.def = def;
        this.offsets = {} as any;
        this.bitLengths = {} as any;
        let i = 0;
        for (const [k, v] of Object.entries(def)) {
            this.offsets[k as keyof T] = i;

            let length = 0;
            if (v === 'bool') length = 1;
            else if (v === 'u16') length = 16;
            else if (v === 'u8') length = 8;
            else length = v;
            this.bitLengths[k as keyof T] = length;
            i += length;
        }
        this.length = i;
        this.byteLength = Math.ceil(this.length / 8);
    }

    getValueRaw(
        arr: Uint8Array,
        offset: number,
        valueOffset: number,
        length: number
    ): number {
        let value = 0;
        for (let i = valueOffset; i < valueOffset + length; ++i) {
            let read = (arr[offset + Math.floor(i / 8)] >> i % 8) & 1;
            value |= read << (i - valueOffset);
        }

        return value;
    }

    writeValueRaw(
        arr: Uint8Array,
        offset: number,
        valueOffset: number,
        length: number,
        value: number
    ) {
        for (let i = valueOffset; i < valueOffset + length; ++i) {
            arr[offset + Math.floor(i / 8)] &= 0xff ^ (1 << i % 8);
            arr[offset + Math.floor(i / 8)] |=
                ((value >> (i - valueOffset)) & 1) << i % 8;
        }
    }

    getValue<TKey extends keyof T>(
        arr: Uint8Array,
        offset: number,
        rawOffsetAdd: number,
        key: TKey
    ): StructTypeToValue<T[TKey]> {
        const type = this.def[key];

        const number = this.getValueRaw(
            arr,
            offset * this.byteLength + rawOffsetAdd,
            this.offsets[key],
            this.bitLengths[key]
        );

        if (type === 'bool') return number === 1 ? true : (false as any);
        else return number as any;
    }

    writeValue<TKey extends keyof T>(
        arr: Uint8Array,
        offset: number,
        rawOffsetAdd: number,
        key: TKey,
        value: StructTypeToValue<T[TKey]>
    ): void {
        const type = this.def[key];
        let num = 0;

        if (type === 'bool') num = value ? 1 : 0;
        else num = value as number;

        this.writeValueRaw(
            arr,
            offset * this.byteLength + rawOffsetAdd,
            this.offsets[key],
            this.bitLengths[key],
            num
        );
    }

    writeValues(
        arr: Uint8Array,
        offset: number,
        rawOffsetAdd: number,
        values: { [K in keyof T]?: StructTypeToValue<T[K]> }
    ): void {
        for (const [k, v] of Object.entries(values)) {
            this.writeValue(arr, offset, rawOffsetAdd, k, v as any);
        }
    }

    toString(arr: Uint8Array, offset: number, rawOffsetAdd: number): string {
        const object = this.toJSONObject(arr, offset, rawOffsetAdd);

        let str = '';
        for (const [k, v] of Object.entries(object)) str += `${k}: ${v}\n`;

        return str.substring(0, str.length - 1);
    }

    toJSONObject(
        arr: Uint8Array,
        offset: number,
        rawOffsetAdd: number
    ): { [K in keyof T]: StructTypeToValue<T[K]> } {
        const value = {} as Record<string, StructTypeToValue<StructType>>;

        for (const k of Object.keys(this.def))
            value[k] = this.getValue(arr, offset, rawOffsetAdd, k);

        return value as any;
    }
}