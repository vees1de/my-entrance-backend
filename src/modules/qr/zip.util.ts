/**
 * Minimal PKZip implementation using STORED (no compression) method.
 * Avoids adding a zip library dependency.
 */

const CRC_TABLE: number[] = (() => {
  const t: number[] = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    t[n] = c
  }
  return t
})()

function crc32(buf: Buffer): number {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff]
  }
  return ((crc ^ 0xffffffff) >>> 0)
}

export interface ZipEntry {
  name: string   // path inside zip, e.g. "podezd-1/etazh-03.png"
  data: Buffer
}

export function buildZip(entries: ZipEntry[]): Buffer {
  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  const offsets: number[] = []
  let localOffset = 0

  for (const entry of entries) {
    const nameBytes = Buffer.from(entry.name, 'utf8')
    const crc = crc32(entry.data)
    const size = entry.data.length

    // Local file header (30 bytes + filename)
    const local = Buffer.alloc(30 + nameBytes.length)
    local.writeUInt32LE(0x04034b50, 0)     // local file header signature
    local.writeUInt16LE(20, 4)             // version needed to extract
    local.writeUInt16LE(0, 6)              // general purpose bit flag
    local.writeUInt16LE(0, 8)              // compression method: stored
    local.writeUInt16LE(0, 10)             // last mod file time
    local.writeUInt16LE(0, 12)             // last mod file date
    local.writeUInt32LE(crc, 14)           // crc-32
    local.writeUInt32LE(size, 18)          // compressed size
    local.writeUInt32LE(size, 22)          // uncompressed size
    local.writeUInt16LE(nameBytes.length, 26) // file name length
    local.writeUInt16LE(0, 28)             // extra field length
    nameBytes.copy(local, 30)

    // Central directory entry (46 bytes + filename)
    const central = Buffer.alloc(46 + nameBytes.length)
    central.writeUInt32LE(0x02014b50, 0)   // central file header signature
    central.writeUInt16LE(20, 4)           // version made by
    central.writeUInt16LE(20, 6)           // version needed to extract
    central.writeUInt16LE(0, 8)            // general purpose bit flag
    central.writeUInt16LE(0, 10)           // compression method: stored
    central.writeUInt16LE(0, 12)           // last mod file time
    central.writeUInt16LE(0, 14)           // last mod file date
    central.writeUInt32LE(crc, 16)         // crc-32
    central.writeUInt32LE(size, 20)        // compressed size
    central.writeUInt32LE(size, 24)        // uncompressed size
    central.writeUInt16LE(nameBytes.length, 28) // file name length
    central.writeUInt16LE(0, 30)           // extra field length
    central.writeUInt16LE(0, 32)           // file comment length
    central.writeUInt16LE(0, 34)           // disk number start
    central.writeUInt16LE(0, 36)           // internal file attributes
    central.writeUInt32LE(0, 38)           // external file attributes
    central.writeUInt32LE(localOffset, 42) // relative offset of local header
    nameBytes.copy(central, 46)

    offsets.push(localOffset)
    locals.push(local, entry.data)
    centrals.push(central)
    localOffset += local.length + size
  }

  const centralBuf = Buffer.concat(centrals)

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)          // end of central dir signature
  eocd.writeUInt16LE(0, 4)                    // number of this disk
  eocd.writeUInt16LE(0, 6)                    // disk where central dir starts
  eocd.writeUInt16LE(entries.length, 8)       // number of entries on disk
  eocd.writeUInt16LE(entries.length, 10)      // total number of entries
  eocd.writeUInt32LE(centralBuf.length, 12)   // size of central directory
  eocd.writeUInt32LE(localOffset, 16)         // offset of start of central dir
  eocd.writeUInt16LE(0, 20)                   // comment length

  return Buffer.concat([...locals, centralBuf, eocd])
}
